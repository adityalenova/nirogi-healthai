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

/** Premium hexagon badge — CSS clip-path, big 3D number, no flame overlay. */
function BadgeHexagon({ badge, earned, current }: { badge: BadgeDef; earned: boolean; current: number }) {
  const gradient = earned ? `linear-gradient(160deg, ${badge.from}, ${badge.to})` : "linear-gradient(160deg, #A1A1AA, #52525B)";
  const pct = earned ? 100 : Math.min(100, Math.round((current / badge.days) * 100));

  return (
    <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <div className="relative mx-auto aspect-[1/1.15] w-[110px] sm:w-[128px]">
        <style>{`
          @keyframes badge-hue { to { filter: hue-rotate(360deg); } }
          @keyframes badge-holo { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        `}</style>
        <div
          className="absolute inset-0 flex items-center justify-center"
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
            filter: earned ? "none" : "grayscale(1) opacity(0.75)",
            boxShadow: earned ? `0 12px 32px -14px ${badge.from}` : "none",
          }}
        >
          <div className="flex flex-col items-center leading-none text-primary-foreground">
            <span
              className="font-display text-4xl font-extrabold sm:text-5xl"
              style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22), 0 6px 12px rgba(0,0,0,0.28)" }}
            >
              {badge.days}
            </span>
            <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em]">STREAK</span>
          </div>
        </div>

        {!earned && (
          <span className="absolute inset-x-0 bottom-0 mx-auto flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
            <Lock className="size-3.5" />
          </span>
        )}
      </div>

      <p className={`mt-4 font-display text-sm font-bold ${earned ? "" : "text-muted-foreground"}`}>{badge.name}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{badge.tagline}</p>

      <div className="mt-auto w-full pt-3">
        {earned ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            <Check className="size-3" /> Unlocked
          </span>
        ) : (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-muted-foreground">
              {current} / {badge.days} days
            </p>
          </>
        )}
      </div>
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
  const next = BADGES.find((b) => !earned.has(b.id));
  const toNext = next ? Math.max(0, next.days - current) : 0;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <Award className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">Streaks &amp; Badges</h1>
            <p className="text-sm text-muted-foreground">{earned.size} of {BADGES.length} badges unlocked</p>
          </div>
        </div>

        <section className="mt-6 grid gap-5 rounded-2xl border border-border bg-gradient-to-br from-muted/60 to-transparent p-6 shadow-card sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div className="flex items-center gap-4">
            <AnimatedFlame streak={current} dead={isDead} />
            <div className="min-w-0">
              <p className="font-display text-4xl font-extrabold leading-none">{current}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">days streak</p>
              {isDead ? (
                <p className="mt-1 text-xs font-medium text-destructive">Streak lost. Start again today.</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Best: {best} days</p>
              )}
            </div>
          </div>

          {next && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next badge</p>
              <p className="mt-1 font-display text-base font-bold">{next.name}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (current / next.days) * 100)}%`, background: `linear-gradient(90deg, ${next.from}, ${next.to})` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {toNext === 0 ? "Unlocking today." : `${toNext} more day${toNext === 1 ? "" : "s"} to unlock.`}
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="h-full"
            >
              <BadgeHexagon badge={b} earned={earned.has(b.id)} current={current} />
            </motion.div>
          ))}
        </section>
      </div>
    </SiteLayout>
  );
}

