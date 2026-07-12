# Habit Tracker — Design

A personal habit-tracking web app. Single user (protected by a single app password), deployed on Vercel, backed by Neon Postgres, with database migrations applied automatically on every deploy.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, React Server Components) | First-class Vercel deployment, server actions remove the need for a REST layer |
| Database | Neon Postgres | Serverless Postgres with an HTTP driver that works well from Vercel functions |
| ORM / migrations | Drizzle ORM + drizzle-kit | TypeScript-first schema, SQL migrations generated from the schema, tiny runtime |
| Auth | Single app password (`APP_PASSWORD` env var) | Simplest thing that keeps a public URL private for one user — no OAuth setup, no auth library |
| Styling | Tailwind CSS v4 | Fast to iterate on a small personal UI |

## Architecture

```
Browser
  │  (all routes gated by middleware → session cookie check)
  ▼
Next.js on Vercel
  ├─ Server Components ── read queries (today view, habit detail)
  ├─ Server Actions ───── writes (check in, create/edit/archive habit)
  └─ /login ───────────── password form → sets the session cookie
  │
  ▼
Neon Postgres  (Drizzle over @neondatabase/serverless HTTP driver)
```

- **No REST API layer.** Reads happen in server components, writes in server actions. Every action re-checks the session server-side (middleware is the first gate, not the only one).
- **Password-gate auth, no auth library and no auth tables.** The login form compares against `APP_PASSWORD` and sets a year-long HTTP-only cookie whose value is a SHA-256 token derived from the password. Middleware (and every server action) recomputes the token and compares. Changing the password invalidates every session. This is deliberately minimal — the threat model is "strangers who find the URL," not targeted attacks.

## Data model

Two tables. Streaks and stats are computed at read time — at personal-use scale there's nothing to precompute.

```
habits                          checkins
──────                          ────────
id            serial PK        id          serial PK
name          text NOT NULL    habit_id    int FK → habits (cascade delete)
emoji         text             date        date NOT NULL   ← local calendar day
description   text             amount      double          ← for measurable habits
unit          text             note        text
target_amount double           created_at  timestamptz
sort_order    int
archived_at   timestamptz      UNIQUE (habit_id, date)
created_at    timestamptz
```

Design decisions:

- **A check-in row = "done that day."** Unchecking deletes the row. The `UNIQUE (habit_id, date)` constraint makes check-in idempotent (upsert) and guarantees at most one entry per habit per day.
- **Measurable habits are the same table.** A habit with a `unit` (e.g. "minutes", "km") is measurable; its check-ins carry an `amount`. `target_amount` is an optional daily goal shown in the UI. Habits without a unit are simple done/not-done.
- **Notes are per check-in**, optional on any habit type.
- **Archive, don't delete.** `archived_at` hides a habit from the today view but keeps its history. Hard delete exists too and cascades to check-ins.
- **Dates are calendar days, not timestamps.** The app resolves "today" using the `APP_TIMEZONE` env var (IANA name, e.g. `Asia/Bangkok`), so a check-in at 11pm local time lands on the right day regardless of the server's clock.

### Streaks

Computed in TypeScript from the ordered list of a habit's check-in dates:

- **Current streak**: consecutive days ending at *today or yesterday* (so the streak isn't shown as broken before you've had a chance to check in today).
- **Best streak**: longest consecutive run in history.

## Pages

| Route | Purpose |
|---|---|
| `/` | **Today** — every active habit with a check-off control; measurable habits get an amount input; optional note per check-in; current streak badge |
| `/habits` | Manage habits — create, edit, archive/unarchive, delete |
| `/habits/[id]` | Detail — streaks, totals, recent history with notes/amounts |
| `/login` | Password form |

## Auto-migration on Vercel deploy

Migrations are plain SQL files generated from the schema and committed to the repo. They are applied during the **build step**, so a deploy never goes live against a database that's missing its schema:

```
local:   edit src/db/schema.ts  →  npm run db:generate  →  commit drizzle/*.sql
deploy:  Vercel build  →  "build": "drizzle-kit migrate && next build"
                              │
                              └─ applies any pending drizzle/*.sql to Neon,
                                 recorded in the __drizzle_migrations table
                                 (already-applied files are skipped → idempotent)
```

Notes:

- `drizzle-kit migrate` connects using `DATABASE_URL_UNPOOLED` if set, falling back to `DATABASE_URL`. Neon's Vercel integration provides both; migrations prefer the direct (unpooled) connection.
- If a migration fails, the build fails — the previous deployment stays live. That's the desired failure mode.
- Runtime queries use Neon's pooled connection string over the HTTP driver.

## Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (runtime queries) |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string (migrations; optional, falls back to `DATABASE_URL`) |
| `APP_PASSWORD` | The password that gates the whole app; changing it signs out all sessions |
| `APP_TIMEZONE` | IANA timezone for resolving "today" (default `UTC`) |

## Later (deliberately out of v1)

- Flexible schedules (3×/week, weekdays only) — would add a `schedule` column on `habits` and change streak semantics
- Stats page with a year heatmap and completion-rate trends
- Reminders (email or push)
