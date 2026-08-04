// Server-only helper for AI sleep analysis via the Lovable AI Gateway.
// Never import this from client code paths.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function analyzeSleepAI(opts: {
  durationMin: number;
  bedtime: string;
  wake: string;
  notes: string;
  lang: "en" | "hi";
}): Promise<{ score: number; summary: string; tips: string[]; flags: string[] }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured.");

  const hours = (opts.durationMin / 60).toFixed(1);
  const langInstruction =
    opts.lang === "hi"
      ? " Write summary, tips and flags in simple everyday Hindi (Devanagari script). Keep JSON keys in English."
      : "";

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a sleep-quality educator. Given last night's sleep, produce a JSON sleep report.
Return ONLY valid JSON (no markdown) with this shape:
{ "score": number (0-100 sleep quality), "summary": string (2 sentences, plain language), "tips": string[] (3-4 practical tips), "flags": string[] (any warning signs like very short/long sleep, irregular timing, or snoring/apnea concerns from notes; empty if none) }.${langInstruction}`,
        },
        {
          role: "user",
          content: `Last night: slept ${hours} hours (bedtime ${opts.bedtime}, woke ${opts.wake}). Notes from the user about how they slept / sounds recorded: ${opts.notes || "none"}. Adults need ~7-9 hours.`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error("AI_ERROR");
  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let parsed: { score?: number; summary?: string; tips?: string[]; flags?: string[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : {};
  }
  return {
    score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 70,
    summary: parsed.summary ?? "",
    tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    flags: Array.isArray(parsed.flags) ? parsed.flags : [],
  };
}

/* ------------------------- Sleep session analysis ------------------------ */

export async function analyzeSleepSessionAI(opts: {
  durationHours: number;
  targetHours: number;
  bedtime: string;
  wake: string;
  snoringEvents: number;
  apneaEvents: number;
  movementEvents: number;
  soundEvents: number;
  notes: string;
  lang: "en" | "hi";
}): Promise<{
  score: number;
  summary: string;
  tips: string[];
  flags: string[];
  snoring_severity: "none" | "mild" | "moderate" | "loud";
  urgency_level: "low" | "moderate" | "high";
}> {
  const key = process.env.LOVABLE_API_KEY;
  const langInstruction =
    opts.lang === "hi"
      ? " Write summary, tips and flags in simple everyday Hindi (Devanagari script). Keep JSON keys and enum values in English."
      : "";

  const fallback = () => {
    const snoring_severity: "none" | "mild" | "moderate" | "loud" =
      opts.snoringEvents === 0 ? "none" : opts.snoringEvents < 5 ? "mild" : opts.snoringEvents < 15 ? "moderate" : "loud";
    const urgency_level: "low" | "moderate" | "high" =
      opts.apneaEvents >= 5 ? "high" : opts.apneaEvents >= 1 || snoring_severity === "loud" ? "moderate" : "low";
    let score = 90;
    score -= Math.min(30, Math.abs(opts.durationHours - opts.targetHours) * 8);
    score -= Math.min(25, opts.apneaEvents * 6);
    score -= Math.min(15, opts.movementEvents * 1.5);
    score -= snoring_severity === "loud" ? 12 : snoring_severity === "moderate" ? 6 : 0;
    score = Math.max(10, Math.min(100, Math.round(score)));
    const flags: string[] = [];
    if (opts.apneaEvents >= 1) flags.push(`${opts.apneaEvents} suspected breathing-pause (apnea) event(s) detected — consider a sleep-study if this repeats.`);
    if (snoring_severity === "loud") flags.push("Loud, frequent snoring detected.");
    if (opts.durationHours < opts.targetHours - 1) flags.push("You slept notably less than your target.");
    return {
      score,
      summary: `You slept ${opts.durationHours.toFixed(1)}h against a ${opts.targetHours}h target, with ${opts.snoringEvents} snoring and ${opts.movementEvents} movement events detected overnight.`,
      tips: [
        "Keep a consistent bedtime and wake time, even on weekends.",
        "Avoid caffeine and heavy meals within 3 hours of bedtime.",
        "Sleep on your side to reduce snoring and airway blockage.",
      ],
      flags,
      snoring_severity,
      urgency_level,
    };
  };

  if (!key) return fallback();

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a sleep-quality educator analysing overnight microphone-derived sound/movement data. Return ONLY valid JSON (no markdown) with this shape:
{ "score": number (0-100), "summary": string (2-3 sentences), "tips": string[] (3-4 practical tips), "flags": string[] (warnings, empty if none), "snoring_severity": "none"|"mild"|"moderate"|"loud", "urgency_level": "low"|"moderate"|"high" }.${langInstruction}`,
          },
          {
            role: "user",
            content: `Slept ${opts.durationHours.toFixed(1)}h (target ${opts.targetHours}h), bedtime ${opts.bedtime}, wake ${opts.wake}. Detected during the night: ${opts.snoringEvents} snoring events, ${opts.apneaEvents} suspected apnea (breathing pause) events, ${opts.movementEvents} movement events, ${opts.soundEvents} other sound events. User notes: ${opts.notes || "none"}.`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback();
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let parsed: Partial<{
      score: number;
      summary: string;
      tips: string[];
      flags: string[];
      snoring_severity: string;
      urgency_level: string;
    }>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    const fb = fallback();
    return {
      score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : fb.score,
      summary: parsed.summary ?? fb.summary,
      tips: Array.isArray(parsed.tips) ? parsed.tips : fb.tips,
      flags: Array.isArray(parsed.flags) ? parsed.flags : fb.flags,
      snoring_severity: (["none", "mild", "moderate", "loud"] as const).includes(parsed.snoring_severity as never)
        ? (parsed.snoring_severity as never)
        : fb.snoring_severity,
      urgency_level: (["low", "moderate", "high"] as const).includes(parsed.urgency_level as never)
        ? (parsed.urgency_level as never)
        : fb.urgency_level,
    };
  } catch {
    return fallback();
  }
}
