import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const KEY = "nirogi-water-reminders";

type Schedule = { enabled: boolean; intervalMin: number; startHour: number; endHour: number };

const DEFAULTS: Schedule = { enabled: false, intervalMin: 60, startHour: 7, endHour: 22 };
const INTERVALS = [30, 60, 90, 120];

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** Water reminders driven by the service worker, so they fire with the tab closed. */
export function WaterReminders({ goalReached }: { goalReached: boolean }) {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULTS);
  const [custom, setCustom] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSchedule({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Schedule>) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Push the schedule into the service worker whenever it changes.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(schedule));
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        // Auto-stop for the rest of the day once the goal is reached.
        const enabled = schedule.enabled && !goalReached;
        reg.active?.postMessage(enabled ? { type: "WATER_SCHEDULE", schedule: { ...schedule, enabled } } : { type: "WATER_STOP" });
      })
      .catch(() => undefined);
  }, [schedule, hydrated, goalReached]);

  const toggle = async () => {
    if (schedule.enabled) {
      setSchedule((s) => ({ ...s, enabled: false }));
      toast.success("Water reminders turned off.");
      return;
    }
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast.error("Allow notifications to get water reminders.");
      return;
    }
    setSchedule((s) => ({ ...s, enabled: true }));
    toast.success(`Reminders on — every ${schedule.intervalMin} minutes.`);
  };

  const showIosBanner = isIos() && !isStandalone();

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            {schedule.enabled ? <BellRing className="size-5 text-primary" /> : <BellOff className="size-5 text-muted-foreground" />}
            Drink-water reminders
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nudges keep coming even when Nirogi is closed, and stop automatically once you hit your goal.
          </p>
        </div>
        <Button onClick={toggle} variant={schedule.enabled ? "outline" : "default"} size="sm">
          {schedule.enabled ? "Turn off" : "Turn on"}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {INTERVALS.map((m) => (
          <button
            key={m}
            onClick={() => setSchedule((s) => ({ ...s, intervalMin: m }))}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              schedule.intervalMin === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
            }`}
          >
            {m < 60 ? `${m} min` : m === 60 ? "1 hour" : `${m / 60} hours`}
          </button>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
            placeholder="custom"
            inputMode="numeric"
            className="h-8 w-20 rounded-full border border-border bg-transparent px-3 text-xs"
          />
          <button
            onClick={() => {
              const v = parseInt(custom);
              if (!v || v < 15) return toast.error("Choose 15 minutes or more.");
              setSchedule((s) => ({ ...s, intervalMin: v }));
              setCustom("");
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            Set
          </button>
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Active hours</span>
        <select
          value={schedule.startHour}
          onChange={(e) => setSchedule((s) => ({ ...s, startHour: parseInt(e.target.value) }))}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>)}
        </select>
        <span className="text-muted-foreground">to</span>
        <select
          value={schedule.endHour}
          onChange={(e) => setSchedule((s) => ({ ...s, endHour: parseInt(e.target.value) }))}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>)}
        </select>
      </div>

      {schedule.enabled && goalReached && (
        <p className="mt-3 rounded-xl bg-success/10 px-4 py-2 text-sm text-success">
          Goal reached — reminders paused until tomorrow.
        </p>
      )}

      {showIosBanner && (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
          On iPhone, tap <span className="font-semibold">Share → Add to Home Screen</span> and open Nirogi from there — iOS only
          allows notifications for installed web apps.
        </p>
      )}
    </section>
  );
}
