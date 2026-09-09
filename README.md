# team-log

## Overview

team-log is a team status and task-tracking app. Users can create a team or join one
with an invite code. The person who creates a team becomes its `director`; invited
users join as `members`.

Teams share a task feed containing a title, optional description, priority, status,
and optional deadline. Priorities are `low`, `medium`, `high`, and `urgent`. Tasks move
through `planned`, `in_progress`, and `done`; the app records when work starts and
finishes and highlights unfinished tasks past their deadline. The dashboard can filter
tasks by member, status, and priority. Data is isolated by team.

Directors can view the team feed, share the team invite code, and change member roles.
Users can change status or delete only tasks they authored.

## Tech stack

- Next.js 14 with the App Router
- TypeScript and React 18
- Prisma 5 with PostgreSQL hosted by Supabase
- NextAuth.js credentials authentication with JWT sessions
- `bcryptjs` for password hashing
- Tailwind CSS for styling
- Zod for request validation
- Lucide React for icons

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

   Fill in the variables described below.

3. Push the Prisma schema to PostgreSQL:

   ```bash
   npx prisma db push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`, then create a new team or join an existing team with
   its invite code.

## Environment variables

The project expects these variables in `.env`:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Supabase's pooled PostgreSQL connection string. Use the pooler connection on port `6543`. |
| `DIRECT_URL` | Supabase's direct PostgreSQL connection string. Use the direct connection on port `5432`; Prisma uses this for direct database operations. |
| `NEXTAUTH_SECRET` | Secret used to sign NextAuth sessions. Generate one with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | The exact base URL of the current app. Locally, use `http://localhost:3000`. |

Get both database URLs from the Supabase project connection settings. In Supabase,
the pooler URL uses port `6543` for `DATABASE_URL`, while the direct URL uses port
`5432` for `DIRECT_URL`. Keep the credentials and SSL parameters supplied by
Supabase.

### Important: set `NEXTAUTH_URL` after the first Vercel deploy

`NEXTAUTH_URL` cannot be known automatically before deployment. It depends on the
final domain assigned by Vercel, and that domain is not known until the first deploy
has completed. The AI or build process cannot safely guess or automate this value.

After the first deploy, manually copy the live URL shown in the Vercel dashboard,
then update the production `NEXTAUTH_URL` environment variable to match it exactly,
including `https://` and without an extra trailing slash. Save the variable and
redeploy the project so NextAuth uses the correct URL.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New Project** and connect the GitHub repository.
3. Add the Supabase `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, and an initial
   `NEXTAUTH_URL` value under the project's environment variables. Use the production
   environment for deployment values.
4. Deploy the project.
5. Open the live URL from the Vercel dashboard, replace the production `NEXTAUTH_URL`
   with that exact URL, and redeploy.
6. Push the schema to the production database using the production database URL:

   ```bash
   npx prisma db push
   ```

7. Visit the deployed app, create the first team, and share its generated invite code
   with teammates.

## Project structure

```text
prisma/
  schema.prisma                    Prisma models for Team, User, and Task
src/
  middleware.ts                    Protects /dashboard routes with NextAuth
  app/
    layout.tsx                     Fonts, metadata, and root layout
    page.tsx                       Root page
    globals.css                    Global styles and Tailwind layers
    login/page.tsx                 Credentials sign-in page
    signup/page.tsx                Create-team or join-team registration page
    dashboard/
      page.tsx                     Session-gated dashboard entry point
      LogFeed.tsx                  Task feed, filters, status actions, and team panel
    api/
      auth/[...nextauth]/route.ts  NextAuth credentials endpoint
      auth/register/route.ts       Team creation and invite-code registration
      tasks/route.ts                List and create team-scoped tasks
      tasks/[id]/route.ts           Update task status or delete authored tasks
      team/route.ts                 Return the current team and invite code
      team/members/route.ts         List current team members
      team/members/[id]/route.ts   Director-only role changes
  lib/
    auth.ts                         NextAuth configuration and session fields
    prisma.ts                       Prisma client singleton
  types/
    next-auth.d.ts                  NextAuth type extensions
```
