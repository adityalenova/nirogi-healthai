import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Droplets, Loader2, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { WaterReminders } from "@/components/dashboard/WaterReminders";
import { getWaterToday, addWater, deleteWater, getWellnessSettings, saveWellnessSettings } from "@/lib/wellness.functions";

export const Route = createFileRoute("/_authenticated/water-tracker")({
  head: () => ({ meta: [{ title: "Water Tracker · Nirogi" }] }),
  component: WaterTracker,
});

const QUICK = [200, 300, 500, 750];

function WaterTracker() {
  const { t } = useI18n();
  const { memberId, memberName } = useActiveMember();
  const qc = useQueryClient();
  const fnToday = useServerFn(getWaterToday);
  const fnAdd = useServerFn(addWater);
  const fnDel = useServerFn(deleteWater);
  const fnSettings = useServerFn(getWellnessSettings);
  const fnSaveSettings = useServerFn(saveWellnessSettings);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["water", memberId],
    queryFn: () => fnToday({ data: { memberId } }),
  });
  const { data: settings } = useQuery({
    queryKey: ["wellness-settings", memberId],
    queryFn: () => fnSettings({ data: { memberId } }),
  });

  const goal = settings?.settings?.water_goal_ml ?? 3000;
  const total = data?.todayTotal ?? 0;
  const pct = Math.min(100, Math.round((total / goal) * 100));

  const add = async (ml: number) => {
    setBusy(true);
    try {
      await fnAdd({ data: { memberId, amount_ml: ml } });
      await qc.invalidateQueries({ queryKey: ["water", memberId] });
      qc.invalidateQueries({ queryKey: ["health-score"] });
    } catch {
      toast.error("Couldn't log water. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    await fnDel({ data: { id } });
    qc.invalidateQueries({ queryKey: ["water", memberId] });
  };

  const setGoal = async (ml: number) => {
    await fnSaveSettings({ data: { memberId, water_goal_ml: ml } });
    qc.invalidateQueries({ queryKey: ["wellness-settings", memberId] });
    toast.success("Daily goal updated.");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("nav.dashboard", "Dashboard")}
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Droplets className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("water.title", "Water Tracker")}</h1>
            <p className="text-sm text-muted-foreground">
              {memberName ? `${memberName} · ` : ""}{t("water.sub", "Stay hydrated — track every glass toward your daily goal.")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <div className="relative mx-auto size-44">
                <svg viewBox="0 0 120 120" className="size-44 -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`} className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl font-extrabold">{(total / 1000).toFixed(1)}L</span>
                  <span className="text-xs text-muted-foreground">{t("water.of", "of")} {(goal / 1000).toFixed(1)}L · {pct}%</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {QUICK.map((ml) => (
                  <Button key={ml} variant="outline" size="sm" disabled={busy} onClick={() => add(ml)}>
                    <Plus className="size-4" /> {ml}ml
                  </Button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom ml" className="w-32" />
                <Button size="sm" disabled={busy || !custom} onClick={() => { add(parseInt(custom)); setCustom(""); }}>
                  {t("water.add", "Add")}
                </Button>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">{t("water.weekly", "Last 7 days")}</h2>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.week ?? []}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                    <Bar dataKey="ml" radius={[6, 6, 0, 0]}>
                      {(data?.week ?? []).map((d, i) => (
                        <Cell key={i} fill={d.ml >= goal ? "hsl(var(--success))" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <WaterReminders goalReached={pct >= 100} />

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">{t("water.goal", "Daily goal")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[2000, 2500, 3000, 3500, 4000].map((g) => (
                  <Button key={g} variant={goal === g ? "default" : "outline"} size="sm" onClick={() => setGoal(g)}>
                    {(g / 1000).toFixed(1)}L
                  </Button>
                ))}
              </div>
            </section>

            {(data?.todayLogs?.length ?? 0) > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold">{t("water.today_log", "Today's intake")}</h2>
                <div className="mt-3 space-y-2">
                  {data!.todayLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="inline-flex items-center gap-2"><Droplets className="size-4 text-primary" /> {l.amount_ml} ml</span>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        {new Date(l.logged_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        <button onClick={() => del(l.id)} aria-label="Delete"><Trash2 className="size-4 hover:text-destructive" /></button>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  );
}
