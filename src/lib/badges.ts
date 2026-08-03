/** Badge catalogue + streak maths shared by the dashboard, /badges and the server. */

export type StreakKey = "login" | "water" | "exercise" | "sleep" | "medicine" | "tools";

export type Streak = { key: StreakKey; current: number; longest: number };

export type BadgeDef = {
  id: string;
  name: string;
  how: string;
  color: string;
  emoji: string;
};

export const STREAK_META: Record<StreakKey, { label: string; emoji: string; accent: string }> = {
  login: { label: "Daily login", emoji: "🔥", accent: "text-warning" },
  water: { label: "Water goal", emoji: "💧", accent: "text-primary" },
  exercise: { label: "Exercise", emoji: "⚡", accent: "text-warning" },
  sleep: { label: "Sleep tracking", emoji: "🌙", accent: "text-primary" },
  medicine: { label: "Medicines", emoji: "💊", accent: "text-success" },
  tools: { label: "Tool use", emoji: "🩺", accent: "text-primary" },
};

export const BADGES: BadgeDef[] = [
  { id: "first_step", name: "First Step", how: "Use any Nirogi tool for the first time", color: "from-slate-300 to-slate-500", emoji: "👣" },
  { id: "health_detective", name: "Health Detective", how: "Use all 9 AI tools at least once", color: "from-amber-300 to-yellow-500", emoji: "🔎" },
  { id: "hydration_hero", name: "Hydration Hero", how: "Hit your water goal 7 days in a row", color: "from-sky-300 to-blue-600", emoji: "💧" },
  { id: "sleep_champion", name: "Sleep Champion", how: "Track sleep 14 nights in a row", color: "from-violet-400 to-indigo-600", emoji: "🌙" },
  { id: "heart_guardian", name: "Heart Guardian", how: "Run a HeartSense check", color: "from-rose-400 to-red-600", emoji: "❤️" },
  { id: "sugar_warrior", name: "Sugar Warrior", how: "Get a low-risk SugarSense result", color: "from-emerald-300 to-green-600", emoji: "🩸" },
  { id: "medicine_guardian", name: "Medicine Guardian", how: "Take medicines on time 30 days in a row", color: "from-green-300 to-emerald-600", emoji: "💊" },
  { id: "family_protector", name: "Family Protector", how: "Add 3 family members", color: "from-teal-300 to-cyan-600", emoji: "👨‍👩‍👧" },
  { id: "fitness_streak", name: "Fitness Streak", how: "Exercise 14 days in a row", color: "from-orange-300 to-amber-600", emoji: "⚡" },
  { id: "warrior_100", name: "100 Day Warrior", how: "Open Nirogi 100 days in a row", color: "from-yellow-300 to-orange-600", emoji: "🏆" },
  { id: "cancer_preventer", name: "Cancer Preventer", how: "Get a low-risk CancerSense result", color: "from-purple-400 to-amber-500", emoji: "🎗️" },
  { id: "xray_reader", name: "X-Ray Reader", how: "Analyse a medical scan in ScanIQ", color: "from-blue-300 to-slate-500", emoji: "🩻" },
  { id: "referral_champion", name: "Referral Champion", how: "Refer 5 friends successfully", color: "from-amber-300 to-teal-500", emoji: "🤝" },
  { id: "score_90", name: "Health Score 90+", how: "Reach a Health Score above 90", color: "from-slate-200 to-teal-400", emoji: "💎" },
];

export const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export function streakFromDates(dates: Set<string>) {
  const sorted = [...dates].sort().reverse();
  if (sorted.length === 0) return { current: 0, longest: 0 };

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));

  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    let cursor = new Date(sorted[0]);
    for (const d of sorted) {
      if (d === dayKey(cursor)) {
        current += 1;
        cursor = new Date(cursor.getTime() - 86400000);
      } else break;
    }
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]).getTime();
    const cur = new Date(sorted[i]).getTime();
    if (prev - cur === 86400000) run += 1;
    else run = 1;
    if (run > longest) longest = run;
  }
  return { current, longest: Math.max(longest, current) };
}
