import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Brain, Sparkles, Wind } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getWellnessDay, saveMood, saveGratitude, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/mind-mood")({
  head: () => ({
    meta: [
      { title: "Mind & Mood · Nirogi" },
      { name: "description", content: "Daily mood check-in, gratitude journal and a calm-down breathing break." },
      { property: "og:title", content: "Mind & Mood · Nirogi" },
      { property: "og:description", content: "Track your mood, note what you're grateful for and reset your mind." },
    ],
  }),
  component: MindMood,
});

const MOODS = [
  { level: 1, emoji: "😞", label: "Low" },
  { level: 2, emoji: "😕", label: "Meh" },
  { level: 3, emoji: "😐", label: "Okay" },
  { level: 4, emoji: "🙂", label: "Good" },
  { level: 5, emoji: "😄", label: "Great" },
];

function MindMood() {
  const qc = useQueryClient();
  const fnGet = useServerFn(getWellnessDay);
  const fnMood = useServerFn(saveMood);
  const fnGratitude = useServerFn(saveGratitude);
  const fnComplete = useServerFn(completeWellnessActivity);
  const { data } = useQuery({ queryKey: ["wellness-day"], queryFn: () => fnGet({}) });

  const [entry, setEntry] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (data?.moodToday) setSelected(data.moodToday);
  }, [data?.moodToday]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["wellness-day"] });
    qc.invalidateQueries({ queryKey: ["credits"] });
  };

  const reward = async (key: string, label: string) => {
    const res = await fnComplete({ data: { key, label } });
    if (res.credited > 0) toast.success(`+${res.credited} credits — ${label} done for today.`);
  };

  const pickMood = async (level: number) => {
    setSelected(level);
    try {
      await fnMood({ data: { level } });
      await reward("mood", "Mood check-in");
      refresh();
    } catch (e) {
      toastServerError(e);
    }
  };

  const addGratitude = async () => {
    try {
      await fnGratitude({ data: { entry } });
      setEntry("");
      await reward("gratitude", "Gratitude note");
      refresh();
      toast.success("Saved to your journal.");
    } catch (e) {
      toastServerError(e);
    }
  };

  const chart = (data?.moodHistory ?? []).map((m) => ({
    day: new Date(m.log_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    mood: m.mood_level,
  }));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Brain className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Mind &amp; Mood</h1>
            <p className="text-sm text-muted-foreground">A one-minute daily reset for your head</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">How are you feeling today?</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {MOODS.map((m) => (
              <button
                key={m.level}
                onClick={() => pickMood(m.level)}
                className={`flex w-20 flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition-all ${
                  selected === m.level ? "border-primary bg-primary/10 scale-105" : "border-border hover:bg-muted"
                }`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
          {chart.length > 1 && (
            <div className="mt-6 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[1, 5]} fontSize={11} tickLine={false} axisLine={false} width={20} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="size-5 text-primary" /> Gratitude journal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Name one thing that went right today. It rewires how the day feels.</p>
          <Textarea value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Today I'm grateful for…" className="mt-3" rows={3} />
          <Button className="mt-3" disabled={!entry.trim()} onClick={addGratitude}>Save note</Button>

          <div className="mt-5 space-y-2">
            {(data?.gratitude ?? []).map((g) => (
              <div key={g.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                <p>{g.entry}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(g.log_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Wind className="size-5 text-primary" /> Calm down</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {(data?.breathingSecToday ?? 0) > 0
              ? `You've breathed for ${Math.round((data!.breathingSecToday ?? 0) / 60)} minutes today.`
              : "A 3-minute guided breathing session drops your heart rate fast."}
          </p>
          <Button asChild variant="outline" className="mt-3"><Link to="/breathe">Open guided breathing</Link></Button>
        </section>

        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          Nirogi is not a mental-health service. If you feel hopeless or think about harming yourself, call Tele-MANAS 14416
          (India, 24×7) or your local emergency number right away.
        </p>
      </div>
    </SiteLayout>
  );
}
