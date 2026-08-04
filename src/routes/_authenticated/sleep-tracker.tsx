import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Moon,
  Loader2,
  Trash2,
  Sparkles,
  AlertTriangle,
  Mic,
  Square,
  Sun,
  BedDouble,
  Activity,
  Volume2,
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { getSleep, logSleep, deleteSleep, submitSleepSession, getSleepDashboard } from "@/lib/wellness.functions";
import { ReportActions } from "@/components/site/ReportActions";

export const Route = createFileRoute("/_authenticated/sleep-tracker")({
  head: () => ({ meta: [{ title: "Sleep Tracker · Nirogi" }] }),
  component: SleepTracker,
});

function fmtDur(min: number | null) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

type SleepEvent = { type: "snore" | "apnea" | "movement" | "sound"; t: number; intensity?: number };
type DurationChoice = { label: string; hours: number };
const DURATIONS: DurationChoice[] = [
  { label: "4h", hours: 4 },
  { label: "6h", hours: 6 },
  { label: "8h", hours: 8 },
  { label: "Full night", hours: 8.5 },
];

/** In-browser overnight sound monitor. Uses the mic to flag snoring, quiet-after-loud
 * breathing gaps (possible apnea), movement thumps and general sound events. This is a
 * heuristic signal-processing pass, not a medical diagnosis. */
function useSleepMonitor() {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const startRef = useRef<number>(0);
  const loudStreakRef = useRef(0);
  const quietAfterLoudRef = useRef(0);
  const eventsRef = useRef<SleepEvent[]>([]);
  const [level, setLevel] = useState(0);
  const [counts, setCounts] = useState({ snore: 0, apnea: 0, movement: 0, sound: 0 });

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    startRef.current = Date.now();
    eventsRef.current = [];
    loudStreakRef.current = 0;
    quietAfterLoudRef.current = 0;
    setCounts({ snore: 0, apnea: 0, movement: 0, sound: 0 });

    try {
      wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock.request("screen");
    } catch {
      /* wake lock not supported / denied — recording still continues in background */
    }

    const buf = new Uint8Array(analyser.frequencyBinCount);
    intervalRef.current = window.setInterval(() => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
      const norm = Math.min(1, avg / 90);
      setLevel(norm);
      const t = Math.round((Date.now() - startRef.current) / 1000);

      if (norm > 0.55) {
        loudStreakRef.current += 1;
        quietAfterLoudRef.current = 0;
        // Sustained loud, low-frequency-ish rumble ~= snoring.
        if (loudStreakRef.current === 3) {
          eventsRef.current.push({ type: "snore", t, intensity: norm });
          setCounts((c) => ({ ...c, snore: c.snore + 1 }));
        } else if (norm > 0.8 && loudStreakRef.current % 6 === 0) {
          eventsRef.current.push({ type: "movement", t, intensity: norm });
          setCounts((c) => ({ ...c, movement: c.movement + 1 }));
        } else if (loudStreakRef.current % 10 === 0) {
          eventsRef.current.push({ type: "sound", t, intensity: norm });
          setCounts((c) => ({ ...c, sound: c.sound + 1 }));
        }
      } else {
        if (loudStreakRef.current >= 3) {
          quietAfterLoudRef.current += 1;
          // Loud breathing/snoring abruptly stops for 10+ seconds then presumably resumes: flag as
          // a suspected apnea (breathing-pause) event.
          if (quietAfterLoudRef.current === 10) {
            eventsRef.current.push({ type: "apnea", t, intensity: norm });
            setCounts((c) => ({ ...c, apnea: c.apnea + 1 }));
          }
        }
        loudStreakRef.current = 0;
      }
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    wakeLockRef.current?.release().catch(() => undefined);
    wakeLockRef.current = null;
    return eventsRef.current;
  };

  useEffect(() => {
    const reacquire = () => {
      if (document.visibilityState === "visible" && streamRef.current && !wakeLockRef.current) {
        (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } })
          .wakeLock?.request("screen")
          .then((wl) => { wakeLockRef.current = wl; })
          .catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => document.removeEventListener("visibilitychange", reacquire);
  }, []);

  return { start, stop, level, counts };
}

