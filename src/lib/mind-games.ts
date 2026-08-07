/** Static content pools for the Mind & Mood game hub — pure data + deterministic helpers. */

export function dayIndex(len: number, offset = 0, date = new Date()): number {
  const dayNum = Math.floor(date.getTime() / 86400000);
  return ((dayNum + offset) % len + len) % len;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Simple seeded PRNG (mulberry32) so daily content is deterministic per date. */
export function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rnd = seededRandom(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------- Guided meditation ----------------
export const MEDITATION_SCRIPT = [
  "Find a comfortable seat and gently close your eyes.",
  "Take a slow deep breath in through your nose for four counts.",
  "Hold that breath softly for two counts.",
  "Breathe out slowly through your mouth for six counts.",
  "Let your shoulders drop away from your ears.",
  "Bring your attention to the top of your head, and let it soften.",
  "Relax your forehead, your eyes, your jaw.",
  "Let your neck and shoulders release any tension they are holding.",
  "Notice your chest rising and falling, easy and unhurried.",
  "Relax your stomach, your lower back, your hips.",
  "Let your legs feel heavy and supported.",
  "Relax your feet, all the way to your toes.",
  "Continue breathing in this easy rhythm — in for four, out for six.",
  "You are safe. You are exactly where you need to be right now.",
  "With every exhale, let go of a little more tension.",
  "Notice how much calmer your body feels than when we started.",
  "This calm is available to you any time you take a few slow breaths.",
  "Take one more deep breath in, and let it go completely.",
  "When you are ready, gently open your eyes.",
  "Carry this steadiness with you for the rest of your day.",
];

// ---------------- Box breathing ----------------
export const BOX_LABELS = ["Inhale", "Hold", "Exhale", "Hold"] as const;

// ---------------- Word unscramble ----------------
export type WordItem = { word: string; definition: string; fact: string };

export const WORD_POOL: WordItem[] = [
  { word: "CALM", definition: "Not showing or feeling nervousness, anger or other strong emotions.", fact: "Slow breathing signals your nervous system that you are safe, helping you feel calm." },
  { word: "FOCUS", definition: "The center of interest or activity; concentrated attention.", fact: "The brain can only truly focus on one complex task at a time — multitasking is mostly fast switching." },
  { word: "BREATH", definition: "Air taken into or expelled from the lungs.", fact: "Adults breathe roughly 20,000 times a day without ever thinking about it." },
  { word: "SLEEP", definition: "A natural periodic state of rest during which consciousness is suspended.", fact: "Your brain clears out waste products more actively during deep sleep than while awake." },
  { word: "HEART", definition: "The organ that pumps blood through the circulatory system.", fact: "The heart beats about 100,000 times a day, roughly 35 million times a year." },
  { word: "SMILE", definition: "A pleased, kind or amused facial expression.", fact: "Smiling, even when forced, can slightly lower your heart rate during stress." },
  { word: "GRATEFUL", definition: "Feeling or showing an appreciation for kindness.", fact: "Writing down things you're grateful for is linked to better sleep and lower stress." },
  { word: "MINDFUL", definition: "Conscious or aware of the present moment.", fact: "Just a few minutes of mindful breathing can measurably lower cortisol levels." },
  { word: "STRENGTH", definition: "The quality of being physically or mentally strong.", fact: "Mental strength grows the same way muscles do — through repeated small challenges." },
  { word: "PATIENCE", definition: "The capacity to accept delay or difficulty without getting upset.", fact: "Practicing patience is linked to lower blood pressure and reduced anxiety." },
  { word: "COURAGE", definition: "The ability to do something that frightens you.", fact: "Courage doesn't mean absence of fear — it means acting despite it." },
  { word: "BALANCE", definition: "A state in which different things occur in equal or proper amounts.", fact: "Your inner ear and eyes work together with your brain to keep physical balance." },
  { word: "ENERGY", definition: "The strength and vitality required for sustained activity.", fact: "Even mild dehydration of 1-2% can noticeably reduce your energy and focus." },
  { word: "HOPE", definition: "A feeling of expectation and desire for a certain thing to happen.", fact: "Hopeful thinking activates the same brain reward pathways as achieving a goal." },
  { word: "KINDNESS", definition: "The quality of being friendly, generous and considerate.", fact: "Acts of kindness release oxytocin, sometimes called the 'bonding hormone'." },
  { word: "RESILIENT", definition: "Able to withstand or recover quickly from difficult conditions.", fact: "Resilience isn't fixed — it can be strengthened through practice and support." },
  { word: "PRESENT", definition: "Existing or occurring now; being attentive to the current moment.", fact: "Mind-wandering is linked to lower happiness, even when the wandering thought is pleasant." },
  { word: "JOURNAL", definition: "A daily record of events or thoughts, kept for personal reflection.", fact: "Regular journaling has been shown to reduce intrusive, stressful thoughts." },
  { word: "LAUGHTER", definition: "The action or sound of laughing.", fact: "Laughing increases oxygen intake and can relax muscles for up to 45 minutes." },
  { word: "SUNLIGHT", definition: "The light that comes from the sun.", fact: "Morning sunlight exposure helps regulate your circadian rhythm and mood." },
  { word: "NATURE", definition: "The physical world including plants, animals and landscapes.", fact: "Just 20 minutes in nature can lower stress hormone levels significantly." },
  { word: "COMPASSION", definition: "Sympathetic concern for the sufferings of others.", fact: "Self-compassion is linked to lower anxiety and greater emotional resilience." },
  { word: "STILLNESS", definition: "The state of being calm, quiet and without movement.", fact: "Even brief moments of stillness can lower heart rate and blood pressure." },
  { word: "PURPOSE", definition: "A sense of meaning or reason for doing something.", fact: "People with a strong sense of purpose report better sleep and immune function." },
  { word: "TRUST", definition: "Firm belief in the reliability of someone or something.", fact: "Trusting relationships buffer the body's stress response more than almost anything else." },
  { word: "CURIOUS", definition: "Eager to know or learn something.", fact: "Curiosity activates the brain's reward system, similar to anticipating a treat." },
  { word: "STEADY", definition: "Firmly fixed, supported or balanced; not shaking or moving.", fact: "A steady daily routine helps regulate mood by stabilizing your body clock." },
  { word: "WARMTH", definition: "A feeling of affection or kindness.", fact: "Physical warmth (like a warm drink) can subtly increase feelings of social warmth." },
  { word: "RENEWAL", definition: "The action of resuming an activity or the state of being restored.", fact: "Short breaks during the day help renew focus better than pushing through fatigue." },
  { word: "HARMONY", definition: "A pleasing consistent whole; agreement or concord.", fact: "Listening to harmonious music can lower cortisol and reduce perceived pain." },
  { word: "VITALITY", definition: "The state of being strong and active; energy.", fact: "Regular movement, even brief walks, reliably boosts subjective vitality." },
  { word: "SERENE", definition: "Calm, peaceful and untroubled.", fact: "Green and blue environments are consistently rated as more serene by the brain." },
  { word: "WISDOM", definition: "The quality of having experience, knowledge and good judgment.", fact: "Wisdom tends to increase with age even as some memory functions decline." },
  { word: "EMPATHY", definition: "The ability to understand and share the feelings of another.", fact: "Mirror neurons in the brain help us feel echoes of others' emotions." },
  { word: "ANCHOR", definition: "A thing that provides stability or support.", fact: "Focusing on a single sensation, like your feet on the floor, can anchor you during anxiety." },
  { word: "GROWTH", definition: "The process of developing or maturing.", fact: "Believing abilities can grow (a 'growth mindset') improves resilience to setbacks." },
  { word: "RHYTHM", definition: "A strong, regular repeated pattern of movement or sound.", fact: "Your body runs on many rhythms — heartbeat, breath and the 24-hour circadian cycle." },
  { word: "SUPPORT", definition: "Giving assistance or comfort to someone.", fact: "Social support is one of the strongest predictors of long-term mental health." },
  { word: "CLARITY", definition: "The quality of being clear, coherent and easy to understand.", fact: "Mental clarity often improves after a short walk or a few minutes away from screens." },
  { word: "ACCEPT", definition: "To agree to receive or undertake something offered; to embrace as it is.", fact: "Accepting a difficult emotion, rather than fighting it, often reduces its intensity." },
  { word: "REFLECT", definition: "To think deeply or carefully about something.", fact: "Reflecting on the day's events before sleep can improve memory consolidation." },
  { word: "SOOTHE", definition: "To gently calm a person or their feelings.", fact: "Slow rhythmic movement, like rocking, activates the body's natural calming response." },
  { word: "OPTIMISM", definition: "Hopefulness and confidence about the future.", fact: "Optimists tend to have measurably better cardiovascular health over time." },
  { word: "INTENTION", definition: "A thing intended; an aim or plan.", fact: "Setting a small daily intention improves follow-through more than vague goals." },
  { word: "GROUNDED", definition: "Emotionally stable and sensible.", fact: "Naming five things you can see is a common technique to feel grounded fast." },
  { word: "RELAX", definition: "To make or become less tense or anxious.", fact: "Progressively tensing then releasing muscles can relax the whole body in minutes." },
  { word: "NOURISH", definition: "To provide with the substances necessary for health and growth.", fact: "What you eat can measurably affect mood within hours, not just long term." },
  { word: "PEACEFUL", definition: "Free from disturbance; tranquil.", fact: "Consistent bedtime routines help the brain associate certain cues with peaceful sleep." },
  { word: "RESTORE", definition: "To bring back to a former or better condition.", fact: "Deep sleep is when the body does most of its physical restoration and repair." },
  { word: "AWARE", definition: "Having knowledge or perception of a situation or fact.", fact: "Body awareness practices like a body scan can reduce chronic tension over time." },
];

export function scramble(word: string, seed: number): string {
  const rnd = seededRandom(seed);
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const joined = letters.join("");
  return joined === word && word.length > 1 ? word.split("").reverse().join("") : joined;
}

export function wordsForToday(date = new Date()): WordItem[] {
  const dayNum = Math.floor(date.getTime() / 86400000);
  const shuffled = seededShuffle(WORD_POOL, dayNum);
  return shuffled.slice(0, 5);
}

// ---------------- Gratitude journal ----------------
export const GRATITUDE_PROMPTS: string[] = [
  "What made you smile today?", "Name one person you are grateful for.", "What is working well in your life right now?",
  "What is a small comfort you often take for granted?", "What is something your body did for you today?",
  "Who has helped you recently, even in a small way?", "What is a skill or strength you are grateful to have?",
  "What food or meal are you thankful for today?", "What is a place that makes you feel at peace?",
  "What is something beautiful you noticed today?", "What challenge taught you something valuable?",
  "What is a memory that still makes you happy?", "What part of your daily routine are you thankful for?",
  "Who in your family are you grateful for and why?", "What is a piece of technology that makes your life easier?",
  "What is something you accomplished this week, big or small?", "What is a book, song or show you are grateful exists?",
  "What is something about your home you appreciate?", "What is a habit that has helped your health?",
  "What kindness did you receive recently?", "What kindness did you give recently?",
  "What is something in nature you are grateful for?", "What is a lesson a difficult experience taught you?",
  "What opportunity are you thankful for right now?", "What is something about today's weather you can appreciate?",
  "What is a tradition or ritual you value?", "What is a sense (sight, smell, taste, touch, hearing) you're grateful for today?",
  "What is something you are looking forward to?", "What is a mistake that ultimately helped you grow?",
  "What is one thing about yourself you are proud of?",
];

// ---------------- Affirmations ----------------
export const AFFIRMATION_POOL: string[] = [
  "I am taking care of my body one day at a time.", "My health is my greatest wealth.",
  "I choose progress over perfection.", "Every small healthy choice adds up.",
  "I am capable of building habits that last.", "I deserve rest, food, and movement that heal me.",
  "Today I show up for myself.", "I trust my body to heal and adapt.",
  "I am stronger than my toughest day.", "My peace of mind is worth protecting.",
  "I release what I cannot control.", "I am allowed to rest without guilt.",
  "I am growing, even on days it doesn't feel like it.", "My feelings are valid and temporary.",
  "I am doing the best I can with what I have today.", "I choose calm over chaos.",
  "I am worthy of love and care, especially from myself.", "Small steps still move me forward.",
  "I forgive myself for past mistakes.", "I am open to good things happening today.",
  "I breathe in calm and breathe out tension.", "My past does not define my future.",
  "I am proud of how far I have come.", "I trust the timing of my life.",
  "I am enough, exactly as I am right now.", "I choose to focus on what I can control.",
  "I welcome joy into my day.", "I am resilient and I can handle this.",
  "My mind is calm and my thoughts are clear.", "I approach today with curiosity, not fear.",
];

export function affirmationsForToday(date = new Date()): string[] {
  const dayNum = Math.floor(date.getTime() / 86400000);
  return seededShuffle(AFFIRMATION_POOL, dayNum).slice(0, 5);
}

// ---------------- Sudoku 4x4 ----------------
const SUDOKU_SOLUTIONS: number[][][] = [
  [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]],
  [[2, 1, 4, 3], [4, 3, 2, 1], [1, 2, 3, 4], [3, 4, 1, 2]],
  [[3, 4, 1, 2], [1, 2, 3, 4], [4, 3, 2, 1], [2, 1, 4, 3]],
  [[4, 3, 2, 1], [2, 1, 4, 3], [3, 4, 1, 2], [1, 2, 3, 4]],
];

export function sudokuForToday(date = new Date()): { grid: (number | null)[][]; solution: number[][] } {
  const dayNum = Math.floor(date.getTime() / 86400000);
  const solution = SUDOKU_SOLUTIONS[dayNum % SUDOKU_SOLUTIONS.length];
  const grid: (number | null)[][] = solution.map((row) => [...row]);
  const rnd = seededRandom(dayNum * 7919);
  const positions = Array.from({ length: 16 }, (_, i) => i);
  const keep = new Set<number>();
  while (keep.size < 6) keep.add(positions[Math.floor(rnd() * 16)]);
  for (let i = 0; i < 16; i++) if (!keep.has(i)) grid[Math.floor(i / 4)][i % 4] = null;
  return { grid, solution };
}

// ---------------- Tap the Dot ----------------
export const TAP_DOT_SCIENCE =
  "Reaction-time games like this train your brain's processing speed — the time it takes to notice something and respond. Regular practice can sharpen focus and hand-eye coordination.";

// ---------------- Activities meta ----------------
export type ActivityKey =
  | "meditation" | "breathing" | "memory" | "sudoku" | "unscramble" | "tap-dot" | "gratitude" | "affirmations";

export type ActivityMeta = {
  key: ActivityKey;
  name: string;
  time: string;
  description: string;
  gradient: string;
};

export const ACTIVITIES: ActivityMeta[] = [
  { key: "meditation", name: "Guided Meditation", time: "5 min", description: "A calm, voice-guided body scan to help you relax.", gradient: "linear-gradient(135deg,#a78bfa22,#7c3aed33)" },
  { key: "breathing", name: "Box Breathing", time: "2-5 min", description: "Follow the square to slow your breath and calm your nervous system.", gradient: "linear-gradient(135deg,#60a5fa22,#2563eb33)" },
  { key: "memory", name: "Memory Match", time: "3-5 min", description: "Flip cards and find pairs to sharpen focus and memory.", gradient: "linear-gradient(135deg,#34d39922,#05966933)" },
  { key: "sudoku", name: "Daily Sudoku 4x4", time: "5 min", description: "A bite-sized daily logic puzzle with a fresh grid every day.", gradient: "linear-gradient(135deg,#fbbf2422,#d9770633)" },
  { key: "unscramble", name: "Word Unscramble", time: "3-5 min", description: "Unscramble 5 words and learn a fact after each one.", gradient: "linear-gradient(135deg,#f472b622,#db277733)" },
  { key: "tap-dot", name: "Tap the Dot", time: "30 sec", description: "A 30-second reaction game — the dot gets faster and smaller.", gradient: "linear-gradient(135deg,#22d3ee22,#0891b233)" },
  { key: "gratitude", name: "Gratitude Journal", time: "3 min", description: "Answer 3 rotating prompts and build a timeline of gratitude.", gradient: "linear-gradient(135deg,#fb923c22,#ea580c33)" },
  { key: "affirmations", name: "Affirmation Cards", time: "2 min", description: "Swipe through 5 daily affirmations, save your favourites.", gradient: "linear-gradient(135deg,#f8717122,#e11d4833)" },
];

export function getActivity(key: string): ActivityMeta | undefined {
  return ACTIVITIES.find((a) => a.key === key);
}

// ---------------- localStorage completion tracking ----------------
const LS_KEY = "nirogi_mind_mood_completions";

type CompletionMap = Record<string, string[]>; // date -> activity keys

function readMap(): CompletionMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeMap(map: CompletionMap) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export function getCompletedToday(date = new Date()): string[] {
  const map = readMap();
  return map[todayKey(date)] ?? [];
}

export function markCompleted(key: string, date = new Date()) {
  const map = readMap();
  const k = todayKey(date);
  const list = new Set(map[k] ?? []);
  list.add(key);
  map[k] = Array.from(list);
  writeMap(map);
}

export function isCompletedToday(key: string, date = new Date()): boolean {
  return getCompletedToday(date).includes(key);
}

const GRATITUDE_LS_KEY = "nirogi_gratitude_entries_local";
export type LocalGratitudeEntry = { date: string; answers: string[] };

export function getLocalGratitudeEntries(): LocalGratitudeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(GRATITUDE_LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addLocalGratitudeEntry(answers: string[]) {
  const entries = getLocalGratitudeEntries();
  entries.unshift({ date: todayKey(), answers });
  window.localStorage.setItem(GRATITUDE_LS_KEY, JSON.stringify(entries.slice(0, 30)));
}

const AFFIRMATION_SAVED_KEY = "nirogi_saved_affirmations";
export function getSavedAffirmations(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(AFFIRMATION_SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function saveAffirmation(text: string) {
  const list = getSavedAffirmations();
  if (!list.includes(text)) {
    list.unshift(text);
    window.localStorage.setItem(AFFIRMATION_SAVED_KEY, JSON.stringify(list.slice(0, 50)));
  }
}
