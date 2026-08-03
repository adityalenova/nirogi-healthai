import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getGamification } from "@/lib/gamification.functions";
import { BADGES, STREAK_META } from "@/lib/badges";

export const Route = createFileRoute("/_authenticated/badges")({
  head: () => ({
    meta: [
      { title: "Streaks & Badges · Nirogi" },
      { name: "description", content: "Your health streaks and the achievement badges you have unlocked on Nirogi." },
      { property: "og:title", content: "Streaks & Badges · Nirogi" },
      { property: "og:description", content: "Unlock badges as you build daily healthy habits with Nirogi." },
    ],
  }),
  component: BadgesPage,
});

function BadgesPage() {
  const fnGet = useServerFn(getGamification);
  const { data } = useQuery({ queryKey: ["gamification"], queryFn: () => fnGet({}) });
  const earned = new Set((data?.earned ?? []).map((e) => e.badge_id));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-warning/10 text-warning"><Award className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Streaks &amp; Badges</h1>
            <p className="text-sm text-muted-foreground">
              {earned.size} of {BADGES.length} badges unlocked
            </p>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(data?.streaks ?? []).map((s) => (
            <div key={s.key} className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
              <span className="text-2xl">{STREAK_META[s.key].emoji}</span>
              <p className="mt-1 font-display text-2xl font-extrabold">{s.current}</p>
              <p className="text-xs text-muted-foreground">{STREAK_META[s.key].label}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">best {s.longest}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b, i) => {
            const has = earned.has(b.id);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`relative overflow-hidden rounded-2xl border p-5 text-center shadow-card ${
                  has ? "border-transparent bg-gradient-to-br text-white " + b.color : "border-border bg-card"
                }`}
              >
                <span className={`block text-4xl ${has ? "" : "opacity-30 grayscale"}`}>{b.emoji}</span>
                <p className={`mt-2 font-display text-sm font-bold ${has ? "" : "text-muted-foreground"}`}>{b.name}</p>
                <p className={`mt-1 text-[11px] ${has ? "text-white/85" : "text-muted-foreground"}`}>{b.how}</p>
                {!has && (
                  <span className="absolute right-2 top-2 text-muted-foreground"><Lock className="size-3.5" /></span>
                )}
              </motion.div>
            );
          })}
        </section>
      </div>
    </SiteLayout>
  );
}
