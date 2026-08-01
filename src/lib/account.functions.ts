import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Deletes a single health-history record owned by the signed-in user. */
export const deleteHistoryRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("scan_history").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/** Clears every record for one tool, or the whole history when tool is omitted. */
export const clearHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ tool: z.string().max(40).optional().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("scan_history").delete().eq("user_id", userId);
    if (data.tool) q = q.eq("tool", data.tool);
    await q;
    return { ok: true };
  });

/** Clears the stored prescription reading so a new one can be uploaded. */
export const clearPrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({ prescription_analysis: null }).eq("id", userId);
    await supabase.from("scan_history").delete().eq("user_id", userId).eq("tool", "prescription");
    return { ok: true };
  });

/**
 * Permanently deletes the account and every health record attached to it.
 * Requires the user to type DELETE to confirm on the client.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(i))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const tables = [
      "scan_history", "food_diary", "medicine_logs", "medicine_reminders", "water_logs",
      "sleep_logs", "exercise_logs", "exercise_sessions", "breathing_sessions", "heart_rate_logs",
      "weight_logs", "health_score_history", "health_goals", "diet_compliance", "diet_plans",
      "doctor_messages", "doctor_chats", "credit_transactions", "user_credits", "user_integrations",
      "wellness_settings", "family_invites", "family_members",
    ] as const;

    for (const table of tables) {
      await supabase.from(table).delete().eq("user_id", userId);
    }
    await supabase.from("family_members").delete().eq("owner_id", userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return { ok: true };
  });

/** Soft "deactivate": wipes health data but keeps the sign-in able to return. */
export const deactivateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("profiles")
      .update({
        health_conditions: null, current_medicines: null, family_history: null,
        recent_surgeries: null, allergies: null, prescription_analysis: null,
      })
      .eq("id", userId);
    await supabase.from("scan_history").delete().eq("user_id", userId);
    await supabase.from("medicine_reminders").delete().eq("user_id", userId);
    return { ok: true };
  });
