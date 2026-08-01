import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Pillar = { key: string; label: string; points: number; max: 25; note: string };

function level(score: number) {
  if (score >= 85) return "Outstanding";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Below Average";
  return "Poor";
}

function message(score: number) {
  if (score >= 85) return "Outstanding — your habits are protecting your future health.";
  if (score >= 70) return "Good balance. A small push on your weakest pillar lifts everything.";
  if (score >= 50) return "Average. Pick one pillar this week and be consistent.";
  if (score >= 30) return "Below average. Start with hydration and sleep — they move fastest.";
  return "Let's turn this around. One small habit today beats a perfect plan tomorrow.";
}

/**
 * Four-pillar Health Score: Physical Activity, Hydration, Sleep Quality and
 * Personal OS — each out of 25, totalling 100.
 */
export const getHealthScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [
      { data: profile },
      { data: sessions },
      { data: exercise },
      { data: water },
      { data: settings },
      { data: sleep },
      { data: doses },
      { data: scans },
      { data: history },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("exercise_sessions").select("duration_seconds, calories_burned, started_at").eq("user_id", userId).gte("started_at", weekAgo),
      supabase.from("exercise_logs").select("duration_min, logged_at").eq("user_id", userId).gte("logged_at", weekAgo),
      supabase.from("water_logs").select("amount_ml, logged_at").eq("user_id", userId).gte("logged_at", weekAgo),
      supabase.from("wellness_settings").select("water_goal_ml, sleep_goal_min, exercise_goal_min").eq("user_id", userId).maybeSingle(),
      supabase.from("sleep_logs").select("duration_min, quality_score, logged_at").eq("user_id", userId).gte("logged_at", weekAgo),
      supabase.from("medicine_logs").select("status, marked_at").eq("user_id", userId).gte("marked_at", monthAgo),
      supabase.from("scan_history").select("tool, created_at").eq("user_id", userId).gte("created_at", monthAgo),
      supabase.from("health_score_history").select("score, created_at").eq("user_id", userId).order("created_at", { ascending: true }).limit(14),
    ]);

    const pillars: Pillar[] = [];

    // 1) Physical activity — weekly active minutes against a 150-minute target.
    const sessionMins = (sessions ?? []).reduce((s, r) => s + Math.round((r.duration_seconds ?? 0) / 60), 0);
    const loggedMins = (exercise ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
    const activeMins = sessionMins + loggedMins;
    const activityPts = Math.round(Math.min(1, activeMins / 150) * 25);
    pillars.push({
      key: "activity",
      label: "Physical Activity",
      points: activeMins === 0 ? 0 : Math.max(3, activityPts),
      max: 25,
      note: activeMins === 0 ? "No workouts logged this week." : `${activeMins} active minutes this week (target 150).`,
    });

    // 2) Hydration — average daily intake against the personal goal.
    const goalMl = settings?.water_goal_ml ?? 2500;
    const totalMl = (water ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    const days = Math.max(1, new Set((water ?? []).map((r) => (r.logged_at ?? "").slice(0, 10))).size);
    const avgMl = totalMl / days;
    const hydrationPts = totalMl === 0 ? 0 : Math.max(3, Math.round(Math.min(1, avgMl / goalMl) * 25));
    pillars.push({
      key: "hydration",
      label: "Hydration",
      points: hydrationPts,
      max: 25,
      note: totalMl === 0 ? "No water logged this week." : `${(avgMl / 1000).toFixed(1)} L average per day (goal ${(goalMl / 1000).toFixed(1)} L).`,
    });

    // 3) Sleep quality — duration against goal, adjusted by self-rated quality.
    const sleepRows = sleep ?? [];
    const sleepGoal = settings?.sleep_goal_min ?? 450;
    let sleepPts = 0;
    let sleepNote = "No sleep logged this week.";
    if (sleepRows.length) {
      const avgMin = sleepRows.reduce((s, r) => s + (r.duration_min ?? 0), 0) / sleepRows.length;
      const quality = sleepRows.filter((r) => r.quality_score != null);
      const avgQual = quality.length ? quality.reduce((s, r) => s + (r.quality_score ?? 0), 0) / quality.length : null;
      const durationPart = Math.min(1, avgMin / sleepGoal) * 18;
      const qualityPart = avgQual != null ? (avgQual / 10) * 7 : 4;
      sleepPts = Math.max(3, Math.round(durationPart + qualityPart));
      sleepNote = `${(avgMin / 60).toFixed(1)} h average${avgQual != null ? `, quality ${avgQual.toFixed(1)}/10` : ""}.`;
    }
    pillars.push({ key: "sleep", label: "Sleep Quality", points: sleepPts, max: 25, note: sleepNote });

    // 4) Personal OS — profile completeness, medicine adherence, tool engagement.
    const fields = [
      profile?.full_name, profile?.age, profile?.gender, profile?.blood_group,
      profile?.weight_kg, profile?.height_cm, profile?.health_conditions, profile?.allergies,
    ];
    const filled = fields.filter((f) => f != null && `${f}`.trim() !== "").length;
    const completeness = (filled / fields.length) * 10;

    const doseRows = doses ?? [];
    const adherence = doseRows.length
      ? (doseRows.filter((d) => d.status === "taken").length / doseRows.length) * 8
      : 5;

    const distinctTools = new Set((scans ?? []).map((s) => s.tool)).size;
    const engagement = Math.min(7, distinctTools * 1.5);

    const osPts = Math.round(completeness + adherence + engagement);
    pillars.push({
      key: "personal_os",
      label: "Personal OS",
      points: Math.min(25, osPts),
      max: 25,
      note: `${filled}/${fields.length} profile fields, ${distinctTools} tools used this month.`,
    });

    const score = Math.max(0, Math.min(100, pillars.reduce((s, p) => s + p.points, 0)));
    const band = level(score);

    // Daily snapshot (one row per day).
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: todaySnap } = await supabase
      .from("health_score_history")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString())
      .maybeSingle();

    const breakdown = JSON.parse(JSON.stringify(pillars));
    if (todaySnap) {
      await supabase.from("health_score_history").update({ score, breakdown }).eq("id", todaySnap.id);
    } else {
      await supabase.from("health_score_history").insert({ user_id: userId, score, breakdown });
    }

    return {
      score,
      band,
      message: message(score),
      pillars,
      // Kept for older callers that still read `factors`.
      factors: pillars.map((p) => ({ label: p.label, points: p.points, max: p.max, note: p.note })),
      name: profile?.full_name ?? null,
      trend: (history ?? []).map((h) => ({ score: h.score, date: h.created_at })),
    };
  });
