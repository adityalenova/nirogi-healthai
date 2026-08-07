/** Static content for the Today's Wellness rebuild — no runtime deps, plain data + pure helpers. */

/** Pick a stable "random" index for the day, optionally offset (for multi-item rotations). */
export function dayIndex(len: number, offset = 0, date = new Date()): number {
  const dayNum = Math.floor(date.getTime() / 86400000);
  return ((dayNum + offset) % len + len) % len;
}

// ---------------- Mind & Mood ----------------

export const MEDITATION_SCRIPT = [
  "Close your eyes.",
  "Take a slow deep breath in through your nose for 4 counts.",
  "Hold for 2 counts.",
  "Breathe out slowly through your mouth for 6 counts.",
  "Scan your body from head to toe.",
  "Notice any tension without judgment.",
  "Continue this breath pattern throughout our session.",
  "You are safe. You are here.",
  "Continue breathing. Each breath is making you calmer.",
  "The session is complete. Open your eyes slowly. Have a beautiful day.",
];

export const MOOD_OPTIONS = [
  { level: 1, emoji: "😞", label: "Very Low" },
  { level: 2, emoji: "😕", label: "Low" },
  { level: 3, emoji: "😐", label: "Neutral" },
  { level: 4, emoji: "🙂", label: "Good" },
  { level: 5, emoji: "😄", label: "Great" },
] as const;

export const MOOD_RESPONSES: Record<number, string> = {
  1: "That takes courage to acknowledge. You do not have to fix everything today. Take one breath. Dr. Amit Verma is here if you want to talk.",
  2: "Low days are part of the journey. Be gentle with yourself. Try the breathing exercise above — just 2 minutes can shift things. You showed up today. That matters.",
  3: "Neutral is okay. Not every day needs to be great. Do one small thing for yourself today — drink a glass of water, step outside for 2 minutes. Small moves matter.",
  4: "Good days build momentum. Use this energy to do one health thing you have been putting off — check a tool result, log your water, take a walk.",
  5: "This is the energy. Remember this feeling — what contributed to it? Log it in your gratitude journal so you can replicate it tomorrow.",
};

export const GRATITUDE_PROMPTS = [
  "What made you smile today?",
  "Name one person you are grateful for.",
  "What is working well in your life right now?",
];

export const AFFIRMATIONS_POOL = [
  "I am taking care of my body one day at a time.",
  "My health is my greatest wealth.",
  "I choose progress over perfection.",
  "Every small healthy choice adds up.",
  "I am capable of building habits that last.",
  "I deserve rest, food, and movement that heal me.",
  "Today I show up for myself.",
  "I trust my body to heal and adapt.",
  "I am stronger than my toughest day.",
  "My peace of mind is worth protecting.",
];

export function affirmationsForToday(date = new Date()): string[] {
  const start = dayIndex(AFFIRMATIONS_POOL.length, 0, date);
  return Array.from({ length: 5 }, (_, i) => AFFIRMATIONS_POOL[(start + i) % AFFIRMATIONS_POOL.length]);
}

export type SudokuPuzzle = { type: "sudoku"; grid: (number | null)[][]; solution: number[][] };
export type UnscramblePuzzle = { type: "unscramble"; scrambled: string; answer: string };
export type SequencePuzzle = { type: "sequence"; sequence: number[]; answer: number };
export type Puzzle = SudokuPuzzle | UnscramblePuzzle | SequencePuzzle;

const SUDOKU_SOLUTIONS: number[][][] = [
  [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ],
  [
    [2, 1, 4, 3],
    [4, 3, 2, 1],
    [1, 2, 3, 4],
    [3, 4, 1, 2],
  ],
];

const UNSCRAMBLE_WORDS: { word: string; scrambled: string }[] = [
  { word: "HEALTH", scrambled: "ELHATH" },
  { word: "BREATH", scrambled: "RBHEAT" },
  { word: "ENERGY", scrambled: "ENGREY" },
];

