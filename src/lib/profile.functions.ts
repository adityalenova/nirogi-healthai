import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileInput = z.object({
  full_name: z.string().max(120).optional().nullable(),
  age: z.number().int().min(0).max(130).optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
  blood_group: z.string().max(10).optional().nullable(),
  weight_kg: z.number().min(0).max(500).optional().nullable(),
  height_cm: z.number().min(0).max(300).optional().nullable(),
  health_conditions: z.string().max(4000).optional().nullable(),
  current_medicines: z.string().max(4000).optional().nullable(),
  family_history: z.string().max(4000).optional().nullable(),
  recent_surgeries: z.string().max(4000).optional().nullable(),
  allergies: z.string().max(2000).optional().nullable(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let bmi: number | null = null;
    if (data.weight_kg && data.height_cm) {
      const m = data.height_cm / 100;
      if (m > 0) bmi = Math.round((data.weight_kg / (m * m)) * 10) / 10;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ ...data, bmi, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { ok: true, bmi };
  });

const PrescriptionInput = z.object({
  image: z.string().max(12_000_000),
  lang: z.enum(["en", "hi"]).optional(),
});

export type PrescriptionMedicine = {
  name: string;
  dose: string;
  frequency: string;
  timings: string[];
  with_food: string;
  duration: string;
  purpose: string;
  cautions: string;
};

export const analyzePrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PrescriptionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("AI is not configured.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_medicines, allergies, health_conditions")
      .eq("id", userId)
      .maybeSingle();

    const contextLine = `Medicines the patient already takes: ${profile?.current_medicines || "none recorded"}. Known allergies: ${profile?.allergies || "none recorded"}. Conditions: ${profile?.health_conditions || "none recorded"}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a clinical assistant reading a prescription image for a patient. Convert doctor shorthand to plain language (OD = once daily, BD = twice daily 8 AM and 8 PM, TDS = three times daily 8 AM, 2 PM and 8 PM, QID = four times daily, HS = at bedtime, AC = before food, PC = after food). " +
              "Also cross-check the new medicines against the ones the patient already takes and flag any dangerous interaction or duplicate. " +
              'Reply with STRICT JSON only, no markdown fences, shaped: {"explanation": string, "medicines": [{"name": string, "dose": string, "frequency": string, "timings": ["08:00"], "with_food": string, "duration": string, "purpose": string, "cautions": string}], "interactions": [string], "doctor": string}. ' +
              "The explanation is a friendly plain-text summary in short headed paragraphs ending with a reminder to follow the prescribing doctor and pharmacist. timings must be 24-hour HH:MM strings.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Please read and explain this prescription. ${contextLine}` },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!res.ok) {
      console.error("prescription AI error", res.status, await res.text().catch(() => ""));
      throw new Error("AI_ERROR");
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";

    let analysis = raw;
    let medicines: PrescriptionMedicine[] = [];
    let interactions: string[] = [];
    let doctor = "";
    try {
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      analysis = typeof parsed.explanation === "string" ? parsed.explanation : raw;
      medicines = Array.isArray(parsed.medicines)
        ? parsed.medicines.slice(0, 20).map((m: Record<string, unknown>) => ({
            name: String(m['name'] ?? "Medicine"),
            dose: String(m['dose'] ?? ""),
            frequency: String(m['frequency'] ?? ""),
            timings: Array.isArray(m['timings']) ? (m['timings'] as unknown[]).slice(0, 6).map(String) : [],
            with_food: String(m['with_food'] ?? ""),
            duration: String(m['duration'] ?? ""),
            purpose: String(m['purpose'] ?? ""),
            cautions: String(m['cautions'] ?? ""),
          }))
        : [];
      interactions = Array.isArray(parsed.interactions) ? parsed.interactions.slice(0, 10).map(String) : [];
      doctor = String(parsed.doctor ?? "");
    } catch {
      /* Model returned prose — keep the plain explanation. */
    }

    await supabase.from("profiles").update({ prescription_analysis: analysis }).eq("id", userId);

    const firstLine = analysis.split("\n").find((l) => l.trim())?.slice(0, 140) ?? "Prescription analyzed";
    await supabase.from("scan_history").insert({
      user_id: userId,
      tool: "prescription",
      title: "Prescription reading",
      summary: firstLine,
      result: JSON.parse(JSON.stringify({ riskLevel: "info", analysis, medicines, interactions })),
    });

    // One-time credit reward for uploading a prescription.
    try {
      const { grantOnce } = await import("./credits.server");
      await grantOnce(supabase, userId, "prescription_upload", 15, "Uploaded a prescription");
    } catch {
      /* credits are non-critical */
    }

    return { analysis, medicines, interactions, doctor };
  });

