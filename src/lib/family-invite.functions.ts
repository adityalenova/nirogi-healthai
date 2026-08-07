import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function makeToken() {
  const a = crypto.randomUUID().replace(/-/g, "");
  const b = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${a}${b}`;
}

/** Owner creates a family member placeholder + a shareable invite link. */
export const createFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ full_name: z.string().min(1).max(120), relation: z.string().max(60).optional().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    if ((count ?? 0) >= 6) throw new Error("LIMIT_REACHED");

    const { data: member, error: mErr } = await supabase
      .from("family_members")
      .insert({ owner_id: userId, full_name: data.full_name, relation: data.relation ?? null, invite_status: "pending" })
      .select()
      .single();
    if (mErr) throw new Error(mErr.message);

    const token = makeToken();
    const { data: invite, error } = await supabase
      .from("family_invites")
      .insert({
        owner_id: userId,
        member_id: member.id,
        token,
        label: data.full_name,
        relation: data.relation ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { invite, member, token };
  });

export const listFamilyInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("family_invites")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    return { invites: data ?? [] };
  });

export const revokeFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("family_invites").update({ status: "revoked" }).eq("id", data.id).eq("owner_id", userId);
    return { ok: true };
  });

/** Public-ish: look up an invite by token (uses admin to read across owners). */
export const getInviteInfo = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(8).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("family_invites")
      .select("id, label, relation, status, owner_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { invite: null, ownerName: null };
    const { data: owner } = await supabaseAdmin.from("profiles").select("full_name").eq("id", invite.owner_id).maybeSingle();
    return {
      invite: { id: invite.id, label: invite.label, relation: invite.relation, status: invite.status },
      ownerName: owner?.full_name ?? "A Nirogi user",
    };
  });

/** Resolve a short 6-character join code back to its full invite token. */
export const resolveFamilyCode = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ code: z.string().min(4).max(12) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const prefix = data.code.trim().toLowerCase();
    const { data: rows } = await supabaseAdmin
      .from("family_invites")
      .select("token, status")
      .ilike("token", `${prefix}%`)
      .limit(2);
    const pending = (rows ?? []).filter((r) => r.status !== "revoked");
    if (pending.length !== 1) return { token: null as string | null };
    return { token: pending[0].token as string };
  });


/** The signed-in family member accepts the invite and links their account. */
export const acceptFamilyInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ token: z.string().min(8).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite } = await supabaseAdmin
      .from("family_invites")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) throw new Error("INVALID_INVITE");
    if (invite.status === "revoked") throw new Error("REVOKED");
    if (invite.owner_id === userId) throw new Error("SELF_INVITE");
    if (invite.status === "accepted" && invite.accepted_user_id !== userId) throw new Error("ALREADY_USED");

    await supabaseAdmin
      .from("family_invites")
      .update({ status: "accepted", accepted_user_id: userId, accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (invite.member_id) {
      await supabaseAdmin
        .from("family_members")
        .update({ member_user_id: userId, invite_status: "joined" })
        .eq("id", invite.member_id);
    }

    // Seed the joining member's own profile name if empty
    const { data: prof } = await supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    if (prof && (!prof.full_name || !prof.full_name.trim()) && invite.label) {
      await supabaseAdmin.from("profiles").update({ full_name: invite.label }).eq("id", userId);
    }

    const { data: owner } = await supabaseAdmin.from("profiles").select("full_name").eq("id", invite.owner_id).maybeSingle();
    return { ok: true, ownerName: owner?.full_name ?? "your family" };
  });
