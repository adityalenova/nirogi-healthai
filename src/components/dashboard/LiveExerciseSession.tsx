import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, MapPin, Pause, Play, Square, Footprints, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveExerciseSession } from "@/lib/exercise.functions";
import { ACTIVITIES, findActivity } from "@/lib/sports";

const LIVE_ACTIVITIES = ACTIVITIES.slice(0, 20);

function hhmmss(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function haversine(a: GeolocationCoordinates, b: GeolocationCoordinates) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Live, smartwatch-style workout session: timer, GPS distance, steps and MET calories. */
export function LiveExerciseSession({ weightKg }: { weightKg: number | null }) {
  const qc = useQueryClient();
  const fnSave = useServerFn(saveExerciseSession);

  const [activity, setActivity] = useState(LIVE_ACTIVITIES[0]?.name ?? "Outdoor Running");
  const [state, setState] = useState<"idle" | "running" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [steps, setSteps] = useState(0);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<{ activity: string; seconds: number; km: number; steps: number; kcal: number } | null>(null);

  const startedAt = useRef<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastCoords = useRef<GeolocationCoordinates | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const selected = findActivity(activity);
  const met = selected?.met ?? 6;
  const kcal = Math.round((met * 3.5 * (weightKg ?? 70) * (seconds / 60)) / 200);

  // Timer.
  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  // GPS distance for outdoor activities.
  useEffect(() => {
    if (state !== "running" || !selected?.gps || !("geolocation" in navigator)) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (stateRef.current !== "running") return;
        if (pos.coords.accuracy > 40) return;
        if (lastCoords.current) {
          const d = haversine(lastCoords.current, pos.coords);
          if (d > 0.002 && d < 0.2) setDistanceKm((k) => k + d);
        }
        lastCoords.current = pos.coords;
      },
      () => toast.error("Location unavailable — distance won't be tracked."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10_000 },
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [state, selected?.gps]);

  // Step counting from device motion peaks.
  useEffect(() => {
    if (state !== "running" || typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;
    let last = 0;
    let lastPeak = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();
      if (mag - last > 2.2 && now - lastPeak > 300) {
        lastPeak = now;
        setSteps((s) => s + 1);
      }
      last = mag;
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [state]);

  const start = async () => {
    const Motion = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    if (Motion?.requestPermission) {
      try { await Motion.requestPermission(); } catch { /* declined */ }
    }
    startedAt.current = new Date().toISOString();
    setSeconds(0);
    setDistanceKm(0);
    setSteps(0);
    setSummary(null);
    lastCoords.current = null;
    setState("running");
  };

  const stop = async () => {
    setState("idle");
    const total = seconds;
    if (total < 10) {
      toast.error("Session too short to save.");
      return;
    }
    setSaving(true);
    try {
      await fnSave({
        data: {
          activity_type: activity,
          duration_seconds: total,
          distance_km: distanceKm > 0 ? Math.round(distanceKm * 100) / 100 : null,
          steps: steps > 0 ? steps : null,
          calories_burned: kcal,
          started_at: startedAt.current ?? new Date().toISOString(),
          ended_at: new Date().toISOString(),
        },
      });
      setSummary({ activity, seconds: total, km: Math.round(distanceKm * 100) / 100, steps, kcal });
      qc.invalidateQueries({ queryKey: ["exercise-sessions"] });
      qc.invalidateQueries({ queryKey: ["health-score"] });
      toast.success("Workout saved.");
    } catch {
      toast.error("Couldn't save the session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">Live workout</h2>
      <p className="mt-1 text-sm text-muted-foreground">Start a real session — the timer, distance, steps and calories update as you move.</p>

      <select
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        disabled={state !== "idle"}
        className="mt-4 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-60"
      >
        {LIVE_ACTIVITIES.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
      </select>

      <div className="mt-5 text-center">
        <p className="font-display text-5xl font-extrabold tabular-nums">{hhmmss(seconds)}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Metric icon={<Flame className="size-4 text-pulse" />} label="kcal" value={`${kcal}`} />
          <Metric icon={<MapPin className="size-4 text-primary" />} label="km" value={distanceKm.toFixed(2)} />
          <Metric icon={<Footprints className="size-4 text-success" />} label="steps" value={`${steps}`} />
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {state === "idle" && <Button onClick={start}><Play className="size-4" /> Start</Button>}
        {state === "running" && (
          <>
            <Button variant="outline" onClick={() => setState("paused")}><Pause className="size-4" /> Pause</Button>
            <Button variant="destructive" onClick={stop} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" />} Stop &amp; save
            </Button>
          </>
        )}
        {state === "paused" && (
          <>
            <Button onClick={() => setState("running")}><Play className="size-4" /> Resume</Button>
            <Button variant="destructive" onClick={stop} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" />} Stop &amp; save
            </Button>
          </>
        )}
      </div>

      {!weightKg && <p className="mt-3 text-center text-xs text-muted-foreground">Add your weight in your profile for accurate calorie burn.</p>}

      {summary && (
        <div className="mt-5 rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
          <p className="font-display font-bold text-success">Session complete — {summary.activity}</p>
          <p className="mt-1 text-muted-foreground">
            {hhmmss(summary.seconds)} · {summary.kcal} kcal{summary.km ? ` · ${summary.km} km` : ""}{summary.steps ? ` · ${summary.steps} steps` : ""}
          </p>
        </div>
      )}
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</span>
      <p className="mt-1 font-display text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
