import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Boxes, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Body3D, type OrganKey, type OrganStatus } from "@/components/dashboard/Body3D";
import { getMyProfile } from "@/lib/profile.functions";
import { getHealthScore } from "@/lib/health-score.functions";
import { ClinicalDisclaimer } from "@/components/site/ClinicalDisclaimer";

export const Route = createFileRoute("/_authenticated/dashboard/body-3d")({
  head: () => ({
    meta: [
      { title: "3D Body View · Nirogi" },
      { name: "description", content: "An interactive 3D view of your body with organ-by-organ insight from your Nirogi health data." },
    ],
  }),
  component: Body3DPage,
});

const has = (text: string | null | undefined, words: string[]) => {
  const t = (text ?? "").toLowerCase();
  return words.some((w) => t.includes(w));
};

function Body3DPage() {
  const fnProfile = useServerFn(getMyProfile);
  const fnScore = useServerFn(getHealthScore);
  const { data: profileData, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => fnProfile() });
  const { data: score } = useQuery({ queryKey: ["health-score"], queryFn: () => fnScore() });
  const [selected, setSelected] = useState<OrganKey | null>("heart");

  const organs: OrganStatus[] = useMemo(() => {
    const p = profileData?.profile;
    const conditions = `${p?.health_conditions ?? ""} ${p?.family_history ?? ""}`;
    const bmi = p?.bmi ?? null;
    const pillar = (k: string) => score?.pillars?.find((x) => x.key === k)?.points ?? null;
    const sleep = pillar("sleep");
    const activity = pillar("activity");
    const hydration = pillar("hydration");

    const heartRisk = has(conditions, ["heart", "cardiac", "hypertension", "blood pressure", "cholesterol"]);
    const lungRisk = has(conditions, ["asthma", "copd", "smok", "bronch", "lung"]);
    const liverRisk = has(conditions, ["liver", "fatty", "alcohol", "hepat"]);
    const stomachRisk = has(conditions, ["gastr", "acidity", "ulcer", "ibs", "reflux"]);
    const kidneyRisk = has(conditions, ["kidney", "renal", "stone"]);
    const boneRisk = has(conditions, ["arthrit", "osteo", "joint", "back pain"]);
    const brainRisk = has(conditions, ["migraine", "anxiety", "depress", "insomnia", "stress"]);

    return [
      {
        key: "brain",
        label: "Brain & mind",
        status: brainRisk ? "risk" : sleep != null && sleep < 12 ? "watch" : "good",
        note: brainRisk
          ? "You've noted a neurological or mental-health condition. Sleep, breathing sessions and steady routines help most."
          : sleep != null && sleep < 12
            ? "Short or poor sleep is the biggest drag on focus and mood right now."
            : "Sleep and stress markers look steady. Keep the wind-down routine going.",
      },
      {
        key: "heart",
        label: "Heart & circulation",
        status: heartRisk ? "risk" : activity != null && activity < 10 ? "watch" : "good",
        note: heartRisk
          ? "Cardiovascular risk noted in your profile — keep to your medicines and log your pulse regularly."
          : activity != null && activity < 10
            ? "Under 150 active minutes this week. Brisk walking is the single best heart habit."
            : "Activity levels are supporting your heart well.",
      },
      {
        key: "lungs",
        label: "Lungs & breathing",
        status: lungRisk ? "risk" : "good",
        note: lungRisk
          ? "Respiratory condition noted. Avoid smoke and pollution peaks; use the guided breathing sessions."
          : "No respiratory flags. Try a 5-minute breathing session to build lung capacity.",
      },
      {
        key: "liver",
        label: "Liver & metabolism",
        status: liverRisk ? "risk" : bmi != null && bmi >= 30 ? "watch" : "good",
        note: liverRisk
          ? "Liver-related history noted — avoid alcohol and check with your doctor before new medicines."
          : bmi != null && bmi >= 30
            ? "A higher BMI raises fatty-liver risk. Small calorie deficits work better than crash diets."
            : "Metabolic markers look fine from what you've shared.",
      },
      {
        key: "stomach",
        label: "Stomach & gut",
        status: stomachRisk ? "watch" : "good",
        note: stomachRisk
          ? "Digestive symptoms noted — regular meal times and fewer late dinners usually help."
          : "No digestive flags. Fibre and water keep this system happy.",
      },
      {
        key: "kidneys",
        label: "Kidneys & hydration",
        status: kidneyRisk ? "risk" : hydration != null && hydration < 12 ? "watch" : "good",
        note: kidneyRisk
          ? "Kidney history noted — stay hydrated and avoid painkillers that aren't prescribed."
          : hydration != null && hydration < 12
            ? "Hydration is below your goal. Water reminders in the tracker will fix that fast."
            : "Hydration is on track for healthy kidney function.",
      },
      {
        key: "bones",
        label: "Bones & joints",
        status: boneRisk ? "watch" : "good",
        note: boneRisk
          ? "Joint or bone pain noted — low-impact activity plus vitamin D and calcium usually help."
          : "No bone or joint flags recorded. Strength work twice a week keeps it that way.",
      },
    ];
  }, [profileData, score]);

  const active = organs.find((o) => o.key === selected) ?? null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Boxes className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">3D Body View</h1>
            <p className="text-sm text-muted-foreground">Your health data mapped onto an interactive body model.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Body3D organs={organs} selected={selected} onSelect={setSelected} />
            </div>

            <div className="space-y-4 lg:col-span-2">
              {active && (
                <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">{active.label}</h2>
                    <StatusChip status={active.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{active.note}</p>
                </section>
              )}

              <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">All systems</h2>
                <div className="mt-3 space-y-1.5">
                  {organs.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => setSelected(o.key)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected === o.key ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium">{o.label}</span>
                      <StatusChip status={o.status} />
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        <div className="mt-6">
          <ClinicalDisclaimer />
        </div>
      </div>
    </SiteLayout>
  );
}

function StatusChip({ status }: { status: OrganStatus["status"] }) {
  const map = {
    good: "border-success/30 bg-success/10 text-success",
    watch: "border-warning/30 bg-warning/10 text-warning",
    risk: "border-destructive/40 bg-destructive/10 text-destructive",
  } as const;
  const label = { good: "Healthy", watch: "Watch", risk: "Attention" } as const;
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>{label[status]}</span>;
}