const SEQUENCES: { sequence: number[]; answer: number }[] = [
  { sequence: [2, 4, 8, 16], answer: 32 },
  { sequence: [1, 1, 2, 3, 5], answer: 8 },
  { sequence: [1, 4, 9, 16], answer: 25 },
];

export function puzzleOfTheDay(date = new Date()): Puzzle {
  const dayNum = Math.floor(date.getTime() / 86400000);
  const mod = dayNum % 6; // deterministic rotation across the three types
  if (mod % 3 === 0) {
    const solution = SUDOKU_SOLUTIONS[dayNum % SUDOKU_SOLUTIONS.length];
    const grid: (number | null)[][] = solution.map((row) => [...row]);
    // Blank out all but 6 cells.
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const keep = new Set<number>();
    let seed = dayNum;
    while (keep.size < 6) {
      seed = (seed * 9301 + 49297) % 233280;
      keep.add(positions[seed % positions.length]);
    }
    for (let i = 0; i < 16; i++) {
      if (!keep.has(i)) grid[Math.floor(i / 4)][i % 4] = null;
    }
    return { type: "sudoku", grid, solution };
  }
  if (mod % 3 === 1) {
    const w = UNSCRAMBLE_WORDS[dayNum % UNSCRAMBLE_WORDS.length];
    return { type: "unscramble", scrambled: w.scrambled, answer: w.word };
  }
  const s = SEQUENCES[dayNum % SEQUENCES.length];
  return { type: "sequence", sequence: s.sequence, answer: s.answer };
}

// ---------------- Gut Health ----------------

export type FoodOfDay = { name: string; nutrient: string; howTo: string };

export const HIGH_FIBRE_FOODS: FoodOfDay[] = [
  { name: "Ragi (finger millet)", nutrient: "3.6g fibre per 100g", howTo: "Make ragi dosa or ragi mudde for lunch" },
  { name: "Rajma (kidney beans)", nutrient: "6.4g fibre per 100g", howTo: "Rajma chawal — classic high-fibre meal" },
  { name: "Sabja seeds (basil seeds)", nutrient: "7g fibre per 100g", howTo: "Add 1 tsp to a glass of water and drink" },
  { name: "Psyllium husk (isabgol)", nutrient: "71g fibre per 100g", howTo: "Mix 1 tsp in warm water — drink before bed" },
  { name: "Banana", nutrient: "2.6g fibre per 100g", howTo: "Eat one ripe banana with breakfast" },
  { name: "Papaya", nutrient: "1.7g fibre per 100g", howTo: "Half a papaya in the morning on an empty stomach" },
  { name: "Spinach (palak)", nutrient: "2.2g fibre per 100g", howTo: "Palak dal or palak sabzi for dinner" },
  { name: "Chickpeas (chana)", nutrient: "7.6g fibre per 100g", howTo: "Chana chaat or chana curry" },
  { name: "Oats", nutrient: "10.6g fibre per 100g", howTo: "Oats porridge for breakfast with jaggery" },
  { name: "Sweet potato (shakarkand)", nutrient: "3g fibre per 100g", howTo: "Boiled or roasted as an evening snack" },
  { name: "Guava", nutrient: "5.4g fibre per 100g", howTo: "Eat one whole guava with a pinch of salt" },
  { name: "Moong dal (whole)", nutrient: "7.6g fibre per 100g", howTo: "Sprouted moong salad or moong dal khichdi" },
  { name: "Whole wheat (atta)", nutrient: "11g fibre per 100g", howTo: "Choose atta roti over maida-based bread" },
  { name: "Almonds", nutrient: "12.5g fibre per 100g", howTo: "Soak 5-6 overnight, eat first thing in the morning" },
  { name: "Flax seeds (alsi)", nutrient: "27g fibre per 100g", howTo: "1 tsp ground flax mixed into curd or roti dough" },
  { name: "Apple (with skin)", nutrient: "2.4g fibre per 100g", howTo: "Eat unpeeled as a mid-morning snack" },
  { name: "Carrots", nutrient: "2.8g fibre per 100g", howTo: "Raw carrot sticks or grated carrot salad" },
  { name: "Beetroot", nutrient: "2.8g fibre per 100g", howTo: "Boiled beetroot salad with lemon and salt" },
  { name: "Green peas (matar)", nutrient: "5g fibre per 100g", howTo: "Matar paneer or plain boiled peas" },
  { name: "Bajra (pearl millet)", nutrient: "11.5g fibre per 100g", howTo: "Bajra roti with ghee for dinner" },
  { name: "Jowar (sorghum)", nutrient: "6.3g fibre per 100g", howTo: "Jowar bhakri instead of wheat roti" },
  { name: "Drumstick (moringa)", nutrient: "3.2g fibre per 100g", howTo: "Sambar or drumstick curry" },
  { name: "Pomegranate", nutrient: "4g fibre per 100g", howTo: "A bowl of pomegranate seeds as a snack" },
  { name: "Cluster beans (gawar)", nutrient: "4.5g fibre per 100g", howTo: "Gawar phali sabzi with mustard tempering" },
  { name: "Amaranth leaves (chaulai)", nutrient: "3.5g fibre per 100g", howTo: "Sautéed chaulai saag with garlic" },
  { name: "Black chana (kala chana)", nutrient: "8g fibre per 100g", howTo: "Kala chana curry or a chaat with onions" },
  { name: "Fenugreek leaves (methi)", nutrient: "3.9g fibre per 100g", howTo: "Methi thepla or methi dal" },
  { name: "Dates (khajur)", nutrient: "6.7g fibre per 100g", howTo: "2-3 dates with warm milk before bed" },
  { name: "Whole moong sprouts", nutrient: "7.5g fibre per 100g", howTo: "Sprout salad with lemon and chaat masala" },
  { name: "Custard apple (sitaphal)", nutrient: "4.4g fibre per 100g", howTo: "Eat one whole fruit as a dessert" },
];