function SleepTracker() {
  const { t, lang } = useI18n();
  const { memberId, memberName } = useActiveMember();
  const qc = useQueryClient();
  const fnGet = useServerFn(getSleep);
  const fnLog = useServerFn(logSleep);
  const fnDel = useServerFn(deleteSleep);
  const fnSubmitSession = useServerFn(submitSleepSession);
  const fnDashboard = useServerFn(getSleepDashboard);

  const [bedtime, setBedtime] = useState("22:30");
  const [wake, setWake] = useState("06:30");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // In-session tracking state
  const [target, setTarget] = useState<DurationChoice>(DURATIONS[2]);
  const [tracking, setTracking] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [dark, setDark] = useState(false);
  const monitor = useSleepMonitor();

  const { data, isLoading } = useQuery({ queryKey: ["sleep", memberId], queryFn: () => fnGet({ data: { memberId } }) });
  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ["sleep-dashboard", memberId],
    queryFn: () => fnDashboard({ data: { memberId } }),
  });

  useEffect(() => {
    if (!tracking || !sessionStart) return;
    const id = window.setInterval(() => setElapsed(Math.round((Date.now() - sessionStart) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [tracking, sessionStart]);

  const startTracking = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("This device can't access the microphone for sleep monitoring.");
      return;
    }
    try {
      await monitor.start();
      setSessionStart(Date.now());
      setElapsed(0);
      setTracking(true);
      setDark(true);
      toast.success("Sleep tracking started. Place your phone near the bed and go to sleep.");
    } catch {
      toast.error("Microphone permission is needed to track snoring and sounds.");
    }
  };

  const stopTracking = async () => {
    const events = monitor.stop();
    setTracking(false);
    setDark(false);
    setBusy(true);
    try {
      const startedAt = sessionStart ?? Date.now();
      const bed = new Date(startedAt);
      const wakeAt = new Date();
      await fnSubmitSession({
        data: {
          memberId,
          bedtime: bed.toISOString(),
          wake_time: wakeAt.toISOString(),
          target_hours: target.hours,
          events,
          notes: notes || null,
          lang,
        },
      });
      setNotes("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["sleep", memberId] }),
        qc.invalidateQueries({ queryKey: ["sleep-dashboard", memberId] }),
      ]);
      qc.invalidateQueries({ queryKey: ["health-score"] });
      toast.success("You're awake — sleep report ready.");
    } catch {
      toast.error("Couldn't analyse your sleep session. Try again.");
    } finally {
      setBusy(false);
      setSessionStart(null);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      await fnLog({
        data: {
          memberId,
          bedtime: `${yest}T${bedtime}:00`,
          wake_time: `${today}T${wake}:00`,
          notes: notes || null,
          lang,
        },
      });
      setNotes("");
      await qc.invalidateQueries({ queryKey: ["sleep", memberId] });
      qc.invalidateQueries({ queryKey: ["health-score"] });
      toast.success("Sleep logged and analysed.");
    } catch {
      toast.error("Couldn't log sleep. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const latest = data?.logs?.[0];
  const analysis = latest?.ai_analysis as { score?: number; summary?: string; tips?: string[]; flags?: string[] } | null;

  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");

  return (
    <SiteLayout>
      {dark && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black text-white" onClick={() => setDark(false)}>
          <Moon className="size-10 text-primary" />
          <p className="font-display text-4xl font-bold tabular-nums">{h}:{m}:{s}</p>
          <p className="text-sm text-white/60">Tracking your sleep — tap for details</p>
          <div className="flex items-center gap-1.5">
            <Volume2 className="size-4 text-white/50" />
            <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(monitor.level * 100)}%` }} />
            </div>
          </div>
          <Button
            variant="destructive"
            size="lg"
            onClick={(e) => { e.stopPropagation(); stopTracking(); }}
            className="mt-4"
          >
            <Sun className="size-4" /> I'm awake — stop &amp; analyse
          </Button>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("nav.dashboard", "Dashboard")}
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Moon className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("sleep.title", "Sleep Tracker")}</h1>
            <p className="text-sm text-muted-foreground">
              {memberName ? `${memberName} · ` : ""}{t("sleep.sub", "Log your nights and get an AI sleep-quality report.")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
                <p className="font-display text-2xl font-bold">{fmtDur(data?.avgDuration ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{t("sleep.avg_dur", "Avg sleep (7 nights)")}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
                <p className="font-display text-2xl font-bold">{data?.avgScore || "—"}<span className="text-sm text-muted-foreground">/100</span></p>
                <p className="text-xs text-muted-foreground">{t("sleep.avg_score", "Avg quality")}</p>
              </div>
            </section>

            {/* Voice-monitored overnight tracking */}
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Mic className="size-5 text-primary" /> {t("sleep.track_live", "Start sleep tracking")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Uses your microphone to listen for snoring, breathing pauses and movement while you sleep. Everything is
                processed on this device — audio is never uploaded, only detected event counts and timing.
              </p>

              {!tracking ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.label}
                        onClick={() => setTarget(d)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          target.label === d.label ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <Button onClick={startTracking} disabled={busy} className="mt-4 w-full">
                    <Mic className="size-4" /> {t("sleep.start_tracking", "Start Sleep Tracking")}
                  </Button>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-2xl font-bold tabular-nums">{h}:{m}:{s}</p>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span className="size-2 animate-pulse rounded-full bg-primary" /> Recording
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Volume2 className="size-4 text-muted-foreground" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(monitor.level * 100)}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div><p className="font-display text-lg font-bold">{monitor.counts.snore}</p><p className="text-muted-foreground">Snores</p></div>
                    <div><p className="font-display text-lg font-bold text-destructive">{monitor.counts.apnea}</p><p className="text-muted-foreground">Apnea?</p></div>
                    <div><p className="font-display text-lg font-bold">{monitor.counts.movement}</p><p className="text-muted-foreground">Movement</p></div>
                    <div><p className="font-display text-lg font-bold">{monitor.counts.sound}</p><p className="text-muted-foreground">Sounds</p></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => setDark(true)} className="flex-1">
                      <Moon className="size-4" /> Dark screen
                    </Button>
                    <Button variant="destructive" onClick={stopTracking} disabled={busy} className="flex-1">
                      {busy ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" />} I'm awake
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    You can lock or dim your screen — tracking keeps running in the background as long as this tab stays open.
                  </p>
                </div>
              )}
            </section>

            {/* Weekly sleep dashboard */}
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Activity className="size-5 text-primary" /> {t("sleep.weekly_dashboard", "Weekly sleep dashboard")}
              </h2>
              {dashLoading ? (
                <div className="mt-6 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="mt-4 h-40 w-full">
                    <ResponsiveContainer>
                      <BarChart data={dash?.week ?? []}>
                        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                        <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                          <LabelList dataKey="hours" position="top" fontSize={10} formatter={(v: number) => (v ? `${v}h` : "")} />
                          {(dash?.week ?? []).map((d, i) => (
                            <Cell key={i} fill={d.apnea ? "hsl(var(--destructive))" : d.hours >= d.target ? "hsl(var(--primary))" : "hsl(var(--warning))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Bar height = hours slept vs target · <span className="text-destructive font-semibold">red</span> = apnea flagged that night
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="font-display text-xl font-bold">{dash?.avgScore || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">Avg score</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="font-display text-xl font-bold">{dash?.snoringNights ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Snoring nights</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="font-display text-xl font-bold text-destructive">{dash?.apneaNights ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Apnea nights</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="font-display text-xl font-bold">{dash?.consistencyScore ?? 0}%</p>
                      <p className="text-[11px] text-muted-foreground">Consistency</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-success"><BedDouble className="size-3.5" /> Best night</p>
                      <p className="mt-1 text-sm">{dash?.best ? `${dash.best.quality_score}/100 · ${dash.best.duration_hours}h` : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-warning"><AlertTriangle className="size-3.5" /> Worst night</p>
                      <p className="mt-1 text-sm">{dash?.worst ? `${dash.worst.quality_score}/100 · ${dash.worst.duration_hours}h` : "—"}</p>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">{t("sleep.log_night", "Log last night")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">{t("sleep.bedtime", "Bedtime")}</Label>
                  <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5">{t("sleep.waketime", "Wake time")}</Label>
                  <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <Label className="mb-1.5">{t("sleep.notes", "How did you sleep? (snoring, waking up, dreams, sounds)")}</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. woke up twice, snored a lot, restless" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("sleep.voice_note", "Tip: describe any sounds or snoring you noticed — the AI uses this to flag possible sleep-apnea patterns.")}
                </p>
              </div>
              <Button onClick={submit} disabled={busy} className="mt-4 w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {busy ? t("sleep.analysing", "Analysing…") : t("sleep.analyse", "Save & analyse")}
              </Button>
            </section>

            {analysis && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">{t("sleep.report", "Latest sleep report")}</h2>
                  <span className="font-display text-2xl font-bold text-primary">{analysis.score}<span className="text-sm text-muted-foreground">/100</span></span>
                </div>
                <p className="mt-2 text-sm text-foreground/80">{analysis.summary}</p>
                {(analysis.flags?.length ?? 0) > 0 && (
                  <div className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3">
                    {analysis.flags!.map((f, i) => (
                      <p key={i} className="flex items-start gap-2 text-sm text-warning-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {f}</p>
                    ))}
                  </div>
                )}
                {(analysis.tips?.length ?? 0) > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                    {analysis.tips!.map((tp, i) => <li key={i}>{tp}</li>)}
                  </ul>
                )}
                <div className="mt-4">
                  <ReportActions source={{ toolName: "Sleep report", text: `Sleep quality: ${analysis.score}/100\n\n${analysis.summary}\n\nTips:\n${(analysis.tips ?? []).join("\n")}` }} />
                </div>
              </section>
            )}

            {(data?.logs.length ?? 0) > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold">{t("sleep.history", "Sleep history")}</h2>
                <div className="mt-3 space-y-2">
                  {data!.logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{fmtDur(l.duration_min)}{l.quality_score ? ` · ${l.quality_score}/100` : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.bedtime ? new Date(l.bedtime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"} → {l.wake_time ? new Date(l.wake_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </p>
                      </div>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        {new Date(l.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <button onClick={async () => { await fnDel({ data: { id: l.id } }); qc.invalidateQueries({ queryKey: ["sleep", memberId] }); }} aria-label="Delete">
                          <Trash2 className="size-4 hover:text-destructive" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  );
}
