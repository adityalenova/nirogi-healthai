import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap, Sun, Dumbbell, Apple, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWellnessDay, saveEnergy, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";
import {
  ENERGY_LEVELS,
  ENERGY_RESPONSES,
  MORNING_WINS,
  SUNLIGHT_SCIENCE,
  IRON_DEFICIENCY_CONTEXT,
  antiFatigueFoodOfDay,
  microExerciseOfDay,
} from "@/lib/wellness-content";

export const Route = createFileRoute("/_authenticated/daily-energy")({
  head: () => ({
    meta: [
      { title: "Daily Energy · Nirogi" },
      { name: "description", content: "Energy check-in, morning wins, sunlight timer, iron-rich foods, micro exercise and a 7-day energy chart." },
      { property: "og:title", content: "Daily Energy · Nirogi" },
      { property: "og:description", content: "Six daily tools to beat fatigue and build lasting energy." },
    ],
  }),
  component: DailyEnergy,
});

function useReward(fnComplete: ReturnType<typeof useServerFn<typeof completeWellnessActivity>>, refresh: () => void) {
  return async (key: string, label: string) => {
    const res = await fnComplete({ data: { key, label } });
    if (res.credited > 0) toast.success(`+${res.credited} credits — ${label} done for today.`);
    refresh();
  };
}

function EnergyCheckInCard({ selected, onPick }: { selected: number | null; onPick: (l: number) => void }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Zap className="size-5 text-primary" /> Energy check-in</h2>
      <p className="mt-1 text-sm text-muted-foreground">How's your energy right now?</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {ENERGY_LEVELS.map((e) => (
          <button
            key={e.level}
            onClick={() => onPick(e.level)}
            className={`flex w-20 flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition-all ${
              selected === e.level ? "border-primary bg-primary/10 scale-105" : "border-border hover:bg-muted"
            }`}
          >
            <span className="font-display text-xl font-bold">{e.level}</span>
            <span className="text-xs font-semibold">{e.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">{ENERGY_RESPONSES[selected]}</div>
      )}
    </section>
  );
}

function MorningWinsCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [celebrate, setCelebrate] = useState<number | null>(null);

  const tap = (i: number) => {
    if (done.has(i)) return;
    setCelebrate(i);
    setTimeout(() => setCelebrate(null), 700);
    setDone((s) => {
      const next = new Set(s).add(i);
      if (next.size === MORNING_WINS.length) reward("morning-wins", "2-minute morning wins");
      return next;
    });
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">2-minute morning wins</h2>
      <p className="mt-1 text-sm text-muted-foreground">Complete all three for a quick energy lift and a bonus reward.</p>
      <div className="mt-4 space-y-2">
        {MORNING_WINS.map((task, i) => (
          <button
            key={task}
            onClick={() => tap(i)}
            className={`relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              done.has(i) ? "border-success/40 bg-success/10" : "border-border hover:bg-muted"
            } ${celebrate === i ? "scale-[1.02]" : ""}`}
          >
            <CheckCircle2 className={`size-5 shrink-0 ${done.has(i) ? "fill-success text-success-foreground" : "text-muted-foreground"}`} />
            {task}
            {celebrate === i && <span className="absolute right-3 animate-bounce text-lg">🎉</span>}
          </button>
        ))}
      </div>
      {done.size === MORNING_WINS.length && (
        <p className="mt-3 text-sm font-semibold text-success">All done! +5 credits earned for today.</p>
      )}
    </section>
  );
}

function useCountdown(totalSeconds: number, onDone: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const start = () => {
    setSecondsLeft(totalSeconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return s;
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return { secondsLeft, start };
}

function SunlightTimerCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const [done, setDone] = useState(false);
  const { secondsLeft, start } = useCountdown(10 * 60, () => {
    setDone(true);
    toast.success("10 minutes of sunlight done — enjoy the natural energy boost!");
    reward("sunlight-timer", "Sunlight timer");
  });

  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60).toString().padStart(2, "0") : "10";
  const ss = secondsLeft !== null ? (secondsLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Sun className="size-5 text-primary" /> Sunlight timer</h2>
      <p className="mt-1 text-sm text-muted-foreground">{SUNLIGHT_SCIENCE}</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="font-display text-3xl font-bold tabular-nums">{mm}:{ss}</span>
        {secondsLeft === null ? (
          <Button onClick={start}>Start 10-minute timer</Button>
        ) : done ? (
          <span className="text-sm font-semibold text-success">Done ✓</span>
        ) : (
          <span className="text-sm text-muted-foreground">Soaking it in…</span>
        )}
      </div>
    </section>
  );
}

function AntiFatigueFoodCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const food = useState(() => antiFatigueFoodOfDay())[0];
  const [seen, setSeen] = useState(false);

  const markSeen = () => {
    setSeen(true);
    reward("anti-fatigue-food", "Anti-fatigue food of the day");
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Apple className="size-5 text-primary" /> Anti-fatigue food of the day</h2>
      <p className="mt-1 text-sm text-muted-foreground">{IRON_DEFICIENCY_CONTEXT}</p>
      <div className="mt-4 rounded-xl bg-muted/50 p-4">
        <p className="font-display text-xl font-bold">{food.name}</p>
        <p className="mt-1 text-sm text-primary">{food.nutrient}</p>
        <p className="mt-2 text-sm text-muted-foreground">{food.howTo}</p>
      </div>
      <Button className="mt-4" variant="secondary" disabled={seen} onClick={markSeen}>{seen ? "Noted ✓" : "I'll try this today"}</Button>
    </section>
  );
}

function MicroExerciseCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const exercise = useState(() => microExerciseOfDay())[0];
  const [done, setDone] = useState(false);
  const { secondsLeft, start } = useCountdown(2 * 60, () => {
    setDone(true);
    toast.success("Micro exercise complete — feel that boost!");
    reward("micro-exercise", "Micro exercise challenge");
  });

  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60).toString().padStart(2, "0") : "02";
  const ss = secondsLeft !== null ? (secondsLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Dumbbell className="size-5 text-primary" /> Micro exercise challenge</h2>
      <p className="mt-1 text-sm text-muted-foreground">Today's move: <span className="font-semibold text-foreground">{exercise.name}</span></p>
      <p className="mt-1 text-sm text-muted-foreground">{exercise.instructions}</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="font-display text-3xl font-bold tabular-nums">{mm}:{ss}</span>
        {secondsLeft === null ? (
          <Button onClick={start}>Start 2-minute challenge</Button>
        ) : done ? (
          <span className="text-sm font-semibold text-success">Done ✓</span>
        ) : (
          <span className="text-sm text-muted-foreground">Go!</span>
        )}
      </div>
    </section>
  );
}

function EnergyChartCard({ history, sleepHistory }: {
  history: { energy_level: number; log_date: string }[];
  sleepHistory: { report_date: string; quality_score: number | null }[];
}) {
  const last7 = history.slice(-7);
  const max = 5;

  let trendNote = "Log a few more check-ins to see your trend.";
  if (last7.length >= 2) {
    const diff = last7[last7.length - 1].energy_level - last7[0].energy_level;
    trendNote = diff > 0 ? "Your energy is trending up over the last week." : diff < 0 ? "Your energy has dipped over the last week." : "Your energy has been steady this week.";
  }

  const sleepByDate = new Map(sleepHistory.map((s) => [s.report_date, s.quality_score]));
  const lowSleepDays = last7.filter((e) => {
    const q = sleepByDate.get(e.log_date);
    return q !== undefined && q !== null && q < 50 && e.energy_level <= 2;
  });

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">7-day energy chart</h2>
      <div className="mt-5 flex h-40 items-end justify-between gap-2">
        {last7.length === 0 && <p className="text-sm text-muted-foreground">No check-ins logged yet this week.</p>}
        {last7.map((e) => (
          <div key={e.log_date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-primary/70"
              style={{ height: `${(e.energy_level / max) * 100}%`, minHeight: "8px" }}
            />
            <span className="text-[10px] text-muted-foreground">{new Date(e.log_date).toLocaleDateString(undefined, { weekday: "short" })}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        {last7.length >= 2 && (last7[last7.length - 1].energy_level >= last7[0].energy_level ? <TrendingUp className="mt-0.5 size-4 shrink-0 text-success" /> : <TrendingDown className="mt-0.5 size-4 shrink-0 text-destructive" />)}
        <span>{trendNote}</span>
      </div>
      {lowSleepDays.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          On {lowSleepDays.length} of these days your sleep score was low alongside low energy — better sleep may be your biggest energy lever.
        </p>
      )}
    </section>
  );
}

function DailyEnergy() {
  const qc = useQueryClient();
  const fnGet = useServerFn(getWellnessDay);
  const fnEnergy = useServerFn(saveEnergy);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });

  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (data?.energyToday) setSelected(data.energyToday);
  }, [data?.energyToday]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["wellness-day"] });
    qc.invalidateQueries({ queryKey: ["credits"] });
  };

  const reward = useReward(fnComplete, refresh);

  const pickEnergy = async (level: number) => {
    setSelected(level);
    try {
      await fnEnergy({ data: { level } });
      await reward("energy-check-in", "Energy check-in");
    } catch (e) {
      toastServerError(e);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Zap className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Daily Energy</h1>
            <p className="text-sm text-muted-foreground">Six tools to beat fatigue and build lasting energy</p>
          </div>
        </div>

        <EnergyCheckInCard selected={selected} onPick={pickEnergy} />
        <MorningWinsCard reward={reward} />
        <SunlightTimerCard reward={reward} />
        <AntiFatigueFoodCard reward={reward} />
        <MicroExerciseCard reward={reward} />
        <EnergyChartCard history={data?.energyHistory ?? []} sleepHistory={data?.sleepHistory ?? []} />
      </div>
    </SiteLayout>
  );
}
