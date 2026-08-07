import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Zap, Sun, Dumbbell, Apple, BarChart3, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ENERGY_TOOLS, loadHubDone } from "@/lib/wellness-content";

export const Route = createFileRoute("/_authenticated/daily-energy/")({
  head: () => ({
    meta: [
      { title: "Daily Energy · Nirogi" },
      { name: "description", content: "Energy check-in, morning wins, sunlight timer, micro exercise, iron-rich foods and a 7-day energy chart." },
      { property: "og:title", content: "Daily Energy · Nirogi" },
      { property: "og:description", content: "Six daily tools to beat fatigue and build lasting energy." },
    ],
  }),
  component: DailyEnergyHub,
});

const ICONS: Record<string, typeof Zap> = {
  "check-in": Zap,
  "morning-wins": Sparkles,
  sunlight: Sun,
  exercise: Dumbbell,
  foods: Apple,
  chart: BarChart3,
};

function DailyEnergyHub() {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => setDone(loadHubDone("daily-energy")), []);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Zap className="size-6" /></span>
            <div>
              <h1 className="font-display text-2xl font-bold">Daily Energy</h1>
              <p className="text-sm text-muted-foreground">Six tools to beat fatigue and build lasting energy</p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold shadow-card">
            {done.size}/6 done today
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ENERGY_TOOLS.map((tool, i) => {
            const Icon = ICONS[tool.id] ?? Zap;
            const isDone = done.has(tool.id);
            return (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  to="/daily-energy/$tool"
                  params={{ tool: tool.id }}
                  className={`group relative block overflow-hidden rounded-2xl bg-gradient-to-br ${tool.gradient} p-6 text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5`}
                >
                  <svg className="pointer-events-none absolute -right-6 -top-6 size-32 opacity-20" viewBox="0 0 100 100" fill="none">
                    <path d="M50 5 L61 38 L96 38 L68 59 L79 92 L50 71 L21 92 L32 59 L4 38 L39 38 Z" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  <div className="relative flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white/20"><Icon className="size-6" /></span>
                    {isDone && <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-xs font-semibold"><CheckCircle2 className="size-3.5" /> Done</span>}
                  </div>
                  <h2 className="relative mt-4 font-display text-lg font-semibold">{tool.title}</h2>
                  <p className="relative mt-1 text-sm opacity-90">{tool.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}
