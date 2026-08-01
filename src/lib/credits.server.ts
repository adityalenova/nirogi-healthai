/**
 * Shared credit-ledger helpers. Credits are ONLY used for AI Doctor
 * consultations — every health tool in Nirogi stays free forever.
 */

export const WELCOME_CREDITS = 300;
export const MONTHLY_REFRESH = 100;
export const BALANCE_CAP = 500;
export const DAILY_LOGIN = 5;
export const REFERRER_REWARD = 100;
export const REFERRED_BONUS = 50;

/** One-time earning rules, keyed by transaction reason. */
export const ONE_TIME_REWARDS: Record<string, number> = {
  prescription_upload: 15,
  family_member_added: 25,
  all_tools_week: 100,
  profile_completed: 0, // handled by the welcome grant
};

export const FIRST_TOOL_REWARD = 10;

export type CreditsRow = {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  referral_code: string | null;
  referred_by: string | null;
  last_refresh_date: string | null;
  last_streak_date: string | null;
  signup_date: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function makeReferralCode(fullName: string | null | undefined) {
  const base = (fullName ?? "NIROGI").trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "NIROGI";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${base.slice(0, 10)}${digits}`;
}

async function logTx(supabase: any, userId: string, amount: number, reason: string, meta?: unknown) {
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    reason,
    meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
  });
}

async function applyDelta(supabase: any, row: CreditsRow, amount: number, patch: Record<string, unknown> = {}) {
  const nextBalance = Math.max(0, Math.min(BALANCE_CAP, row.balance + amount));
  const earned = amount > 0 ? row.lifetime_earned + amount : row.lifetime_earned;
  const spent = amount < 0 ? row.lifetime_spent - amount : row.lifetime_spent;
  await supabase
    .from("user_credits")
    .update({ balance: nextBalance, lifetime_earned: earned, lifetime_spent: spent, ...patch })
    .eq("user_id", row.user_id);
  row.balance = nextBalance;
  row.lifetime_earned = earned;
  row.lifetime_spent = spent;
  Object.assign(row, patch);
  return row;
}

/**
 * Loads (or creates) the ledger row, granting the 300-credit welcome gift on
 * first sight, the 100-credit monthly refresh and the 5-credit daily login.
 */
export async function ensureCredits(
  supabase: any,
  userId: string,
): Promise<{ row: CreditsRow; welcomed: boolean; refreshed: boolean; dailyBonus: boolean }> {
  const { data: existing } = await supabase.from("user_credits").select("*").eq("user_id", userId).maybeSingle();

  let welcomed = false;
  let row = existing as CreditsRow | null;

  if (!row) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    const insert = {
      user_id: userId,
      balance: WELCOME_CREDITS,
      lifetime_earned: WELCOME_CREDITS,
      lifetime_spent: 0,
      referral_code: makeReferralCode(profile?.full_name),
      last_refresh_date: todayISO(),
      last_streak_date: todayISO(),
    };
    const { data: created } = await supabase.from("user_credits").insert(insert).select("*").single();
    await logTx(supabase, userId, WELCOME_CREDITS, "Welcome gift — health profile completed");
    row = (created ?? { ...insert, referred_by: null, signup_date: new Date().toISOString() }) as CreditsRow;
    welcomed = true;
    return { row, welcomed, refreshed: false, dailyBonus: false };
  }

  if (!row.referral_code) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    const code = makeReferralCode(profile?.full_name);
    await supabase.from("user_credits").update({ referral_code: code }).eq("user_id", userId);
    row.referral_code = code;
  }

  // Monthly refresh (every 30 days).
  let refreshed = false;
  const last = row.last_refresh_date ? new Date(row.last_refresh_date) : null;
  const daysSince = last ? Math.floor((Date.now() - last.getTime()) / 86_400_000) : 999;
  if (daysSince >= 30 && row.balance < BALANCE_CAP) {
    await applyDelta(supabase, row, MONTHLY_REFRESH, { last_refresh_date: todayISO() });
    await logTx(supabase, userId, MONTHLY_REFRESH, "Monthly credit refresh");
    refreshed = true;
  } else if (!row.last_refresh_date) {
    await supabase.from("user_credits").update({ last_refresh_date: todayISO() }).eq("user_id", userId);
    row.last_refresh_date = todayISO();
  }

  // Daily login streak.
  let dailyBonus = false;
  if (row.last_streak_date !== todayISO() && row.balance < BALANCE_CAP) {
    await applyDelta(supabase, row, DAILY_LOGIN, { last_streak_date: todayISO() });
    await logTx(supabase, userId, DAILY_LOGIN, "Daily login bonus");
    dailyBonus = true;
  }

  return { row, welcomed, refreshed, dailyBonus };
}

/** Grants a reward once per reason. Returns the amount actually granted. */
export async function grantOnce(supabase: any, userId: string, reason: string, amount: number, label: string) {
  const { data: prior } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", reason)
    .maybeSingle();
  if (prior) return 0;

  const { row } = await ensureCredits(supabase, userId);
  if (row.balance >= BALANCE_CAP) return 0;
  await applyDelta(supabase, row, amount);
  await logTx(supabase, userId, amount, label);
  return amount;
}

/** Deducts credits for a doctor consultation. Throws when the balance is short. */
export async function spendCredits(supabase: any, userId: string, amount: number, label: string) {
  const { row } = await ensureCredits(supabase, userId);
  if (row.balance < amount) throw new Error("INSUFFICIENT_CREDITS");
  await applyDelta(supabase, row, -amount);
  await logTx(supabase, userId, -amount, label);
  return row.balance;
}

export async function creditRowFor(supabase: any, userId: string) {
  const { row } = await ensureCredits(supabase, userId);
  return row;
}
