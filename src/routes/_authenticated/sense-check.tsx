import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Ear, Mic, Volume2, Loader2, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { runTool } from "@/lib/health-tools.functions";
import type { ToolResult } from "@/lib/health-tools.server";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { toastServerError } from "@/lib/errors";
import { AiResultPanel } from "@/components/tools/AiResultPanel";
import { ClinicalDisclaimer } from "@/components/site/ClinicalDisclaimer";
import { getTool } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/sense-check")({
  head: () => ({ meta: [{ title: "SenseCheck · Nirogi" }] }),
  component: SenseCheckPage,
});

const QUESTIONS: { key: string; prompt: string }[] = [
  { key: "vision_symptoms", prompt: "Let's start with your vision. Do things look blurry far away or up close? Any strain, floaters, or trouble seeing at night?" },
  { key: "hearing_symptoms", prompt: "Now your hearing. Do you hear ringing, muffled sounds, or struggle to follow talk in noisy places?" },
];

function SenseCheckPage() {
  const { memberId } = useActiveMember();
  const { lang } = useI18n();
  const run = useServerFn(runTool);
  const tool = getTool("sensecheck")!;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);

  const q = QUESTIONS[step];

  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* TTS unavailable */ }
  };

  const startVoice = () => {
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input isn't supported in this browser. Please type your answer."); return; }
    // @ts-expect-error browser speech API
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const text = e.results[0][0].transcript;
      setAnswers((a) => ({ ...a, [q.key]: ((a[q.key] ?? "") + " " + text).trim() }));
    };
    rec.onerror = () => toast.error("Couldn't capture audio. Try again or type.");
    rec.start();
    toast.info("Listening… speak now.");
  };

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await run({
        data: { tool: "sensecheck", fields: answers, image: null, file: null, fileName: null, lang, memberId },
      });
      setResult(res as ToolResult);
      toast.success("Assessment ready.");
    } catch (e) {
      toastServerError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-success/10 text-success"><Ear className="size-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-bold">SenseCheck</h1>
            <p className="text-sm text-muted-foreground">Voice-guided vision & hearing check</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Step {step + 1} of {QUESTIONS.length}</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">{q.prompt}</h2>
              <button onClick={() => speak(q.prompt)} aria-label="Read question aloud" className="shrink-0 rounded-lg p-1.5 text-primary hover:bg-primary/10">
                <Volume2 className="size-5" />
              </button>
            </div>
            <Textarea
              className="mt-4"
              rows={4}
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
              placeholder="Speak or type your answer…"
            />
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" onClick={startVoice}><Mic className="size-4" /> Speak</Button>
              {step < QUESTIONS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="ml-auto">Next <ChevronRight className="size-4" /></Button>
              ) : (
                <Button onClick={submit} disabled={loading} className="ml-auto">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null} Run SenseCheck
                </Button>
              )}
            </div>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">← Previous question</button>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Result</h2>
            {!result && !loading && (
              <p className="mt-6 text-sm text-muted-foreground">Answer both questions, then run SenseCheck. Your assessment appears here.</p>
            )}
            {loading && (
              <div className="mt-10 flex flex-col items-center text-center text-muted-foreground">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="mt-3 text-sm">Analyzing your answers…</p>
              </div>
            )}
            {result && <div className="mt-5"><AiResultPanel result={result} toolName="SenseCheck" /></div>}
          </section>
        </div>

        <div className="mt-6">
          <ClinicalDisclaimer tool={tool} />
        </div>
      </div>
    </SiteLayout>
  );
}
