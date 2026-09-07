import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Smartphone, Activity, Mic, Camera, MapPin, Bell, HeartPulse, CheckCircle2, Gauge, Loader2, RefreshCw, Unlink, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { startWithingsAuth, completeWithingsAuth, syncWithings, getWithingsStatus, disconnectWithings } from "@/lib/withings.functions";
import { startGoogleHealthAuth, completeGoogleHealthAuth, syncGoogleHealth, getGoogleHealthStatus, disconnectGoogleHealth } from "@/lib/googlefit.functions";


export const Route = createFileRoute("/_authenticated/dashboard/devices")({
  head: () => ({ meta: [{ title: "Connected Devices · Nirogi" }] }),
  component: DevicesPage,
});

const STORAGE = "nirogi_devices_config";
type SensorKey = "gps" | "motion" | "mic" | "camera" | "barometer" | "notifications";

const SENSORS: { key: SensorKey; label: string; desc: string; icon: typeof MapPin }[] = [
  { key: "gps", label: "Location (GPS)", desc: "Powers UV index, altitude & route tracking", icon: MapPin },
  { key: "motion", label: "Motion / Accelerometer", desc: "Powers step counting & activity", icon: Activity },
  { key: "mic", label: "Microphone", desc: "Powers the hearing self-test & voice tools", icon: Mic },
  { key: "camera", label: "Camera", desc: "Powers heart rate & SpO2 (finger PPG)", icon: Camera },
  { key: "barometer", label: "Barometer / Pressure", desc: "Powers altitude & weather-pressure tracking", icon: Gauge },
  { key: "notifications", label: "Notifications", desc: "Reminders for water, medicine & breaks", icon: Bell },
];

function load(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE) || "{}"); } catch { return {}; }
}
function save(state: Record<string, boolean>) {
  try { window.localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* ignore */ }
}

function DevicesPage() {
  const [state, setState] = useState<Record<string, boolean>>({});
  useEffect(() => setState(load()), []);

  const setKey = (key: string, val: boolean) => {
    const next = { ...state, [key]: val };
    setState(next);
    save(next);
  };

  const requestSensor = async (key: SensorKey) => {
    if (state[key]) { setKey(key, false); toast.info("Turned off in Nirogi. Manage full access in your browser settings."); return; }
    try {
      if (key === "gps") {
        await new Promise<void>((res, rej) => navigator.geolocation.getCurrentPosition(() => res(), rej, { timeout: 10000 }));
      } else if (key === "mic") {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop());
      } else if (key === "camera") {
        const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach((t) => t.stop());
      } else if (key === "notifications") {
        const p = await Notification.requestPermission(); if (p !== "granted") throw new Error("denied");
      } else if (key === "barometer") {
        const hasBaro = typeof window !== "undefined" && "Barometer" in window;
        if (!hasBaro) { toast.info("No barometer detected — altitude uses GPS instead."); }
      } else if (key === "motion") {
        const D = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
        if (D?.requestPermission) { const p = await D.requestPermission(); if (p !== "granted") throw new Error("denied"); }
      }
      setKey(key, true);
      toast.success("Permission granted.");
    } catch {
      setKey(key, false);
      toast.error("Permission denied. You can still use manual entry for these features.");
    }
  };

  const connectedCount = SENSORS.filter((s) => state[s.key]).length;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Smartphone className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Connected Devices</h1>
            <p className="text-sm text-muted-foreground">{connectedCount} phone sensor{connectedCount === 1 ? "" : "s"} enabled</p>
          </div>
        </div>

        <Tabs defaultValue={typeof window !== "undefined" && window.location.search.includes("code=") ? (window.location.search.includes("state=gh.") ? "google-health" : "withings") : "sensors"} className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sensors">Phone Sensors</TabsTrigger>
            <TabsTrigger value="withings">Withings</TabsTrigger>
            <TabsTrigger value="google-health">Google Health</TabsTrigger>
          </TabsList>


          <TabsContent value="sensors" className="mt-5 space-y-3">
            {SENSORS.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl", state[s.key] ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
                <Switch checked={!!state[s.key]} onCheckedChange={() => requestSensor(s.key)} />
              </div>
            ))}
            <p className="pt-1 text-center text-xs text-muted-foreground">Permissions are requested by your browser. Nirogi never accesses a sensor without your tap.</p>
          </TabsContent>

          <TabsContent value="withings" className="mt-5">
            <WithingsPanel />
          </TabsContent>

          <TabsContent value="google-health" className="mt-5">
            <GoogleHealthPanel />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          Sensor status is stored on this device. Enabled sensors power modules like Heart Rhythm, SpO2, Hearing and UV.
        </div>
      </div>
    </SiteLayout>
  );
}

