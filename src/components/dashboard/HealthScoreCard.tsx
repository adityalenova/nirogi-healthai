import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity, Brain, Download, Droplets, Loader2, Moon, Share2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getHealthScore } from "@/lib/health-score.functions";
import { canvasToBlob, downloadCanvas, drawScoreCard } from "@/lib/score-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const bandColor: Record<string, string> = {
  Outstanding: "text-success",
  Good: "text-primary",
  Average: "text-warning",
  "Below Average": "text-warning",
  Poor: "text-destructive",
};

const pillarIcon: Record<string, typeof Activity> = {
  activity: Activity,
  hydration: Droplets,
  sleep: Moon,
  personal_os: Brain,
};

export function HealthScoreCard() {
  const { t } = useI18n();
  const fn = useServerFn(getHealthScore);
  const [shareOpen, setShareOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["health-score"], queryFn: () => fn() });

  const score = data?.score ?? 0;
  const circumference = 2 * Math.PI * 52;
  const dash = (score / 100) * circumference;
  const pillars = data?.pillars ?? [];

  const buildCanvas = (format: "square" | "story") =>
    drawScoreCard({
      name: (data?.name ?? "Your").split(" ")[0],
      score,
      band: data?.band ?? "Average",
      pillars: pillars.map((p) => ({ label: p.label, points: p.points, max: p.max })),
      format,
    });

  const shareNative = async (format: "square" | "story", target: "whatsapp" | "facebook" | "generic") => {
    try {
      const canvas = buildCanvas(format);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], "nirogi-health-score.png", { type: "image/png" });
      const text = `My Nirogi AI Health Score is ${score}/100 — ${data?.band}. Check yours free at nirogi.ai`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "My Nirogi Health Score" });
        return;
      }
      downloadCanvas(canvas, `nirogi-health-score-${format}.png`);
      if (target === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        toast.success("Card downloaded — attach it in WhatsApp.");
      } else if (target === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://nirogi.ai")}&quote=${encodeURIComponent(text)}`, "_blank", "noopener");
        toast.success("Card downloaded — attach it to your post.");
      } else {
        toast.success("Card downloaded.");
      }
    } catch {
      toast.error("Couldn't create the share card.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <TrendingUp className="size-5 text-primary" /> {t("dash.health_score", "Health Score")}
        </h2>
        {!isLoading && (
          <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" /> Share
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative size-32 shrink-0">
              <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-extrabold">{score}</span>
                <span className="text-[11px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div>
              <p className={cn("font-display text-lg font-bold", bandColor[data?.band ?? ""] ?? "text-foreground")}>
                {data?.band}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{data?.message}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {pillars.map((p) => {
              const Icon = pillarIcon[p.key] ?? Activity;
              return (
                <div key={p.key} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Icon className="size-4 text-primary" /> {p.label}
                    </span>
                    <span className="text-muted-foreground">{p.points}/{p.max}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                      style={{ width: `${(p.points / p.max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{p.note}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your Health Score</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A branded card with your score and four pillars. Nothing personal beyond your first name is included.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => shareNative("square", "whatsapp")}>
              <Share2 className="size-4" /> WhatsApp
            </Button>
            <Button variant="outline" onClick={() => shareNative("square", "facebook")}>
              <Share2 className="size-4" /> Facebook
            </Button>
            <Button variant="outline" onClick={() => shareNative("story", "generic")}>
              <Share2 className="size-4" /> Instagram / TikTok story
            </Button>
            <Button variant="outline" onClick={() => downloadCanvas(buildCanvas("square"), "nirogi-health-score.png")}>
              <Download className="size-4" /> Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
