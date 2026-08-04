import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Boxes, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Body3D, type OrganKey, type OrganStatus, useOrganStatuses } from "@/components/dashboard/Body3D";

export const Route = createFileRoute("/_authenticated/dashboard/body-3d")({
  head: () => ({
    meta: [
      { title: "3D Body View · Nirogi" },
      { name: "description", content: "An interactive 3D view of your body with organ-by-organ insight from your Nirogi health data." },
    ],
  }),
  component: Body3DPage,
});

function Body3DPage() {
  const { organs, bpm, isLoading } = useOrganStatuses();
  const [selected, setSelected] = useState<OrganKey | null>("heart");
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
              <Body3D organs={organs} selected={selected} onSelect={setSelected} bpm={bpm} />
            </div>

            <div className="space-y-4 lg:col-span-2">
              {active && (
                <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">{active.label}</h2>
                    <StatusChip status={active.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{active.note}</p>
                  <Link
                    to="/dashboard/organs/$organ"
                    params={{ organ: active.key }}
                    className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    View details →
                  </Link>
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

        <p className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
          This model is an educational visualisation built from the details you entered — not a scan, an
          imaging result or a diagnosis. Always speak to a doctor about symptoms.
        </p>
      </div>
    </SiteLayout>
  );
}

export function StatusChip({ status }: { status: OrganStatus["status"] }) {
  const map = {
    good: "border-success/30 bg-success/10 text-success",
    watch: "border-warning/30 bg-warning/10 text-warning",
    risk: "border-destructive/40 bg-destructive/10 text-destructive",
    none: "border-border bg-muted/40 text-muted-foreground",
  } as const;
  const label = { good: "Healthy", watch: "Watch", risk: "Attention", none: "No data" } as const;
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>{label[status]}</span>;
}
