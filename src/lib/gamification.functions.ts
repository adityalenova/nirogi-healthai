import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BADGES, dayKey, streakFromDates } from "@/lib/badges";

export const getGamification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 1100 * 86400000).toISOString();

    const [txs, badgeRows] = await Promise.all([
      supabase.from("credit_transactions").select("reason, created_at").eq("user_id", userId).gte("created_at", since),
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
    ]);

    // Login streak: derived from the days on which the user had any credit-ledger
    // activity (a reliable proxy for "opened Nirogi") — no extra table needed.
    const loginDays = new Set((txs.data ?? []).map((r) => dayKey(r.created_at)));
    const login = streakFromDates(loginDays);

    const already = new Set((badgeRows.data ?? []).map((b) => b.badge_id));
    const newlyEarned = BADGES.filter((b) => login.current >= b.days && !already.has(b.id)).map((b) => b.id);
    if (newlyEarned.length > 0) {
      await supabase.from("user_badges").insert(newlyEarned.map((badge_id) => ({ user_id: userId, badge_id })));
    }

    const earned = [
      ...(badgeRows.data ?? []).map((b) => ({ badge_id: b.badge_id as string, earned_at: b.earned_at as string })),
      ...newlyEarned.map((badge_id) => ({ badge_id, earned_at: new Date().toISOString() })),
    ].sort((a, b) => (a.earned_at < b.earned_at ? 1 : -1));

    return {
      streak: { current: login.current, best: login.longest },
      earned,
      newlyEarned,
    };
  });
