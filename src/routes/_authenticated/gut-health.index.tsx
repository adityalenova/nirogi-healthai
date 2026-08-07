import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Salad, Droplets, Flame, RotateCw, Soup, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { GUT_TOOLS, loadHubDone } from "@/lib/wellness-content";

export const Route = createFileRoute("/_authenticated/gut-health/")({
  head: () => ({
    meta: [
      { title: "Gut Health · Nirogi" },
      { name: "description", content: "Gut check, warm water timer, digestion yoga, high-fibre foods, massage guide and a gut-friendly recipe." },
      { property: "og:title", content: "Gut Health · Nirogi" },
      { property: "og:description", content: "Six daily tools for digestion and gut wellness." },
    ],
  }),
  component: GutHealthHub,
});

const ICONS: Record<string, typeof Salad> = {
  "gut-check": Salad,
  "water-timer": Droplets,
  yoga: RotateCw,
  fibre: Flame,
  massage: RotateCw,
  recipe: Soup,
};

function GutHealthHub() {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => setDone(loadHubDone("gut-health")), []);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Salad className="size-6" /></span>
            <div>
              <h1 className="font-display text-2xl font-bold">Gut Health</h1>
              <p className="text-sm text-muted-foreground">Six daily tools for digestion and gut wellness</p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold shadow-card">
            {done.size}/6 done today
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUT_TOOLS.map((tool, i) => {
            const Icon = ICONS[tool.id] ?? Salad;
            const isDone = done.has(tool.id);
            return (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  to="/gut-health/$tool"
                  params={{ tool: tool.id }}
                  className={`group relative block overflow-hidden rounded-2xl bg-gradient-to-br ${tool.gradient} p-6 text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5`}
                >
                  <svg className="pointer-events-none absolute -right-6 -top-6 size-32 opacity-20" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" />
                    <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="3" />
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
