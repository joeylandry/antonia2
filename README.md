# Antonia Training

Client management and progress tracking for a personal trainer. Next.js (App Router) + TypeScript + Tailwind CSS 4,
Supabase (Postgres and Auth), Recharts.

- **Today**: reviews due, clients who have gone quiet, goals coming up, prospects, recent sessions, one-step "Log session".
- **Clients**: search, filter, sort; fast add (name only); profile with goal, notes, schedule, review date; archive and restore.
- **Sessions**: one dated workout per entry, with sets, weights, notes per exercise and "Start from last session".
- **Progress**: per-exercise charts (top weight, volume, best reps, hold time) with date ranges and goal lines.
- **Goals**: free-text goals with optional measurable weight target; progress computed from logged sessions.
- **Export**: *Export all data* in the account menu downloads everything as JSON.

The reasoning behind the data model is in [`docs/product-analysis.md`](docs/product-analysis.md).

## Setup

### 1. Create the Supabase project
1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` in order: paste each file into the SQL editor, or use the Supabase CLI (`supabase link` then `supabase db push`).
3. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up". Accounts are created by an administrator only.
4. **Authentication → Users → Add user**: create Antonia's account (email + strong password, "Auto confirm"). To show her name in greetings, set user metadata `{"display_name": "Antonia"}` before the first sign-in, or update `trainer_profiles.display_name` afterwards.
5. **Authentication → URL Configuration**: set *Site URL* to the production URL and add `https://<your-domain>/auth/confirm` (and `http://localhost:3000/auth/confirm` for development) to *Redirect URLs*.
6. Password reset works with Supabase's default email template. If you customize the template, use the link
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
   For anything beyond a handful of emails, configure custom SMTP (Supabase's built-in sender is heavily rate limited).

### 2. Environment variables
Copy `.env.example` to `.env.local` (never commit it):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable (anon) key. Safe in the browser because row-level security protects every table. |
| `NEXT_PUBLIC_SITE_URL` | Public origin of the app, e.g. `https://app.example.com` |
| `APP_TIMEZONE` | Optional IANA timezone used for "today" and the greeting. Default `America/New_York`. |

The service-role key is **not** used and must not be added.

### 3. Run
```bash
npm install
npm run dev        # http://localhost:3000
```

## Quality checks
```bash
npm run lint
npm run typecheck
npm test           # unit tests (Vitest)
npm run test:db    # applies the migrations to a throwaway Postgres and runs the row-level-security tests (needs PostgreSQL 15+ binaries)
npm run build
npm run test:e2e   # Playwright against a running app and a real Supabase project; see tests/e2e/README.md
```

## Deploying (Vercel)
1. Import the repository in Vercel (framework preset: Next.js).
2. Add the environment variables above for Production (and Preview if wanted).
3. Deploy, then confirm the Supabase *Site URL* and *Redirect URLs* match the deployed domain.

## Security model
- Authentication is Supabase Auth (email + password). There is no public sign-up.
- `src/proxy.ts` refreshes the session and redirects signed-out visitors, but is only an optimistic check. Every page, server action and route handler re-verifies the user with `requireTrainer()` / `auth.getUser()`.
- Authorization lives in the database: every table has `trainer_id` with row-level security (`trainer_id = auth.uid()`), and composite foreign keys prevent one trainer's rows from referencing another's. This is what lets more trainer accounts be added later without exposing each other's clients. `npm run test:db` proves it.
- No client data is cached across users, and nothing sensitive is logged. Client records contain names, goals, notes and training data only (no contact details, by design).
- Security headers (frame denial, nosniff, referrer policy, HSTS) are set in `next.config.ts`.

## Backups and data safety
- Clients are archived rather than deleted. Permanent deletion requires an archived client and typing their name.
- Use *Export all data* for a portable JSON copy. Supabase provides automatic backups on paid plans; enable them for production.

## Known limitations
- Weights are in pounds only.
- Single-trainer UI: the schema supports more trainers, but there is no invite or admin screen.
- No client portal, scheduling or billing (not in the current workflow).
- No import from the existing Excel workbook yet.
