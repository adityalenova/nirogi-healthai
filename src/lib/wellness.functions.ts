import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const memberId = z.string().uuid().nullable().optional();

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

/* ------------------------------- Settings ------------------------------- */

export const getWellnessSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = supabase.from("wellness_settings").select("*").eq("user_id", userId);
    const { data: row } = data.memberId
      ? await q.eq("member_id", data.memberId).maybeSingle()
      : await q.is("member_id", null).maybeSingle();
    return { settings: row };
  });

export const saveWellnessSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        water_goal_ml: z.number().int().min(250).max(10000).optional(),
        water_reminder_min: z.number().int().min(15).max(480).optional(),
        exercise_goal_min: z.number().int().min(30).max(2000).optional(),
        target_bedtime: z.string().max(10).nullable().optional(),
        target_wake_time: z.string().max(10).nullable().optional(),
        sleep_goal_min: z.number().int().min(180).max(900).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId: mId, ...rest } = data;
    const { error } = await supabase
      .from("wellness_settings")
      .upsert(
        { user_id: userId, member_id: mId ?? null, ...rest, updated_at: new Date().toISOString() },
        { onConflict: "user_id,member_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- Water -------------------------------- */

export const getWaterToday = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("water_logs").select("*").eq("user_id", userId).gte("logged_at", daysAgo(6).toISOString());
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false });
    const today = startOfDay().getTime();
    const rows = logs ?? [];
    const todayTotal = rows
      .filter((r) => new Date(r.logged_at).getTime() >= today)
      .reduce((s, r) => s + r.amount_ml, 0);
    // weekly buckets
    const week: { day: string; ml: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = daysAgo(i);
      const next = daysAgo(i - 1);
      const ml = rows
        .filter((r) => {
          const t = new Date(r.logged_at).getTime();
          return t >= day.getTime() && t < next.getTime();
        })
        .reduce((s, r) => s + r.amount_ml, 0);
      week.push({ day: day.toLocaleDateString("en-US", { weekday: "short" }), ml });
    }
    return { todayTotal, todayLogs: rows.filter((r) => new Date(r.logged_at).getTime() >= today), week };
  });

export const addWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ memberId, amount_ml: z.number().int().min(10).max(5000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("water_logs")
      .insert({ user_id: userId, member_id: data.memberId ?? null, amount_ml: data.amount_ml });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("water_logs").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/* -------------------------------- Exercise ------------------------------ */

export const getExercise = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("exercise_logs").select("*").eq("user_id", userId).gte("logged_at", daysAgo(6).toISOString());
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false });
    const rows = logs ?? [];
    const weekMinutes = rows.reduce((s, r) => s + (r.duration_min ?? 0), 0);
    const weekCalories = rows.reduce((s, r) => s + (r.calories ?? 0), 0);
    return { logs: rows, weekMinutes, weekCalories };
  });

export const addExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        activity: z.string().min(1).max(80),
        category: z.string().max(60).nullable().optional(),
        duration_min: z.number().int().min(1).max(1440),
        distance_km: z.number().min(0).max(1000).nullable().optional(),
        calories: z.number().int().min(0).max(20000).nullable().optional(),
        steps: z.number().int().min(0).max(200000).nullable().optional(),
        intensity: z.string().max(30).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId: mId, ...rest } = data;
    const { error } = await supabase
      .from("exercise_logs")
      .insert({ user_id: userId, member_id: mId ?? null, ...rest });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("exercise_logs").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/* --------------------------------- Sleep -------------------------------- */

export const getSleep = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("sleep_logs").select("*").eq("user_id", userId);
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false }).limit(14);
    const rows = logs ?? [];
    const recent = rows.slice(0, 7);
    const avgDuration = recent.length
      ? Math.round(recent.reduce((s, r) => s + (r.duration_min ?? 0), 0) / recent.length)
      : 0;
    const avgScore = recent.filter((r) => r.quality_score != null).length
      ? Math.round(
          recent.filter((r) => r.quality_score != null).reduce((s, r) => s + (r.quality_score ?? 0), 0) /
            recent.filter((r) => r.quality_score != null).length,
        )
      : 0;
    return { logs: rows, avgDuration, avgScore };
  });

