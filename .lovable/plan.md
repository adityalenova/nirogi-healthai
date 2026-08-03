# Nirogi Phase 3 — single shipment

Everything below ships in one pass, ordered by your priorities.

## 1. 3D Body View rebuild

Rework the body view into a realistic, animated model:
- Semi-transparent "x-ray" skin (head, torso, arms, legs) with teal tint, dark clinical background, blue-teal under-light.
- Detailed organ meshes: heart, left/right lungs, liver, stomach, both kidneys, brain, intestines, spine.
- Live animations: heart pulses at 72 BPM (uses your real heart-rate data when available), lungs breathe at 16/min, stomach peristaltic squeeze every 4s, liver slow pulse every 8s, brain neural sparks, red particle blood flow from the heart.
- Colour by status: teal healthy, amber watch, orange warning, red critical, grey no data — driven by your tool results (HeartSense→heart, MedGuard→liver/kidneys, SugarSense→pancreas/kidneys, ScanIQ→lungs, CalorieEye→liver/stomach, water→kidneys, sleep→brain).
- Drag to rotate, pinch to zoom, tap an organ to smoothly fly the camera in; a bottom panel shows organ name, status, the tool behind it, and a button to open that tool. Back button returns to full body.

**Body Systems section** (new, on the dashboard below 3D Body): horizontal row of 8 organ cards (heart, lungs, liver, stomach, kidneys, brain, intestines, skin), each with its own mini live 3D animation, status badge and one-line insight. Tapping opens a full-screen organ detail page with the large rotating organ plus: what it does, your organ health, what puts it at risk, how to protect it, related tools, and a consult-specialist button.

## 2. Family sign-in rebuild

- My Family lives only in the dashboard, between Health Score and the wellness trackers (no separate page).
- Horizontal row: your own card first with a "You" label, then each member, then an "Add Member" card. Each card 130×170 with photo, name, health score and a colour dot.
- Add Member opens a bottom sheet with two options: generate invite link (WhatsApp + SMS + copy) and enter invite code manually.
- Invite page shows "[Name] has invited you to their family health group", Join Now signs in with Google, then auto-links the member and shows their own dashboard.
- Tapping a member switches the whole dashboard to their data, with a sticky teal banner "You are viewing [Name]'s profile" and "Switch to my profile"; the active card gets a teal glow.
- Privacy: view-only across members, non-admins see only score numbers, full data only when that profile is active — enforced with database rules, not just UI.

## 3. Streaks & Badges (new dashboard cards)

- Streaks card: daily login, water goal, exercise, sleep, medicine, tool use — each with icon, day count and fire indicator; resets when a day is missed.
- Badges: 14 achievements (First Step, Health Detective, Hydration Hero, Sleep Champion, Heart Guardian, Sugar Warrior, Medicine Guardian, Family Protector, Fitness Streak, 100 Day Warrior, Cancer Preventer, X-Ray Reader, Referral Champion, Health Score 90+). Earned badges in colour, locked ones greyed.
- New `/badges` page with the full grid; the dashboard shows the 3 most recent with "View all".
- Earning a badge triggers a confetti celebration and a share card (WhatsApp, Instagram story 1080×1920, Facebook, PNG download) with the Nirogi logo, badge, your name, date and tagline.

## 4. Sleep tracker upgrade

- Setup: target bedtime and wake time pickers, calculated target duration, bedtime reminder toggle (30 min before), big Start Sleep Tracking button.
- Recording: mic permission, duration choice (4/6/8h or full night), sound-triggered capture above threshold so only disturbances are stored, motion logging for restlessness, live recording screen with pulsing indicator, elapsed time, sound-event count and Stop.
- Morning analysis via AI: snoring severity, suspected apnea, teeth grinding, sleep talking, coughing, quality score, recommendations, urgency.
- Report: duration vs target, score ring, sound analysis, movement, disturbance timeline, numbered recommendations, playable clips of detected events, and a red urgent banner + specialist referral when apnea is suspected.
- Weekly dashboard: 7-day duration/score chart, snoring nights, apnea nights in red, best/worst night, consistency score.

## 5. Today's Wellness (peace of mind)

New dashboard section with three cards, each opening its own page and behaving like the other health modules:
- **Mind & Mood** (`/wellness/mind-mood`) — daily mood check-in (5 emojis), gentle Dr. Amit Verma prompt after two very-low days, daily quote, 4-7-8 breathing animation, gratitude journal, puzzle of the day.
- **Gut Health** (`/wellness/gut-health`) — 5-question daily check-in, 3-day no-movement alert with Dr. Suresh Kumar, high-fibre Indian food of the day, three digestion yoga poses, animated abdominal massage guide, foods to avoid today.
- **Daily Energy** (`/wellness/daily-energy`) — energy check-in with 7-day chart, 2-minute morning wins, daily purpose statement from your goal, sunlight reminder, anti-fatigue food of the day, 2-minute micro-exercise challenge.

Completing an activity marks it Done and awards 5 credits (once per activity per day).

## 6. Music in guided breathing

Add a music bar to the breathing tool: built-in ambient tracks (calm drone, rain, ocean, om) that play and fade with the session, plus one-tap links to curated calm playlists on Spotify, YouTube Music and Apple Music using each service's official brand mark and colour, opening in their app when installed.

## 7. Water reminder notifications — fix

Current reminders rely on a timer inside the background worker, which the browser shuts down when idle, so nothing fires. Fix:
- Register the background worker at app start (not only on the install prompt) and store the schedule persistently so it survives worker restarts.
- Re-arm the reminder on every worker wake-up and catch up on a missed slot instead of silently skipping.
- Also schedule from the page while Nirogi is open, so reminders are reliable in the foreground.
- Add a "Send test reminder now" button plus clear permission state (blocked / allowed / iOS needs Add to Home Screen) so you can confirm it works immediately.

Note: on iPhone, notifications only work after installing Nirogi to the home screen — the UI will say so explicitly.

## Technical notes

- 3D: React Three Fiber + drei (OrbitControls, raycast picking, lerped camera), geometry primitives with emissive/physical materials — no heavy GLB downloads, keeps mobile smooth.
- New tables (with row-level security and grants): `family_groups`, rework of family membership/invites, `user_streaks`, `user_badges`, `sleep_reports`, `mood_logs`, `gratitude_journal`, `gut_health_logs`, `energy_logs`, `wellness_completions`.
- Sleep audio analysis runs through a server function on the Lovable AI gateway; only short detected clips are uploaded, not the whole night.
- Streak/badge evaluation runs server-side on dashboard load so counters and awards cannot be faked from the client.
- Account deactivation (data-preserved) from the same document is already covered by the existing account page and is left as-is.
