import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Balance, referral code, refresh countdown and the full transaction ledger. */
export const getCreditsState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { ensureCredits, BALANCE_CAP, MONTHLY_REFRESH } = await import("./credits.server");
    const { row, welcomed, refreshed, dailyBonus } = await ensureCredits(supabase, userId);

    const { data: txs } = await supabase
      .from("credit_transactions")
      .select("id, amount, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);

    const last = row.last_refresh_date ? new Date(row.last_refresh_date) : new Date();
    const nextRefresh = new Date(last.getTime() + 30 * 86_400_000);
    const daysToRefresh = Math.max(0, Math.ceil((nextRefresh.getTime() - Date.now()) / 86_400_000));

    return {
      balance: row.balance,
      lifetimeEarned: row.lifetime_earned,
      lifetimeSpent: row.lifetime_spent,
      referralCode: row.referral_code,
      cap: BALANCE_CAP,
      monthlyRefresh: MONTHLY_REFRESH,
      daysToRefresh,
      welcomed,
      refreshed,
      dailyBonus,
      transactions: txs ?? [],
    };
  });

/** Lightweight balance read for the header pill. */
export const getCreditBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { ensureCredits } = await import("./credits.server");
    const { row, welcomed } = await ensureCredits(supabase, userId);
    return { balance: row.balance, welcomed };
  });

const REWARDS: Record<string, { amount: number; label: string }> = {
  prescription_upload: { amount: 15, label: "Uploaded a prescription" },
  family_member_added: { amount: 25, label: "Added a family member" },
  all_tools_week: { amount: 100, label: "Used all 9 tools in a week" },
};

/** Claims a one-time earning reward (idempotent per reason). */
export const claimReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ reason: z.string().min(1).max(60) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { grantOnce, FIRST_TOOL_REWARD } = await import("./credits.server");

    let granted = 0;
    if (data.reason.startsWith("first_tool_")) {
      const tool = data.reason.replace("first_tool_", "").slice(0, 30);
      granted = await grantOnce(supabase, userId, data.reason, FIRST_TOOL_REWARD, `First use of ${tool}`);
    } else {
      const rule = REWARDS[data.reason];
      if (!rule) return { granted: 0 };
      granted = await grantOnce(supabase, userId, data.reason, rule.amount, rule.label);
    }
    return { granted };
  });

/** Applies a friend's referral code — once per account, never your own. */
export const redeemReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ code: z.string().min(4).max(20) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { ensureCredits, grantOnce, REFERRED_BONUS, REFERRER_REWARD } = await import("./credits.server");
    const { row } = await ensureCredits(supabase, userId);
    if (row.referred_by) throw new Error("ALREADY_REFERRED");

    const code = data.code.trim().toUpperCase();
    if (row.referral_code && code === row.referral_code) throw new Error("SELF_REFERRAL");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: referrer } = await supabaseAdmin
      .from("user_credits")
      .select("user_id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!referrer) throw new Error("INVALID_CODE");

    await supabase.from("user_credits").update({ referred_by: referrer.user_id }).eq("user_id", userId);
    await grantOnce(supabase, userId, "referral_bonus", REFERRED_BONUS, "Referral welcome bonus");
    await grantOnce(supabaseAdmin, referrer.user_id, `referred_${userId}`, REFERRER_REWARD, "A friend joined with your code");

    return { ok: true, bonus: REFERRED_BONUS };
  });