export const logSleep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        bedtime: z.string(),
        wake_time: z.string(),
        notes: z.string().max(1000).nullable().optional(),
        lang: z.enum(["en", "hi"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bed = new Date(data.bedtime);
    let wake = new Date(data.wake_time);
    if (wake.getTime() <= bed.getTime()) wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
    const duration = Math.round((wake.getTime() - bed.getTime()) / 60000);

    const { analyzeSleepAI } = await import("./wellness.server");
    let analysis: { score: number; summary: string; tips: string[]; flags: string[] } | null = null;
    try {
      analysis = await analyzeSleepAI({
        durationMin: duration,
        bedtime: bed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        wake: wake.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        notes: data.notes ?? "",
        lang: data.lang ?? "en",
      });
    } catch {
      analysis = null;
    }

    const { error } = await supabase.from("sleep_logs").insert({
      user_id: userId,
      member_id: data.memberId ?? null,
      bedtime: bed.toISOString(),
      wake_time: wake.toISOString(),
      duration_min: duration,
      quality_score: analysis?.score ?? null,
      notes: data.notes ?? null,
      ai_analysis: analysis ? JSON.parse(JSON.stringify(analysis)) : null,
    });
    if (error) throw new Error(error.message);
    return { duration, analysis };
  });

export const deleteSleep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("sleep_logs").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/* ------------------------------- Breathing ------------------------------ */

export const getBreathing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("breathing_sessions").select("*").eq("user_id", userId).gte("logged_at", daysAgo(6).toISOString());
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false });
    const rows = logs ?? [];
    const today = startOfDay().getTime();
    const todaySec = rows.filter((r) => new Date(r.logged_at).getTime() >= today).reduce((s, r) => s + (r.duration_sec ?? 0), 0);
    const weekSessions = rows.length;
    return { logs: rows, todaySec, weekSessions };
  });

export const logBreathing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        technique: z.string().min(1).max(60),
        duration_sec: z.number().int().min(10).max(7200),
        cycles: z.number().int().min(0).max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId: mId, ...rest } = data;
    const { error } = await supabase.from("breathing_sessions").insert({ user_id: userId, member_id: mId ?? null, ...rest });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------ Heart rate ------------------------------ */

export const getHeartRate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("heart_rate_logs").select("*").eq("user_id", userId);
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false }).limit(30);
    const rows = logs ?? [];
    const last = rows[0] ?? null;
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + (r.bpm ?? 0), 0) / rows.length) : 0;
    return { logs: rows, last, avg };
  });

export const logHeartRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        bpm: z.number().int().min(25).max(240),
        context: z.string().max(60).nullable().optional(),
        lang: z.enum(["en", "hi"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Simple, deterministic rhythm note (not a medical ECG).
    const bpm = data.bpm;
    const hi = data.lang === "hi";
    let note: string;
    if (bpm < 60) note = hi ? "आपकी विश्राम हृदय गति सामान्य से कम (ब्रैडीकार्डिया) है। यदि चक्कर आते हों तो डॉक्टर से मिलें।" : "Your resting rate is below the typical range (bradycardia). Common in athletes; see a doctor if you feel dizzy or faint.";
    else if (bpm <= 100) note = hi ? "आपकी विश्राम हृदय गति सामान्य सीमा में है।" : "Your resting heart rate is within the normal range (60–100 bpm).";
    else note = hi ? "आपकी विश्राम हृदय गति अधिक (टैकीकार्डिया) है। आराम करके दोबारा मापें; बार-बार अधिक रहने पर डॉक्टर से मिलें।" : "Your resting rate is elevated (tachycardia). Rest and re-measure; if it stays high, consult a doctor.";

    const { error } = await supabase.from("heart_rate_logs").insert({
      user_id: userId,
      member_id: data.memberId ?? null,
      bpm,
      context: data.context ?? "resting",
      ai_note: note,
    });
    if (error) throw new Error(error.message);
    return { ok: true, note };
  });

/* --------------------------- Sleep sessions/reports ---------------------- */

const disturbanceEvent = z.object({
  type: z.enum(["snore", "apnea", "movement", "sound"]),
  t: z.number(), // seconds from session start
  intensity: z.number().min(0).max(1).optional(),
});

