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

    // A badge is legitimately earned only when the user's BEST streak has actually
    // reached its milestone. Anything else stored previously is stale and removed.
    const qualifying = new Set(BADGES.filter((b) => login.longest >= b.days).map((b) => b.id));
    const stored = badgeRows.data ?? [];
    const stale = stored.filter((b) => !qualifying.has(b.badge_id as string)).map((b) => b.badge_id as string);
    if (stale.length > 0) {
      await supabase.from("user_badges").delete().eq("user_id", userId).in("badge_id", stale);
    }

    const already = new Set(stored.filter((b) => qualifying.has(b.badge_id as string)).map((b) => b.badge_id as string));
    const newlyEarned = [...qualifying].filter((id) => !already.has(id));
    if (newlyEarned.length > 0) {
      await supabase.from("user_badges").insert(newlyEarned.map((badge_id) => ({ user_id: userId, badge_id })));
    }

    const earned = [
      ...stored
        .filter((b) => qualifying.has(b.badge_id as string))
        .map((b) => ({ badge_id: b.badge_id as string, earned_at: b.earned_at as string })),
      ...newlyEarned.map((badge_id) => ({ badge_id, earned_at: new Date().toISOString() })),
    ].sort((a, b) => (a.earned_at < b.earned_at ? 1 : -1));

    return {
      streak: { current: login.current, best: login.longest },
      earned,
      newlyEarned,
    };
  });
