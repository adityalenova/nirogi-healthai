import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Stethoscope } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useOrganStatuses, ORGAN_INFO, type OrganKey } from "@/components/dashboard/Body3D";
import { StatusChip } from "@/routes/_authenticated/dashboard.body-3d";
import { TOOLS } from "@/lib/tools";

const ORGAN_KEYS: OrganKey[] = ["brain", "heart", "lungs", "liver", "stomach", "kidneys", "bones"];

const isOrganKey = (v: string): v is OrganKey => (ORGAN_KEYS as string[]).includes(v);

export const Route = createFileRoute("/_authenticated/dashboard/organs/$organ")({
  beforeLoad: ({ params }) => {
    if (!isOrganKey(params.organ)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${isOrganKey(params.organ) ? ORGAN_INFO[params.organ].label : "Organ"} · Nirogi` }],
  }),
  component: OrganDetailPage,
});

function OrganDetailPage() {
  const { organ: rawOrgan } = Route.useParams();
  const organ: OrganKey = isOrganKey(rawOrgan) ? rawOrgan : "heart";
  const info = ORGAN_INFO[organ];
  const { organs, isLoading } = useOrganStatuses();
  const status = organs.find((o) => o.key === organ);
  const tools = TOOLS.filter((t) => info.toolSlugs.includes(t.slug));


  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard/body-3d" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> 3D Body View
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">{info.label}</h1>
          {status && <StatusChip status={status.status} />}
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">What it does</h2>
              <p className="mt-2 text-sm text-muted-foreground">{info.whatItDoes}</p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">How your data looks</h2>
              <p className="mt-2 text-sm text-muted-foreground">{status?.note ?? "No data yet."}</p>
            </section>

            {tools.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Related Nirogi tools</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {tools.map((t) => (
                    <Link key={t.slug} to="/tools/$tool" params={{ tool: t.slug }} className="rounded-xl border border-border p-3 transition-colors hover:bg-muted/50">
                      <p className="font-display text-sm font-bold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.tagline}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="size-5" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide">Who to consult</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                For anything beyond everyday habits here, a <strong>{info.specialist}</strong> is the right specialist to see.
              </p>
            </section>

            <p className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
              This is an educational summary from the details you entered — not a diagnosis. Always speak to a doctor about symptoms.
            </p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
