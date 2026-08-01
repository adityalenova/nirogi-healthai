# Nirogi AI — family, credits, health score, new tools, legal pages, English-only

Built from the uploaded build-instructions document, mapped onto what already exists in the app.

## 1. Family profiles — finish the feature

The invite backend already exists (`family_invites`, `family_members`, `/invite/$token` accept page). What's missing is the front end and profile switching:

- "Invite family member" button in the dashboard Family section that creates an invite and shows a share sheet: copy link + WhatsApp share with the message from the doc.
- Horizontal scrollable family member cards: avatar (Google photo when joined), name, their health score /100.
- Tapping a card switches the whole dashboard to that member's data (wired through the existing active-member context), with a persistent banner "Viewing [Name]'s Profile" and a "Switch to my profile" button.
- View-only when browsing another member; max 6 members; revoke/remove controls.
- Only the group admin (owner) sees all members' scores; a joined member sees only their own.

## 2. Health Score rework + shareable card

- Rework the score into the four-pillar model, each out of 25: Physical Activity, Hydration, Sleep Quality, Personal OS. Ring shows total /100 with level label (Outstanding / Good / Average / Below Average / Poor).
- New "Share score" card rendered to an image: dark navy brand background, logo, "[Name]'s Health Score", big teal ring, four pillar bars, tagline "Catch it before it is too late — nirogi.ai", date. Exports 1080x1080 and 1080x1920.
- Share actions: WhatsApp, Facebook, download PNG, and story-size download for Instagram/TikTok.

## 3. Credit system redesign

Credits apply only to AI Doctor chat/voice — all 9 health tools stay free.

- 300 welcome credits on profile completion (celebration animation), 100 monthly refresh, 500 balance cap.
- Earning: daily login 5, first use of each tool 10 (max 90), all 9 tools in a week 100 bonus, prescription upload 15, add family member 25, referral 100 for referrer / 50 bonus for the new user.
- Spending: doctor chat 2 per exchange, voice call 5 per minute.
- Referral code = first name + 4 digits, with copy and WhatsApp share.
- Credit pill in the top navigation on every page: teal normally, orange under 50, red with "Earn credits" at 0.
- New `/credits` page: balance ring, countdown to next refresh, earn-credits list, referral block, full transaction history.

## 4. Tools from the document

- **Remove the menstruation card** and its route/nav entries; reflow the remaining cards.
- **Exercise tracker rebuild** — real live tracker: 20-activity selector, Start/Pause/Resume/Stop, HH:MM:SS timer, GPS distance for outdoor activities, DeviceMotion step counting, live MET-based calorie burn using profile weight, session summary, weekly summary (active minutes, calories, distance, most frequent activity, 7-day chart), and session history.
- **Water reminders via service worker** — schedule stored in the service worker so notifications fire with the tab closed; interval selector (30m/1h/90m/2h/custom), active hours, enable toggle, auto-stop at goal, resume next day, iPhone add-to-home-screen banner.
- **Prescription → medicine reminder approval** — after AI reads the prescription, an approval screen lists each medicine with name, dose and editable suggested times, with "Set reminder" / "Skip" per medicine plus "Set all", MedGuard interaction check before approval, and reminders firing as notifications.
- **Account & data controls** — deactivate, permanent delete, and health-history clearing (per-record delete, per-tool clear-all, clear-everything) with confirmation modals.

Google Fit REST integration (Task 8) needs a Google Fit OAuth client ID before it can work; I'll add the Integrations screen and connect/disconnect flow, and wire live syncing once the credential is provided.

## 5. Remove Hindi

Drop the Hindi dictionary, the language switcher, and the language field usage; the app becomes English-only. The `t()` helper stays as a thin pass-through so no page has to be rewritten.

## 6. UI/UX refinement

- Rebuild Privacy Policy, Cookie Policy and Terms of Service pages with a proper legal-document layout: hero header, last-updated line, section navigation, readable measure, and consistent card styling instead of the current bare text.
- General polish pass: consistent section spacing and card treatment across the dashboard, smoother entrance motion, better empty and loading states, tighter mobile layout. No redesign — the existing teal/emerald identity and component language stay exactly as they are.

## Technical notes

- New tables: `exercise_sessions`, `user_integrations`; `user_credits` gains referral code, refresh date and signup date columns. All with RLS scoped to `auth.uid()` and matching grants.
- Family reuses the existing `family_members` / `family_invites` tables rather than adding `family_groups` / `invite_links`, so current data keeps working.
- Score, credits and share-card generation run through server functions; the share image is rendered client-side to canvas.
- Scope note: this is a large shipment. Order of work is family → health score + share → credits → tools → legal/UI polish, and Hindi removal lands with the polish pass.
