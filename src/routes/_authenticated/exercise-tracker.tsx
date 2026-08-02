import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Dumbbell, Flame, Loader2, MapPin, Timer, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { getExercise, addExercise, deleteExercise, getWellnessSettings } from "@/lib/wellness.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { LiveExerciseSession } from "@/components/dashboard/LiveExerciseSession";
import { ACTIVITIES, SPORT_CATEGORIES, estimateCalories, findActivity, type SportCategory } from "@/lib/sports";

export const Route = createFileRoute("/_authenticated/exercise-tracker")({
  head: () => ({ meta: [{ title: "Exercise Tracker · Nirogi" }] }),
  component: ExerciseTracker,
});

function ExerciseTracker() {
  const { t } = useI18n();
  const { memberId, memberName } = useActiveMember();
  const qc = useQueryClient();
  const fnGet = useServerFn(getExercise);
  const fnAdd = useServerFn(addExercise);
  const fnDel = useServerFn(deleteExercise);
  const fnSettings = useServerFn(getWellnessSettings);
  const fnProfile = useServerFn(getMyProfile);

  const [cat, setCat] = useState<SportCategory>("Running & Walking");
  const [activity, setActivity] = useState("Outdoor Running");
  const [duration, setDuration] = useState("30");
  const [distance, setDistance] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["exercise", memberId], queryFn: () => fnGet({ data: { memberId } }) });
  const { data: settings } = useQuery({ queryKey: ["wellness-settings", memberId], queryFn: () => fnSettings({ data: { memberId } }) });
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: () => fnProfile() });

  const weight = profile?.profile?.weight_kg ?? null;
  const goal = settings?.settings?.exercise_goal_min ?? 150;
  const weekMin = data?.weekMinutes ?? 0;
  const goalPct = Math.min(100, Math.round((weekMin / goal) * 100));

  const inCat = useMemo(() => ACTIVITIES.filter((a) => a.category === cat), [cat]);
  const selected = findActivity(activity);
  const estCal = selected ? estimateCalories(selected.met, parseInt(duration) || 0, weight) : 0;

  const log = async () => {
    if (!selected || !duration) return;
    setBusy(true);
    try {
      await fnAdd({
        data: {
          memberId,
          activity: selected.name,
          category: selected.category,
          duration_min: parseInt(duration),
          distance_km: selected.gps && distance ? parseFloat(distance) : null,
          calories: estCal,
        },
      });
      setDistance("");
      await qc.invalidateQueries({ queryKey: ["exercise", memberId] });
      qc.invalidateQueries({ queryKey: ["health-score"] });
      toast.success(`Logged ${selected.name} · ${estCal} kcal`);
    } catch {
      toast.error("Couldn't log activity. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("nav.dashboard", "Dashboard")}
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-pulse/10 text-pulse">
            <Dumbbell className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">{t("exercise.title", "Exercise Tracker")}</h1>
            <p className="text-sm text-muted-foreground">
              {memberName ? `${memberName} · ` : ""}{t("exercise.sub", "87 activities — calories, distance and time, like a smartwatch.")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-3 gap-3">
              <Stat icon={<Timer className="size-4" />} label={t("exercise.this_week", "This week")} value={`${weekMin} min`} />
              <Stat icon={<Flame className="size-4" />} label={t("exercise.burned", "Burned")} value={`${data?.weekCalories ?? 0}`} />
              <Stat icon={<MapPin className="size-4" />} label={t("exercise.sessions", "Sessions")} value={`${data?.logs.length ?? 0}`} />
            </section>

            <section className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t("exercise.weekly_goal", "Weekly goal (WHO: 150 min)")}</span>
                <span className="text-muted-foreground">{weekMin}/{goal} min</span>
              </div>
              <Progress value={goalPct} className="mt-2" />
              {goalPct >= 100 && <p className="mt-2 text-sm font-medium text-success">🎉 {t("exercise.goal_hit", "Weekly goal smashed — great work!")}</p>}
            </section>

            <LiveExerciseSession weightKg={weight} />

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">{t("exercise.log_activity", "Log an activity")}</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="mb-1.5">{t("exercise.category", "Category")}</Label>
                  <select
                    value={cat}
                    onChange={(e) => {
                      const c = e.target.value as SportCategory;
                      setCat(c);
                      const first = ACTIVITIES.find((a) => a.category === c);
                      if (first) setActivity(first.name);
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {SPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5">{t("exercise.activity", "Activity")}</Label>
                  <select value={activity} onChange={(e) => setActivity(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                    {inCat.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5">{t("exercise.duration", "Duration (min)")}</Label>
                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                  {selected?.gps && (
                    <div>
                      <Label className="mb-1.5">{t("exercise.distance", "Distance (km)")}</Label>
                      <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="optional" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{t("exercise.est_cal", "Estimated burn")}</span>
                  <span className="inline-flex items-center gap-1 font-display text-lg font-bold"><Flame className="size-4 text-pulse" /> {estCal} kcal</span>
                </div>
                {!weight && <p className="text-xs text-muted-foreground">{t("exercise.add_weight", "Add your weight in your profile for accurate calorie estimates.")}</p>}
                <Button onClick={log} disabled={busy} className="w-full">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null} {t("exercise.save", "Save activity")}
                </Button>
              </div>
            </section>

            {(data?.logs.length ?? 0) > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold">{t("exercise.recent", "Recent activities")}</h2>
                <div className="mt-3 space-y-2">
                  {data!.logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{l.activity}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.duration_min} min{l.distance_km ? ` · ${l.distance_km} km` : ""}{l.calories ? ` · ${l.calories} kcal` : ""}
                        </p>
                      </div>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        {new Date(l.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <button onClick={async () => { await fnDel({ data: { id: l.id } }); qc.invalidateQueries({ queryKey: ["exercise", memberId] }); }} aria-label="Delete">
                          <Trash2 className="size-4 hover:text-destructive" />
                        </button>
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

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <p className="mt-2 font-display text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
