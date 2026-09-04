import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Google Health / Google Fit REST integration (OAuth 2.0, server-side only).
 * Access + refresh tokens live in user_integrations and never reach the browser.
 */

const PROVIDER = "google_fit";
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.blood_pressure.read",
  "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
].join(" ");
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AGG_URL = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";

function creds() {
  const client_id = process.env["GOOGLE_HEALTH_CLIENT_ID"] || process.env["GOOGLE_FIT_CLIENT_ID"];
  const client_secret = process.env["GOOGLE_HEALTH_CLIENT_SECRET"] || process.env["GOOGLE_FIT_CLIENT_SECRET"];
  if (!client_id || !client_secret) throw new Error("GOOGLE_HEALTH_NOT_CONFIGURED");
  return { client_id, client_secret };
}

export const getGoogleHealthStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const configured = Boolean(
      (process.env["GOOGLE_HEALTH_CLIENT_ID"] || process.env["GOOGLE_FIT_CLIENT_ID"]) &&
        (process.env["GOOGLE_HEALTH_CLIENT_SECRET"] || process.env["GOOGLE_FIT_CLIENT_SECRET"]),
    );
    const { data: row } = await supabase
      .from("user_integrations")
      .select("connected_at, last_sync_at, scopes")
      .eq("user_id", userId)
      .eq("provider", PROVIDER)
      .maybeSingle();

    const { data: days } = await supabase
      .from("google_fit_daily")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7);

    return { configured, connected: Boolean(row), connectedAt: row?.connected_at ?? null, lastSync: row?.last_sync_at ?? null, days: days ?? [] };
  });

/** Builds the Google consent URL. */
export const startGoogleHealthAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ redirect_uri: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    const { client_id } = creds();
    const state = `gh.${context.userId}.${Math.random().toString(36).slice(2, 10)}`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
      `&client_id=${encodeURIComponent(client_id)}` +
      `&redirect_uri=${encodeURIComponent(data.redirect_uri)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&access_type=offline&include_granted_scopes=true&prompt=consent` +
      `&state=${encodeURIComponent(state)}`;
    return { url };
  });

type TokenResponse = { access_token: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || json.error) throw new Error(`Google token request failed [${res.status}]: ${json.error_description ?? json.error ?? "unknown"}`);
  return json;
}

export const completeGoogleHealthAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ code: z.string().min(4), redirect_uri: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    const { client_id, client_secret } = creds();
    const t = await tokenRequest({
      grant_type: "authorization_code",
      code: data.code,
      client_id,
      client_secret,
      redirect_uri: data.redirect_uri,
    });

    const { error } = await context.supabase.from("user_integrations").upsert(
      {
        user_id: context.userId,
        provider: PROVIDER,
        access_token: t.access_token,
        refresh_token: t.refresh_token ?? null,
        token_expiry: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(),
        scopes: SCOPES,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

async function validToken(supabase: any, userId: string) {
  const { data: row } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, token_expiry")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (!row?.access_token) return null;

  const expiring = !row.token_expiry || new Date(row.token_expiry).getTime() - Date.now() < 5 * 60 * 1000;
  if (expiring && row.refresh_token) {
    const { client_id, client_secret } = creds();
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: row.refresh_token, client_id, client_secret });
    await supabase
      .from("user_integrations")
      .update({
        access_token: t.access_token,
        token_expiry: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", PROVIDER);
    return t.access_token as string;
  }
  return row.access_token as string;
}

async function aggregate(token: string, dataTypeName: string, start: number, end: number) {
  const res = await fetch(AGG_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: 86_400_000 },
      startTimeMillis: start,
      endTimeMillis: end,
    }),
  });
  if (!res.ok) return {} as Record<string, number>;
  const json: any = await res.json().catch(() => ({}));
  const out: Record<string, number> = {};
  for (const b of json.bucket ?? []) {
    const points = b.dataset?.[0]?.point ?? [];
    if (!points.length) continue;
    const values = points.map((p: any) => p.value?.[0]?.fpVal ?? p.value?.[0]?.intVal ?? 0).filter((n: number) => typeof n === "number");
    if (!values.length) continue;
    const date = new Date(Number(b.startTimeMillis)).toISOString().slice(0, 10);
    const isAverage = dataTypeName.includes("heart_rate") || dataTypeName.includes("weight") || dataTypeName.includes("oxygen");
    out[date] = isAverage
      ? values.reduce((s: number, v: number) => s + v, 0) / values.length
      : values.reduce((s: number, v: number) => s + v, 0);
  }
  return out;
}

/** Pulls the last 30 days of Google Health data and stores one row per day. */
export const syncGoogleHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const token = await validToken(supabase, userId);
    if (!token) return { connected: false as const };

    const end = Date.now();
    const start = end - 30 * 86_400_000;

    const [steps, calories, distance, active, hr, sleep, weight, spo2] = await Promise.all([
      aggregate(token, "com.google.step_count.delta", start, end),
      aggregate(token, "com.google.calories.expended", start, end),
      aggregate(token, "com.google.distance.delta", start, end),
      aggregate(token, "com.google.active_minutes", start, end),
      aggregate(token, "com.google.heart_rate.bpm", start, end),
      aggregate(token, "com.google.sleep.segment", start, end),
      aggregate(token, "com.google.weight", start, end),
      aggregate(token, "com.google.oxygen_saturation", start, end),
    ]);

    const dates = new Set<string>([
      ...Object.keys(steps), ...Object.keys(calories), ...Object.keys(distance),
      ...Object.keys(active), ...Object.keys(hr), ...Object.keys(sleep), ...Object.keys(weight), ...Object.keys(spo2),
    ]);

    const rows = [...dates].map((date) => ({
      user_id: userId,
      date,
      steps: steps[date] ? Math.round(steps[date]) : null,
      calories: calories[date] ? Math.round(calories[date]) : null,
      distance_m: distance[date] ? Math.round(distance[date]) : null,
      active_minutes: active[date] ? Math.round(active[date]) : null,
      heart_rate_avg: hr[date] ? Math.round(hr[date]) : null,
      sleep_minutes: sleep[date] ? Math.round(sleep[date] / 60_000) : null,
      weight_kg: weight[date] ? Math.round(weight[date] * 10) / 10 : null,
      spo2_avg: spo2[date] ? Math.round(spo2[date]) : null,
    }));

    if (rows.length) {
      const { error } = await supabase.from("google_fit_daily").upsert(rows, { onConflict: "user_id,date" });
      if (error) throw new Error(error.message);
    }

    // Keep the profile weight / BMI fresh from the latest reading.
    const latestWeight = rows.filter((r) => r.weight_kg).sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.weight_kg ?? null;
    if (latestWeight) {
      const { data: profile } = await supabase.from("profiles").select("height_cm").eq("id", userId).maybeSingle();
      const h = profile?.height_cm ? profile.height_cm / 100 : null;
      await supabase
        .from("profiles")
        .update({ weight_kg: latestWeight, bmi: h ? Math.round((latestWeight / (h * h)) * 10) / 10 : null })
        .eq("id", userId);
    }

    await supabase
      .from("user_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", PROVIDER);

    return { connected: true as const, imported: rows.length };
  });

export const disconnectGoogleHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("user_integrations")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", PROVIDER)
      .maybeSingle();
    if (row?.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(row.access_token)}`, { method: "POST" }).catch(() => undefined);
    }
    await supabase.from("user_integrations").delete().eq("user_id", userId).eq("provider", PROVIDER);
    return { ok: true as const };
  });
