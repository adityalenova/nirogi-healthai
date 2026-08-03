import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Salad } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWellnessDay, saveGutCheck, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/gut-health")({
  head: () => ({
    meta: [
      { title: "Gut Health · Nirogi" },
      { name: "description", content: "A 30-second daily digestion check-in with a gut score and practical food tips." },
      { property: "og:title", content: "Gut Health · Nirogi" },
      { property: "og:description", content: "Track digestion, bloating and appetite, and get daily gut-friendly guidance." },
    ],
  }),
  component: GutHealth,
});

type Answers = {
  bowel_movement: boolean;
  bloated: boolean;
  stomach_pain: boolean;
  appetite_normal: boolean;
  hydrated: boolean;
};

const QUESTIONS: { key: keyof Answers; q: string; goodIsYes: boolean }[] = [
  { key: "bowel_movement", q: "Did you have a bowel movement today?", goodIsYes: true },
  { key: "bloated", q: "Did you feel bloated or gassy?", goodIsYes: false },
  { key: "stomach_pain", q: "Any stomach pain or cramps?", goodIsYes: false },
  { key: "appetite_normal", q: "Was your appetite normal?", goodIsYes: true },
  { key: "hydrated", q: "Did you drink enough water?", goodIsYes: true },
];

const DEFAULTS: Answers = { bowel_movement: true, bloated: false, stomach_pain: false, appetite_normal: true, hydrated: true };

function GutHealth() {
  const qc = useQueryClient();
  const fnGet = useServerFn(getWellnessDay);
  const fnSave = useServerFn(saveGutCheck);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });

  const [answers, setAnswers] = useState<Answers>(DEFAULTS);
  const [result, setResult] = useState<{ score: number; tips: string[] } | null>(null);

  useEffect(() => {
    const g = data?.gutToday;
    if (g) {
      setAnswers({
        bowel_movement: !!g.bowel_movement,
        bloated: !!g.bloated,
        stomach_pain: !!g.stomach_pain,
        appetite_normal: !!g.appetite_normal,
        hydrated: !!g.hydrated,
      });
    }
  }, [data?.gutToday]);

  const submit = async () => {
    try {
      const res = await fnSave({ data: answers });
      setResult(res);
      const c = await fnComplete({ data: { key: "gut", label: "Gut check-in" } });
      if (c.credited > 0) toast.success(`+${c.credited} credits — gut check-in done.`);
      qc.invalidateQueries({ queryKey: ["wellness-day"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    } catch (e) {
      toastServerError(e);
    }
  };

  const streakDays = (data?.gutHistory ?? []).length;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-success/10 text-success"><Salad className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Gut Health</h1>
            <p className="text-sm text-muted-foreground">Digestion is the quietest signal your body sends</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Today's check-in</h2>
          <div className="mt-4 space-y-3">
            {QUESTIONS.map((q) => (
              <div key={q.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <span className="text-sm">{q.q}</span>
                <span className="flex gap-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: val }))}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                        answers[q.key] === val ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                      }`}
                    >
                      {val ? "Yes" : "No"}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <Button className="mt-4" onClick={submit}>Save check-in</Button>
        </section>

        {result && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex size-20 flex-col items-center justify-center rounded-full border-4 border-success/40">
                <span className="font-display text-2xl font-extrabold">{result.score}</span>
                <span className="text-[10px] text-muted-foreground">gut score</span>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">
                  {result.score >= 80 ? "Gut is happy" : result.score >= 50 ? "Needs some care" : "Worth paying attention"}
                </h2>
                <p className="text-sm text-muted-foreground">{streakDays} day{streakDays === 1 ? "" : "s"} logged in the last month</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {result.tips.map((t) => (
                <li key={t} className="rounded-xl bg-muted/50 px-4 py-3 text-sm">{t}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-muted-foreground">
          Blood in stool, black stools, unexplained weight loss, or pain lasting more than a few days needs a doctor, not an app.
          Nirogi does not diagnose digestive disease.
        </p>
      </div>
    </SiteLayout>
  );
}
