import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Daily wellness: Mind & Mood, Gut Health, Daily Energy. */

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const getWellnessDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const from = daysAgo(29);
    const [mood, gratitude, gut, energy, done, breathing, sleep] = await Promise.all([
      supabase.from("mood_logs").select("mood_level, log_date").eq("user_id", userId).gte("log_date", from).order("log_date"),
      supabase.from("gratitude_journal").select("id, entry, log_date").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("gut_health_logs").select("*").eq("user_id", userId).gte("log_date", from).order("log_date"),
      supabase.from("energy_logs").select("energy_level, log_date").eq("user_id", userId).gte("log_date", from).order("log_date"),
      supabase.from("wellness_completions").select("activity_key").eq("user_id", userId).eq("log_date", today()),
      supabase.from("breathing_sessions").select("duration_sec").eq("user_id", userId).gte("logged_at", `${today()}T00:00:00Z`),
      supabase.from("sleep_reports").select("report_date, quality_score").eq("user_id", userId).gte("report_date", from).order("report_date"),
    ]);

    const t = today();
    return {
      today: t,
      moodToday: (mood.data ?? []).find((m) => m.log_date === t)?.mood_level ?? null,
      moodHistory: mood.data ?? [],
      gratitude: gratitude.data ?? [],
      gutToday: (gut.data ?? []).find((g) => g.log_date === t) ?? null,
      gutHistory: gut.data ?? [],
      energyToday: (energy.data ?? []).find((e) => e.log_date === t)?.energy_level ?? null,
      energyHistory: energy.data ?? [],
      completedToday: (done.data ?? []).map((d) => d.activity_key),
      breathingSecToday: (breathing.data ?? []).reduce((s, b) => s + (b.duration_sec ?? 0), 0),
      sleepHistory: sleep.data ?? [],
    };
  });

export const saveMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { level: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("mood_logs")
      .upsert({ user_id: userId, mood_level: data.level, log_date: today() }, { onConflict: "user_id,log_date" });
    return { ok: true };
  });

export const saveGratitude = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entry: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const entry = data.entry.trim().slice(0, 500);
    if (!entry) throw new Error("Write something first.");
    await supabase.from("gratitude_journal").insert({ user_id: userId, entry, log_date: today() });
    return { ok: true };
  });

export const saveGutCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    bowel_movement: boolean;
    bloated: boolean;
    stomach_pain: boolean;
    appetite_normal: boolean;
    hydrated: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("gut_health_logs")
      .upsert({ ...data, user_id: userId, log_date: today() }, { onConflict: "user_id,log_date" });

    const good = [data.bowel_movement, !data.bloated, !data.stomach_pain, data.appetite_normal, data.hydrated].filter(Boolean).length;
    const score = Math.round((good / 5) * 100);
    const tips: string[] = [];
    if (!data.bowel_movement) tips.push("No bowel movement today — add fibre (oats, papaya, dal) and 2 extra glasses of water.");
    if (data.bloated) tips.push("Bloating: eat slower, cut fizzy drinks, and try a 10-minute walk after meals.");
    if (data.stomach_pain) tips.push("Stomach pain for 3+ days, with blood or fever, needs a doctor — don't self-treat.");
    if (!data.appetite_normal) tips.push("Appetite changes lasting over a week are worth discussing with a doctor.");
    if (!data.hydrated) tips.push("Low hydration slows digestion — aim for your daily water goal.");
    if (tips.length === 0) tips.push("Gut looking healthy today. Keep fibre, water and movement consistent.");
    return { score, tips };
  });

export const saveEnergy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { level: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("energy_logs")
      .upsert({ user_id: userId, energy_level: data.level, log_date: today() }, { onConflict: "user_id,log_date" });
    return { ok: true };
  });

/** Marks a daily wellness activity complete and pays the 5-credit reward once per day. */
export const completeWellnessActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; label: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("wellness_completions")
      .insert({ user_id: userId, activity_key: data.key, log_date: today() });
    if (error) return { credited: 0, already: true };

    const { grantOnce } = await import("@/lib/credits.server");
    const credited = await grantOnce(supabase, userId, `wellness:${data.key}:${today()}`, 5, `${data.label} completed`);
    return { credited, already: false };
  });
