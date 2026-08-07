import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Salad, Droplets, ChevronDown, RotateCw, Soup, Flame, AlertTriangle, Lock } from "lucide-react";
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
  recipeOfDay,
  GUT_TOOLS,
  markHubToolDone,
} from "@/lib/wellness-content";

const TOOL_IDS = GUT_TOOLS.map((t) => t.id);

export const Route = createFileRoute("/_authenticated/gut-health/$tool")({
  beforeLoad: ({ params }) => {
    if (!TOOL_IDS.includes(params.tool)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${GUT_TOOLS.find((t) => t.id === params.tool)?.title ?? "Tool"} · Gut Health · Nirogi` }],
  }),
  component: GutTool,
});

function useReward(fnComplete: ReturnType<typeof useServerFn<typeof completeWellnessActivity>>, refresh: () => void) {
  return async (key: string, label: string) => {
    const res = await fnComplete({ data: { key, label } });
    if (res.credited > 0) toast.success(`+${res.credited} credits — ${label} done for today.`);
    refresh();
  };
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

type GutAnswers = Record<string, boolean>;

function GutCheckTool({ mark, gutHistory }: { mark: () => void; gutHistory: { log_date: string; bowel_movement: boolean }[] }) {
  const qc = useQueryClient();
  const fnGutCheck = useServerFn(saveGutCheck);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<GutAnswers>({});
  const [result, setResult] = useState<{ score: number; tips: string[] } | null>(null);

  const last3NoBM = gutHistory.slice(-3).length === 3 && gutHistory.slice(-3).every((g) => !g.bowel_movement);

  const answer = async (key: string, value: boolean) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step + 1 < GUT_CHECK_QUESTIONS.length) {
      setStep(step + 1);
      return;
    }
    try {
      const res = await fnGutCheck({
        data: {
          bowel_movement: next.bowel_movement,
          bloated: next.bloated,
          stomach_pain: next.stomach_pain,
          appetite_normal: next.appetite_normal,
          hydrated: next.hydrated,
        },
      });
      setResult(res);
      mark();
      qc.invalidateQueries({ queryKey: ["wellness-day"] });
    } catch (e) {
      toastServerError(e);
    }
  };

  if (result) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <p className="font-display text-4xl font-bold text-primary">{Math.round(result.score / 20)}/5</p>
        <p className="text-sm text-muted-foreground">Gut score ({result.score}/100)</p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {result.tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>
    );
  }

  const q = GUT_CHECK_QUESTIONS[step];
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      {last3NoBM && (
        <Link to="/gut-health/$tool" params={{ tool: "water-timer" }} className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>No bowel movement logged for 3 days. Try the warm water timer to help kickstart digestion — tap here.</span>
        </Link>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question {step + 1} of {GUT_CHECK_QUESTIONS.length}</p>
      <p className="mt-2 font-display text-lg font-semibold">{q.question}</p>
      <div className="mt-5 flex gap-3">
        <Button className="flex-1" onClick={() => answer(q.key, true)}>Yes</Button>
        <Button className="flex-1" variant="secondary" onClick={() => answer(q.key, false)}>No</Button>
      </div>
      <div className="mt-5 flex gap-1.5">
        {GUT_CHECK_QUESTIONS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
    </section>
  );
}

function WarmWaterTool({ mark }: { mark: () => void }) {
  const TOTAL = 20 * 60;
  const [done, setDone] = useState(false);
  const [worked, setWorked] = useState<boolean | null>(null);
  const { secondsLeft, start } = useCountdown(TOTAL, () => setDone(true));

  useEffect(() => {
    if (secondsLeft === null) return;
    const elapsed = TOTAL - secondsLeft;
    if ([5, 10, 15].includes(Math.round(elapsed / 60)) && elapsed % 60 === 0) {
      toast.message(`${Math.round(elapsed / 60)} minutes in — keep going, your digestion is warming up.`);
    }
  }, [secondsLeft]);

  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60).toString().padStart(2, "0") : "20";
  const ss = secondsLeft !== null ? (secondsLeft % 60).toString().padStart(2, "0") : "00";

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex justify-center py-4">
        <div className="relative flex size-24 items-center justify-center rounded-full bg-sky-500/10">
          <Droplets className="size-10 text-sky-500" />
          {secondsLeft !== null && !done && (
            <>
              <span className="absolute -top-3 left-1/2 h-6 w-1 -translate-x-1/2 animate-pulse rounded-full bg-sky-400/60 [animation-delay:0ms]" />
              <span className="absolute -top-4 left-[42%] h-7 w-1 -translate-x-1/2 animate-pulse rounded-full bg-sky-400/40 [animation-delay:200ms]" />
              <span className="absolute -top-4 left-[58%] h-7 w-1 -translate-x-1/2 animate-pulse rounded-full bg-sky-400/40 [animation-delay:400ms]" />
            </>
          )}
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">Drink a glass of warm water on an empty stomach — it kick-starts digestion.</p>
      <div className="mt-5 flex flex-col items-center gap-4">
        <span className="font-display text-4xl font-bold tabular-nums">{mm}:{ss}</span>
        {secondsLeft === null ? (
          <Button onClick={start}>I Drank It — Start Timer</Button>
        ) : done ? (
          worked === null ? (
            <div className="flex gap-3">
              <Button onClick={() => { setWorked(true); mark(); toast.success("Great! Logged for today."); }}>It Worked</Button>
              <Button variant="secondary" onClick={() => { setWorked(false); mark(); }}>Not Yet</Button>
            </div>
          ) : (
            <span className="text-sm font-semibold text-success">Logged for today ✓</span>
          )
        ) : (
          <span className="text-sm text-muted-foreground">20 minutes are up — your digestion should be getting a boost now!</span>
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
      {pose === "Balasana" && <div className="h-8 w-20 origin-left animate-pulse rounded-t-full bg-primary/20" />}
      {pose === "Malasana" && (
        <div className="flex flex-col items-center gap-1">
          <span className="size-6 animate-bounce rounded-full bg-primary/40 [animation-duration:2s]" />
          <span className="h-8 w-14 rounded-t-2xl bg-primary/20" />
        </div>
      )}
    </div>
  );
}

function YogaTool({ mark }: { mark: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [holding, setHolding] = useState<number | null>(null);
  const { secondsLeft, start } = useCountdown(25, () => setHolding(null));

  const markDone = (i: number) => {
    setDone((s) => {
      const next = new Set(s).add(i);
      if (next.size === YOGA_POSES.length) mark();
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="space-y-3">
        {YOGA_POSES.map((pose, i) => (
          <div key={pose.name} className="overflow-hidden rounded-xl border border-border">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span>
                <span className="font-semibold">{pose.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{pose.subtitle}</span>
                {done.has(i) && <span className="ml-2 text-xs font-semibold text-success">Done ✓</span>}
              </span>
              <ChevronDown className={`size-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="border-t border-border px-4 py-4">
                <PoseFigure pose={pose.name} />
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {pose.steps.map((s, si) => <li key={si}>{s}</li>)}
                </ol>
                <div className="mt-3 flex items-center gap-3">
                  <span className="font-display text-lg font-bold tabular-nums">
                    {holding === i && secondsLeft !== null ? `0:${secondsLeft.toString().padStart(2, "0")}` : "0:25"}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => { setHolding(i); start(); }}>Hold Timer</Button>
                  <Button size="sm" variant="secondary" disabled={done.has(i)} onClick={() => markDone(i)}>{done.has(i) ? "Done ✓" : "Mark done"}</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FibreTool({ mark }: { mark: () => void }) {
  const food = useState(() => highFibreFoodOfDay())[0];
  const tomorrow = useState(() => highFibreFoodOfDay(new Date(Date.now() + 86400000)))[0];
  const [seen, setSeen] = useState(false);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="font-display text-xl font-bold">{food.name}</p>
        <p className="mt-1 text-sm text-primary">{food.nutrient}</p>
        <p className="mt-2 text-sm text-muted-foreground">{food.howTo}</p>
      </div>
      <Button className="mt-4" variant="secondary" disabled={seen} onClick={() => { setSeen(true); mark(); }}>{seen ? "Noted ✓" : "I'll try this today"}</Button>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0" />
        <span>Tomorrow's pick: <span className="blur-sm select-none">{tomorrow.name}</span> — unlocks tomorrow.</span>
      </div>
    </section>
  );
}

function MassageTool({ mark }: { mark: () => void }) {
  const [stepsDone, setStepsDone] = useState<Set<number>>(new Set());
  const { secondsLeft, start } = useCountdown(5 * 60, () => toast.success("5 minutes of massage complete."));
  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60).toString().padStart(2, "0") : "05";
  const ss = secondsLeft !== null ? (secondsLeft % 60).toString().padStart(2, "0") : "00";

  const tapStep = (i: number) => {
    setStepsDone((s) => {
      const next = new Set(s).add(i);
      if (next.size === ABDOMINAL_MASSAGE_STEPS.length) mark();
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-center py-2">
        <RotateCw className="size-20 animate-spin text-primary/40 [animation-duration:3s]" />
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="font-display text-2xl font-bold tabular-nums">{mm}:{ss}</span>
        <Button size="sm" onClick={start}>Start 5-min Timer</Button>
      </div>
      <div className="mt-4 space-y-2">
        {ABDOMINAL_MASSAGE_STEPS.map((step, i) => (
          <button key={i} onClick={() => tapStep(i)} className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${stepsDone.has(i) ? "border-success/40 bg-success/10" : "border-border"}`}>
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stepsDone.has(i) ? "bg-success text-success-foreground" : "bg-muted"}`}>{i + 1}</span>
            {step}
          </button>
        ))}
      </div>
    </section>
  );
}

function RecipeTool({ mark }: { mark: () => void }) {
  const recipe = useState(() => recipeOfDay())[0];
  const [tried, setTried] = useState(false);
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <p className="font-display text-xl font-bold">{recipe.name}</p>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
      </ul>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Steps</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
        {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
      <Button className="mt-4" variant="secondary" disabled={tried} onClick={() => { setTried(true); mark(); }}>{tried ? "Cooked ✓" : "I'll cook this today"}</Button>
    </section>
  );
}

const META: Record<string, { icon: typeof Salad; title: string; subtitle: string }> = {
  "gut-check": { icon: Salad, title: "Daily Gut Check", subtitle: "5 quick questions for your gut score" },
  "water-timer": { icon: Droplets, title: "Warm Water Timer", subtitle: "20-minute digestion ritual" },
  yoga: { icon: RotateCw, title: "Yoga for Digestion", subtitle: "3 poses to ease bloating" },
  fibre: { icon: Flame, title: "High Fibre Food", subtitle: "Today's Indian pick" },
  massage: { icon: RotateCw, title: "Massage Guide", subtitle: "5-step clockwise routine" },
  recipe: { icon: Soup, title: "Gut Friendly Recipe", subtitle: "Today's easy recipe" },
};

function GutTool() {
  const { tool } = Route.useParams();
  const qc = useQueryClient();
  const fnGet = useServerFn(getWellnessDay);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });
  const meta = META[tool];
  const Icon = meta?.icon ?? Salad;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["wellness-day"] });
    qc.invalidateQueries({ queryKey: ["credits"] });
  };
  const reward = useReward(fnComplete, refresh);
  const mark = () => {
    markHubToolDone("gut-health", tool);
    reward(tool, meta?.title ?? "Gut health tool");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link to="/gut-health" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Gut Health
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">{meta?.title}</h1>
            <p className="text-sm text-muted-foreground">{meta?.subtitle}</p>
          </div>
        </div>
        <div className="mt-6">
          {tool === "gut-check" && <GutCheckTool mark={mark} gutHistory={data?.gutHistory ?? []} />}
          {tool === "water-timer" && <WarmWaterTool mark={mark} />}
          {tool === "yoga" && <YogaTool mark={mark} />}
          {tool === "fibre" && <FibreTool mark={mark} />}
          {tool === "massage" && <MassageTool mark={mark} />}
          {tool === "recipe" && <RecipeTool mark={mark} />}
        </div>
      </div>
    </SiteLayout>
  );
}
