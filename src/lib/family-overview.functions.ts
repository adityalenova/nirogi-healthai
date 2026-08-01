import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FamilyOverviewMember = {
  id: string;
  full_name: string;
  relation: string | null;
  age: number | null;
  blood_group: string | null;
  invite_status: string | null;
  member_user_id: string | null;
  avatar_url: string | null;
  score: number | null;
};

/**
 * Family cards for the dashboard: each member with their avatar (once they
 * have joined with Google) and their latest health score. Only the group
 * owner sees everyone's score.
 */
export const getFamilyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: members } = await supabase
      .from("family_members")
      .select("id, full_name, relation, age, blood_group, invite_status, member_user_id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });

    const joinedIds = (members ?? []).map((m) => m.member_user_id).filter(Boolean) as string[];

    let profiles: { id: string; avatar_url: string | null; full_name: string | null }[] = [];
    let scores: { user_id: string; score: number }[] = [];

    if (joinedIds.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: profs }, { data: hist }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, avatar_url, full_name").in("id", joinedIds),
        supabaseAdmin
          .from("health_score_history")
          .select("user_id, score, created_at")
          .in("user_id", joinedIds)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      profiles = profs ?? [];
      const seen = new Set<string>();
      for (const row of hist ?? []) {
        if (seen.has(row.user_id)) continue;
        seen.add(row.user_id);
        scores.push({ user_id: row.user_id, score: row.score });
      }
    }

    const enriched: FamilyOverviewMember[] = (members ?? []).map((m) => {
      const prof = profiles.find((p) => p.id === m.member_user_id);
      return {
        id: m.id,
        full_name: prof?.full_name || m.full_name,
        relation: m.relation,
        age: m.age,
        blood_group: m.blood_group,
        invite_status: m.invite_status,
        member_user_id: m.member_user_id,
        avatar_url: prof?.avatar_url ?? null,
        score: scores.find((s) => s.user_id === m.member_user_id)?.score ?? null,
      };
    });

    // Is this account itself a member of somebody else's family?
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: belongsTo } = await supabaseAdmin
      .from("family_members")
      .select("owner_id")
      .eq("member_user_id", userId)
      .maybeSingle();

    return { members: enriched, isOwner: true, belongsToOwner: belongsTo?.owner_id ?? null };
  });
