import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Users, Trash2, Pencil, User, Link2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "@/lib/family.functions";
import { createFamilyInvite, listFamilyInvites, revokeFamilyInvite } from "@/lib/family-invite.functions";
import { useActiveMember } from "@/lib/active-member";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";


type MemberRow = {
  id: string;
  full_name: string;
  relation: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  health_conditions: string | null;
  current_medicines: string | null;
  allergies: string | null;
};

type FormState = {
  full_name: string;
  relation: string;
  age: string;
  gender: string;
  blood_group: string;
  weight_kg: string;
  height_cm: string;
  health_conditions: string;
  current_medicines: string;
  allergies: string;
};

const empty: FormState = {
  full_name: "", relation: "", age: "", gender: "", blood_group: "",
  weight_kg: "", height_cm: "", health_conditions: "", current_medicines: "", allergies: "",
};

export function FamilySection() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { memberId, setMember } = useActiveMember();

  const listFn = useServerFn(listFamilyMembers);
  const addFn = useServerFn(addFamilyMember);
  const updFn = useServerFn(updateFamilyMember);
  const delFn = useServerFn(deleteFamilyMember);

  const inviteFn = useServerFn(createFamilyInvite);
  const listInvitesFn = useServerFn(listFamilyInvites);
  const revokeFn = useServerFn(revokeFamilyInvite);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRelation, setInviteRelation] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["family-members"],
    queryFn: () => listFn(),
  });
  const members = (data?.members ?? []) as MemberRow[];

  const { data: invitesData } = useQuery({
    queryKey: ["family-invites"],
    queryFn: () => listInvitesFn(),
  });
  const invites = (invitesData?.invites ?? []) as { id: string; token: string; label: string; relation: string | null; status: string }[];

  const inviteLink = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`;

  const inviteMut = useMutation({
    mutationFn: () => inviteFn({ data: { full_name: inviteName.trim(), relation: inviteRelation || null } }),
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ["family-invites"] });
      qc.invalidateQueries({ queryKey: ["family-members"] });
      try {
        await navigator.clipboard.writeText(inviteLink(res.token));
        toast.success("Invite link copied to clipboard.");
      } catch {
        toast.success("Invite created.");
      }
      setInviteName("");
      setInviteRelation("");
      setInviteOpen(false);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("LIMIT_REACHED")) toast.error("You can add up to 6 family members.");
      else toast.error("Couldn't create the invite. Please try again.");
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["family-invites"] }); toast.success("Invite revoked."); },
    onError: () => toast.error("Couldn't revoke the invite."),
  });

  const copyLink = async (token: string) => {
    try { await navigator.clipboard.writeText(inviteLink(token)); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Link copied."); }
    catch { toast.error("Couldn't copy."); }
  };


  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["family-members"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        relation: form.relation || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        health_conditions: form.health_conditions || null,
        current_medicines: form.current_medicines || null,
        allergies: form.allergies || null,
      };
      if (editId) return updFn({ data: { id: editId, ...payload } });
      return addFn({ data: payload });
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm(empty);
      setEditId(null);
      toast.success(editId ? "Member updated." : "Member added.");
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("LIMIT_REACHED")) toast.error("You can add up to 6 family members.");
      else toast.error("Couldn't save member. Please try again.");
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: (_d, id) => {
      if (memberId === id) setMember(null, null);
      invalidate();
      toast.success("Member removed.");
    },
    onError: () => toast.error("Couldn't remove member."),
  });

  const startAdd = () => {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  };

  const startEdit = (m: MemberRow) => {
    setEditId(m.id);
    setForm({
      full_name: m.full_name ?? "",
      relation: m.relation ?? "",
      age: m.age?.toString() ?? "",
      gender: m.gender ?? "",
      blood_group: m.blood_group ?? "",
      weight_kg: m.weight_kg?.toString() ?? "",
      height_cm: m.height_cm?.toString() ?? "",
      health_conditions: m.health_conditions ?? "",
      current_medicines: m.current_medicines ?? "",
      allergies: m.allergies ?? "",
    });
    setOpen(true);
  };

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const overview = (overviewData?.members ?? []) as FamilyOverviewMember[];


  const shareWhatsApp = (token: string, label: string) => {
    const text = `Hi ${label}, join my family health group on Nirogi AI so we can look after each other. Tap to join: ${inviteLink(token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const scoreFor = (id: string) => overview.find((o) => o.id === id)?.score ?? null;
  const avatarFor = (id: string) => overview.find((o) => o.id === id)?.avatar_url ?? null;
  const joined = (id: string) => overview.find((o) => o.id === id)?.member_user_id != null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Users className="size-5 text-primary" /> {t("dash.family", "Family")}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
            <Link2 className="size-4" /> Invite with Google
          </Button>
          <Button size="sm" variant="outline" onClick={startAdd}>
            <Plus className="size-4" /> {t("dash.add_member", "Add member")}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Up to 6 people. Tap a card to view that person&apos;s dashboard and run tools for them.
      </p>

      {isLoading ? (
        <div className="mt-6 flex justify-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : (
        <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          <MemberCard
            name={t("dash.you", "You")}
            subtitle="Your own profile"
            active={memberId === null}
            onClick={() => setMember(null, null)}
          />
          {members.map((m) => (
            <MemberCard
              key={m.id}
              name={m.full_name}
              subtitle={[m.relation, m.age ? `${m.age}y` : null, m.blood_group].filter(Boolean).join(" · ") || "No details yet"}
              score={scoreFor(m.id)}
              avatar={avatarFor(m.id)}
              joined={joined(m.id)}
              active={memberId === m.id}
              onClick={() => setMember(m.id, m.full_name)}
              onEdit={() => startEdit(m)}
              onDelete={() => delMut.mutate(m.id)}
            />
          ))}
        </div>
      )}

      {invites.filter((i) => i.status === "pending").length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending invites</p>
          {invites
            .filter((i) => i.status === "pending")
            .map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="font-medium">
                  {i.label}
                  {i.relation ? <span className="text-muted-foreground"> · {i.relation}</span> : null}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => shareWhatsApp(i.token, i.label)}>
                    Share
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => copyLink(i.token)}>
                    {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => revokeMut.mutate(i.id)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a family member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            We&apos;ll create a private join link. When they open it and sign in with Google, their profile joins your
            family group automatically.
          </p>
          <div className="grid gap-3">
            <Field label="Their name"><Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Mummy" /></Field>
            <Field label="Relation"><Input value={inviteRelation} onChange={(e) => setInviteRelation(e.target.value)} placeholder="e.g. Mother" /></Field>
          </div>
          <DialogFooter>
            <Button onClick={() => inviteMut.mutate()} disabled={!inviteName.trim() || inviteMut.isPending}>
              {inviteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Create invite link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t("dash.edit_member", "Edit member") : t("dash.add_member", "Add member")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("dash.full_name", "Full name")}><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
            <Field label={t("dash.relation", "Relation")}><Input value={form.relation} onChange={(e) => set("relation", e.target.value)} placeholder="e.g. Mother" /></Field>
            <Field label={t("dash.age", "Age")}><Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} /></Field>
            <Field label={t("dash.gender", "Gender")}><Input value={form.gender} onChange={(e) => set("gender", e.target.value)} /></Field>
            <Field label={t("dash.blood_group", "Blood group")}><Input value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)} /></Field>
            <Field label={t("dash.weight", "Weight (kg)")}><Input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></Field>
            <Field label={t("dash.height", "Height (cm)")}><Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label={t("dash.conditions", "Health conditions")}><Textarea rows={2} value={form.health_conditions} onChange={(e) => set("health_conditions", e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label={t("dash.medicines", "Current medicines")}><Textarea rows={2} value={form.current_medicines} onChange={(e) => set("current_medicines", e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label={t("dash.allergies", "Allergies")}><Textarea rows={2} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} /></Field></div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveMut.mutate()} disabled={!form.full_name.trim() || saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MemberCard({
  name,
  subtitle,
  score,
  avatar,
  joined,
  active,
  onClick,
  onEdit,
  onDelete,
}: {
  name: string;
  subtitle: string;
  score?: number | null;
  avatar?: string | null;
  joined?: boolean;
  active: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const pct = score ?? 0;
  return (
    <div
      className={cn(
        "w-44 shrink-0 snap-start rounded-xl border p-3 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
      )}
    >
      <button onClick={onClick} className="w-full text-left">
        <div className="relative mx-auto size-16">
          <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
            <circle
              cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
            />
          </svg>
          <div className="absolute inset-1.5 overflow-hidden rounded-full bg-muted">
            {avatar ? (
              <img src={avatar} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center">
                <User className="size-6 text-muted-foreground" />
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 truncate text-center text-sm font-semibold">{name}</p>
        <p className="truncate text-center text-[11px] text-muted-foreground">{subtitle}</p>
        <p className="mt-1 text-center text-[11px] font-medium text-primary">
          {score != null ? `Score ${score}` : joined ? "No score yet" : "Invite pending"}
        </p>
      </button>
      {(onEdit || onDelete) && (
        <div className="mt-2 flex justify-center gap-1">
          {onEdit && (
            <Button size="icon" variant="ghost" className="size-7" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="size-7 text-destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  );
}
