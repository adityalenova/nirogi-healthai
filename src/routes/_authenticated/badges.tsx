import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getGamification } from "@/lib/gamification.functions";
import { BADGES, type BadgeDef } from "@/lib/badges";
import { AnimatedFlame } from "@/components/dashboard/StreaksBadges";

export const Route = createFileRoute("/_authenticated/badges")({
  head: () => ({
    meta: [
      { title: "Streaks & Badges · Nirogi" },
      { name: "description", content: "Your daily login streak and the premium badges you have unlocked on Nirogi." },
      { property: "og:title", content: "Streaks & Badges · Nirogi" },
      { property: "og:description", content: "Unlock badges as you build a daily login streak with Nirogi." },
    ],
  }),
  component: BadgesPage,
});

/** Premium hexagon badge — CSS clip-path, 3D flame overlapping the top edge, big 3D number. */
function BadgeHexagon({ badge, earned, current }: { badge: BadgeDef; earned: boolean; current: number }) {
  const gradient = earned ? `linear-gradient(160deg, ${badge.from}, ${badge.to})` : "linear-gradient(160deg, #A1A1AA, #52525B)";
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 160, height: 185 }}>
        <style>{`
          @keyframes badge-hue { to { filter: hue-rotate(360deg); } }
          @keyframes badge-holo { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        `}</style>
        <div
          className="absolute inset-0 flex items-center justify-center border-[3px] border-white"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: badge.animated === "holo"
              ? "linear-gradient(120deg,#00BFFF,#FF00FF,#FFD700,#00BFFF)"
              : gradient,
            backgroundSize: badge.animated === "holo" ? "300% 300%" : undefined,
            animation: !earned
              ? undefined
              : badge.animated === "rainbow"
              ? "badge-hue 3s linear infinite"
              : badge.animated === "holo"
              ? "badge-holo 3s ease-in-out infinite"
              : undefined,
            filter: earned ? "none" : "grayscale(1)",
            boxShadow: earned ? `0 10px 30px -10px ${badge.from}99` : "0 6px 16px -8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex flex-col items-center text-white">
            <span
              className="font-display text-5xl font-extrabold"
              style={{ textShadow: "0 2px 0 rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.3)" }}
            >
              {badge.days}
            </span>
            <span className="mt-0.5 text-xs font-bold tracking-widest" style={{ textShadow: "0 1px 0 rgba(0,0,0,0.25)" }}>
              STREAK
            </span>
            <span className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-white/70">Nirogi AI</span>
          </div>
        </div>

        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2/3">
          <AnimatedFlame streak={earned ? Math.max(badge.days, 30) : 0} dead={!earned} />
        </div>

        {!earned && (
          <span className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white">
            <Lock className="size-3.5" />
          </span>
        )}
      </div>

      <p className={`mt-2 text-center font-display text-sm font-bold ${earned ? "" : "text-muted-foreground"}`}>{badge.name}</p>
      <p className="mt-1 max-w-[10rem] text-center text-[11px] italic text-muted-foreground">{badge.tagline}</p>
      {!earned && (
        <p className="mt-1 text-center text-[10px] font-medium text-muted-foreground">
          Reach {badge.days} days streak to unlock
        </p>
      )}
    </div>
  );
}

function BadgesPage() {
  const fnGet = useServerFn(getGamification);
  const { data } = useQuery({ queryKey: ["gamification"], queryFn: () => fnGet({}) });
  const earned = new Set((data?.earned ?? []).map((e) => e.badge_id));
  const current = data?.streak.current ?? 0;
  const best = data?.streak.best ?? 0;
  const isDead = current === 0 && best > 0;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <Award className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Streaks &amp; Badges</h1>
            <p className="text-sm text-muted-foreground">{earned.size} of {BADGES.length} badges unlocked</p>
          </div>
        </div>

        <section className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <AnimatedFlame streak={current} dead={isDead} />
          <div>
            <p className="font-display text-4xl font-extrabold leading-none">{current}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">days streak</p>
            {isDead ? (
              <p className="mt-1 text-xs font-medium text-destructive">Streak lost. Start again today.</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Best: {best} days</p>
            )}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-6 sm:gap-8">
          {BADGES.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <BadgeHexagon badge={b} earned={earned.has(b.id)} current={current} />
            </motion.div>
          ))}
        </section>
      </div>
    </SiteLayout>
  );
}
