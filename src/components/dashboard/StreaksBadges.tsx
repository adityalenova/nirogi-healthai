import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Flame, Award, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getGamification } from "@/lib/gamification.functions";
import { BADGES, STREAK_META } from "@/lib/badges";

/** Dashboard card: live streaks + the badges unlocked so far. */
export function StreaksBadges() {
  const fnGet = useServerFn(getGamification);
  const { data } = useQuery({ queryKey: ["gamification"], queryFn: () => fnGet({}) });

  const earned = new Set((data?.earned ?? []).map((e) => e.badge_id));
  const shown = [...BADGES].sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id))).slice(0, 6);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Flame className="size-5 text-warning" /> Streaks &amp; badges
        </h2>
        <Link to="/badges" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {(data?.streaks ?? []).map((s) => (
          <div key={s.key} className="rounded-xl border border-border p-3 text-center">
            <span className="text-lg">{STREAK_META[s.key].emoji}</span>
            <p className="font-display text-xl font-extrabold">{s.current}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">{STREAK_META[s.key].label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Award className="size-4 text-warning" />
        {earned.size} of {BADGES.length} badges unlocked
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {shown.map((b) => {
          const has = earned.has(b.id);
          return (
            <motion.span
              key={b.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              title={`${b.name} — ${b.how}`}
              className={`flex size-12 items-center justify-center rounded-2xl text-2xl ${
                has ? `bg-gradient-to-br ${b.color}` : "bg-muted opacity-40 grayscale"
              }`}
            >
              {b.emoji}
            </motion.span>
          );
        })}
      </div>
    </section>
  );
}
