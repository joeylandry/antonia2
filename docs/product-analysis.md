# Product analysis: Antonia's current tracking workflow

Source: two photographs of Antonia's Excel workbook (client names redacted by the owner).
The images are not committed because they are photographs of client data.
Items are labelled **Shown** (visible in an image), **Inferred** (my reading), or **Unclear** (low legibility; needs confirmation).

## 1. What is shown

### Sheet "Client Overview" — *Personal Training & Fitness Assessment Tracker*
Subtitle (shown): "Track each client, assessment date, and review date. Use the Client 1–10 tabs for individual workout logs."

| Column | Shown values |
|---|---|
| Client Name | one row per client (redacted) |
| Client Type | `Fitness Assessment`, `Personal Training` (dropdown) |
| Assessment Date | dates (Aug 18 – Oct 13, 2026). Several cells also hold free text appended to the date: "on hold", "inactive", "wants to start PT in beginning of Nov", "30min 1x/week", "30min 2x/week", "nothing" |
| Review Date | dates (Oct 1 – Oct 23, 2026) |
| Primary Goal / Focus | free text: "gaining strength, improving shoulder problems", "preparing to hike the 4000 footers", "building a shelf, losing weight, gaining strength", "getting back into lifting heavy. Bench press and squat", "improving BMD, general strength", "toning out" |
| Client Tab | link to that client's own sheet (`Client 1` … `Client 10`) |

About 13 client rows are visible, so the "Client 1–10" tab limit is already exceeded or close to it.

### Sheet "Client N" — *Workout & Session Log*
Subtitle (shown): "Enter one exercise per row. Repeat the session date for each exercise in the same workout."
Header fields: Client Name, Start Date (e.g. Oct 6, 2026), Goal.
Goal example (shown): "squatting 180 by end of Oct, 250 by March; benching 130".

Columns: **Session Date · Workout / Focus · Exercise · Sets · Reps · Weight (lbs) · Notes / Progress**

Example content (some cells hard to read in the photo, marked *Unclear*):
- Oct 6, Lower Body: Goblet Squat 2 × 12 @ "24 then 32" ("24 felt easy, focus on feet hips length apart"); Dumbbell RDL 2 × 12 @ "15 then 20"; Lateral Band Walk 2 × 8 @ "orange" (a resistance band, not a weight); Cossack Squat; 90/90s; Heel Slides.
- Oct 7, Upper Body: Dumbbell Bench Press, Seated Row, Dumbbell Lat Raise, Pallof Press (reps "12 each side"), Thread the Needle, High Plank (reps/duration "20s–40s": "20 seconds felt easy so we moved to 40s").
- Oct 9, Fundamental/Full Body Day: Leg Press, KB Deadlift.

## 2. What this tells us

1. **Antonia tracks training performance, not body measurements.** No body weight, circumference, or body-fat columns appear. Progress means load, reps, and quality of movement over time.
2. **Her numbers are not clean numbers.** Reps and weight hold ranges ("12 to 14"), in-session progressions ("24 then 32"), per-side counts, durations ("20s–40s"), and non-weight loads ("orange" band). A numeric-only form would lose information or force her to change how she writes.
3. **Notes are the most valuable column.** They carry form cues and the reason a load changed. They must be first-class, searchable, and visible beside the numbers.
4. **Goals are mixed.** Some are lifestyle ("hike the 4000 footers", "building a shelf"), some are measurable lift targets with dates ("squat 180 by end of Oct, 250 by March; bench 130"), and one is clinical ("improving BMD", i.e. bone mineral density).
5. **The overview sheet is the real workflow driver.** Review Date is how she decides who needs attention. Status ("on hold", "inactive", "wants to start PT in Nov") and schedule ("30min 2x/week") are squeezed into the date cell because no column exists for them.
6. **Two client types form a pipeline.** A Fitness Assessment may convert to Personal Training (e.g. "wants to start PT in beginning of Nov").
7. **Sessions are grouped by workout.** The session date is repeated on every row, which Antonia must do by hand.

## 3. Pain points (inferred)
- Repeating the session date and re-typing the exercise names every row; no carry-forward of last session's loads.
- No way to see a lift's trend over time without scanning rows. No charts.
- Status and schedule hidden in date cells; no overdue-review signal.
- Capped at 10 client tabs; adding a client means copying a tab and updating a link by hand.
- Goal progress (squat 180 by end of Oct) is judged by eye.
- Free-text typos make the same exercise appear under different names ("Dumbbell RDL" vs "DB RDL").
- Client data in a personal spreadsheet with no access control beyond OneDrive.

## 4. Keep / redesign

| Keep | Redesign |
|---|---|
| One row per exercise, grouped under a dated session with a focus label | Session is created once; its date applies to all exercises |
| Free-text notes beside every exercise | Same, plus a searchable history |
| Free-form goals | Free-text goal kept; optional measurable target (exercise, weight, date) added |
| Client Type, Review Date | Add explicit status, schedule, and next-review fields; overdue reviews surface on the dashboard |
| Lbs | Lbs, stored as numbers so charts work |
| Ranges and progressions in her wording | Entered as separate sets, so "24 then 32" becomes two sets; labels like "orange band" and "each side" kept |

## 5. Proposed product (v1)

**Screens:** Dashboard · Clients (searchable list) · Client detail (Overview, Sessions, Progress, Goals) · Session entry · Settings/Account.

**Data model** (all rows carry `trainer_id`; Postgres row-level security restricts each trainer to their own rows):
`trainer_profiles`, `clients`, `goals`, `exercises` (the trainer's library, de-duplicating names), `sessions`, `session_entries`, `entry_sets`.

**Dashboard (only actionable items):** reviews overdue or due within 7 days; active clients with no session in 14+ days; prospects awaiting follow-up; goals due soon; recent sessions.

**Charts:** per-exercise top-set weight and total volume over time, with date ranges and goal target lines.

## 6. Out of scope for v1 (not shown in the images)
Body measurements, photos, payments or invoicing, scheduling or calendar, a client-facing portal, exercise video library. A configurable body-metrics feature can be added later without changing the above.

## 7. Assumptions and open questions
- **A1.** Weight unit is pounds only (column header "Weight (lbs)"). Kilograms are deferred.
- **A2.** One trainer today; every table is trainer-scoped for later multi-trainer use.
- **A3.** "Assessment Date" means the date of the initial fitness assessment; "Review Date" means the next planned progress review. *Please confirm.*
- **A4.** "BMD" is read as bone mineral density. Treated as a goal text only.
- **A5.** Some Notes cells in the photo are partly unreadable. No requirement depends on them.
- **Q1.** Does a review happen on a fixed cadence (e.g. every 4 weeks) or ad hoc? This decides whether the app should suggest the next review date.
- **Q2.** Is "Grace's client" a second trainer or an assistant who shares clients? If so, multi-trainer sharing is needed sooner.
- **Q3.** Does she want her existing history imported from Excel? A one-time CSV import is feasible but not planned for v1.
