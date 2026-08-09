import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Globe, Loader2, ExternalLink, AlertTriangle, Stethoscope } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askHealthBrowser, type BrowserSource } from "@/lib/browser.functions";
import { INSTITUTIONS, SUGGESTED_QUESTIONS } from "@/lib/knowledge";
import { toastServerError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/health-browser")({
  head: () => ({
    meta: [
      { title: "AI Health Browser · Nirogi" },
      { name: "description", content: "Ask any health question and get an AI answer backed by 50 of the world's top medical institutions." },
      { property: "og:title", content: "AI Health Browser · Nirogi" },
      { property: "og:description", content: "Medical research assistant with cited sources from Harvard, WHO, Mayo Clinic, AIIMS and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HealthBrowser,
});

type Turn = { role: "user" | "assistant"; content: string; sources?: BrowserSource[] };

function sourceUrl(name: string) {
  const hit = INSTITUTIONS.find((i) => i.name.toLowerCase().includes(name.toLowerCase().slice(0, 12)));
  return hit?.url ?? `https://www.google.com/search?q=${encodeURIComponent(name)}`;
}

function HealthBrowser() {
  const ask = useServerFn(askHealthBrowser);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  const submit = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await ask({ data: { question: q, history } });
      setTurns((prev) => [...prev, { role: "assistant", content: res.message, sources: res.sources }]);
    } catch (err) {
      toastServerError(err);
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Globe className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">Nirogi AI Health Browser</h1>
            <p className="text-sm text-muted-foreground">Ask any health question. Answers backed by 50 top medical institutions.</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>AI-generated health information for educational purposes only. Always consult a certified doctor for medical advice.</p>
        </div>

        {turns.length === 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-card transition-colors hover:border-primary hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex-1 space-y-4">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{t.content}</p>
              </div>
            ) : (
              <div key={i} className="rounded-2xl rounded-bl-sm border border-border bg-card p-4 shadow-card">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Stethoscope className="size-3.5" /> Nirogi AI
                </p>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{t.content}</ReactMarkdown>
                </div>
                {t.sources && t.sources.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</p>
                    <ol className="mt-2 space-y-2">
                      {t.sources.map((s, n) => (
                        <li key={n} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold">{n + 1}. {s.institution}</span>
                          <span className="text-muted-foreground">— {s.relevance}</span>
                          <a
                            href={sourceUrl(s.institution)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-medium text-primary hover:bg-muted"
                          >
                            Visit source <ExternalLink className="size-3" />
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Searching medical literature…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
          className="sticky bottom-0 mt-6 flex gap-2 bg-background/90 py-3 backdrop-blur"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a health question…"
            aria-label="Ask a health question"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