function WithingsPanel() {
  const qc = useQueryClient();
  const start = useServerFn(startWithingsAuth);
  const complete = useServerFn(completeWithingsAuth);
  const sync = useServerFn(syncWithings);
  const disconnect = useServerFn(disconnectWithings);
  const status = useQuery({ queryKey: ["withings-status"], queryFn: () => getWithingsStatus() });
  const [busy, setBusy] = useState<null | "connect" | "sync" | "disconnect" | "callback">(null);

  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/dashboard/devices` : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code || (params.get("state") ?? "").startsWith("gh.")) return;
    setBusy("callback");
    complete({ data: { code, redirect_uri: redirectUri } })
      .then(async () => {
        window.history.replaceState({}, "", "/dashboard/devices");
        toast.success("Withings connected. Importing your data…");
        await sync();
        qc.invalidateQueries();
      })
      .catch(() => toast.error("Couldn't finish connecting Withings. Please try again."))
      .finally(() => setBusy(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = status.data;
  const connected = data?.connected === true;
  const configured = data?.configured !== false;

  const onConnect = async () => {
    setBusy("connect");
    try {
      const { url } = await start({ data: { redirect_uri: redirectUri } });
      window.location.href = url;
    } catch {
      toast.error("Withings isn't configured yet. Add the API keys to enable it.");
      setBusy(null);
    }
  };

  const onSync = async () => {
    setBusy("sync");
    try {
      const res = await sync();
      if (res.connected === false) toast.error("Withings isn't connected.");
      else {
        const i = res.imported;
        toast.success(`Synced — ${i.body} body, ${i.sleep} sleep, ${i.activity} activity, ${i.heart} heart records.`);
      }
      qc.invalidateQueries();
    } catch {
      toast.error("Sync failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async () => {
    if (!window.confirm("Disconnect Withings? Imported data stays in Nirogi.")) return;
    setBusy("disconnect");
    try {
      await disconnect();
      toast.success("Withings disconnected.");
      qc.invalidateQueries();
    } catch {
      toast.error("Couldn't disconnect. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const latest = connected ? data.latest : null;
  const cards = [
    { label: "Weight", value: latest?.body?.weight_kg != null ? `${latest.body.weight_kg} kg` : "—" },
    { label: "Body fat", value: latest?.body?.fat_ratio != null ? `${latest.body.fat_ratio}%` : "—" },
    { label: "Sleep", value: latest?.sleep?.duration_seconds != null ? `${Math.round((latest.sleep.duration_seconds / 3600) * 10) / 10} h` : "—" },
    { label: "Steps", value: latest?.activity?.steps != null ? `${latest.activity.steps}` : "—" },
    { label: "Heart rate", value: latest?.heart?.resting_hr != null ? `${latest.heart.resting_hr} bpm` : "—" },
    { label: "Last sync", value: connected && data.last_sync_at ? new Date(data.last_sync_at).toLocaleDateString() : "Never" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-success/10 text-success"><HeartPulse className="size-6" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">Withings</h2>
          <p className="text-sm text-muted-foreground">Smart scales, sleep mats, watches & BPM devices</p>
        </div>
        {connected && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="size-3.5" /> Connected
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Weight & BMI", "Body composition", "Sleep stages", "Steps & activity", "Heart rate", "Blood pressure"].map((d) => (
          <span key={d} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{d}</span>
        ))}
      </div>

      {status.isLoading || busy === "callback" ? (
        <div className="mt-6 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : connected ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-0.5 font-display text-base font-semibold">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={onSync} disabled={busy !== null}>
              {busy === "sync" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Sync now
            </Button>
            <Button variant="outline" onClick={onDisconnect} disabled={busy !== null}>
              <Unlink className="size-4" /> Disconnect
            </Button>
          </div>
        </>
      ) : configured ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Connect your Withings account to import the last 90 days of weight, body composition, sleep, activity and heart data — then keep it in sync with one tap.
          </p>
          <Button className="mt-4 w-full" onClick={onConnect} disabled={busy !== null}>
            {busy === "connect" ? <Loader2 className="size-4 animate-spin" /> : null} Connect Withings
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
            Withings needs its API keys configured for Nirogi before you can link an account. Once added, connecting takes one tap.
          </div>
          <Button disabled className="mt-4 w-full">Connect (setup required)</Button>
        </>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
        Your Withings tokens are stored securely on Nirogi's servers and never exposed to your browser. Disconnecting revokes access instantly.
      </p>
    </div>
  );
}

function GoogleHealthPanel() {
  const qc = useQueryClient();
  const start = useServerFn(startGoogleHealthAuth);
  const complete = useServerFn(completeGoogleHealthAuth);
  const sync = useServerFn(syncGoogleHealth);
  const disconnect = useServerFn(disconnectGoogleHealth);
  const status = useQuery({ queryKey: ["google-health-status"], queryFn: () => getGoogleHealthStatus() });
  const [busy, setBusy] = useState<null | "connect" | "sync" | "disconnect" | "callback">(null);

  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/dashboard/devices` : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state") ?? "";
    if (!code || !state.startsWith("gh.")) return;
    setBusy("callback");
    complete({ data: { code, redirect_uri: redirectUri } })
      .then(async () => {
        window.history.replaceState({}, "", "/dashboard/devices");
        toast.success("Google Health connected. Importing your data…");
        await sync().catch(() => undefined);
        qc.invalidateQueries();
      })
      .catch(() => toast.error("Couldn't finish connecting Google Health. Please try again."))
      .finally(() => setBusy(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = status.data;
  const connected = Boolean(data?.connected);
  const configured = Boolean(data?.configured);
  const days = (data?.days ?? []) as Array<Record<string, number | string | null>>;
  const latest = days[0];

  const onConnect = async () => {
    setBusy("connect");
    try {
      const { url } = await start({ data: { redirect_uri: redirectUri } });
      window.location.href = url;
    } catch {
      toast.error("Google Health isn't configured yet. Add the API keys to enable it.");
      setBusy(null);
    }
  };

  const onSync = async () => {
    setBusy("sync");
    try {
      const res = await sync();
      if (res.connected === false) toast.error("Google Health isn't connected.");
      else toast.success(`Synced ${res.imported} day${res.imported === 1 ? "" : "s"} of activity.`);
      qc.invalidateQueries();
    } catch {
      toast.error("Sync failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async () => {
    if (!window.confirm("Disconnect Google Health? Imported data stays in Nirogi.")) return;
    setBusy("disconnect");
    try {
      await disconnect();
      toast.success("Google Health disconnected.");
      qc.invalidateQueries();
    } catch {
      toast.error("Couldn't disconnect. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const num = (v: unknown) => (typeof v === "number" ? v : null);
  const cards = [
    { label: "Steps", value: num(latest?.steps) != null ? `${num(latest?.steps)}` : "—" },
    { label: "Calories", value: num(latest?.calories) != null ? `${num(latest?.calories)} kcal` : "—" },
    { label: "Distance", value: num(latest?.distance_m) != null ? `${Math.round((num(latest?.distance_m)! / 1000) * 10) / 10} km` : "—" },
    { label: "Active time", value: num(latest?.active_minutes) != null ? `${num(latest?.active_minutes)} min` : "—" },
    { label: "Heart rate", value: num(latest?.heart_rate_avg) != null ? `${num(latest?.heart_rate_avg)} bpm` : "—" },
    { label: "Sleep", value: num(latest?.sleep_minutes) != null ? `${Math.round((num(latest?.sleep_minutes)! / 60) * 10) / 10} h` : "—" },
    { label: "SpO2", value: num(latest?.spo2_avg) != null ? `${num(latest?.spo2_avg)}%` : "—" },
    { label: "Last sync", value: data?.lastSync ? new Date(data.lastSync).toLocaleDateString() : "Never" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Activity className="size-6" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">Google Health</h2>
          <p className="text-sm text-muted-foreground">Steps, workouts, sleep, heart rate & body data</p>
        </div>
        {connected && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="size-3.5" /> Connected
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Steps & distance", "Calories", "Active minutes", "Heart rate", "Sleep", "Weight & BMI", "SpO2"].map((d) => (
          <span key={d} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{d}</span>
        ))}
      </div>

      {status.isLoading || busy === "callback" ? (
        <div className="mt-6 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : connected ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-0.5 font-display text-base font-semibold">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={onSync} disabled={busy !== null}>
              {busy === "sync" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Sync now
            </Button>
            <Button variant="outline" onClick={onDisconnect} disabled={busy !== null}>
              <Unlink className="size-4" /> Disconnect
            </Button>
          </div>
        </>
      ) : configured ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Link your Google account to import the last 30 days of steps, workouts, sleep, heart rate and weight — Nirogi keeps your dashboard and health score up to date from it.
          </p>
          <Button className="mt-4 w-full" onClick={onConnect} disabled={busy !== null}>
            {busy === "connect" ? <Loader2 className="size-4 animate-spin" /> : null} Connect Google Health
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
            Google Health needs its client ID and secret configured for Nirogi before you can link an account.
          </div>
          <Button disabled className="mt-4 w-full">Connect (setup required)</Button>
        </>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
        Your Google tokens are stored securely on Nirogi's servers and never exposed to your browser. Disconnecting revokes access instantly.
      </p>
    </div>
  );
}
