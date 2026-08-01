import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { ensureCredits } = await import("./credits.server");
    const { row } = await ensureCredits(supabase, userId);
    return { balance: row.balance };
  });

export const getDoctorChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ doctorId: z.string().min(1).max(60) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: chat } = await supabase
      .from("doctor_chats")
      .select("id")
      .eq("user_id", userId)
      .eq("doctor_id", data.doctorId)
      .maybeSingle();
    if (!chat) return { messages: [] as { role: string; content: string }[] };
    const { data: msgs } = await supabase
      .from("doctor_messages")
      .select("role, content, created_at")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true })
      .limit(50);
    return { messages: (msgs ?? []) as { role: string; content: string }[] };
  });

const SendInput = z.object({
  doctorId: z.string().min(1).max(60),
  message: z.string().min(1).max(2000),
  system: z.string().min(1).max(4000),
  voice: z.boolean().optional(),
  voiceId: z.string().max(60).optional(),
  lang: z.enum(["en", "hi"]).optional(),
});

export const sendDoctorMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SendInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cost = data.voice ? 5 : 2;

    const { ensureCredits } = await import("./credits.server");
    const { row: creditRow } = await ensureCredits(supabase, userId);
    const balance = creditRow.balance;
    if (balance < cost) throw new Error("INSUFFICIENT_CREDITS");

    // Find or create the chat thread for this doctor.
    let chatId: string;
    const { data: chat } = await supabase
      .from("doctor_chats")
      .select("id")
      .eq("user_id", userId)
      .eq("doctor_id", data.doctorId)
      .maybeSingle();
    if (chat) {
      chatId = chat.id;
      await supabase.from("doctor_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);
    } else {
      const { data: created, error } = await supabase
        .from("doctor_chats")
        .insert({ user_id: userId, doctor_id: data.doctorId, title: data.message.slice(0, 60) })
        .select("id")
        .single();
      if (error || !created) throw new Error("CHAT_CREATE_FAILED");
      chatId = created.id;
    }

    // Recent history for context.
    const { data: history } = await supabase
      .from("doctor_messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(12);

    // Profile for personalization.
    const { data: profile } = await supabase
      .from("profiles")
      .select("age, gender, weight_kg, height_cm, bmi, health_conditions, current_medicines, allergies")
      .eq("id", userId)
      .maybeSingle();
    const profileText = profile
      ? `Patient context — Age: ${profile.age ?? "?"}, Gender: ${profile.gender ?? "?"}, BMI: ${profile.bmi ?? "?"}, Conditions: ${profile.health_conditions ?? "none"}, Medicines: ${profile.current_medicines ?? "none"}, Allergies: ${profile.allergies ?? "none"}.`
      : "No saved health profile — give general guidance and suggest completing the profile.";

    const { callDoctorAI, speakWithElevenLabs } = await import("./doctor.server");
    const reply = await callDoctorAI({
      system: data.system,
      profileText,
      history: (history ?? []) as { role: "user" | "assistant"; content: string }[],
      message: data.message,
      lang: data.lang ?? "en",
    });

    // Persist both turns.
    await supabase.from("doctor_messages").insert([
      { chat_id: chatId, user_id: userId, role: "user", content: data.message },
      { chat_id: chatId, user_id: userId, role: "assistant", content: reply },
    ]);

    // Deduct credits through the shared ledger.
    const { spendCredits } = await import("./credits.server");
    const newBalance = await spendCredits(
      supabase,
      userId,
      cost,
      data.voice ? `Voice minute with ${data.doctorId}` : `Doctor chat with ${data.doctorId}`,
    );

    // Optional voice.
    let audio: string | null = null;
    if (data.voice && data.voiceId) {
      try {
        audio = await speakWithElevenLabs(reply, data.voiceId);
      } catch (e) {
        console.error("TTS failed", e);
      }
    }

    return { reply, balance: newBalance, audio };
  });

/** Speak an arbitrary line (e.g. the greeting) without charging credits. */
export const speakLine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ text: z.string().min(1).max(800), voiceId: z.string().min(1).max(60) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { speakWithElevenLabs } = await import("./doctor.server");
    try {
      const audio = await speakWithElevenLabs(data.text, data.voiceId);
      return { audio };
    } catch {
      return { audio: null };
    }
  });
