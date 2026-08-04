import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Brain, Sparkles, Wind, Play, Square, Heart, PartyPopper } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getWellnessDay, saveMood, saveGratitude, completeWellnessActivity } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";
import {
  MEDITATION_SCRIPT,
  MOOD_OPTIONS,
  MOOD_RESPONSES,
  GRATITUDE_PROMPTS,
  affirmationsForToday,
  puzzleOfTheDay,
  dayIndex,
} from "@/lib/wellness-content";

export const Route = createFileRoute("/_authenticated/mind-mood")({
  head: () => ({
    meta: [
      { title: "Mind & Mood · Nirogi" },
      { name: "description", content: "Guided meditation, box breathing, mood check-in, gratitude, puzzles and affirmations." },
      { property: "og:title", content: "Mind & Mood · Nirogi" },
      { property: "og:description", content: "Six daily tools for anxiety, depression and mental wellness." },
    ],
  }),
  component: MindMood,
});

const BOX_LABELS = ["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s"];

function useReward(fnComplete: ReturnType<typeof useServerFn<typeof completeWellnessActivity>>, refresh: () => void) {
  return async (key: string, label: string) => {
    const res = await fnComplete({ data: { key, label } });
    if (res.credited > 0) toast.success(`+${res.credited} credits — ${label} done for today.`);
    refresh();
  };
}

function MeditationCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalMs = 5 * 60 * 1000;

  const play = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Your browser doesn't support voice narration.");
      return;
    }
    setPlaying(true);
    setProgress(0);
    window.speechSynthesis.cancel();
    const perLine = totalMs / MEDITATION_SCRIPT.length;
    MEDITATION_SCRIPT.forEach((line, i) => {
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(line);
        utter.rate = 0.85;
        utter.pitch = 0.95;
        window.speechSynthesis.speak(utter);
      }, i * perLine);
    });
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / totalMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlaying(false);
      }
    }, 250);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
  };

  const markDone = async () => {
    setDone(true);
    await reward("meditation", "Guided meditation");
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Brain className="size-5 text-primary" /> Guided meditation</h2>
      <p className="mt-1 text-sm text-muted-foreground">A 5-minute AI-narrated body scan and breath awareness session.</p>
      <div className="relative mt-4 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-primary/5">
        {playing && (
          <>
            <span className="absolute size-16 animate-ping rounded-full bg-primary/20" />
            <span className="absolute size-28 animate-ping rounded-full bg-primary/10 [animation-delay:0.3s]" />
            <span className="absolute size-40 animate-ping rounded-full bg-primary/5 [animation-delay:0.6s]" />
          </>
        )}
        <span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Brain className="size-6" />
        </span>
      </div>
      <Progress value={progress} className="mt-4" />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!playing ? (
          <Button onClick={play} disabled={done}><Play className="mr-1.5 size-4" /> Play</Button>
        ) : (
          <Button variant="outline" onClick={stop}><Square className="mr-1.5 size-4" /> Stop</Button>
        )}
        <Button variant="secondary" disabled={done || progress < 100} onClick={markDone}>
          {done ? "Done ✓" : "Mark done"}
        </Button>
      </div>
    </section>
  );
}

function BoxBreathingCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const [rounds, setRounds] = useState(3);
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState(0);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setActive(true);
    setDone(false);
    setPhase(0);
    setRound(1);
    let p = 0;
    let r = 1;
    intervalRef.current = setInterval(() => {
      p = (p + 1) % 4;
      setPhase(p);
      if (p === 0) {
        r += 1;
        setRound(r);
        if (r > rounds) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setActive(false);
          setDone(true);
          reward("breathing", "Box breathing");
        }
      }
    }, 4000);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const dotPos: Record<number, string> = {
    0: "top-0 left-0 animate-[dot-top_4s_linear]",
    1: "top-0 right-0 animate-[dot-right_4s_linear]",
    2: "bottom-0 right-0 animate-[dot-bottom_4s_linear]",
    3: "bottom-0 left-0 animate-[dot-left_4s_linear]",
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Wind className="size-5 text-primary" /> Box breathing</h2>
      <p className="mt-1 text-sm text-muted-foreground">Follow the dot around the square — inhale, hold, exhale, hold, 4 seconds each side.</p>
      <div className="relative mx-auto mt-6 size-48 rounded-lg border-2 border-primary/30">
        {active && <span key={phase + round} className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ${dotPos[phase]}`} />}
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">Inhale 4s</span>
        <span className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">Hold 4s</span>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">Exhale 4s</span>
        <span className="absolute -left-14 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">Hold 4s</span>
        {active && <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{BOX_LABELS[phase]}</span>}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">{active ? `Round ${round} of ${rounds}` : done ? "Session complete ✓" : "Pick a length and start"}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {[3, 5, 10].map((r) => (
          <button
            key={r}
            onClick={() => !active && setRounds(r)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${rounds === r ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            disabled={active}
          >
            {r} rounds
          </button>
        ))}
        <Button size="sm" onClick={start} disabled={active}>{active ? "In progress…" : "Start"}</Button>
      </div>
    </section>
  );
}

function MoodCard({ selected, onPick, doctorLink }: { selected: number | null; onPick: (l: number) => void; doctorLink: string }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">Daily mood check-in</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {MOOD_OPTIONS.map((m) => (
          <button
            key={m.level}
            onClick={() => onPick(m.level)}
            className={`flex w-20 flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition-all ${
              selected === m.level ? "border-primary bg-primary/10 scale-105" : "border-border hover:bg-muted"
            }`}
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs font-semibold">{m.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <p>{MOOD_RESPONSES[selected]}</p>
          {selected === 1 && (
            <Button asChild size="sm" className="mt-3"><Link to={doctorLink}>Chat with Dr. Amit</Link></Button>
          )}
        </div>
      )}
    </section>
  );
}

function GratitudeCard({ entry, setEntry, onSave, entries }: {
  entry: string; setEntry: (v: string) => void; onSave: () => void;
  entries: { id: string; entry: string; log_date: string }[];
}) {
  const prompt = GRATITUDE_PROMPTS[dayIndex(GRATITUDE_PROMPTS.length)];
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="size-5 text-primary" /> Gratitude journal</h2>
      <p className="mt-1 text-sm text-muted-foreground">{prompt}</p>
      <Textarea value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Today I'm grateful for…" className="mt-3" rows={3} />
      <Button className="mt-3" disabled={!entry.trim()} onClick={onSave}>Save note</Button>
      <div className="mt-5 space-y-2">
        {entries.map((g) => (
          <div key={g.id} className="rounded-xl border border-border px-4 py-3 text-sm">
            <p>{g.entry}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(g.log_date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PuzzleCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const puzzle = useState(() => puzzleOfTheDay())[0];
  const [grid, setGrid] = useState<(number | null)[][]>(puzzle.type === "sudoku" ? puzzle.grid.map((r) => [...r]) : []);
  const [text, setText] = useState("");
  const [solved, setSolved] = useState(false);

  const checkSudoku = () => {
    if (puzzle.type !== "sudoku") return;
    const ok = grid.every((row, r) => row.every((v, c) => v === puzzle.solution[r][c]));
    if (ok) {
      setSolved(true);
      reward("puzzle", "Puzzle of the day");
    } else toast.error("Not quite — check rows and columns for repeats.");
  };

  const checkAnswer = () => {
    if (puzzle.type === "unscramble" && text.trim().toUpperCase() === puzzle.answer) {
      setSolved(true);
      reward("puzzle", "Puzzle of the day");
    } else if (puzzle.type === "sequence" && Number(text.trim()) === puzzle.answer) {
      setSolved(true);
      reward("puzzle", "Puzzle of the day");
    } else toast.error("Try again!");
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">Puzzle of the day</h2>
      {solved ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          <PartyPopper className="size-4" /> Solved! Great work keeping that mind sharp.
        </p>
      ) : puzzle.type === "sudoku" ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Fill 1–4 so no row or column repeats.</p>
          <div className="mx-auto mt-4 grid w-fit grid-cols-4 gap-1">
            {grid.map((row, r) =>
              row.map((v, c) => (
                <input
                  key={`${r}-${c}`}
                  value={v ?? ""}
                  disabled={puzzle.grid[r][c] !== null}
                  onChange={(e) => {
                    const n = Number(e.target.value.slice(-1));
                    if (n >= 1 && n <= 4) {
                      const next = grid.map((row2) => [...row2]);
                      next[r][c] = n;
                      setGrid(next);
                    } else if (e.target.value === "") {
                      const next = grid.map((row2) => [...row2]);
                      next[r][c] = null;
                      setGrid(next);
                    }
                  }}
                  className={`size-10 rounded border text-center font-semibold ${puzzle.grid[r][c] !== null ? "bg-muted" : "bg-background"}`}
                />
              )),
            )}
          </div>
          <Button className="mt-4" onClick={checkSudoku}>Check</Button>
        </>
      ) : puzzle.type === "unscramble" ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Unscramble this health word:</p>
          <p className="mt-2 text-center font-display text-3xl font-bold tracking-widest">{puzzle.scrambled}</p>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" className="mx-auto mt-4 max-w-xs" />
          <Button className="mt-3" onClick={checkAnswer}>Check</Button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">What comes next in the pattern?</p>
          <p className="mt-2 text-center font-display text-2xl font-bold">{puzzle.sequence.join(", ")}, ?</p>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" className="mx-auto mt-4 max-w-xs" />
          <Button className="mt-3" onClick={checkAnswer}>Check</Button>
        </>
      )}
    </section>
  );
}

function AffirmationCard({ reward }: { reward: (k: string, l: string) => Promise<void> }) {
  const list = useState(() => affirmationsForToday())[0];
  const [idx, setIdx] = useState(0);
  const [favourites, setFavourites] = useState<Set<number>>(new Set());
  const [rewarded, setRewarded] = useState(false);

  const next = () => {
    setIdx((i) => (i + 1) % list.length);
    if (!rewarded) {
      setRewarded(true);
      reward("affirmation", "Today's affirmation");
    }
  };

  return (
    <section className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground shadow-card">
      <h2 className="font-display text-lg font-semibold">Today's affirmation</h2>
      <p className="mt-6 text-center font-display text-2xl font-bold leading-snug">{list[idx]}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={next}>Next affirmation</Button>
        <button
          onClick={() => setFavourites((s) => new Set(s).add(idx))}
          className="flex size-9 items-center justify-center rounded-full bg-white/20"
        >
          <Heart className={`size-4 ${favourites.has(idx) ? "fill-current" : ""}`} />
        </button>
      </div>
    </section>
  );
}

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

  const reward = useReward(fnComplete, refresh);

  const pickMood = async (level: number) => {
    setSelected(level);
    try {
      await fnMood({ data: { level } });
      await reward("mood", "Mood check-in");
    } catch (e) {
      toastServerError(e);
    }
  };

  const addGratitude = async () => {
    try {
      await fnGratitude({ data: { entry } });
      setEntry("");
      await reward("gratitude", "Gratitude note");
      toast.success("Saved to your journal.");
    } catch (e) {
      toastServerError(e);
    }
  };

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
            <p className="text-sm text-muted-foreground">Six tools for anxiety, depression and daily mental wellness</p>
          </div>
        </div>

        <MeditationCard reward={reward} />
        <BoxBreathingCard reward={reward} />
        <MoodCard selected={selected} onPick={pickMood} doctorLink="/doctors/amit-verma" />
        <GratitudeCard entry={entry} setEntry={setEntry} onSave={addGratitude} entries={data?.gratitude ?? []} />
        <PuzzleCard reward={reward} />
        <AffirmationCard reward={reward} />

        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          Nirogi is not a mental-health service. If you feel hopeless or think about harming yourself, call Tele-MANAS 14416
          (India, 24×7) or your local emergency number right away.
        </p>
      </div>
    </SiteLayout>
  );
}
