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

  const googleFitClientId = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID as string | undefined;
  const connectGoogleFit = () => {
    if (!googleFitClientId) return;
    const scope = "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read";
    const redirect = `${window.location.origin}/dashboard/devices`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleFitClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=${encodeURIComponent(scope)}&include_granted_scopes=true`;
    window.location.href = url;
  };

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

        <Tabs defaultValue="sensors" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sensors">Phone Sensors</TabsTrigger>
            <TabsTrigger value="health-connect">Health Connect</TabsTrigger>
            <TabsTrigger value="google-fit">Google Fit</TabsTrigger>
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

          <TabsContent value="health-connect" className="mt-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-success/10 text-success"><HeartPulse className="size-6" /></span>
                <div>
                  <h2 className="font-display text-lg font-semibold">Android Health Connect</h2>
                  <p className="text-sm text-muted-foreground">Sync steps, heart rate, sleep, weight & SpO2</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Steps", "Heart rate", "Sleep", "Weight", "SpO2", "Blood glucose"].map((d) => (
                  <span key={d} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">{d}</span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
                Health Connect needs the free <span className="font-semibold text-foreground">Nirogi Sync</span> companion app (coming soon) on Android. We'll notify you when it's available — for now, use the phone sensors and manual logging.
              </div>
              <Button disabled className="mt-4 w-full">Install Nirogi Sync (coming soon)</Button>
            </div>
          </TabsContent>

          <TabsContent value="google-fit" className="mt-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Gauge className="size-6" /></span>
                <div>
                  <h2 className="font-display text-lg font-semibold">Google Fit</h2>
                  <p className="text-sm text-muted-foreground">Import activity, steps & heart data</p>
                </div>
              </div>
              {googleFitClientId ? (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">Connect your Google account to pull your fitness history into Nirogi.</p>
                  <Button className="mt-4 w-full" onClick={connectGoogleFit}>Connect Google Fit</Button>
                </>
              ) : (
                <>
                  <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
                    Google Fit connection requires a Google OAuth client ID to be configured for Nirogi. Once set up, you'll be able to connect your account here and pull your fitness history.
                  </div>
                  <Button disabled className="mt-4 w-full">Connect (setup required)</Button>
                </>
              )}
            </div>
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
