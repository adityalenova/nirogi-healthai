/** Streak-milestone badge catalogue + login-streak maths shared by the dashboard, /badges and the server. */

export type BadgeDef = {
  id: string;
  name: string;
  days: number;
  tagline: string;
  /** Tailwind-friendly gradient stops used for the hexagon fill and glow. */
  from: string;
  to: string;
  /** True for the two top-tier badges that use an animated hue-rotate / holographic shimmer. */
  animated?: "rainbow" | "holo";
};

/** The 14 premium hexagon badges — pure consecutive daily-login milestones. */
export const BADGES: BadgeDef[] = [
  { id: "rookie", name: "Rookie", days: 3, tagline: "Is this just fleeting motivation or real dedication?", from: "#CD7F32", to: "#A0522D" },
  { id: "committed", name: "Committed", days: 7, tagline: "One week in. The real ones keep going.", from: "#FF6B35", to: "#FF8C00" },
  { id: "two_weeks_strong", name: "Two Weeks Strong", days: 14, tagline: "Two weeks. Most people quit by now.", from: "#FF4500", to: "#FF6B35" },
  { id: "habit_former", name: "Habit Former", days: 21, tagline: "21 days. Science says you have built a habit.", from: "#FF3D00", to: "#DD2C00" },
  { id: "one_month_in", name: "One Month In", days: 30, tagline: "30 days. This is no longer motivation. This is discipline.", from: "#FF0000", to: "#CC0000" },
  { id: "locked_in", name: "Locked In", days: 50, tagline: "50 days. This is now your identity.", from: "#FFD700", to: "#FFA500" },
  { id: "unstoppable", name: "Unstoppable", days: 75, tagline: "75 days. You do not miss. That is your superpower.", from: "#FFD700", to: "#FF8C00" },
  { id: "triple_threat", name: "Triple Threat", days: 100, tagline: "100 days. If consistency were a crime you would be doing life.", from: "#00BFFF", to: "#0080FF" },
  { id: "legend", name: "Legend", days: 150, tagline: "150 days of choosing your health. Every single day.", from: "#4169E1", to: "#00BFFF" },
  { id: "health_warrior", name: "Health Warrior", days: 200, tagline: "200 days. You have done more for your health than most do in a lifetime.", from: "#8A2BE2", to: "#9B59B6" },
  { id: "year_one", name: "Year One", days: 365, tagline: "365 days. One full year. You changed your life.", from: "#9B59B6", to: "#6C3483" },
  { id: "elite", name: "Elite", days: 500, tagline: "500 days. You are in a category most people do not even know exists.", from: "#2C3E50", to: "#9B59B6" },
  { id: "master", name: "Master", days: 750, tagline: "750 days. Two years of dedication. You are the example.", from: "#FF0000", to: "#8A2BE2", animated: "rainbow" },
  { id: "god_mode", name: "God Mode", days: 1000, tagline: "1000 days. You did not just change habits. You became who you were meant to be.", from: "#00BFFF", to: "#FF00FF", animated: "holo" },
];

export type FlameTier = {
  key: string;
  min: number;
  max: number;
  from: string;
  to: string;
  size: "sm" | "md" | "lg" | "xl" | "xxl";
  animated?: "rainbow";
};

/** Flame colour + size tiers driven purely by the current login streak. */
export const FLAME_TIERS: FlameTier[] = [
  { key: "bronze", min: 0, max: 6, from: "#CD7F32", to: "#A0522D", size: "sm" },
  { key: "orange", min: 7, max: 13, from: "#FF6B35", to: "#FF8C00", size: "md" },
  { key: "red-orange", min: 14, max: 29, from: "#FF4500", to: "#FF6B35", size: "md" },
  { key: "red", min: 30, max: 49, from: "#FF0000", to: "#CC0000", size: "lg" },
  { key: "gold", min: 50, max: 99, from: "#FFD700", to: "#FFA500", size: "lg" },
  { key: "cyan-blue", min: 100, max: 364, from: "#00BFFF", to: "#0080FF", size: "xl" },
  { key: "purple", min: 365, max: 999, from: "#9B59B6", to: "#6C3483", size: "xl" },
  { key: "rainbow", min: 1000, max: Infinity, from: "#FF0000", to: "#9B59B6", size: "xxl", animated: "rainbow" },
];

export function flameTierFor(streak: number): FlameTier {
  return FLAME_TIERS.find((t) => streak >= t.min && streak <= t.max) ?? FLAME_TIERS[0];
}

export const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

/** Consecutive-day streak maths shared by login and (legacy) habit streaks. */
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
