import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SessionInput = z.object({
  activity_type: z.string().min(1).max(60),
  duration_seconds: z.number().int().min(0).max(86_400),
  distance_km: z.number().min(0).max(1000).optional().nullable(),
  steps: z.number().int().min(0).max(500_000).optional().nullable(),
  calories_burned: z.number().int().min(0).max(50_000).optional().nullable(),
  started_at: z.string().max(40),
  ended_at: z.string().max(40),
  member_id: z.string().uuid().optional().nullable(),
});

export const saveExerciseSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SessionInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("exercise_sessions")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { session: row };
  });

export const listExerciseSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
    const { data } = await supabase
      .from("exercise_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(120);
    const { data: profile } = await supabase.from("profiles").select("weight_kg").eq("id", userId).maybeSingle();
    return { sessions: data ?? [], weightKg: profile?.weight_kg ?? null };
  });

export const deleteExerciseSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("exercise_sessions").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });
