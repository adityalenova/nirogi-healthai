import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { getCreditBalance } from "@/lib/credits.functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * Live credit balance pill. Teal normally, amber under 50 and red with an
 * "Earn credits" nudge at zero. Refetches whenever the window regains focus so
 * it stays in step with actions taken elsewhere in the app.
 */
export function CreditPill({ className }: { className?: string }) {
  const { user } = useAuth();
  const fnBalance = useServerFn(getCreditBalance);

  const { data } = useQuery({
    queryKey: ["credit-balance"],
    queryFn: () => fnBalance(),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  if (!user) return null;
  const balance = data?.balance ?? 0;
  const tone =
    balance === 0
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : balance < 50
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-primary/30 bg-primary/10 text-primary";

  return (
    <Link
      to="/credits"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors hover:brightness-105",
        tone,
        className,
      )}
      title="Credits are used for AI Doctor chat and voice calls"
    >
      <Coins className="size-3.5" />
      {balance === 0 ? "Earn credits" : `${balance} credits`}
    </Link>
  );
}