export function highFibreFoodOfDay(date = new Date()): FoodOfDay {
  return HIGH_FIBRE_FOODS[dayIndex(HIGH_FIBRE_FOODS.length, 0, date)];
}

export const YOGA_POSES = [
  {
    name: "Pawanmuktasana",
    subtitle: "Wind-relieving pose",
    steps: [
      "Lie flat on your back with legs extended.",
      "Bring both knees to your chest, hugging them with your arms.",
      "Lift your head slightly toward your knees.",
      "Hold for 20-30 seconds, breathing normally.",
      "Release slowly and relax.",
    ],
  },
  {
    name: "Balasana",
    subtitle: "Child's pose",
    steps: [
      "Kneel on the floor with big toes touching.",
      "Sit back on your heels and separate your knees hip-width.",
      "Fold forward, extending arms in front of you.",
      "Rest your forehead on the floor.",
      "Hold for 30 seconds, breathing deeply into your belly.",
    ],
  },
  {
    name: "Malasana",
    subtitle: "Squat pose",
    steps: [
      "Stand with feet slightly wider than hip-width.",
      "Lower into a deep squat, heels flat if possible.",
      "Bring palms together at your chest, elbows pressing against knees.",
      "Keep your spine long, chest lifted.",
      "Hold for 20-30 seconds.",
    ],
  },
];

export const ABDOMINAL_MASSAGE_STEPS = [
  "Lie on your back and relax your abdomen.",
  "Place your right palm flat below your navel.",
  "Massage in slow clockwise circles — this follows your colon's natural direction.",
  "Gradually widen the circles to cover your whole belly.",
  "Continue for 5 minutes, breathing slowly throughout.",
];

// ---------------- Daily Energy ----------------

