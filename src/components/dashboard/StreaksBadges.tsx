import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Flame as FlameIcon, Award, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { getGamification } from "@/lib/gamification.functions";
import { BADGES, flameTierFor } from "@/lib/badges";

/** Animated flame whose colour + size scale with the login streak tier. */
export function AnimatedFlame({ streak, dead = false }: { streak: number; dead?: boolean }) {
  const tier = flameTierFor(streak);
  const sizePx = { sm: 34, md: 44, lg: 54, xl: 64, xxl: 76 }[tier.size];
  const from = dead ? "#9CA3AF" : tier.from;
  const to = dead ? "#6B7280" : tier.to;

  return (
    <div
      className="relative shrink-0"
      style={{ width: sizePx, height: sizePx * 1.2 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          25% { transform: scale(1.05, 0.96) rotate(2deg); }
          50% { transform: scale(0.96, 1.06) rotate(-1deg); }
          75% { transform: scale(1.03, 0.98) rotate(1deg); }
        }
        @keyframes flame-hue { to { filter: hue-rotate(360deg); } }
      `}</style>
      <div
        className="absolute inset-0 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
        style={{
          background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
          clipPath: "path('M20 0C24 8 34 16 34 28C34 37 27 44 20 44C13 44 6 37 6 28C6 20 12 16 15 8C16 12 15 15 17 17C18 14 17 6 20 0Z')",
          animation: `flame-flicker ${dead ? "0s" : "1.6s"} ease-in-out infinite${tier.animated ? ", flame-hue 3s linear infinite" : ""}`,
          boxShadow: dead ? "none" : `0 0 ${sizePx * 0.4}px ${from}66`,
        }}
      />
    </div>
  );
}

/** Dashboard card: the animated login-streak counter + the 4 most recent badges. */
export function StreaksBadges() {
  const fnGet = useServerFn(getGamification);
  const { data } = useQuery({ queryKey: ["gamification"], queryFn: () => fnGet({}) });

  const current = data?.streak.current ?? 0;
  const best = data?.streak.best ?? 0;
  const earnedIds = new Set((data?.earned ?? []).map((e) => e.badge_id));
  const isDead = current === 0 && best > 0;

  const recent = [...BADGES]
    .sort((a, b) => Number(earnedIds.has(b.id)) - Number(earnedIds.has(a.id)) || a.days - b.days)
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <FlameIcon className="size-5 text-warning" /> Streaks &amp; badges
        </h2>
        <Link to="/badges" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      <Link
        to="/badges"
        className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-muted/60 to-transparent p-5"
      >
        <AnimatedFlame streak={current} dead={isDead} />
        <div className="flex-1">
          <p className="font-display text-4xl font-extrabold leading-none">{current}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">days streak</p>
          {isDead ? (
            <p className="mt-1 text-xs font-medium text-destructive">Streak lost. Start again today.</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Best: {best} days</p>
          )}
        </div>
      </Link>

      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Award className="size-4 text-warning" />
        {earnedIds.size} of {BADGES.length} badges unlocked
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {recent.map((b) => {
          const has = earnedIds.has(b.id);
          return (
            <motion.div
              key={b.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              title={`${b.name} — ${b.tagline}`}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <div
                className="relative flex h-14 w-12 items-center justify-center text-white"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: has ? `linear-gradient(160deg, ${b.from}, ${b.to})` : "linear-gradient(160deg, #9CA3AF, #6B7280)",
                  filter: has ? "none" : "grayscale(1) opacity(0.55)",
                }}
              >
                <span className="font-display text-lg font-extrabold drop-shadow">{b.days}</span>
                {!has && <Lock className="absolute right-1 top-1 size-2.5 text-white/90" />}
              </div>
              <span className="max-w-[3.5rem] truncate text-[10px] text-muted-foreground">{b.name}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
