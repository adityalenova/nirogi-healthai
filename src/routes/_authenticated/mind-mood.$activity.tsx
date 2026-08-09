import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Pause, Check, Heart, RotateCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { completeWellnessActivity, saveGratitude } from "@/lib/mindful.functions";
import { toastServerError } from "@/lib/errors";
import {
  getActivity,
  MEDITATION_SCRIPT,
  BOX_LABELS,
  wordsForToday,
  scramble,
  GRATITUDE_PROMPTS,
  affirmationsForToday,
  sudokuForToday,
  TAP_DOT_SCIENCE,
  seededShuffle,
  markCompleted,
  addLocalGratitudeEntry,
  getSavedAffirmations,
  saveAffirmation,
} from "@/lib/mind-games";

export const Route = createFileRoute("/_authenticated/mind-mood/$activity")({
  beforeLoad: ({ params }) => {
    if (!getActivity(params.activity)) throw notFound();
  },
  head: ({ params }) => {
    const a = getActivity(params.activity);
    return {
      meta: [
        { title: `${a?.name ?? "Activity"} · Mind & Mood · Nirogi` },
        { name: "description", content: a?.description ?? "Calm your mind with Nirogi's daily mind & mood activities." },
        { property: "og:title", content: `${a?.name ?? "Mind & Mood"} · Nirogi` },
        { property: "og:description", content: a?.description ?? "Calm your mind with Nirogi's daily mind & mood activities." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: MindActivity,
});

function MindActivity() {
  const { activity } = Route.useParams();
  const meta = getActivity(activity)!;
  const qc = useQueryClient();
  const fnComplete = useServerFn(completeWellnessActivity);
  const [done, setDone] = useState(false);

  const finish = async () => {
    if (done) return;
    setDone(true);
    markCompleted(activity);
    try {
      const res = await fnComplete({ data: { key: `mind:${activity}`, label: meta.name } });
      if (res.credited > 0) toast.success(`+${res.credited} credits — ${meta.name} done for today.`);
      else toast.success(`${meta.name} complete.`);
      qc.invalidateQueries({ queryKey: ["wellness-day"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    } catch (err) {
      toastServerError(err);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link to="/mind-mood" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Mind &amp; Mood
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-2xl font-bold">{meta.name}</h1>
          <p className="text-sm text-muted-foreground">{meta.description} · {meta.time}</p>
        </div>

        <section className="mt-6 rounded-2xl border border-border p-6 shadow-card" style={{ background: meta.gradient }}>
          {activity === "meditation" && <Meditation onDone={finish} />}
          {activity === "breathing" && <BoxBreathing onDone={finish} />}
          {activity === "memory" && <MemoryMatch onDone={finish} />}
          {activity === "sudoku" && <Sudoku onDone={finish} />}
          {activity === "unscramble" && <Unscramble onDone={finish} />}
          {activity === "tap-dot" && <TapDot onDone={finish} />}
          {activity === "gratitude" && <Gratitude onDone={finish} />}
          {activity === "affirmations" && <Affirmations onDone={finish} />}
        </section>

        {done && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-success">
            <Check className="size-4" /> Completed for today
          </p>
        )}
      </div>
    </SiteLayout>
  );
}

/* ---------------- Guided meditation ---------------- */
function Meditation({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  const speak = (line: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(line);
    u.rate = 0.85;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const toggle = () => {
    if (playing) {
      if (ref.current) clearInterval(ref.current);
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(MEDITATION_SCRIPT[i]);
    ref.current = setInterval(() => {
      setI((n) => {
        const next = n + 1;
        if (next >= MEDITATION_SCRIPT.length) {
          if (ref.current) clearInterval(ref.current);
          setPlaying(false);
          onDone();
          return n;
        }
        speak(MEDITATION_SCRIPT[next]);
        return next;
      });
    }, 15000);
  };

  const pct = Math.round(((i + 1) / MEDITATION_SCRIPT.length) * 100);

  return (
    <div className="text-center">
      <motion.div
        animate={{ scale: playing ? [1, 1.12, 1] : 1 }}
        transition={{ duration: 6, repeat: playing ? Infinity : 0, ease: "easeInOut" }}
        className="mx-auto size-32 rounded-full bg-primary/20 ring-8 ring-primary/10"
      />
      <p className="mx-auto mt-6 min-h-[3.5rem] max-w-md text-base leading-relaxed">{MEDITATION_SCRIPT[i]}</p>
      <div className="mx-auto mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <Button className="mt-5" onClick={toggle}>
        {playing ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Play</>}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">Step {i + 1} of {MEDITATION_SCRIPT.length} · voice guided</p>
    </div>
  );
}

/* ---------------- Box breathing ---------------- */
function BoxBreathing({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setPhase((p) => {
        const next = (p + 1) % 4;
        if (next === 0) {
          setCycles((c) => {
            const nc = c + 1;
            if (nc >= 8) {
              setRunning(false);
              onDone();
            }
            return nc;
          });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [running, onDone]);

  const scale = phase === 0 ? 1.25 : phase === 2 ? 0.85 : 1.05;

  return (
    <div className="text-center">
      <motion.div
        animate={{ scale: running ? scale : 1 }}
        transition={{ duration: 4, ease: "easeInOut" }}
        className="mx-auto flex size-40 items-center justify-center rounded-3xl bg-primary/20 ring-8 ring-primary/10"
      >
        <span className="font-display text-lg font-bold">{BOX_LABELS[phase]}</span>
      </motion.div>
      <p className="mt-4 text-sm text-muted-foreground">4 seconds each side · {cycles} of 8 cycles</p>
      <Button className="mt-4" onClick={() => setRunning((r) => !r)}>
        {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
      </Button>
    </div>
  );
}

/* ---------------- Memory match ---------------- */
const EMOJIS = ["🫀", "🧠", "🌿", "💧", "🍎", "🧘", "😴", "☀️"];

function MemoryMatch({ onDone }: { onDone: () => void }) {
  const deck = useMemo(() => seededShuffle([...EMOJIS, ...EMOJIS], Date.now() % 10000), []);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    setMoves((m) => m + 1);
    const t = setTimeout(() => {
      if (deck[a] === deck[b]) {
        setMatched((prev) => {
          const next = [...prev, a, b];
          if (next.length === deck.length) onDone();
          return next;
        });
      }
      setFlipped([]);
    }, 700);
    return () => clearTimeout(t);
  }, [flipped, deck, onDone]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {deck.map((e, i) => {
          const show = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              onClick={() => !show && flipped.length < 2 && setFlipped((f) => [...f, i])}
              className={`flex aspect-square items-center justify-center rounded-xl border text-2xl transition-colors ${
                show ? "border-primary bg-card" : "border-border bg-muted"
              }`}
            >
              {show ? e : ""}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {matched.length / 2} of {EMOJIS.length} pairs · {moves} moves
      </p>
    </div>
  );
}

/* ---------------- Daily sudoku 4x4 ---------------- */
function Sudoku({ onDone }: { onDone: () => void }) {
  const { grid, solution } = useMemo(() => sudokuForToday(), []);
  const [cells, setCells] = useState<(number | null)[][]>(grid.map((r) => [...r]));

  const check = (next: (number | null)[][]) => {
    if (next.every((row, r) => row.every((v, c) => v === solution[r][c]))) {
      toast.success("Solved! Nice logic work.");
      onDone();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-4 gap-1">
        {cells.map((row, r) =>
          row.map((v, c) => {
            const fixed = grid[r][c] !== null;
            return (
              <button
                key={`${r}-${c}`}
                disabled={fixed}
                onClick={() => {
                  const next = cells.map((rr) => [...rr]);
                  const cur = next[r][c] ?? 0;
                  next[r][c] = cur >= 4 ? null : cur + 1;
                  setCells(next);
                  check(next);
                }}
                className={`flex size-14 items-center justify-center rounded-lg border font-display text-xl font-bold ${
                  fixed ? "border-border bg-muted text-muted-foreground" : "border-primary/40 bg-card"
                } ${(r < 2) === (c < 2) ? "" : "opacity-95"}`}
              >
                {v ?? ""}
              </button>
            );
          }),
        )}
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">Tap a cell to cycle 1-4. Each row, column and 2x2 box needs 1-4 once.</p>
      <Button variant="outline" className="mt-3" onClick={() => setCells(grid.map((r) => [...r]))}>
        <RotateCw className="size-4" /> Reset
      </Button>
    </div>
  );
}

/* ---------------- Word unscramble ---------------- */
function Unscramble({ onDone }: { onDone: () => void }) {
  const words = useMemo(() => wordsForToday(), []);
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const item = words[idx];
  const puzzle = useMemo(() => scramble(item.word, idx + 7), [item.word, idx]);

  const submit = () => {
    if (guess.trim().toLowerCase() === item.word.toLowerCase()) {
      setRevealed(true);
    } else {
      toast.error("Not quite — try again.");
    }
  };

  const next = () => {
    if (idx + 1 >= words.length) {
      onDone();
      return;
    }
    setIdx(idx + 1);
    setGuess("");
    setRevealed(false);
  };

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Word {idx + 1} of {words.length}</p>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-[0.3em]">{puzzle.toUpperCase()}</p>
      {!revealed ? (
        <>
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Your answer"
            aria-label="Your answer"
            className="mt-5 w-full max-w-xs rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm"
          />
          <div className="mt-3 flex justify-center gap-2">
            <Button onClick={submit}>Check</Button>
            <Button variant="outline" onClick={() => setRevealed(true)}>Reveal</Button>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <p className="font-display text-xl font-bold text-primary">{item.word}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.definition}</p>
          <p className="mx-auto mt-3 max-w-md rounded-xl bg-card/70 p-3 text-sm">{item.fact}</p>
          <Button className="mt-4" onClick={next}>{idx + 1 >= words.length ? "Finish" : "Next word"}</Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Tap the dot ---------------- */
function TapDot({ onDone }: { onDone: () => void }) {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState({ x: 40, y: 40 });

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, onDone]);

  const move = () => setPos({ x: Math.random() * 80 + 5, y: Math.random() * 75 + 5 });
  const size = Math.max(26, 60 - score * 1.5);

  return (
    <div className="text-center">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>Score: {score}</span>
        <span>{left}s</span>
      </div>
      <div className="relative mt-3 h-64 overflow-hidden rounded-2xl border border-border bg-card">
        {running && (
          <button
            onClick={() => { setScore((s) => s + 1); move(); }}
            aria-label="Tap the dot"
            className="absolute rounded-full bg-primary shadow-lg transition-all"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size }}
          />
        )}
        {!running && (
          <div className="flex h-full items-center justify-center">
            <Button onClick={() => { setScore(0); setLeft(30); setRunning(true); move(); }}>
              <Play className="size-4" /> {left === 0 ? "Play again" : "Start 30 seconds"}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{TAP_DOT_SCIENCE}</p>
    </div>
  );
}

/* ---------------- Gratitude journal ---------------- */
function Gratitude({ onDone }: { onDone: () => void }) {
  const prompts = useMemo(() => GRATITUDE_PROMPTS.slice(new Date().getDate() % 5).slice(0, 3), []);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const fnSave = useServerFn(saveGratitude);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (answers.some((a) => !a.trim())) {
      toast.error("Answer all three prompts first.");
      return;
    }
    setSaving(true);
    try {
      addLocalGratitudeEntry(answers);
      await fnSave({ data: { entry: prompts.map((p, i) => `${p}\n${answers[i]}`).join("\n\n") } });
      onDone();
    } catch (err) {
      toastServerError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {prompts.map((p, i) => (
        <div key={p}>
          <label className="text-sm font-semibold">{p}</label>
          <Textarea
            className="mt-1.5 bg-card"
            rows={2}
            value={answers[i]}
            onChange={(e) => setAnswers((a) => a.map((v, n) => (n === i ? e.target.value : v)))}
          />
        </div>
      ))}
      <Button className="w-full" onClick={save} disabled={saving}>
        <Heart className="size-4" /> Save today&apos;s gratitude
      </Button>
    </div>
  );
}

/* ---------------- Affirmation cards ---------------- */
function Affirmations({ onDone }: { onDone: () => void }) {
  const cards = useMemo(() => affirmationsForToday(), []);
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState<string[]>(() => getSavedAffirmations());

  return (
    <div className="text-center">
      <motion.div
        key={i}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="mx-auto flex min-h-40 max-w-md items-center justify-center rounded-2xl border border-border bg-card p-6"
      >
        <p className="font-display text-lg font-semibold leading-relaxed">{cards[i]}</p>
      </motion.div>

      <div className="mt-4 flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            saveAffirmation(cards[i]);
            setSaved(getSavedAffirmations());
            toast.success("Saved to your favourites.");
          }}
        >
          <Sparkles className="size-4" /> Save
        </Button>
        <Button
          onClick={() => {
            if (i + 1 >= cards.length) onDone();
            else setI(i + 1);
          }}
        >
          {i + 1 >= cards.length ? "Finish" : "Next"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{i + 1} of {cards.length} · {saved.length} saved favourites</p>
    </div>
  );
}