export const ENERGY_RESPONSES: Record<number, string> = {
  1: "Your body is telling you something. Drink water immediately — dehydration causes 80% of afternoon fatigue. Try the 2-minute morning wins first. If this is every day, please run a HeartSense or SugarSense check.",
  2: "Low energy but you showed up. Try the sunlight timer — 10 minutes outside can shift your energy significantly. Also check your last night's sleep score.",
  3: "Moderate energy is the baseline. A micro exercise challenge right now will push you to a 4 within 10 minutes. The endorphin boost is real and fast.",
  4: "Good energy — this is your window. Use it. Do one health thing you have been avoiding. Check a tool, log your food, take a walk.",
  5: "Maximum energy. Use it on something that matters to your health goals. This is the day to exercise, cook a healthy meal, or have a doctor consultation.",
};

export const ENERGY_LEVELS = [
  { level: 1, label: "Exhausted" },
  { level: 2, label: "Very Low" },
  { level: 3, label: "Moderate" },
  { level: 4, label: "Good" },
  { level: 5, label: "Excellent" },
];

export const MORNING_WINS = [
  "Drink a glass of water now",
  "Stand up and stretch for 30 seconds",
  "Take 5 deep breaths",
];

export const ANTI_FATIGUE_FOODS: FoodOfDay[] = [
  { name: "Spinach (palak)", nutrient: "2.7mg iron per 100g", howTo: "Palak dal or a palak smoothie today" },
  { name: "Jaggery (gur)", nutrient: "11mg iron per 100g", howTo: "A small piece after lunch instead of sugar" },
  { name: "Pomegranate", nutrient: "Rich in iron & vitamin C", howTo: "A bowl of seeds mid-morning" },
  { name: "Beetroot", nutrient: "0.8mg iron + nitrates", howTo: "Boiled beetroot salad with lemon" },
  { name: "Ragi (finger millet)", nutrient: "3.9mg iron per 100g", howTo: "Ragi porridge for breakfast" },
  { name: "Chana (chickpeas)", nutrient: "6.2mg iron per 100g", howTo: "Chana chaat as an evening snack" },
  { name: "Dates (khajur)", nutrient: "0.9mg iron per 100g", howTo: "2-3 dates with milk before bed" },
  { name: "Bananas", nutrient: "Natural sugars + potassium", howTo: "One banana pre-workout for quick energy" },
  { name: "Eggs", nutrient: "1.2mg iron per egg", howTo: "Two boiled eggs at breakfast" },
  { name: "Almonds", nutrient: "3.7mg iron per 100g", howTo: "A handful soaked overnight" },
  { name: "Sesame seeds (til)", nutrient: "14.6mg iron per 100g", howTo: "Sprinkle 1 tsp roasted til on your dal" },
  { name: "Soybean", nutrient: "15.7mg iron per 100g", howTo: "Soya chunk curry for lunch" },
  { name: "Watermelon seeds", nutrient: "7.3mg iron per 100g", howTo: "Roasted as a mid-day snack" },
  { name: "Peanuts (moongfali)", nutrient: "4.6mg iron per 100g", howTo: "A small roasted handful with jaggery" },
  { name: "Amla (Indian gooseberry)", nutrient: "Very high vitamin C — boosts iron absorption", howTo: "One fresh amla or a spoon of amla juice" },
  { name: "Moong dal", nutrient: "3.9mg iron per 100g", howTo: "Moong dal khichdi for dinner" },
  { name: "Oats", nutrient: "4.7mg iron per 100g", howTo: "Oats with milk and a few nuts for breakfast" },
  { name: "Paneer", nutrient: "0.9mg iron + protein", howTo: "Paneer bhurji at breakfast or lunch" },
  { name: "Bajra (pearl millet)", nutrient: "8mg iron per 100g", howTo: "Bajra roti with ghee for dinner" },
  { name: "Coconut water", nutrient: "Electrolytes + natural sugars", howTo: "One glass in the afternoon slump" },
];

