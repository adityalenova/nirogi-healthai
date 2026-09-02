import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Withings Public API integration (OAuth 2.0, server-side only).
 * Tokens never touch the browser — every call goes through these server functions.
 */

const WITHINGS_SCOPES = "user.info,user.metrics,user.activity,user.sleepevents";
const TOKEN_URL = "https://wbsapi.withings.net/v2/oauth2";

type Tokens = { access_token: string; refresh_token: string; expires_in: number; userid?: string };

function creds() {
  const client_id = process.env["WITHINGS_CLIENT_ID"];
  const client_secret = process.env["WITHINGS_CLIENT_SECRET"];
  if (!client_id || !client_secret) throw new Error("WITHINGS_NOT_CONFIGURED");
  return { client_id, client_secret };
}

async function withingsPost(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Withings request failed [${res.status}]: ${JSON.stringify(json)}`);
  if (json.status !== 0) throw new Error(`Withings error ${json.status}: ${json.error ?? "unknown"}`);
  return json.body ?? {};
}

/** Builds the consent URL the user is redirected to. */
export const startWithingsAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ redirect_uri: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    const { client_id } = creds();
    const state = `${context.userId}.${Math.random().toString(36).slice(2, 10)}`;
    const url =
      `https://account.withings.com/oauth2_user/authorize2?response_type=code` +
      `&client_id=${encodeURIComponent(client_id)}` +
      `&scope=${encodeURIComponent(WITHINGS_SCOPES)}` +
      `&redirect_uri=${encodeURIComponent(data.redirect_uri)}` +
      `&state=${encodeURIComponent(state)}`;
    return { url };
  });

async function storeTokens(supabase: any, userId: string, t: Tokens) {
  const { error } = await supabase.from("user_integrations").upsert(
    {
      user_id: userId,
      provider: "withings",
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      token_expiry: new Date(Date.now() + (t.expires_in ?? 10800) * 1000).toISOString(),
      provider_user_id: t.userid ? String(t.userid) : null,
      scopes: WITHINGS_SCOPES,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );
  if (error) throw new Error(error.message);
}

/** Exchanges the authorization code for tokens and runs the first import. */
export const completeWithingsAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ code: z.string().min(4), redirect_uri: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    const { client_id, client_secret } = creds();
    const body = await withingsPost(TOKEN_URL, {
      action: "requesttoken",
      grant_type: "authorization_code",
      client_id,
      client_secret,
      code: data.code,
      redirect_uri: data.redirect_uri,
    });
    await storeTokens(context.supabase, context.userId, body as Tokens);
    return { ok: true as const };
  });

/** Returns a valid access token, refreshing it when it is close to expiry. */
async function validToken(supabase: any, userId: string) {
  const { data: row } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, token_expiry, provider_user_id, connected_at, last_sync_at")
    .eq("user_id", userId)
    .eq("provider", "withings")
    .maybeSingle();
  if (!row?.access_token) return null;

  const expiresSoon = !row.token_expiry || new Date(row.token_expiry).getTime() - Date.now() < 60 * 60 * 1000;
  if (expiresSoon && row.refresh_token) {
    const { client_id, client_secret } = creds();
    const body = (await withingsPost(TOKEN_URL, {
      action: "requesttoken",
      grant_type: "refresh_token",
      client_id,
      client_secret,
      refresh_token: row.refresh_token,
    })) as Tokens;
    await storeTokens(supabase, userId, body);
    return { ...row, access_token: body.access_token };
  }
  return row;
}

