import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Connection status for third-party health providers (currently Google Fit). */
export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_integrations")
      .select("provider, token_expiry, connected_at")
      .eq("user_id", userId);
    return { integrations: data ?? [] };
  });

const SaveInput = z.object({
  provider: z.string().min(1).max(40),
  access_token: z.string().min(1).max(4000),
  refresh_token: z.string().max(4000).optional().nullable(),
  expires_in: z.number().int().min(0).max(100_000).optional().nullable(),
});

export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SaveInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const expiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null;
    const { error } = await supabase.from("user_integrations").upsert(
      {
        user_id: userId,
        provider: data.provider,
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        token_expiry: expiry,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ provider: z.string().min(1).max(40) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("user_integrations")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", data.provider)
      .maybeSingle();

    if (row?.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(row.access_token)}`, {
        method: "POST",
      }).catch(() => undefined);
    }
    await supabase.from("user_integrations").delete().eq("user_id", userId).eq("provider", data.provider);
    return { ok: true };
  });

/** Pulls the last 7 days of steps, active minutes, calories, sleep and weight from Google Fit. */
export const syncGoogleFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("user_integrations")
      .select("access_token, token_expiry")
      .eq("user_id", userId)
      .eq("provider", "google_fit")
      .maybeSingle();
    if (!row?.access_token) return { connected: false as const };
    if (row.token_expiry && new Date(row.token_expiry).getTime() < Date.now()) {
      return { connected: true as const, expired: true as const };
    }

    const end = Date.now();
    const start = end - 7 * 86_400_000;

    async function aggregate(dataTypeName: string) {
      const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: { Authorization: `Bearer ${row!.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          aggregateBy: [{ dataTypeName }],
          bucketByTime: { durationMillis: 86_400_000 },
          startTimeMillis: start,
          endTimeMillis: end,
        }),
      });
      if (!res.ok) return [] as { date: string; value: number }[];
      const json: any = await res.json();
      return (json.bucket ?? []).map((b: any) => {
        const points = b.dataset?.[0]?.point ?? [];
        const value = points.reduce((s: number, p: any) => {
          const v = p.value?.[0];
          return s + (v?.intVal ?? v?.fpVal ?? 0);
        }, 0);
        return { date: new Date(Number(b.startTimeMillis)).toISOString().slice(0, 10), value: Math.round(value) };
      });
    }

    const [steps, activeMinutes, calories, weight] = await Promise.all([
      aggregate("com.google.step_count.delta"),
      aggregate("com.google.active_minutes"),
      aggregate("com.google.calories.expended"),
      aggregate("com.google.weight.summary"),
    ]);

    const latestWeight = [...weight].reverse().find((w) => w.value > 0)?.value ?? null;
    if (latestWeight) {
      const { data: profile } = await supabase.from("profiles").select("weight_kg, height_cm, updated_at").eq("id", userId).maybeSingle();
      const stale = !profile?.updated_at || Date.now() - new Date(profile.updated_at).getTime() > 86_400_000;
      if (stale) {
        const h = profile?.height_cm ? profile.height_cm / 100 : null;
        await supabase
          .from("profiles")
          .update({ weight_kg: latestWeight, bmi: h ? Math.round((latestWeight / (h * h)) * 10) / 10 : null })
          .eq("id", userId);
      }
    }

    return { connected: true as const, expired: false as const, steps, activeMinutes, calories, latestWeight };
  });
