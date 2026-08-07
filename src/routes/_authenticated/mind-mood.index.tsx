import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ACTIVITIES, getCompletedToday } from "@/lib/mind-games";

export const Route = createFileRoute("/_authenticated/mind-mood/")({
  head: () => ({
    meta: [
      { title: "Mind & Mood · Nirogi" },
      { name: "description", content: "Eight quick mental wellness games and exercises — meditation, breathing, memory, sudoku, word games, gratitude and affirmations." },
      { property: "og:title", content: "Mind & Mood · Nirogi" },
      { property: "og:description", content: "Choose an activity and take care of your mind, one small game at a time." },
    ],
  }),
  component: MindMoodHub,
});

function ActivityIcon({ activityKey }: { activityKey: string }) {
  const common = "size-9";
  switch (activityKey) {
    case "meditation":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <circle cx="20" cy="20" r="6" className="fill-primary/70" />
          <circle cx="20" cy="20" r="12" className="stroke-primary/40" strokeWidth="2" />
          <circle cx="20" cy="20" r="18" className="stroke-primary/20" strokeWidth="2" />
        </svg>
      );
    case "breathing":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <rect x="6" y="6" width="28" height="28" rx="6" className="stroke-primary/60" strokeWidth="2.5" />
          <circle cx="6" cy="6" r="3" className="fill-primary" />
        </svg>
      );
    case "memory":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <rect x="4" y="4" width="14" height="14" rx="3" className="fill-primary/60" />
          <rect x="22" y="4" width="14" height="14" rx="3" className="fill-primary/30" />
          <rect x="4" y="22" width="14" height="14" rx="3" className="fill-primary/30" />
          <rect x="22" y="22" width="14" height="14" rx="3" className="fill-primary/60" />
        </svg>
      );
    case "sudoku":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" className="stroke-primary/60" strokeWidth="2" />
          <path d="M20 4v32M4 20h32" className="stroke-primary/40" strokeWidth="2" />
        </svg>
      );
    case "unscramble":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <text x="4" y="18" className="fill-primary/70 font-bold" fontSize="14">A</text>
          <text x="18" y="26" className="fill-primary/50 font-bold" fontSize="14">B</text>
          <text x="26" y="14" className="fill-primary/70 font-bold" fontSize="14">C</text>
        </svg>
      );
    case "tap-dot":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <circle cx="14" cy="26" r="4" className="fill-primary/30" />
          <circle cx="27" cy="14" r="6" className="fill-primary/70" />
        </svg>
      );
    case "gratitude":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <path d="M20 34s-13-8-13-18a7 7 0 0113-3 7 7 0 0113 3c0 10-13 18-13 18z" className="fill-primary/60" />
        </svg>
      );
    case "affirmations":
      return (
        <svg viewBox="0 0 40 40" className={common} fill="none">
          <rect x="8" y="6" width="20" height="26" rx="3" className="fill-primary/25" transform="rotate(-8 18 19)" />
          <rect x="12" y="8" width="20" height="26" rx="3" className="fill-primary/60" />
        </svg>
      );
    default:
      return <Sparkles className={common} />;
  }
}

function MindMoodHub() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(getCompletedToday());
    const onFocus = () => setCompleted(getCompletedToday());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const doneCount = completed.length;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">Mind &amp; Mood</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose an activity. Take care of your mind.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-card">
            <CheckCircle2 className="size-4 text-primary" />
            <span className="text-sm font-medium">{doneCount}/8 done today</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ACTIVITIES.map((activity, i) => {
            const done = completed.includes(activity.key);
            return (
              <motion.div
                key={activity.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/mind-mood/$activity"
                  params={{ activity: activity.key }}
                  className="relative block min-h-[160px] overflow-hidden rounded-2xl border border-border p-5 shadow-card transition-transform hover:-translate-y-0.5"
                  style={{ background: activity.gradient }}
                >
                  {done && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-primary shadow-sm">
                      <CheckCircle2 className="size-3.5" /> Done
                    </span>
                  )}
                  <ActivityIcon activityKey={activity.key} />
                  <h2 className="mt-3 font-display text-lg font-semibold">{activity.name}</h2>
                  <p className="text-xs font-medium text-muted-foreground">{activity.time}</p>
                  <p className="mt-2 text-sm text-foreground/80">{activity.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}
