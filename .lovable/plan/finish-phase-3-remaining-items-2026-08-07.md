# Finish Phase 3 — remaining items

Most of this shipment already landed: streaks + hexagon badges, sleep tracker upgrade with weekly dashboard, water reminder notification fix, My Family rebuild, breathing/meditation music, the 3D body model and Body Systems section, and the new Mind & Mood wellness page.

I switched into plan mode mid-way, so the last few items need build mode to complete.

## 1. Fix two type errors

- `dashboard.body-3d.tsx`: the status chip colour/label maps are missing the `none` ("no data") case. Type both maps as `Record<OrganStatus["status"], string>` and add `none` → muted styling, label "No data".
- `dashboard.organs.$organ.tsx`: the route param is untyped when indexing the organ info record. Narrow it to `OrganKey` (validate against the known keys and show a not-found state otherwise).

## 2. Finish the two remaining wellness pages

Rebuild the content inside these pages using the already-created `src/lib/wellness-content.ts` data library:

- **Gut Health**: 30-second gut check, warm water 20-minute challenge, three animated digestion yoga poses, high-fibre Indian food of the day (rotating 30), abdominal massage guide with tappable steps, gut-check streak counter.
- **Daily Energy**: energy check-in 1-5 with the scripted responses, 2-minute morning wins (all three = 5 credits), 10-minute sunlight timer, anti-fatigue food of the day (rotating 20), daily micro exercise challenge, 7-day energy bar chart with trend note.

## 3. Reposition My Family on the dashboard

Move `<FamilySection />` out of the narrow grid column into its own full-width block, placed after the Health Score card and before the wellness trackers, as the spec requires.

## Technical notes

No database migrations are needed — everything uses existing tables. Work is limited to `dashboard.body-3d.tsx`, `dashboard.organs.$organ.tsx`, `gut-health.tsx`, `daily-energy.tsx`, `mindful.functions.ts`, and `dashboard.index.tsx`.