export function antiFatigueFoodOfDay(date = new Date()): FoodOfDay {
  return ANTI_FATIGUE_FOODS[dayIndex(ANTI_FATIGUE_FOODS.length, 0, date)];
}

export const MICRO_EXERCISES = [
  { name: "15 jumping jacks", instructions: "Jump feet apart while raising arms overhead, then back — repeat 15 times." },
  { name: "15 squats", instructions: "Feet shoulder-width apart, lower hips like sitting in a chair, stand back up — 15 reps." },
  { name: "20 high knees", instructions: "Jog in place, driving your knees up to hip height — 20 total (10 each leg)." },
  { name: "10 push-ups", instructions: "Full or knee push-ups, keeping your back straight — 10 reps." },
  { name: "60-second wall sit", instructions: "Back against a wall, knees at 90 degrees, hold for 60 seconds." },
];

export function microExerciseOfDay(date = new Date()) {
  return MICRO_EXERCISES[dayIndex(MICRO_EXERCISES.length, 0, date)];
}

export const SUNLIGHT_SCIENCE =
  "Go stand outside or near a window right now. Morning sunlight triggers serotonin production — your natural mood lifter — and helps set your body clock, improving sleep and energy the same day.";

export const GUT_CHECK_QUESTIONS: { key: "bowel_movement" | "bloated" | "stomach_pain" | "appetite_normal" | "hydrated"; question: string; goodAnswer: boolean }[] = [
  { key: "bowel_movement", question: "Did you have a bowel movement today?", goodAnswer: true },
  { key: "bloated", question: "Are you feeling bloated?", goodAnswer: false },
  { key: "stomach_pain", question: "Do you have any stomach pain?", goodAnswer: false },
  { key: "appetite_normal", question: "Is your appetite normal today?", goodAnswer: true },
  { key: "hydrated", question: "Have you had 8 glasses of water today?", goodAnswer: true },
];

export const IRON_DEFICIENCY_CONTEXT =
  "Over 50% of Indian women and a large share of men are iron-deficient, largely due to vegetarian diets low in easily-absorbed iron. Pairing iron-rich foods with vitamin C (lemon, amla, tomato) roughly triples absorption — small daily swaps make a real difference.";

// ---------------- Hub metadata (Gut Health & Daily Energy) ----------------

export type HubTool = { id: string; title: string; description: string; gradient: string };

export const GUT_TOOLS: HubTool[] = [
  { id: "gut-check", title: "Daily Gut Check", description: "5 quick yes/no questions for your gut score", gradient: "from-emerald-500 to-teal-600" },
  { id: "water-timer", title: "Warm Water Timer", description: "20-minute digestion kickstart ritual", gradient: "from-sky-500 to-cyan-600" },
  { id: "yoga", title: "Yoga for Digestion", description: "3 gentle poses to ease bloating", gradient: "from-violet-500 to-purple-600" },
  { id: "fibre", title: "High Fibre Foods", description: "Today's Indian pick and how to eat it", gradient: "from-lime-500 to-green-600" },
  { id: "massage", title: "Massage Guide", description: "5-step clockwise abdominal massage", gradient: "from-amber-500 to-orange-600" },
  { id: "recipe", title: "Gut Friendly Recipe", description: "Today's easy digestion-friendly recipe", gradient: "from-rose-500 to-pink-600" },
];

export const ENERGY_TOOLS: HubTool[] = [
  { id: "check-in", title: "Energy Check-In", description: "Tell us your energy level right now", gradient: "from-yellow-500 to-orange-600" },
  { id: "morning-wins", title: "2-Minute Morning Wins", description: "Three tiny tasks for an instant lift", gradient: "from-sky-500 to-blue-600" },
  { id: "sunlight", title: "Sunlight Timer", description: "10 minutes outside for a natural boost", gradient: "from-amber-400 to-yellow-600" },
  { id: "exercise", title: "Micro Exercise", description: "2-minute movement, today's pick", gradient: "from-red-500 to-rose-600" },
  { id: "foods", title: "Anti-Fatigue Foods", description: "Iron-rich Indian food of the day", gradient: "from-emerald-500 to-green-600" },
  { id: "chart", title: "7-Day Energy Chart", description: "See your energy trend across the week", gradient: "from-indigo-500 to-violet-600" },
];

