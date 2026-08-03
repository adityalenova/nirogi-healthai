import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BatteryCharging } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWellnessDay, saveEnergy, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/daily-energy")({
  head: () => ({
    meta: [
      { title: "Daily Energy · Nirogi" },
      { name: "description", content: "Rate your energy each day and see what sleep, water and movement do to it." },
      { property: "og:title", content: "Daily Energy · Nirogi" },
      { property: "og:description", content: "Spot the habits behind your good days and your flat days." },
    ],
  }),
  component: DailyEnergy,
});

const LEVELS = [
  { level: 1, label: "Drained", tip: "Protect sleep tonight and skip late caffeine — aim for 7–8 hours." },
  { level: 2, label: "Low", tip: "A 10-minute walk in daylight lifts energy more than another coffee." },
  { level: 3, label: "Steady", tip: "Keep meals regular; a protein-rich breakfast smooths the afternoon dip." },
  { level: 4, label: "Good", tip: "Great baseline — add 20 minutes of movement to lock it in." },
  { level: 5, label: "Charged", tip: "Note what you did today; repeatable habits beat one-off energy spikes." },
];

function DailyEnergy() {
  const qc = useQueryClient();
  const fnGet = useServerFn(getWellnessDay);
  const fnSave = useServerFn(saveEnergy);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });

  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    if (data?.energyToday) setLevel(data.energyToday);
  }, [data?.energyToday]);

  const pick = async (v: number) => {
    setLevel(v);
    try {
      await fnSave({ data: { level: v } });
      const c = await fnComplete({ data: { key: "energy", label: "Energy check-in" } });
      if (c.credited > 0) toast.success(`+${c.credited} credits — energy logged.`);
      qc.invalidateQueries({ queryKey: ["wellness-day"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    } catch (e) {
      toastServerError(e);
    }
  };

  const chart = (data?.energyHistory ?? []).map((e) => ({
    day: new Date(e.log_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    level: e.energy_level,
  }));
  const avg = chart.length ? Math.round((chart.reduce((s, c) => s + c.level, 0) / chart.length) * 10) / 10 : 0;
  const tip = LEVELS.find((l) => l.level === level)?.tip;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-warning/10 text-warning"><BatteryCharging className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Daily Energy</h1>
            <p className="text-sm text-muted-foreground">Find the habits behind your best days</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Energy right now</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.level}
                onClick={() => pick(l.level)}
                className={`flex-1 min-w-24 rounded-xl border px-3 py-3 text-center transition-all ${
                  level === l.level ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                }`}
              >
                <span className="block font-display text-lg font-bold">{l.level}</span>
                <span className="text-xs font-semibold">{l.label}</span>
              </button>
            ))}
          </div>
          {tip && <p className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">{tip}</p>}
        </section>

        {chart.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Last 30 days</h2>
              <span className="text-sm text-muted-foreground">avg {avg}/5</span>
            </div>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <Bar dataKey="level" radius={[6, 6, 0, 0]}>
                    {chart.map((c, i) => (
                      <Cell key={i} fill={c.level >= 4 ? "hsl(var(--success))" : c.level >= 3 ? "hsl(var(--primary))" : "hsl(var(--warning))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Boost it today</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/sleep-tracker">Check sleep</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/water-tracker">Log water</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/exercise-tracker">Move 20 min</Link></Button>
          </div>
        </section>

        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          Constant exhaustion for weeks can point to anaemia, thyroid problems, diabetes or sleep apnoea. Please get checked
          by a doctor rather than relying on daily scores.
        </p>
      </div>
    </SiteLayout>
  );
}
