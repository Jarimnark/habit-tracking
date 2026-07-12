# Habits

Personal habit tracker. Next.js + Drizzle + Neon Postgres, deployed on Vercel with automatic database migrations on every deploy. See [DESIGN.md](./DESIGN.md) for the full design.

## Local development

```bash
cp .env.example .env   # fill in your Neon connection string and pick an APP_PASSWORD
npm install
npm run db:migrate     # apply migrations to your Neon database
npm run dev
```

## Changing the schema

1. Edit `src/db/schema.ts`
2. `npm run db:generate` — writes a new SQL migration into `drizzle/`
3. Commit the migration file. It will be applied automatically on the next deploy (and locally via `npm run db:migrate`).

## Deploying to Vercel

1. Create a [Neon](https://neon.tech) project.
2. Import this repo into Vercel and set the environment variables from `.env.example` (make sure `DATABASE_URL` is available to the **build** step — Vercel does this by default).
3. Deploy. The build runs `drizzle-kit migrate && next build`, so pending migrations are applied before the new version goes live; if a migration fails, the build fails and the previous deployment stays up.

The whole app sits behind the single `APP_PASSWORD` — sign in once and the session cookie lasts a year.
