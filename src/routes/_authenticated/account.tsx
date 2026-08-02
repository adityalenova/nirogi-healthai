import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShieldAlert, Trash2, UserMinus } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { clearHistory, clearPrescription, deactivateMyAccount, deleteMyAccount } from "@/lib/account.functions";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account & data · Nirogi" },
      { name: "description", content: "Control your Nirogi data: clear health history per tool, deactivate your account or delete it permanently." },
      { property: "og:title", content: "Account & data · Nirogi" },
      { property: "og:description", content: "Clear your health history, deactivate or permanently delete your Nirogi account." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fnClear = useServerFn(clearHistory);
  const fnClearRx = useServerFn(clearPrescription);
  const fnDeactivate = useServerFn(deactivateMyAccount);
  const fnDelete = useServerFn(deleteMyAccount);

  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>, message: string) => {
    setBusy(key);
    try {
      await fn();
      qc.invalidateQueries();
      toast.success(message);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold">Account &amp; data controls</h1>
        <p className="mt-1 text-sm text-muted-foreground">You own your health data. Clear parts of it, or remove everything for good.</p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Clear health history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Remove saved results for a single tool, or wipe every result at once.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {TOOLS.map((tl) => (
              <button
                key={tl.slug}
                disabled={busy === tl.slug}
                onClick={() => run(tl.slug, () => fnClear({ data: { tool: tl.slug } }), `${tl.name} history cleared.`)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                Clear {tl.name}
              </button>
            ))}
            <button
              disabled={busy === "rx"}
              onClick={() => run("rx", () => fnClearRx(), "Prescription reading cleared.")}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              Clear prescription reading
            </button>
          </div>

          <Button
            variant="outline"
            className="mt-4"
            disabled={busy === "all"}
            onClick={() => run("all", () => fnClear({ data: { tool: null } }), "All history cleared.")}
          >
            {busy === "all" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Clear everything
          </Button>
        </section>

        <section className="mt-6 rounded-2xl border border-warning/40 bg-warning/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><UserMinus className="size-5 text-warning" /> Deactivate account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Wipes your health details, saved results and medicine reminders, but keeps your sign-in so you can come back later.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            disabled={busy === "deactivate"}
            onClick={() => {
              if (!window.confirm("Deactivate your account and erase your health data?")) return;
              run("deactivate", () => fnDeactivate(), "Account deactivated. Your health data has been erased.");
            }}
          >
            {busy === "deactivate" ? <Loader2 className="size-4 animate-spin" /> : null} Deactivate
          </Button>
        </section>

        <section className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-destructive">
            <ShieldAlert className="size-5" /> Delete account permanently
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This removes your profile, every health record, family members, reminders and credits. It cannot be undone.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className="max-w-44"
            />
            <Button
              variant="destructive"
              disabled={confirm !== "DELETE" || busy === "delete"}
              onClick={async () => {
                if (!window.confirm("Permanently delete your Nirogi account and all data?")) return;
                setBusy("delete");
                try {
                  await fnDelete({ data: { confirm: "DELETE" } });
                  await signOut();
                  toast.success("Your account and data have been deleted.");
                  navigate({ to: "/" });
                } catch {
                  toast.error("Couldn't delete the account. Please try again.");
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete forever
            </Button>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
