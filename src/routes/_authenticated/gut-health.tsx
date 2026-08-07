import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Salad, Droplets, Flame, ChevronDown, RotateCw, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWellnessDay, saveGutCheck, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";
import {
  GUT_CHECK_QUESTIONS,
  YOGA_POSES,
  ABDOMINAL_MASSAGE_STEPS,
  highFibreFoodOfDay,
} from "@/lib/wellness-content";

export const Route = createFileRoute("/_authenticated/gut-health")({
  head: () => ({
    meta: [
      { title: "Gut Health · Nirogi" },
      { name: "description", content: "Gut check, warm water challenge, digestion yoga, high-fibre foods and an abdominal massage guide." },
      { property: "og:title", content: "Gut Health · Nirogi" },
      { property: "og:description", content: "Six daily tools for digestion and gut wellness." },
    ],
  }),
  component: GutHealth,
});

function useReward(fnComplete: ReturnType<typeof useServerFn<typeof completeWellnessActivity>>, refresh: () => void) {
  return async (key: string, label: string) => {
    const res = await fnComplete({ data: { key, label } });
    if (res.credited > 0) toast.success(`+${res.credited} credits — ${label} done for today.`);
    refresh();
  };
}

type GutAnswers = Record<string, boolean>;

function GutCheckCard({ onSubmit, result }: {
  onSubmit: (answers: GutAnswers) => Promise<void>;
  result: { score: number; tips: string[] } | null;
}) {
  const [answers, setAnswers] = useState<GutAnswers>({});
  const allAnswered = GUT_CHECK_QUESTIONS.every((q) => answers[q.key] !== undefined);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Salad className="size-5 text-primary" /> 30-second gut check</h2>
      <p className="mt-1 text-sm text-muted-foreground">Answer 5 quick questions for a gut score and personalised tip.</p>
      <div className="mt-4 space-y-3">
        {GUT_CHECK_QUESTIONS.map((q) => (
          <div key={q.key} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="text-sm">{q.question}</span>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setAnswers((a) => ({ ...a, [q.key]: v }))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    answers[q.key] === v ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button className="mt-4" disabled={!allAnswered} onClick={() => onSubmit(answers)}>Get my gut score</Button>
      {result && (
        <div className="mt-5 rounded-xl bg-muted/50 p-4">
          <p className="font-display text-2xl font-bold text-primary">{result.score}/100</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

function WarmWaterCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const TOTAL = 20 * 60;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const start = () => {
    setSecondsLeft(TOTAL);
    setDone(false);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return s;
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDone(true);
          toast.success("20 minutes are up — your digestion should be getting a boost now!");
          reward("warm-water", "Warm water challenge");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60).toString().padStart(2, "0") : "20";
  const ss = secondsLeft !== null ? (secondsLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Droplets className="size-5 text-primary" /> Warm water challenge</h2>
      <p className="mt-1 text-sm text-muted-foreground">Drink a glass of warm water on an empty stomach — it kick-starts digestion. We'll remind you in 20 minutes.</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="font-display text-3xl font-bold tabular-nums">{mm}:{ss}</span>
        {secondsLeft === null ? (
          <Button onClick={start}>I Drank It</Button>
        ) : done ? (
          <span className="text-sm font-semibold text-success">Done ✓ Great job!</span>
        ) : (
          <span className="text-sm text-muted-foreground">Timer running…</span>
        )}
      </div>
    </section>
  );
}

function PoseFigure({ pose }: { pose: string }) {
  return (
    <div className="relative flex h-28 items-center justify-center">
      {pose === "Pawanmuktasana" && (
        <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
          <span className="absolute size-10 animate-bounce rounded-full border-4 border-primary/40" />
        </div>
      )}
      {pose === "Balasana" && (
        <div className="h-8 w-20 origin-left animate-pulse rounded-t-full bg-primary/20" />
      )}
      {pose === "Malasana" && (
        <div className="flex flex-col items-center gap-1">
          <span className="size-6 animate-bounce rounded-full bg-primary/40 [animation-duration:2s]" />
          <span className="h-8 w-14 rounded-t-2xl bg-primary/20" />
        </div>
      )}
    </div>
  );
}

function YogaPosesCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const [open, setOpen] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  const markDone = (i: number) => {
    setDone((s) => {
      const next = new Set(s).add(i);
      if (next.size === YOGA_POSES.length) reward("yoga-digestion", "Digestion yoga");
      return next;
    });
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">3 yoga poses for digestion</h2>
      <div className="mt-4 space-y-3">
        {YOGA_POSES.map((pose, i) => (
          <div key={pose.name} className="overflow-hidden rounded-xl border border-border">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span>
                <span className="font-semibold">{pose.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{pose.subtitle}</span>
                {done.has(i) && <span className="ml-2 text-xs font-semibold text-success">✓ done</span>}
              </span>
              <ChevronDown className={`size-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="border-t border-border px-4 py-4">
                <PoseFigure pose={pose.name} />
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {pose.steps.map((s, si) => <li key={si}>{s}</li>)}
                </ol>
                <Button size="sm" variant="secondary" className="mt-3" disabled={done.has(i)} onClick={() => markDone(i)}>
                  {done.has(i) ? "Done ✓" : "Mark done"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FibreFoodCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const food = useState(() => highFibreFoodOfDay())[0];
  const [seen, setSeen] = useState(false);

  const markSeen = () => {
    setSeen(true);
    reward("fibre-food", "High-fibre food of the day");
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Flame className="size-5 text-primary" /> High-fibre food of the day</h2>
      <div className="mt-4 rounded-xl bg-muted/50 p-4">
        <p className="font-display text-xl font-bold">{food.name}</p>
        <p className="mt-1 text-sm text-primary">{food.nutrient}</p>
        <p className="mt-2 text-sm text-muted-foreground">{food.howTo}</p>
      </div>
      <Button className="mt-4" variant="secondary" disabled={seen} onClick={markSeen}>{seen ? "Noted ✓" : "I'll try this today"}</Button>
    </section>
  );
}

function MassageCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const [stepsDone, setStepsDone] = useState<Set<number>>(new Set());

  const tapStep = (i: number) => {
    setStepsDone((s) => {
      const next = new Set(s).add(i);
      if (next.size === ABDOMINAL_MASSAGE_STEPS.length) reward("abdominal-massage", "Abdominal massage");
      return next;
    });
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><RotateCw className="size-5 text-primary" /> Abdominal massage guide</h2>
      <div className="mt-4 flex items-center justify-center">
        <RotateCw className="size-20 animate-spin text-primary/40 [animation-duration:3s]" />
      </div>
      <div className="mt-4 space-y-2">
        {ABDOMINAL_MASSAGE_STEPS.map((step, i) => (
          <button
            key={i}
            onClick={() => tapStep(i)}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              stepsDone.has(i) ? "border-success/40 bg-success/10" : "border-border"
            }`}
          >
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stepsDone.has(i) ? "bg-success text-success-foreground" : "bg-muted"}`}>{i + 1}</span>
            {step}
          </button>
        ))}
      </div>
    </section>
  );
}

function computeStreak(history: { log_date: string }[]): number {
  const dates = new Set(history.map((h) => h.log_date));
  let streak = 0;
  const cursor = new Date();
  // If today isn't logged yet, start counting from yesterday.
  if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function StreakCard({ history }: { history: { log_date: string }[] }) {
  const streak = computeStreak(history);
  return (
    <section className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="size-5" /> Gut health streak</h2>
      <p className="mt-4 text-center font-display text-4xl font-bold">{streak} {streak === 1 ? "day" : "days"}</p>
      <p className="mt-2 text-center text-sm opacity-90">
        {streak === 0 ? "Complete today's gut check to start your streak." : "Consecutive days you've logged a gut check. Keep it going!"}
      </p>
    </section>
  );
}

function GutHealth() {
  const qc = useQueryClient();
  const fnGet = useServerFn(getWellnessDay);
  const fnGutCheck = useServerFn(saveGutCheck);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });

  const [result, setResult] = useState<{ score: number; tips: string[] } | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["wellness-day"] });
    qc.invalidateQueries({ queryKey: ["credits"] });
  };

  const reward = useReward(fnComplete, refresh);

  const submitGutCheck = async (answers: GutAnswers) => {
    try {
      const res = await fnGutCheck({
        data: {
          bowel_movement: answers.bowel_movement,
          bloated: answers.bloated,
          stomach_pain: answers.stomach_pain,
          appetite_normal: answers.appetite_normal,
          hydrated: answers.hydrated,
        },
      });
      setResult(res);
      await reward("gut-check", "Gut check");
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
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Salad className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Gut Health</h1>
            <p className="text-sm text-muted-foreground">Six tools for digestion and daily gut wellness</p>
          </div>
        </div>

        <GutCheckCard onSubmit={submitGutCheck} result={result} />
        <WarmWaterCard reward={reward} />
        <YogaPosesCard reward={reward} />
        <FibreFoodCard reward={reward} />
        <MassageCard reward={reward} />
        <StreakCard history={data?.gutHistory ?? []} />
      </div>
    </SiteLayout>
  );
}
