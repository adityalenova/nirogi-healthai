import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, Footprints, Moon, HeartPulse, Flame, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGoogleHealthStatus, syncGoogleHealth } from "@/lib/googlefit.functions";

/** Shows the latest real Google Health numbers synced into Nirogi. */
export function GoogleHealthSummary() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getGoogleHealthStatus);
  const syncFn = useServerFn(syncGoogleHealth);
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["google-health-status"],
    queryFn: () => statusFn(),
  });

  if (isLoading) return null;
  if (!data?.connected) return null;

  const days = (data.days ?? []) as Array<Record<string, number | string | null>>;
  const latest = days[0];
  const num = (v: unknown) => (typeof v === "number" ? v : null);

  const cards = [
    { icon: Footprints, accent: "bg-success/10 text-success", label: "Steps", value: num(latest?.steps) != null ? num(latest?.steps)!.toLocaleString() : "—" },
    { icon: Moon, accent: "bg-primary/10 text-primary", label: "Sleep", value: num(latest?.sleep_minutes) != null ? `${Math.round((num(latest?.sleep_minutes)! / 60) * 10) / 10} h` : "—" },
    { icon: HeartPulse, accent: "bg-pulse/10 text-pulse", label: "Heart rate", value: num(latest?.heart_rate_avg) != null ? `${num(latest?.heart_rate_avg)} bpm` : "—" },
    { icon: Flame, accent: "bg-warning/10 text-warning", label: "Calories", value: num(latest?.calories) != null ? `${num(latest?.calories)} kcal` : "—" },
  ];

  const onSync = async () => {
    setSyncing(true);
    try {
      const res = await syncFn();
      if (res.connected === false) toast.error("Google Health isn't connected.");
      else toast.success(`Synced ${res.imported} day${res.imported === 1 ? "" : "s"} of data.`);
      qc.invalidateQueries();
    } catch {
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Activity className="size-5" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">Google Health</h2>
          <p className="text-xs text-muted-foreground">
            {latest?.date ? `Latest day: ${new Date(`${latest.date}T00:00:00`).toLocaleDateString()}` : "No data imported yet"}
            {data.lastSync ? ` · synced ${new Date(data.lastSync).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={onSync} disabled={syncing}>
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Sync now
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/dashboard/devices"><Smartphone className="size-4" /> Devices</Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-muted/30 p-4">
            <span className={`flex size-9 items-center justify-center rounded-xl ${c.accent}`}><c.icon className="size-5" /></span>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="font-display text-base font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
