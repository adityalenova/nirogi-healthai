import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Wind, Play, Square, Music, Volume2, VolumeX, Repeat, ExternalLink, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getBreathing, logBreathing } from "@/lib/wellness.functions";
import { useActiveMember } from "@/lib/active-member";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/breathe")({
  head: () => ({ meta: [{ title: "Guided Breathing · Nirogi" }] }),
  component: BreathePage,
});

type Phase = { key: "inhale" | "hold" | "exhale" | "hold2"; label: string; sec: number };

const TECHNIQUES: Record<string, { name: string; desc: string; phases: Phase[] }> = {
  box: {
    name: "Box Breathing",
    desc: "Calm focus — used by athletes and forces. 4-4-4-4.",
    phases: [
      { key: "inhale", label: "Breathe in", sec: 4 },
      { key: "hold", label: "Hold", sec: 4 },
      { key: "exhale", label: "Breathe out", sec: 4 },
      { key: "hold2", label: "Hold", sec: 4 },
    ],
  },
  relax: {
    name: "4-7-8 Relaxing",
    desc: "Eases anxiety and helps you fall asleep.",
    phases: [
      { key: "inhale", label: "Breathe in", sec: 4 },
      { key: "hold", label: "Hold", sec: 7 },
      { key: "exhale", label: "Breathe out", sec: 8 },
    ],
  },
  coherent: {
    name: "Coherent Breathing",
    desc: "Balances heart-rate variability. 5-5.",
    phases: [
      { key: "inhale", label: "Breathe in", sec: 5 },
      { key: "exhale", label: "Breathe out", sec: 5 },
    ],
  },
};

/** Built-in copyright-free ambient tones, synthesized with the Web Audio API (no external audio files). */
type AmbientTrack = {
  id: string;
  name: string;
  desc: string;
  /** Base frequencies (Hz) layered as soft sine/triangle drones — a generative calm pad, not a sample. */
  freqs: number[];
  wave: OscillatorType;
};

const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: "none", name: "No music", desc: "Just the breathing cues", freqs: [], wave: "sine" },
  { id: "ocean", name: "Ocean Drone", desc: "Deep, slow sine pad", freqs: [110, 165, 220], wave: "sine" },
  { id: "forest", name: "Forest Hum", desc: "Warm triangle tones", freqs: [130.8, 196, 261.6], wave: "triangle" },
  { id: "om", name: "Om Resonance", desc: "Meditative low drone", freqs: [98, 147, 196], wave: "sine" },
];

const SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u"; // Peaceful Meditation (official Spotify)
const YOUTUBE_MUSIC_URL = "https://music.youtube.com/playlist?list=RDCLAK5uy_lfNJgYW8VgYQtnnACbHmZQ2wnUKA-QNsY"; // Calm Meditation Music
const YOUTUBE_EMBED_ID = "1ZYbU82GVz4"; // Relaxing ambient meditation music, royalty-free, embeddable

function useAmbientAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const [trackId, setTrackId] = useState("none");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [loop, setLoop] = useState(true);

  const stopNodes = () => {
    nodesRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime ?? 0) + 0.4);
        osc.stop((ctxRef.current?.currentTime ?? 0) + 0.5);
      } catch {
        /* already stopped */
      }
    });
    nodesRef.current = [];
  };

  const start = (id: string) => {
    const track = AMBIENT_TRACKS.find((t) => t.id === id);
    if (!track || track.freqs.length === 0) {
      stopNodes();
      setPlaying(false);
      return;
    }
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    stopNodes();

    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    nodesRef.current = track.freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = track.wave;
      osc.frequency.value = f;
      // gentle slow LFO-like detune per layer for a "living" ambient pad
      osc.detune.value = i * 3;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      gain.gain.linearRampToValueAtTime(1 / track.freqs.length, ctx.currentTime + 1.2);
      return { osc, gain };
    });
    setPlaying(true);
  };

  const stop = () => {
    stopNodes();
    setPlaying(false);
  };

  useEffect(() => {
    if (masterGainRef.current) masterGainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      stopNodes();
      ctxRef.current?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTrack = (id: string) => {
    setTrackId(id);
    if (playing || id !== "none") start(id);
    if (id === "none") stop();
  };

  return { trackId, selectTrack, playing, start, stop, volume, setVolume, loop, setLoop };
}

function BreathePage() {
  const { memberId } = useActiveMember();
  const qc = useQueryClient();
  const getData = useServerFn(getBreathing);
  const log = useServerFn(logBreathing);

  const { data } = useQuery({ queryKey: ["breathing", memberId], queryFn: () => getData({ data: { memberId } }) });

  const [techKey, setTechKey] = useState<keyof typeof TECHNIQUES>("box");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const startedAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const music = useAmbientAudio();
  const [showYoutubeEmbed, setShowYoutubeEmbed] = useState(false);

  const tech = TECHNIQUES[techKey];
  const phase = tech.phases[phaseIdx];

  useEffect(() => {
    if (!running) return;
    setCount(phase.sec);
    let remaining = phase.sec;
    timer.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        setPhaseIdx((i) => {
          const next = (i + 1) % tech.phases.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
      }
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIdx, techKey]);

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    setCycles(0);
    startedAt.current = Date.now();
    // Music keeps playing across breathing rounds — only (re)start it if it isn't already running.
    if (music.trackId !== "none" && !music.playing) music.start(music.trackId);
  };

  const stop = async () => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    const duration = Math.round((Date.now() - startedAt.current) / 1000);
    if (duration >= 10) {
      try {
        await log({ data: { memberId, technique: tech.name, duration_sec: duration, cycles } });
        toast.success(`Nice — ${cycles} cycles, ${Math.round(duration / 60)} min logged.`);
        qc.invalidateQueries({ queryKey: ["breathing", memberId] });
      } catch (e) {
        toastServerError(e);
      }
    }
    setPhaseIdx(0);
    setCycles(0);
    // Music intentionally keeps playing after the session ends unless the user stops it manually.
  };

  const scale = phase?.key === "inhale" ? 1.35 : phase?.key === "exhale" ? 0.75 : phase?.key.startsWith("hold") ? (phaseIdx <= 1 ? 1.35 : 0.75) : 1;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Wind className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">Guided Breathing</h1>
            <p className="text-sm text-muted-foreground">Slow your heart, calm your mind</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(TECHNIQUES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { if (!running) setTechKey(k as keyof typeof TECHNIQUES); }}
              disabled={running}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                techKey === k ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
              } ${running ? "opacity-50" : ""}`}
            >
              {v.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{tech.desc}</p>

        <div className="mt-8 flex flex-col items-center">
          <div className="relative flex size-64 items-center justify-center">
            <motion.div
              animate={{ scale: running ? scale : 1 }}
              transition={{ duration: running ? count || 1 : 0.5, ease: "easeInOut" }}
              className="absolute size-56 rounded-full bg-gradient-primary opacity-20"
            />
            <motion.div
              animate={{ scale: running ? scale : 1 }}
              transition={{ duration: running ? count || 1 : 0.5, ease: "easeInOut" }}
              className="absolute size-40 rounded-full bg-gradient-primary opacity-40"
            />
            <div className="z-10 text-center text-primary-foreground">
              <p className="font-display text-lg font-bold text-primary">{running ? phase.label : "Ready"}</p>
              {running && <p className="font-display text-5xl font-extrabold text-primary">{count}</p>}
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{running ? `Cycle ${cycles + 1}` : "Press start when you're ready"}</p>
          <div className="mt-4">
            {running ? (
              <Button onClick={stop} variant="destructive" size="lg"><Square className="size-4" /> Finish</Button>
            ) : (
              <Button onClick={start} size="lg"><Play className="size-4" /> Start session</Button>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Today" value={`${Math.round((data?.todaySec ?? 0) / 60)} min`} />
          <Stat label="Sessions (7d)" value={String(data?.weekSessions ?? 0)} />
          <Stat label="Technique" value={tech.name} />
        </div>

        {/* Music picker */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Music className="size-5 text-primary" /> Background music
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ambient sound plays continuously through your breathing rounds — start it once and it keeps going.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {AMBIENT_TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => music.selectTrack(t.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  music.trackId === t.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => (music.playing ? music.stop() : music.start(music.trackId))}
              disabled={music.trackId === "none"}
            >
              {music.playing ? <Square className="size-4" /> : <Play className="size-4" />}
              {music.playing ? "Pause music" : "Play music"}
            </Button>

            <button
              onClick={() => music.setLoop((l) => !l)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                music.loop ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
              title="Music loops continuously across breathing rounds"
            >
              <Repeat className="size-3.5" /> {music.loop ? "Looping on" : "Looping off"}
            </button>

            <div className="flex items-center gap-2">
              {music.volume === 0 ? <VolumeX className="size-4 text-muted-foreground" /> : <Volume2 className="size-4 text-muted-foreground" />}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={music.volume}
                onChange={(e) => music.setVolume(parseFloat(e.target.value))}
                className="w-32 accent-primary"
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prefer your own playlist?</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={SPOTIFY_PLAYLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted/50"
              >
                <SpotifyIcon className="size-5" /> Open Peaceful Meditation on Spotify
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
              <a
                href={YOUTUBE_MUSIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted/50"
              >
                <YouTubeMusicIcon className="size-5" /> Open Calm playlist on YouTube Music
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
              <Button size="sm" variant="outline" onClick={() => setShowYoutubeEmbed((v) => !v)}>
                <Youtube className="size-4" /> {showYoutubeEmbed ? "Hide" : "Play"} YouTube video here
              </Button>
            </div>

            {showYoutubeEmbed && (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border">
                <iframe
                  className="size-full"
                  src={`https://www.youtube.com/embed/${YOUTUBE_EMBED_ID}?autoplay=0&loop=1&playlist=${YOUTUBE_EMBED_ID}`}
                  title="Calm meditation music"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Official Spotify brand mark in official brand green (#1DB954). */
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path
        d="M17.2 16.6c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.3.1-.7-.1-.8-.5-.1-.3.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.3.4-.8.5-1.1.3-2.9-1.8-7.3-2.3-10.7-1.3-.4.1-.8-.1-1-.5-.1-.4.1-.8.5-1 3.9-1.2 8.7-.6 12 1.4.4.2.5.7.3 1.1zm.1-2.8C15.4 9 8.9 8.8 5.6 9.8c-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 3.8-1.1 10.9-.9 15.1 1.6.4.3.6.9.3 1.3-.3.4-.9.5-1.3.2z"
        fill="#fff"
      />
    </svg>
  );
}

/** Official YouTube Music brand mark (red gradient disc). */
function YouTubeMusicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#FF0000" />
      <circle cx="12" cy="12" r="6.5" fill="#fff" />
      <circle cx="12" cy="12" r="2.2" fill="#FF0000" />
      <path d="M10.4 9.3v5.4l4.6-2.7-4.6-2.7z" fill="#FF0000" />
    </svg>
  );
}
