import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BADGES, dayKey, streakFromDates, type Streak } from "@/lib/badges";

export const getGamification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 400 * 86400000).toISOString();

    const [water, settings, sessions, logs, sleep, meds, tools, family, txs, badgeRows, score] = await Promise.all([
      supabase.from("water_logs").select("amount_ml, logged_at").eq("user_id", userId).gte("logged_at", since),
      supabase.from("wellness_settings").select("water_goal_ml").eq("user_id", userId).is("member_id", null).maybeSingle(),
      supabase.from("exercise_sessions").select("started_at").eq("user_id", userId).gte("started_at", since),
      supabase.from("exercise_logs").select("logged_at").eq("user_id", userId).gte("logged_at", since),
      supabase.from("sleep_logs").select("logged_at").eq("user_id", userId).gte("logged_at", since),
      supabase.from("medicine_logs").select("status, due_at").eq("user_id", userId).gte("due_at", since),
      supabase.from("scan_history").select("tool, summary, result, created_at").eq("user_id", userId).gte("created_at", since),
      supabase.from("family_members").select("id", { count: "exact", head: true }).eq("owner_id", userId),
      supabase.from("credit_transactions").select("reason, created_at").eq("user_id", userId).gte("created_at", since),
      supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
      supabase.from("health_score_history").select("score").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);

    const goal = settings.data?.water_goal_ml ?? 3000;
    const waterByDay = new Map<string, number>();
    for (const r of water.data ?? []) {
      const k = dayKey(r.logged_at);
      waterByDay.set(k, (waterByDay.get(k) ?? 0) + (r.amount_ml ?? 0));
    }
    const waterDays = new Set([...waterByDay.entries()].filter(([, ml]) => ml >= goal).map(([d]) => d));

    const exerciseDays = new Set([
      ...(sessions.data ?? []).map((r) => dayKey(r.started_at)),
      ...(logs.data ?? []).map((r) => dayKey(r.logged_at)),
    ]);
    const sleepDays = new Set((sleep.data ?? []).map((r) => dayKey(r.logged_at)));
    const medDays = new Set((meds.data ?? []).filter((r) => r.status === "taken").map((r) => dayKey(r.due_at)));
    const toolDays = new Set((tools.data ?? []).map((r) => dayKey(r.created_at)));
    const loginDays = new Set((txs.data ?? []).map((r) => dayKey(r.created_at)));

    const streaks: Streak[] = [
      { key: "login", ...streakFromDates(loginDays) },
      { key: "water", ...streakFromDates(waterDays) },
      { key: "exercise", ...streakFromDates(exerciseDays) },
      { key: "sleep", ...streakFromDates(sleepDays) },
      { key: "medicine", ...streakFromDates(medDays) },
      { key: "tools", ...streakFromDates(toolDays) },
    ];

    const s = (k: Streak["key"]) => streaks.find((x) => x.key === k)?.current ?? 0;
    const toolRuns = tools.data ?? [];
    const distinctTools = new Set(toolRuns.map((r) => (r.tool ?? "").toLowerCase()));
    const hasTool = (slug: string) => [...distinctTools].some((t) => t.includes(slug));
    const lowRisk = (slug: string) =>
      toolRuns.some(
        (r) =>
          (r.tool ?? "").toLowerCase().includes(slug) &&
          `${r.summary ?? ""} ${JSON.stringify(r.result ?? {})}`.toLowerCase().includes("low"),
      );
    const referrals = (txs.data ?? []).filter((t) => (t.reason ?? "").toLowerCase().includes("referral")).length;
    const latestScore = score.data?.[0]?.score ?? 0;

    const progress: Record<string, boolean> = {
      first_step: toolRuns.length >= 1,
      health_detective: distinctTools.size >= 9,
      hydration_hero: s("water") >= 7,
      sleep_champion: s("sleep") >= 14,
      heart_guardian: hasTool("heart"),
      sugar_warrior: lowRisk("sugar"),
      medicine_guardian: s("medicine") >= 30,
      family_protector: (family.count ?? 0) >= 3,
      fitness_streak: s("exercise") >= 14,
      warrior_100: s("login") >= 100,
      cancer_preventer: lowRisk("cancer"),
      xray_reader: hasTool("scaniq") || hasTool("scan"),
      referral_champion: referrals >= 5,
      score_90: latestScore >= 90,
    };

    const already = new Set((badgeRows.data ?? []).map((b) => b.badge_id));
    const newlyEarned = BADGES.filter((b) => progress[b.id] && !already.has(b.id)).map((b) => b.id);
    if (newlyEarned.length > 0) {
      await supabase.from("user_badges").insert(newlyEarned.map((badge_id) => ({ user_id: userId, badge_id })));
    }

    const earned = [
      ...(badgeRows.data ?? []).map((b) => ({ badge_id: b.badge_id as string, earned_at: b.earned_at as string })),
      ...newlyEarned.map((badge_id) => ({ badge_id, earned_at: new Date().toISOString() })),
    ].sort((a, b) => (a.earned_at < b.earned_at ? 1 : -1));

    return { streaks, earned, newlyEarned, progress };
  });
