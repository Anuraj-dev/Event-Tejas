# Event Tejas

A private logo voting app for Team Tejas — members submit design entries and rank their favorites, with results tallied and updated live.

## What it does

Team members sign in with a Google account (restricted to authorized team members via Supabase Auth), upload up to two logo submissions each, and rank up to three other members' logos in order of preference once voting opens. Votes are scored with a simple weighted system (1st = 3 points, 2nd = 2 points, 3rd = 1 point) and the results page updates in real time as votes come in, using Supabase's realtime subscriptions. Author identity is hidden by default while voting is open and can be revealed afterwards via a settings flag.

## Features

- **Google OAuth login** restricted to team members, with route protection via Next.js middleware (`/submit`, `/vote`, `/results` all require a signed-in session).
- **Logo submission** — drag-and-drop or click-to-upload (PNG/JPG/SVG/WebP, up to 10MB), capped at 2 submissions per user, with the ability to delete and re-upload before voting closes.
- **Ranked voting** — pick and order up to 3 favorite logos (excluding your own); votes can be changed at any time while voting is open.
- **Live results** — a Borda-count leaderboard (3/2/1 points) that updates in real time via Supabase Realtime as new votes are cast, with a per-logo vote breakdown.
- **Row Level Security everywhere** — Postgres RLS policies enforce that users can only vote for others' logos, only edit their own submissions/votes, and author identity is hidden from queries until an admin toggles `reveal_authors`.
- **Voting open/close toggle** — a single `settings` row (managed directly in the database) controls whether voting is currently accepted.
- **Auto-provisioned profiles** — a Postgres trigger creates a `profiles` row (name, avatar) automatically on first sign-in via Google OAuth metadata.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions)
- [React 19](https://react.dev/)
- [Supabase](https://supabase.com/) (Postgres, Auth with Google OAuth, Storage, Realtime, Row Level Security)
- TypeScript
- Tailwind CSS 4

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is enough)

### Setup

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/Anuraj-dev/Event-Tejas.git
   cd Event-Tejas
   npm install
   ```

2. Create a Supabase project, then in the SQL Editor run the schema in [`supabase/schema.sql`](supabase/schema.sql). This creates the `logos`, `votes`, `settings`, and `profiles` tables, their RLS policies, the auto-profile trigger, and the public `logos` storage bucket.

3. In Supabase Auth settings, enable the **Google** OAuth provider and add your app's callback URL (`<your-url>/auth/callback`).

4. Create a `.env.local` file in the project root with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Project structure

```
src/app/
  login/            Google OAuth sign-in page
  auth/callback/     OAuth code exchange route
  submit/            Logo upload UI and page
  vote/              Ranked voting UI and page
  results/           Live leaderboard page
  middleware.ts      Route protection (redirects unauthenticated users)
src/lib/
  supabase/          Browser, server, and cached Supabase client factories
  actions.ts         Server actions: sign out, delete logo, cast votes
  types.ts           Shared TypeScript types
supabase/schema.sql  Full Postgres schema, RLS policies, and storage bucket setup
```
