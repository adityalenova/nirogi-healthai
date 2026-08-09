import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sun, Zap, Check, Play, Apple, BarChart3, Battery } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWellnessDay, saveEnergy, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";
import {
  ENERGY_TOOLS,
  ENERGY_LEVELS,
  ENERGY_RESPONSES,
  MORNING_WINS,
  SUNLIGHT_SCIENCE,
  IRON_DEFICIENCY_CONTEXT,
  antiFatigueFoodOfDay,
  microExerciseOfDay,
  markHubToolDone,
} from "@/lib/wellness-content";

const TOOL_IDS = ENERGY_TOOLS.map((t) => t.id);

export const Route = createFileRoute("/_authenticated/daily-energy/$tool")({
  beforeLoad: ({ params }) => {
    if (!TOOL_IDS.includes(params.tool)) throw notFound();
  },
  head: ({ params }) => {
    const t = ENERGY_TOOLS.find((x) => x.id === params.tool);
    return {
      meta: [
        { title: `${t?.title ?? "Tool"} · Daily Energy · Nirogi` },
        { name: "description", content: t?.description ?? "Beat fatigue with Nirogi's daily energy tools." },
        { property: "og:title", content: `${t?.title ?? "Daily Energy"} · Nirogi` },
        { property: "og:description", content: t?.description ?? "Beat fatigue with Nirogi's daily energy tools." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: EnergyTool,
});

function Timer({ seconds, onDone, label }: { seconds: number; onDone: () => void; label: string }) {
  const [left, setLeft] = useState<number | null>(null);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  const start = () => {
    setLeft(seconds);
    ref.current = setInterval(() => {
      setLeft((s) => {
        if (s === null) return s;
        if (s <= 1) {
          if (ref.current) clearInterval(ref.current);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const mm = String(Math.floor((left ?? seconds) / 60)).padStart(2, "0");
  const ss = String((left ?? seconds) % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-display text-5xl font-extrabold tabular-nums">{mm}:{ss}</p>
      <Button onClick={start} disabled={left !== null && left > 0}>
        <Play className="size-4" /> {left === 0 ? "Done" : label}
      </Button>
    </div>
  );
}

function EnergyTool() {
  const { tool } = Route.useParams();
  const meta = ENERGY_TOOLS.find((t) => t.id === tool)!;
  const qc = useQueryClient();
  const fnDay = useServerFn(getWellnessDay);
  const fnEnergy = useServerFn(saveEnergy);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnDay({}) });

  const [wins, setWins] = useState<boolean[]>(MORNING_WINS.map(() => false));
  const [level, setLevel] = useState<number | null>(null);

  const reward = async () => {
    try {
      markHubToolDone("energy", tool);
      const res = await fnComplete({ data: { key: `energy:${tool}`, label: meta.title } });
      if (res.credited > 0) toast.success(`+${res.credited} credits — ${meta.title} done for today.`);
      else toast.success(`${meta.title} complete.`);
      qc.invalidateQueries({ queryKey: ["wellness-day"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    } catch (err) {
      toastServerError(err);
    }
  };

  const chosen = level ?? data?.energyToday ?? null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link to="/daily-energy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Daily Energy
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white`}>
            <Zap className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">{meta.title}</h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          {tool === "check-in" && (
            <div>
              <p className="text-sm font-semibold">How is your energy right now?</p>
              <div className="mt-4 grid gap-2">
                {ENERGY_LEVELS.map((l) => (
                  <button
                    key={l.level}
                    onClick={async () => {
                      setLevel(l.level);
                      try {
                        await fnEnergy({ data: { level: l.level } });
                        await reward();
                      } catch (err) {
                        toastServerError(err);
                      }
                    }}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      chosen === l.level ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Battery className="size-4" /> {l.level} — {l.label}
                    </span>
                    {chosen === l.level && <Check className="size-4" />}
                  </button>
                ))}
              </div>
              {chosen && (
                <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">{ENERGY_RESPONSES[chosen]}</p>
              )}
            </div>
          )}

          {tool === "morning-wins" && (
            <div>
              <p className="text-sm text-muted-foreground">Three tiny tasks. Two minutes total. Instant lift.</p>
              <div className="mt-4 grid gap-2">
                {MORNING_WINS.map((w, i) => (
                  <button
                    key={w}
                    onClick={() => setWins((p) => p.map((v, n) => (n === i ? !v : v)))}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                      wins[i] ? "border-success bg-success/10 text-success" : "border-border"
                    }`}
                  >
                    <span className={`flex size-5 items-center justify-center rounded-full border ${wins[i] ? "border-success bg-success text-white" : "border-border"}`}>
                      {wins[i] && <Check className="size-3" />}
                    </span>
                    {w}
                  </button>
                ))}
              </div>
              <Button className="mt-4 w-full" disabled={!wins.every(Boolean)} onClick={reward}>
                {wins.every(Boolean) ? "Complete morning wins" : "Tick all three to finish"}
              </Button>
            </div>
          )}

          {tool === "sunlight" && (
            <div className="text-center">
              <Sun className="mx-auto size-10 text-warning" />
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{SUNLIGHT_SCIENCE}</p>
              <div className="mt-6">
                <Timer seconds={600} label="Start 10 minutes" onDone={reward} />
              </div>
            </div>
          )}

          {tool === "exercise" && (
            <div className="text-center">
              <p className="font-display text-xl font-bold">{microExerciseOfDay().name}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{microExerciseOfDay().instructions}</p>
              <div className="mt-6">
                <Timer seconds={120} label="Start 2-minute burst" onDone={reward} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Stop immediately if you feel chest pain, dizziness or breathlessness, and speak to a doctor.
              </p>
            </div>
          )}

          {tool === "foods" && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Apple className="size-4" /> Iron-rich food of the day
              </div>
              <p className="mt-2 font-display text-xl font-bold">{antiFatigueFoodOfDay().name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{antiFatigueFoodOfDay().nutrient}</p>
              <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">How to eat it today: {antiFatigueFoodOfDay().howTo}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{IRON_DEFICIENCY_CONTEXT}</p>
              <Button className="mt-4 w-full" onClick={reward}>I ate this today</Button>
            </div>
          )}

          {tool === "chart" && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <BarChart3 className="size-4" /> Last 7 days
              </div>
              <div className="mt-6 flex h-40 items-end gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
                  const entry = (data?.energyHistory ?? []).find((e) => e.log_date === date);
                  const lvl = entry?.energy_level ?? 0;
                  return (
                    <div key={date} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-yellow-400"
                          style={{ height: `${(lvl / 5) * 100}%`, minHeight: lvl ? "8px" : "2px", opacity: lvl ? 1 : 0.25 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Log your energy daily in the Energy Check-In to build a clearer pattern — dips at the same time each day usually point to sleep, hydration or iron.
              </p>
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