async function api(token: string, path: string, params: Record<string, string>) {
  const res = await fetch(`https://wbsapi.withings.net${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json: any = await res.json().catch(() => ({}));
  if (json.status !== 0) return null;
  return json.body;
}

/** Withings measure type ids -> our column names (values are scaled by 10^unit). */
const MEASURE_MAP: Record<number, string> = {
  1: "weight_kg",
  6: "fat_ratio",
  5: "fat_free_mass_kg",
  8: "fat_mass_kg",
  76: "muscle_mass_kg",
  88: "bone_mass_kg",
  77: "hydration_kg",
  170: "visceral_fat",
  91: "pulse_wave_velocity",
  9: "bp_diastolic",
  10: "bp_systolic",
  11: "heart_rate_bpm",
  54: "spo2_percent",
  73: "skin_temp_celsius",
  71: "body_temp_celsius",
};

/** Pulls body measurements, sleep summaries, activity and heart data since the last sync. */
export const syncWithings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const row = await validToken(supabase, userId);
    if (!row) return { connected: false as const };
    const token = row.access_token as string;

    const now = Math.floor(Date.now() / 1000);
    const since = now - 90 * 86400;
    const day = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

    // ---- Body measurements
    const measure = await api(token, "/measure", { action: "getmeas", meastypes: Object.keys(MEASURE_MAP).join(","), category: "1", startdate: String(since), enddate: String(now) });
    const bodyRows: any[] = [];
    for (const grp of measure?.measuregrps ?? []) {
      const rec: any = { user_id: userId, measured_at: new Date(grp.date * 1000).toISOString() };
      for (const m of grp.measures ?? []) {
        const col = MEASURE_MAP[m.type];
        if (col) rec[col] = m.value * Math.pow(10, m.unit);
      }
      if (Object.keys(rec).length > 2) bodyRows.push(rec);
    }
    if (bodyRows.length) await supabase.from("withings_body_measurements").upsert(bodyRows, { onConflict: "user_id,measured_at" });

    // ---- Sleep summaries
    const sleep = await api(token, "/v2/sleep", {
      action: "getsummary",
      startdateymd: day(since),
      enddateymd: day(now),
      data_fields: "total_sleep_time,sleep_score,rem_sleepduration,lightsleepduration,deepsleepduration,wakeupcount,apnea_hypopnea_index,snoring,hr_average,hrv,rr_average",
    });
    const sleepRows = (sleep?.series ?? []).map((s: any) => ({
      user_id: userId,
      sleep_date: s.date,
      start_time: s.startdate ? new Date(s.startdate * 1000).toISOString() : null,
      end_time: s.enddate ? new Date(s.enddate * 1000).toISOString() : null,
      duration_seconds: s.data?.total_sleep_time ?? null,
      sleep_score: s.data?.sleep_score ?? null,
      rem_duration: s.data?.rem_sleepduration ?? null,
      light_duration: s.data?.lightsleepduration ?? null,
      deep_duration: s.data?.deepsleepduration ?? null,
      awake_count: s.data?.wakeupcount ?? null,
      apnea_index: s.data?.apnea_hypopnea_index ?? null,
      snoring_duration: s.data?.snoring ?? null,
      avg_heart_rate: s.data?.hr_average ?? null,
      hrv: s.data?.hrv ?? null,
      respiratory_rate: s.data?.rr_average ?? null,
    }));
    if (sleepRows.length) await supabase.from("withings_sleep").upsert(sleepRows, { onConflict: "user_id,sleep_date" });

    // ---- Activity
    const activity = await api(token, "/v2/measure", {
      action: "getactivity",
      startdateymd: day(since),
      enddateymd: day(now),
      data_fields: "steps,distance,calories,totalcalories,elevation,soft,moderate,intense,active",
    });
    const actRows = (activity?.activities ?? []).map((a: any) => ({
      user_id: userId,
      activity_date: a.date,
      steps: a.steps ?? null,
      distance_metres: a.distance ?? null,
      calories_total: a.totalcalories ?? null,
      calories_active: a.calories ?? null,
      active_duration_minutes: a.active != null ? Math.round(a.active / 60) : null,
      elevation_metres: a.elevation ?? null,
      soft_duration: a.soft ?? null,
      moderate_duration: a.moderate ?? null,
      intense_duration: a.intense ?? null,
    }));
    if (actRows.length) await supabase.from("withings_activity").upsert(actRows, { onConflict: "user_id,activity_date" });

    // ---- Heart / ECG (AFib)
    const heart = await api(token, "/v2/heart", { action: "list", startdate: String(since), enddate: String(now) });
    const heartRows = (heart?.series ?? []).map((h: any) => ({
      user_id: userId,
      recorded_at: new Date(h.timestamp * 1000).toISOString(),
      afib_result: h.ecg?.afib === 1 ? "positive" : h.ecg?.afib === 2 ? "negative" : h.ecg ? "inconclusive" : null,
      resting_hr: h.heart_rate ?? null,
      hrv: h.heart_rate_variability ?? null,
    }));
    if (heartRows.length) await supabase.from("withings_heart").upsert(heartRows, { onConflict: "user_id,recorded_at" });

    // Keep the profile weight/BMI in sync with the latest scale reading.
    const latestWeight = bodyRows.filter((b) => b.weight_kg).sort((a, b) => (a.measured_at < b.measured_at ? 1 : -1))[0];
    if (latestWeight?.weight_kg) {
      const { data: profile } = await supabase.from("profiles").select("height_cm").eq("id", userId).maybeSingle();
      const h = profile?.height_cm ? profile.height_cm / 100 : null;
      await supabase
        .from("profiles")
        .update({
          weight_kg: Math.round(latestWeight.weight_kg * 10) / 10,
          bmi: h ? Math.round((latestWeight.weight_kg / (h * h)) * 10) / 10 : null,
        })
        .eq("id", userId);
    }

    await supabase
      .from("user_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "withings");

    return {
      connected: true as const,
      imported: { body: bodyRows.length, sleep: sleepRows.length, activity: actRows.length, heart: heartRows.length },
    };
  });

/** Connection status plus the latest measurements for the dashboard card. */
export const getWithingsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("user_integrations")
      .select("connected_at, last_sync_at, scopes")
      .eq("user_id", userId)
      .eq("provider", "withings")
      .maybeSingle();
    if (!row) return { connected: false as const, configured: !!process.env["WITHINGS_CLIENT_ID"] };

    const [body, sleep, activity, heart] = await Promise.all([
      supabase.from("withings_body_measurements").select("*").eq("user_id", userId).order("measured_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("withings_sleep").select("*").eq("user_id", userId).order("sleep_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("withings_activity").select("*").eq("user_id", userId).order("activity_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("withings_heart").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    return {
      connected: true as const,
      configured: true,
      connected_at: row.connected_at,
      last_sync_at: row.last_sync_at,
      latest: {
        body: body.data ?? null,
        sleep: sleep.data ?? null,
        activity: activity.data ?? null,
        heart: heart.data ?? null,
      },
    };
  });

/** Revokes access at Withings and removes the stored tokens. */
export const disconnectWithings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("user_integrations")
      .select("provider_user_id")
      .eq("user_id", userId)
      .eq("provider", "withings")
      .maybeSingle();

    if (row?.provider_user_id) {
      try {
        const { client_id, client_secret } = creds();
        await withingsPost(TOKEN_URL, {
          action: "revoke",
          client_id,
          client_secret,
          userid: row.provider_user_id,
        });
      } catch {
        /* revocation is best-effort; local tokens are removed regardless */
      }
    }
    await supabase.from("user_integrations").delete().eq("user_id", userId).eq("provider", "withings");
    return { ok: true as const };
  });
