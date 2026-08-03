import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ *
 * Streaks & achievement badges. Everything is computed server-side
 * from the user's real activity records so counters cannot be faked.
 * ------------------------------------------------------------------ */

export type StreakKey = "login" | "water" | "exercise" | "sleep" | "medicine" | "tools";

export type Streak = { key: StreakKey; current: number; longest: number };

export type BadgeDef = {
  id: string;
  name: string;
  how: string;
  color: string; // tailwind gradient classes
  emoji: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first_step", name: "First Step", how: "Use any Nirogi tool for the first time", color: "from-slate-300 to-slate-500", emoji: "👣" },
  { id: "health_detective", name: "Health Detective", how: "Use all 9 AI tools at least once", color: "from-amber-300 to-yellow-500", emoji: "🔎" },
  { id: "hydration_hero", name: "Hydration Hero", how: "Hit your water goal 7 days in a row", color: "from-sky-300 to-blue-600", emoji: "💧" },
  { id: "sleep_champion", name: "Sleep Champion", how: "Track sleep 14 nights in a row", color: "from-violet-400 to-indigo-600", emoji: "🌙" },
  { id: "heart_guardian", name: "Heart Guardian", how: "Run a HeartSense check", color: "from-rose-400 to-red-600", emoji: "❤️" },
  { id: "sugar_warrior", name: "Sugar Warrior", how: "Get a low-risk SugarSense result", color: "from-emerald-300 to-green-600", emoji: "🩸" },
  { id: "medicine_guardian", name: "Medicine Guardian", how: "Take medicines on time 30 days in a row", color: "from-green-300 to-emerald-600", emoji: "💊" },
  { id: "family_protector", name: "Family Protector", how: "Add 3 family members", color: "from-teal-300 to-cyan-600", emoji: "👨‍👩‍👧" },
  { id: "fitness_streak", name: "Fitness Streak", how: "Exercise 14 days in a row", color: "from-orange-300 to-amber-600", emoji: "⚡" },
  { id: "warrior_100", name: "100 Day Warrior", how: "Open Nirogi 100 days in a row", color: "from-yellow-300 to-orange-600", emoji: "🏆" },
  { id: "cancer_preventer", name: "Cancer Preventer", how: "Get a low-risk CancerSense result", color: "from-purple-400 to-amber-500", emoji: "🎗️" },
  { id: "xray_reader", name: "X-Ray Reader", how: "Analyse a medical scan in ScanIQ", color: "from-blue-300 to-slate-500", emoji: "🩻" },
  { id: "referral_champion", name: "Referral Champion", how: "Refer 5 friends successfully", color: "from-amber-300 to-teal-500", emoji: "🤝" },
  { id: "score_90", name: "Health Score 90+", how: "Reach a Health Score above 90", color: "from-slate-200 to-teal-400", emoji: "💎" },
];

const day = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

function streakFromDates(dates: Set<string>) {
  const sorted = [...dates].sort().reverse();
  if (sorted.length === 0) return { current: 0, longest: 0 };

  const today = day(new Date());
  const yesterday = day(new Date(Date.now() - 86400000));

  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    let cursor = new Date(sorted[0]);
    for (const d of sorted) {
      if (d === day(cursor)) {
        current += 1;
        cursor = new Date(cursor.getTime() - 86400000);
      } else break;
    }
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]).getTime();
    const cur = new Date(sorted[i]).getTime();
    if (prev - cur === 86400000) run += 1;
    else run = 1;
    if (run > longest) longest = run;
  }
  return { current, longest: Math.max(longest, current) };
}

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
    for (const r of water.data ?? []) waterByDay.set(day(r.logged_at), (waterByDay.get(day(r.logged_at)) ?? 0) + (r.amount_ml ?? 0));
    const waterDays = new Set([...waterByDay.entries()].filter(([, ml]) => ml >= goal).map(([d]) => d));

    const exerciseDays = new Set([
      ...(sessions.data ?? []).map((r) => day(r.started_at)),
      ...(logs.data ?? []).map((r) => day(r.logged_at)),
    ]);
    const sleepDays = new Set((sleep.data ?? []).map((r) => day(r.logged_at)));
    const medDays = new Set((meds.data ?? []).filter((r) => r.status === "taken").map((r) => day(r.due_at)));
    const toolDays = new Set((tools.data ?? []).map((r) => day(r.created_at)));
    const loginDays = new Set((txs.data ?? []).map((r) => day(r.created_at)));

    const streaks: Streak[] = [
      { key: "login", ...streakFromDates(loginDays) },
      { key: "water", ...streakFromDates(waterDays) },
      { key: "exercise", ...streakFromDates(exerciseDays) },
      { key: "sleep", ...streakFromDates(sleepDays) },
      { key: "medicine", ...streakFromDates(medDays) },
      { key: "tools", ...streakFromDates(toolDays) },
    ];

    const s = (k: StreakKey) => streaks.find((x) => x.key === k)?.current ?? 0;
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

    const conditions: Record<string, boolean> = {
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
    const newlyEarned: string[] = [];
    for (const b of BADGES) {
      if (conditions[b.id] && !already.has(b.id)) newlyEarned.push(b.id);
    }
    if (newlyEarned.length > 0) {
      await supabase.from("user_badges").insert(newlyEarned.map((badge_id) => ({ user_id: userId, badge_id })));
    }

    const earned = [
      ...(badgeRows.data ?? []).map((b) => ({ badge_id: b.badge_id, earned_at: b.earned_at as string })),
      ...newlyEarned.map((badge_id) => ({ badge_id, earned_at: new Date().toISOString() })),
    ].sort((a, b) => (a.earned_at < b.earned_at ? 1 : -1));

    return { streaks, earned, newlyEarned, progress: conditions };
  });