export const submitSleepSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        bedtime: z.string(),
        wake_time: z.string(),
        target_hours: z.number().min(1).max(14),
        events: z.array(disturbanceEvent).max(2000).default([]),
        notes: z.string().max(1000).nullable().optional(),
        lang: z.enum(["en", "hi"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bed = new Date(data.bedtime);
    let wake = new Date(data.wake_time);
    if (wake.getTime() <= bed.getTime()) wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
    const durationHours = (wake.getTime() - bed.getTime()) / 3600000;

    const snoringEvents = data.events.filter((e) => e.type === "snore").length;
    const apneaEvents = data.events.filter((e) => e.type === "apnea").length;
    const movementEvents = data.events.filter((e) => e.type === "movement").length;
    const soundEvents = data.events.filter((e) => e.type === "sound").length;

    const { analyzeSleepSessionAI } = await import("./wellness.server");
    const analysis = await analyzeSleepSessionAI({
      durationHours,
      targetHours: data.target_hours,
      bedtime: bed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      wake: wake.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      snoringEvents,
      apneaEvents,
      movementEvents,
      soundEvents,
      notes: data.notes ?? "",
      lang: data.lang ?? "en",
    });

    const timeline = data.events
      .slice()
      .sort((a, b) => a.t - b.t)
      .map((e) => ({ type: e.type, t: e.t, intensity: e.intensity ?? null }));

    const { data: row, error } = await supabase
      .from("sleep_reports")
      .insert({
        user_id: userId,
        member_id: data.memberId ?? null,
        report_date: new Date().toISOString().slice(0, 10),
        duration_hours: Math.round(durationHours * 10) / 10,
        target_hours: data.target_hours,
        quality_score: analysis.score,
        snoring_severity: analysis.snoring_severity,
        apnea_detected: apneaEvents > 0,
        apnea_events: apneaEvents,
        movement_events: movementEvents,
        sound_events: soundEvents + snoringEvents,
        urgency_level: analysis.urgency_level,
        timeline: JSON.parse(JSON.stringify(timeline)),
        disturbances: JSON.parse(JSON.stringify({ summary: analysis.summary, flags: analysis.flags })),
        recommendations: JSON.parse(JSON.stringify(analysis.tips)),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Keep the simple sleep_logs table in sync too, so existing widgets (e.g. health score) still work.
    await supabase.from("sleep_logs").insert({
      user_id: userId,
      member_id: data.memberId ?? null,
      bedtime: bed.toISOString(),
      wake_time: wake.toISOString(),
      duration_min: Math.round(durationHours * 60),
      quality_score: analysis.score,
      notes: data.notes ?? null,
      ai_analysis: JSON.parse(JSON.stringify(analysis)),
    });

    return { report: row, analysis, durationHours };
  });

export const getSleepDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("sleep_reports").select("*").eq("user_id", userId).gte("report_date", daysAgo(6).toISOString().slice(0, 10));
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: reports } = await q.order("report_date", { ascending: true });
    const rows = reports ?? [];

    const week: { day: string; date: string; hours: number; target: number; score: number | null; apnea: boolean; snoring: string | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = daysAgo(i);
      const dateStr = day.toISOString().slice(0, 10);
      const row = rows.find((r) => r.report_date === dateStr);
      week.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateStr,
        hours: row?.duration_hours ?? 0,
        target: row?.target_hours ?? 8,
        score: row?.quality_score ?? null,
        apnea: !!row?.apnea_detected,
        snoring: row?.snoring_severity ?? null,
      });
    }

    const scored = rows.filter((r) => r.quality_score != null);
    const avgScore = scored.length ? Math.round(scored.reduce((s, r) => s + (r.quality_score ?? 0), 0) / scored.length) : 0;
    const snoringNights = rows.filter((r) => r.snoring_severity && r.snoring_severity !== "none").length;
    const apneaNights = rows.filter((r) => r.apnea_detected).length;
    const best = scored.length ? scored.reduce((a, b) => ((a.quality_score ?? 0) >= (b.quality_score ?? 0) ? a : b)) : null;
    const worst = scored.length ? scored.reduce((a, b) => ((a.quality_score ?? 0) <= (b.quality_score ?? 0) ? a : b)) : null;

    // Consistency: how close each night's duration was to target, and how stable durations were night to night.
    const durations = rows.map((r) => r.duration_hours ?? 0).filter((h) => h > 0);
    let consistencyScore = 0;
    if (durations.length) {
      const targetDeviation =
        rows.reduce((s, r) => s + Math.abs((r.duration_hours ?? 0) - (r.target_hours ?? 8)), 0) / rows.length;
      const mean = durations.reduce((s, d) => s + d, 0) / durations.length;
      const variance = durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      consistencyScore = Math.max(0, Math.min(100, Math.round(100 - targetDeviation * 15 - stdDev * 12)));
    }

    return { reports: rows, week, avgScore, snoringNights, apneaNights, best, worst, consistencyScore };
  });
