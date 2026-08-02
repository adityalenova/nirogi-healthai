import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Copy, Gift, Loader2, Share2, Sparkles, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getCreditsState, redeemReferral } from "@/lib/credits.functions";

export const Route = createFileRoute("/_authenticated/credits")({
  head: () => ({
    meta: [
      { title: "Your credits · Nirogi" },
      { name: "description", content: "Track your Nirogi credit balance, earn more, and see every credit you've earned or spent on AI Doctor consultations." },
      { property: "og:title", content: "Your credits · Nirogi" },
      { property: "og:description", content: "Balance, earning rules, referrals and the full credit ledger." },
    ],
  }),
  component: CreditsPage,
});

const EARN = [
  { label: "Daily login", value: "+5", note: "Every day you open Nirogi" },
  { label: "First use of a tool", value: "+10", note: "For each of the 9 health tools (max 90)" },
  { label: "All 9 tools in a week", value: "+100", note: "Complete the weekly sweep" },
  { label: "Upload a prescription", value: "+15", note: "One-time" },
  { label: "Add a family member", value: "+25", note: "One-time" },
  { label: "Refer a friend", value: "+100", note: "They get 50 on joining" },
];

function CreditsPage() {
  const fnState = useServerFn(getCreditsState);
  const fnRedeem = useServerFn(redeemReferral);
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["credits-state"], queryFn: () => fnState() });

  const balance = data?.balance ?? 0;
  const cap = data?.cap ?? 500;
  const pct = Math.min(100, Math.round((balance / cap) * 100));
  const referral = data?.referralCode ?? "";
  const shareText = `I'm using Nirogi AI for free health checks — use my code ${referral} and get 50 bonus credits. https://nirogi-healthai.lovable.app`;

  const redeem = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await fnRedeem({ data: { code: code.trim() } });
      toast.success(`Referral applied — ${res.bonus} credits added.`);
      setCode("");
      qc.invalidateQueries({ queryKey: ["credits-state"] });
      qc.invalidateQueries({ queryKey: ["credit-balance"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ALREADY_REFERRED")) toast.error("You've already used a referral code.");
      else if (msg.includes("SELF_REFERRAL")) toast.error("You can't use your own code.");
      else if (msg.includes("INVALID_CODE")) toast.error("That code doesn't exist.");
      else toast.error("Couldn't apply that code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <Coins className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Your credits</h1>
            <p className="text-sm text-muted-foreground">All 9 health tools are free forever. Credits are only used for AI Doctor chat and voice calls.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-border bg-gradient-primary p-6 text-primary-foreground shadow-elegant"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm opacity-90">Available balance</p>
                  <p className="font-display text-5xl font-extrabold">{balance}</p>
                  <p className="mt-1 text-sm opacity-90">of {cap} maximum · refreshes in {data?.daysToRefresh ?? 30} days (+{data?.monthlyRefresh ?? 100})</p>
                </div>
                <div className="text-right text-sm opacity-90">
                  <p>Earned: <span className="font-semibold">{data?.lifetimeEarned ?? 0}</span></p>
                  <p>Spent: <span className="font-semibold">{data?.lifetimeSpent ?? 0}</span></p>
                </div>
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full bg-white/90" />
              </div>
              <p className="mt-3 text-xs opacity-90">Doctor chat costs 2 credits per exchange · voice call 5 credits per minute.</p>
            </motion.section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="size-5 text-primary" /> Ways to earn</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {EARN.map((e) => (
                  <div key={e.label} className="flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.note}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">{e.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Users className="size-5 text-primary" /> Refer a friend</h2>
              <p className="mt-1 text-sm text-muted-foreground">Share your code — you get 100 credits when they join, they start with 50 bonus credits.</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2 font-display text-lg font-bold tracking-wider text-primary">
                  {referral || "—"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(referral); toast.success("Code copied."); }}
                  disabled={!referral}
                >
                  <Copy className="size-4" /> Copy
                </Button>
                <Button asChild size="sm" disabled={!referral}>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                    <Share2 className="size-4" /> Share on WhatsApp
                  </a>
                </Button>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-medium">Have a friend&apos;s code?</p>
                <div className="mt-2 flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. RAHUL4821" className="max-w-56" />
                  <Button onClick={redeem} disabled={busy || !code.trim()}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />} Apply
                  </Button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Transaction history</h2>
              {(data?.transactions.length ?? 0) === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No credit activity yet.</p>
              ) : (
                <div className="mt-3 divide-y divide-border">
                  {data!.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`font-display font-bold ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