/** Per-day, per-hub tool completion tracked in localStorage (no DB table for this). */
function hubDoneStorageKey(hub: string, date = new Date()) {
  return `nirogi-hub-done:${hub}:${date.toISOString().slice(0, 10)}`;
}

export function loadHubDone(hub: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(hubDoneStorageKey(hub));
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markHubToolDone(hub: string, toolId: string): Set<string> {
  const set = loadHubDone(hub);
  set.add(toolId);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(hubDoneStorageKey(hub), JSON.stringify([...set]));
  }
  return set;
}

// ---------------- Gut-friendly recipes ----------------

export type Recipe = { name: string; ingredients: string[]; steps: string[] };

export const GUT_RECIPES: Recipe[] = [
  { name: "Moong Dal Khichdi", ingredients: ["1/2 cup rice", "1/2 cup split moong dal", "1 tsp ghee", "1/2 tsp cumin", "1/4 tsp turmeric", "Salt to taste", "3 cups water"], steps: ["Wash rice and dal together.", "Pressure cook with turmeric, salt and water for 3-4 whistles.", "Heat ghee, splutter cumin, pour over khichdi.", "Serve warm — easy to digest and gentle on the gut."] },
  { name: "Curd Rice (Thayir Sadam)", ingredients: ["1 cup cooked rice", "1 cup fresh curd", "1/2 tsp mustard seeds", "1 dried red chilli", "Few curry leaves", "Salt to taste"], steps: ["Mash rice slightly and mix in curd and salt.", "Heat a little oil, splutter mustard seeds, chilli and curry leaves.", "Pour tempering over the curd rice and mix.", "Probiotic curd soothes and aids digestion."] },
  { name: "Vegetable Dalia (Broken Wheat Porridge)", ingredients: ["1/2 cup broken wheat (dalia)", "1 cup mixed vegetables, chopped", "1 tsp ghee", "1/2 tsp cumin", "Salt to taste", "2.5 cups water"], steps: ["Roast dalia in ghee until fragrant.", "Add cumin, vegetables and water.", "Pressure cook for 2-3 whistles.", "A high-fibre, light-on-the-stomach meal."] },
  { name: "Sabudana Khichdi (light version)", ingredients: ["1 cup soaked sabudana", "1 boiled potato, diced", "1 tbsp peanuts, crushed", "1 tsp ghee", "1/2 tsp cumin", "Salt and lemon juice"], steps: ["Heat ghee, splutter cumin.", "Add potato and peanuts, sauté briefly.", "Add sabudana, mix gently until translucent.", "Finish with lemon juice — gentle and filling."] },
  { name: "Vegetable Clear Soup", ingredients: ["1 cup mixed vegetables, chopped", "2 cups water or vegetable stock", "1/2 tsp ginger, grated", "Salt and pepper", "Coriander to garnish"], steps: ["Boil vegetables in water with ginger until soft.", "Season with salt and pepper.", "Garnish with coriander.", "Warm and hydrating — great before or after a heavy meal."] },
  { name: "Ragi Porridge", ingredients: ["3 tbsp ragi flour", "1.5 cups water or milk", "1 tsp jaggery", "A pinch of cardamom"], steps: ["Mix ragi flour with a little water to a smooth paste.", "Add to boiling water/milk, stirring continuously to avoid lumps.", "Cook 5-7 minutes until thickened.", "Sweeten with jaggery — rich in fibre for regularity."] },
  { name: "Papaya and Curd Bowl", ingredients: ["1 cup ripe papaya, cubed", "1/2 cup fresh curd", "1 tsp honey", "A few chia seeds (optional)"], steps: ["Combine papaya cubes with curd.", "Drizzle honey and sprinkle chia seeds.", "Eat on an empty stomach for best digestive benefit.", "Papaya's enzymes plus curd's probiotics support gut flora."] },
  { name: "Jeera Rice with Dal", ingredients: ["1 cup cooked rice", "1 tsp ghee", "1 tsp cumin seeds", "1 cup cooked toor dal", "Pinch of asafoetida", "Salt to taste"], steps: ["Heat ghee, splutter cumin and asafoetida.", "Toss cooked rice in the tempering.", "Serve with warm dal.", "Asafoetida and cumin help reduce bloating."] },
  { name: "Steamed Vegetable Idli", ingredients: ["1 cup idli batter", "1/4 cup grated carrot", "2 tbsp finely chopped beans", "Salt to taste"], steps: ["Mix vegetables into the batter.", "Pour into idli moulds.", "Steam for 10-12 minutes.", "Fermented batter is naturally probiotic and easy to digest."] },
  { name: "Buttermilk (Spiced Chaas)", ingredients: ["1 cup curd", "2 cups water", "1/2 tsp roasted cumin powder", "A pinch of black salt", "Few mint leaves"], steps: ["Whisk curd and water together until frothy.", "Add roasted cumin, black salt and mint.", "Serve chilled or at room temperature after meals.", "A classic Indian digestive drink."] },
  { name: "Vegetable Oats Upma", ingredients: ["1/2 cup rolled oats", "1/2 cup mixed vegetables, chopped", "1 tsp oil", "1/2 tsp mustard seeds", "Curry leaves", "Salt to taste"], steps: ["Dry roast oats lightly and set aside.", "Heat oil, splutter mustard seeds and curry leaves, add vegetables.", "Add water and bring to a boil, then stir in oats.", "Cook 3-4 minutes until soft — fibre-rich and light."] },
  { name: "Beetroot and Carrot Salad", ingredients: ["1/2 cup grated beetroot", "1/2 cup grated carrot", "1 tsp lemon juice", "A pinch of chaat masala", "Roasted peanuts (optional)"], steps: ["Combine grated beetroot and carrot.", "Toss with lemon juice and chaat masala.", "Top with roasted peanuts for crunch.", "Raw fibre helps keep digestion moving."] },
  { name: "Moong Sprouts Chaat", ingredients: ["1 cup moong sprouts, lightly steamed", "1/4 cup chopped onion and tomato", "1 tsp lemon juice", "Chaat masala and salt"], steps: ["Steam sprouts for 3-4 minutes to soften.", "Mix with onion, tomato, lemon juice and spices.", "Serve fresh.", "High in fibre and easy on digestion when lightly steamed."] },
  { name: "Vegetable Khichuri Soup", ingredients: ["1/4 cup rice", "1/4 cup moong dal", "1/2 cup chopped vegetables", "1/2 tsp turmeric", "Salt and ghee"], steps: ["Combine rice, dal, vegetables, turmeric and water in a pot.", "Simmer until everything is soft and soupy.", "Finish with a spoon of ghee.", "A soothing, one-pot gut-friendly comfort meal."] },
  { name: "Coconut Chutney with Idli/Dosa", ingredients: ["1/2 cup grated coconut", "1 tbsp roasted chana dal", "1 green chilli", "Salt and water", "Tempering: mustard seeds, curry leaves"], steps: ["Grind coconut, chana dal, chilli, salt and water to a smooth paste.", "Heat a little oil, splutter mustard seeds and curry leaves.", "Pour tempering over chutney.", "Pairs well with fermented idli/dosa for a gut-friendly combo."] },
];

export function recipeOfDay(date = new Date()): Recipe {
  return GUT_RECIPES[dayIndex(GUT_RECIPES.length, 0, date)];
}
