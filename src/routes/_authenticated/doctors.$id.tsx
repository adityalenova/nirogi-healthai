import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, Coins, Mic, Phone, PhoneOff, MessageSquare, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getDoctor, CREDIT_COST } from "@/lib/doctors";
import { getCredits, getDoctorChat, sendDoctorMessage, speakLine } from "@/lib/doctor.functions";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/doctors/$id")({
  head: () => ({ meta: [{ title: "AI Doctor Consultation · Nirogi" }] }),
  component: DoctorPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Doctor not found</h1>
        <Link to="/dashboard" className="mt-4 inline-block text-primary underline">Back to dashboard</Link>
      </div>
    </SiteLayout>
  ),
});

type Msg = { role: "user" | "assistant"; content: string };

const accentText: Record<string, string> = {
  primary: "text-primary", pulse: "text-pulse", success: "text-success", warning: "text-warning",
};

function DoctorPage() {
  const { id } = useParams({ from: "/_authenticated/doctors/$id" });
  const doctor = getDoctor(id);
  const { lang } = useI18n();

  const creditsFn = useServerFn(getCredits);
  const historyFn = useServerFn(getDoctorChat);
  const sendFn = useServerFn(sendDoctorMessage);
  const speakFn = useServerFn(speakLine);

  const [balance, setBalance] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"chat" | "call">("chat");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!doctor) return;
    creditsFn().then((r) => setBalance(r.balance)).catch(() => {});
    historyFn({ data: { doctorId: doctor.id } })
      .then((r) => setMessages(r.messages as Msg[]))
      .catch(() => {});
  }, [doctor?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!doctor) return null;
  const Icon = doctor.icon;

  const playAudio = (dataUrl: string | null) => {
    if (!dataUrl) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = dataUrl;
    setSpeaking(true);
    audioRef.current.onended = () => setSpeaking(false);
    audioRef.current.play().catch(() => setSpeaking(false));
  };

  const send = async (text: string, voice: boolean) => {
    const msg = text.trim();
    if (!msg || sending) return;
    if (balance != null && balance < (voice ? 3 : CREDIT_COST.chat)) {
      toast.error("You're out of credits. Earn more by using your health tools!");
      return;
    }
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await sendFn({
        data: { doctorId: doctor.id, message: msg, system: doctor.system, voice, voiceId: doctor.voiceId, lang },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      setBalance(res.balance);
      if (voice) playAudio(res.audio);
    } catch (e) {
      const em = e instanceof Error ? e.message : "";
      if (em.includes("INSUFFICIENT_CREDITS")) toast.error("You're out of credits.");
      else if (em.includes("RATE_LIMIT")) toast.error("Too many requests — try again shortly.");
      else if (em.includes("CREDITS_EXHAUSTED")) toast.error("AI usage limit reached.");
      else toast.error("Couldn't reach the doctor. Please try again.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const startCall = async () => {
    setMode("call");
    if (messages.length === 0) {
      try {
        const r = await speakFn({ data: { text: doctor.greeting, voiceId: doctor.voiceId } });
        setMessages([{ role: "assistant", content: doctor.greeting }]);
        playAudio(r.audio);
      } catch {
        setMessages([{ role: "assistant", content: doctor.greeting }]);
      }
    }
  };

  const listen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input isn't supported on this browser. Try typing instead."); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      setListening(false);
      send(transcript, true);
    };
    rec.onerror = () => { setListening(false); toast.error("Couldn't hear you clearly. Try again."); };
    rec.onend = () => setListening(false);
    rec.start();
  };

  const endCall = () => {
    setMode("chat");
    recognitionRef.current?.stop?.();
    audioRef.current?.pause?.();
    setSpeaking(false);
    setListening(false);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold">
            <Coins className="size-4 text-warning" /> {balance ?? "…"} credits
          </span>
        </div>

        {/* Avatar header */}
        <div className="mt-6 flex flex-col items-center text-center">
          <motion.div
            className={cn("relative flex size-32 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-elegant", doctor.gradient)}
            animate={speaking ? { scale: [1, 1.06, 1] } : { scale: [1, 1.02, 1] }}
            transition={{ duration: speaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="size-14" />
            {speaking && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-white/60"
                animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
          <h1 className="mt-4 font-display text-2xl font-bold">{doctor.name}</h1>
          <p className={cn("text-sm font-semibold", accentText[doctor.accent])}>{doctor.specialty}</p>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">{doctor.bio}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {doctor.tools.map((tl) => (
              <span key={tl} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                <Sparkles className="size-3" /> {tl}
              </span>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant={mode === "chat" ? "default" : "outline"} size="sm" onClick={() => setMode("chat")}>
            <MessageSquare className="size-4" /> Chat
          </Button>
          {mode === "call" ? (
            <Button variant="destructive" size="sm" onClick={endCall}>
              <PhoneOff className="size-4" /> End call
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={startCall}>
              <Phone className="size-4" /> Voice call
            </Button>
          )}
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="mt-5 max-h-[46vh] space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-card">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{doctor.greeting}</p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}>
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2.5"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
            </div>
          )}
        </div>

        {/* Composer */}
        {mode === "chat" ? (
          <div className="mt-4 flex items-end gap-2">
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input, false); } }}
              placeholder={`Ask ${doctor.name.split(" ")[1]} anything…`}
              className="flex-1"
            />
            <Button onClick={() => send(input, false)} disabled={sending || !input.trim()} className="h-auto py-3">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button
              size="lg"
              onClick={listen}
              disabled={sending || speaking || listening}
              className={cn("rounded-full", listening && "animate-pulse")}
            >
              <Mic className="size-5" /> {listening ? "Listening…" : speaking ? "Doctor is speaking…" : "Tap and speak"}
            </Button>
            <p className="text-[11px] text-muted-foreground">Voice replies cost 3 credits each · {CREDIT_COST.voicePerMin} credits/min guidance</p>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          AI doctors are educational assistants, not real doctors. Always consult a qualified healthcare professional.
        </p>
      </div>
    </SiteLayout>
  );
}
