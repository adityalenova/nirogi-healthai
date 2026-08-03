import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Brain, Salad, BatteryCharging, CheckCircle2 } from "lucide-react";
import { getWellnessDay } from "@/lib/mindful.functions";

const CARDS = [
  { key: "mood", to: "/mind-mood" as const, title: "Mind & Mood", note: "Mood check-in, gratitude & calm", Icon: Brain, tint: "bg-primary/10 text-primary" },
  { key: "gut", to: "/gut-health" as const, title: "Gut Health", note: "30-second digestion check", Icon: Salad, tint: "bg-success/10 text-success" },
  { key: "energy", to: "/daily-energy" as const, title: "Daily Energy", note: "Rate today, spot the patterns", Icon: BatteryCharging, tint: "bg-warning/10 text-warning" },
];

/** Today's Wellness — three daily check-ins worth 5 credits each. */
export function TodaysWellness() {
  const fnGet = useServerFn(getWellnessDay);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });
  const done = new Set(data?.completedToday ?? []);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Today's wellness</h2>
        <span className="text-xs text-muted-foreground">{done.size}/3 done · 5 credits each</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {CARDS.map(({ key, to, title, note, Icon, tint }) => (
          <Link key={key} to={to} className="group relative rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
            {done.has(key) && <CheckCircle2 className="absolute right-3 top-3 size-4 text-success" />}
            <span className={`flex size-9 items-center justify-center rounded-xl ${tint}`}><Icon className="size-5" /></span>
            <p className="mt-3 font-display text-sm font-bold">{title}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
