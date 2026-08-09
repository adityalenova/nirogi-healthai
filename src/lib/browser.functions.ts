import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BrowserSource = { institution: string; relevance: string };

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Nirogi AI Health Browser, a medical research assistant for Indian users.
Answer health questions accurately and accessibly using your medical knowledge, in clear plain language with short paragraphs and bullet points where useful.
Never diagnose. Always recommend consulting a doctor for personal medical decisions. For any emergency situation immediately say: Call 112 or go to the nearest hospital now.
After the answer, add a final section that starts on its own line with exactly SOURCES: and then list 3 to 5 of the most relevant institutions from this list, one per line, formatted exactly as
SOURCE: [Institution Name] | [brief reason this source is relevant]
Allowed institutions: Harvard Medical School, Johns Hopkins Medicine, Mayo Clinic, World Health Organization, NIH, MIT Health Sciences, Stanford Medicine, Oxford University, Cambridge University, Imperial College London, The Lancet, New England Journal of Medicine, JAMA, BMJ, AIIMS New Delhi, ICMR, NIMHANS Bengaluru, Tata Memorial Centre, Cleveland Clinic, Massachusetts General Hospital, Memorial Sloan Kettering, American Heart Association, American Diabetes Association, American Cancer Society, Cochrane Reviews, UpToDate, Medscape, PubMed Central, International Diabetes Federation, Global Burden of Disease (IHME).
Always include at least one Indian institution when the question relates to health in India.`;

function parseSources(raw: string): { message: string; sources: BrowserSource[] } {
  const idx = raw.search(/\n\s*SOURCES\s*:/i);
  if (idx === -1) return { message: raw.trim(), sources: [] };
  const message = raw.slice(0, idx).trim();
  const sources: BrowserSource[] = [];
  for (const line of raw.slice(idx).split("\n")) {
    const m = line.match(/SOURCE\s*:\s*\[?([^\]|]+)\]?\s*\|\s*\[?(.+?)\]?\s*$/i);
    if (m) sources.push({ institution: m[1].trim(), relevance: m[2].trim() });
  }
  return { message, sources };
}

export const askHealthBrowser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { question: string; history?: ChatMessage[] }) => d)
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const history = (data.history ?? []).slice(-10);
    const input = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.question },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-terra",
        input,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        store: false,
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits to continue.");
    if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status}).`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        for (const line of part.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
            if (evt.type === "response.completed" && !text && evt.response?.output_text) text = evt.response.output_text;
          } catch {
            /* ignore partial frames */
          }
        }
      }
    }

    const parsed = parseSources(text);
    if (!parsed.message) parsed.message = "I could not generate an answer just now. Please rephrase your question.";
    return parsed;
  });
