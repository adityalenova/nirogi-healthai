# Nirogi v4 — credits, 3D body, family privacy, tracker & score rework

One shipment, built in the order below.

## 1. Credits page + live credit pill

- New `/credits` page: balance ring with level colour, low-credit banner under 5, "ways to earn" list with claim buttons, and the full ledger (earned/spent, reason, timestamp) from the existing transaction table.
- Credit pill in the header on every page (coin icon + number), teal normally, orange when low, red at zero; taps through to `/credits`. It refetches after every credit-changing action so the number is always current.
- Credit rules move to the document's values: signup +50 grandfathered against the existing welcome grant, daily login +2, complete health profile +20, log sleep/water/steps +1 each per day, family member joins +15, share score card +5, weekly check-in +10.
- Tool costs applied as a gate before each AI run: MedGuard 2, CancerSense 5, SenseCheck hearing 3, vision 3, SkinScan 4, SugarSense 3, HeartSense 5, ScanIQ 8, CalorieEye 1, IngredientScan 2, MedVerify 1, DietPlan 5, WeightGoal 3, 3D Body View 3. When short, a modal shows the cost and the free ways to earn — never a hard block.

## 2. Remove the menstruation card

Drop the Menstrual Health card from the dashboard grid and every nav/quick-access list. The page itself stays in the codebase, just unlinked. Not be visible for users

## 3. 3D Body View (`/dashboard/body-3d`)

- Interactive Three.js body with separately named parts: heart, lungs, liver, brain, eyes, ears, skin, pancreas, stomach, intestines, kidneys, bones, muscles, blood vessels, fat layer. Built procedurally in-app (no external model download), so it always loads and every part is individually colourable.
- Each part is coloured green / yellow / orange / red from real data using the document's mapping (heart ← HeartSense + heart rate, lungs ← ScanIQ + SpO2, liver ← MedGuard, brain ← stress + sleep, eyes/ears ← SenseCheck, skin ← SkinScan, pancreas ← SugarSense, stomach ← CalorieEye, kidneys ← hydration, bones ← BMI/age, muscles ← fitness).
- Auto-rotate with drag to rotate, pinch zoom, double-tap reset, front/back flip.
- View modes: Full Body, Skeletal, Organ System. "Show Risks Only" fades healthy parts and pulses the risky ones.
- Tapping a part opens a bottom sheet: name, status badge, top 3 data points, last updated, "See full report" link to the source tool/module.
- Overall body score ring top-right, colour legend fixed at the bottom, and an AI-written plain-language body summary under the canvas.
- Costs 3 credits per full render; a new dashboard card links to it.
- Timeline scrubbing and before/after comparison are included as a date selector over stored score history; family body view falls back to grey for anything not shared.

## 4. Family invites & privacy

- `/family` page: member cards with photo, name, relationship badge, health score (when shared) and last active; plus a combined family score row.
- Invite flow: email or phone, relationship (Parent/Spouse/Child/Sibling/Other), permission preset (Full Access / Health Summary Only / Emergency Only / Custom), link generated with copy + WhatsApp share. Accepting prompts the joiner to set their own sharing preferences. +15 credits to the inviter when they join.
- `/family/privacy`: per-member toggles for health score, each AI tool report, each dashboard module, 3D body view, medication list, diet data, location, and health alerts. Instant effect, revoke either side.
- Viewing a member opens their profile read-only with lock icons on anything not shared, and the top-bar profile switcher toggles context between "My Health" and each member.

## 5. Prescription tool + water reminders

- After the AI reads a prescription: an approval screen listing each medicine with name, dose and editable times, MedGuard interaction check, "Set reminder"/"Skip" per medicine and "Set all", plus clearing a stored prescription.
- Water reminders move into the service worker so notifications fire with the tab closed: interval choice (30m/1h/90m/2h/custom), active hours, enable toggle, auto-stop once the goal is met, resume next day, and an iPhone add-to-home-screen hint.

## 6. Health score auto-update, share card, account controls, history

- Score recalculates on every new data point (tool report, sleep log, water log, steps, weight, wearable sync) instead of showing a stale number, using the four 25-point pillars: Physical Activity (steps 10 / frequency 8 / active calories 7), Hydration (goal 15 / 7-day consistency 10), Sleep Quality, Personal OS. Each recalculation is written to score history so trends and the 3D timeline work.
- Share card rebuilt to the 1080x1920 premium design: dark gradient with teal/purple glow, logo, first name, date, big score with ring and label, four pillar bars, top strength, top focus area, AI insight line, mini 3D body snapshot when available, tools-used badges, footer CTA. Download PNG, Web Share sheet, and a public `/score/$userId` page with no medical detail. +5 credits on share.
- Account controls: deactivate, permanent delete, and history clearing (per record, per tool, everything) with typed confirmation.
- History page gains filtering by tool, credit cost shown per entry, and per-item delete wired to the above.

## 7. Fitness & sleep trackers

- Exercise: live session tracker — activity selector, Start/Pause/Resume/Stop, HH:MM:SS timer, GPS distance outdoors, motion-sensor steps, live MET calorie burn from profile weight, session summary, weekly summary with a 7-day chart, and session history. Feeds the Physical Activity pillar and the muscles mesh.
- Sleep: bedtime/wake logging with duration and quality, 7-day chart, consistency insight, and AI sleep note. Feeds the Sleep pillar and the brain mesh.

## Technical notes

- New tables: `family_links`, `family_permissions`, `body_health_snapshots`; `scan_history` gains a credit-cost column. All with RLS scoped to `auth.uid()` and matching grants. Existing `family_members` / `family_invites` data is kept and bridged, not dropped.
- `three` is added as a dependency; the body model is generated in code rather than fetched, and the canvas is client-only so SSR is unaffected.
- Credit gating, score recomputation and family permission filtering all run server-side so balances and privacy can't be bypassed from the browser.
- Public `/score/$userId` reads through a narrow public policy exposing only score, pillars and the insight line.