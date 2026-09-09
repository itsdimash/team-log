# The Log

A shared team status/task board. Teammates post what they're working on; a director
(boss) can view everyone's entries, filter by person/status/priority, and see when a
task actually started and how long it took.

Real accounts, hashed passwords, and per-team data isolation via an invite code — no
shared/global data, no localStorage.

## Stack

- Next.js 14 (App Router) + TypeScript
- PostgreSQL via Prisma
- NextAuth.js (Credentials provider, JWT sessions, bcrypt password hashing)
- Tailwind CSS

## Features

- **Sign up**: create a new team (you become its director) or join an existing one
  with an invite code (you join as a member).
- **Roles**: `member` can post/edit/delete only their own entries. `director` can view
  everyone's entries, filter the feed, and promote/demote teammates from the
  "Invite & roles" panel.
- **Entries**: title, optional description, priority (low/medium/high/urgent), optional
  deadline.
- **Status**: Planned → In progress → Done. Moving to "In progress" records `startedAt`
  automatically; moving to "Done" records `doneAt` and shows how long it took.
- **Overdue flag**: entries past their deadline that aren't done are highlighted.
- Data is scoped per team — one deployment can safely host multiple teams.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill it in:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: a Postgres connection string. Easiest options for local dev:
     - [Neon](https://neon.tech) or [Supabase](https://supabase.com) free tier (get a
       connection string instantly, no local install needed), or
     - a local Postgres via `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`
   - `NEXTAUTH_SECRET`: generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: leave as `http://localhost:3000` for local dev

3. Push the schema to your database:
   ```bash
   npx prisma db push
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`, click "Start a new team," and create your account.

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo.
3. In the project's **Storage** tab, add a Postgres integration (Vercel Postgres or
   Neon) — this automatically sets `DATABASE_URL` for you.
4. In **Settings → Environment Variables**, add:
   - `NEXTAUTH_SECRET` — a random secret (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-app.vercel.app`
5. Deploy. On the first deploy, run the schema push once against the production
   database (from your machine, with `DATABASE_URL` pointed at production):
   ```bash
   npx prisma db push
   ```
6. Open your deployed URL, create your team, and share the invite code shown in the
   "Invite & roles" panel with your teammates.

## Notes / possible next steps

- Password reset (forgot password) isn't wired up yet — it would need an email
  provider (e.g. Resend) to send reset links. The register/login flow is structured so
  this is a self-contained addition later.
- Roles are managed by any existing director from the "Invite & roles" panel.
- To swap Postgres for another provider, only `prisma/schema.prisma`'s `datasource`
  block and `DATABASE_URL` need to change.
