<h1 align="center">Event Tejas</h1>

<p align="center">
  Logo voting for Team Tejas. Members submit designs and rank their favorites.<br />
  The leaderboard updates live as votes come in.
</p>

<p align="center">
  <a href="#getting-started">Set it up</a>
  ·
  <a href="#how-it-works">How it works</a>
</p>

Team members sign in with Google, upload up to two logos each, and rank up to three logos from other members. A first place vote is worth 3 points, second place 2 and third place 1. The results page recalculates as votes change, so the standings update without a refresh.

It is a Next.js 16 app written in TypeScript, with React 19 and Tailwind CSS 4. Supabase provides the Postgres database, Google sign-in, file storage and Realtime. There is no other backend. You bring your own Supabase project.

## What you get

- **Ranked voting with points.** Members pick up to three logos and put them in order. Change your ranking any time while voting is open. Each save deletes your old votes on the server and inserts the new set.
- **A live leaderboard.** The results page subscribes to Realtime changes on `votes` and recalculates the scores on every change. Each logo also shows how many 1st, 2nd and 3rd place votes it has.
- **Row Level Security on every table.** RLS is on for `logos`, `votes`, `settings` and `profiles`. The insert policy on `votes` rejects a vote for a logo its own author submitted. Members can change or delete only their own votes and logos. `castVotes` checks the same rule first, so the app shows a readable error.
- **Google sign-in with route guards.** `src/middleware.ts` sends signed-out visitors on `/submit`, `/vote` and `/results` to `/login`. Signed-in visitors on `/login` go to `/submit`. The `/auth/callback` route exchanges the Google code for a session.
- **Checked uploads.** The upload form accepts PNG, JPG, SVG and WebP files up to 10MB and stops at two logos per member. The `logos` Storage bucket enforces the same size and type limits. A policy allows writes only into the uploader's own `<user_id>/` folder.
- **One settings row for the vote.** `voting_open` makes `castVotes` refuse new votes. `reveal_authors` adds each submitter's name to the results page.
- **Profiles from Google.** The `on_auth_user_created` trigger copies the name and avatar from Google metadata into `profiles` when a user is created.

## Getting started

You need:

- Node.js 20.9 or newer. Next.js 16 requires it.
- A Supabase project. The free tier is enough.
- A Google OAuth client, which you add to Supabase in step 4.

### Setup

1. Clone the repo and install dependencies:

   ```sh
   git clone https://github.com/Anuraj-dev/Event-Tejas.git
   cd Event-Tejas
   npm install
   ```

2. Create the database. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `logos`, `votes`, `settings` and `profiles` tables, their RLS policies, the profile trigger and the public `logos` bucket.

3. Turn on Realtime for `votes`. The schema does not add the table to Realtime, so the live leaderboard does not update until you do. In the Supabase dashboard, add the `votes` table to Realtime from the Database section.

4. Enable Google sign-in. In Supabase Auth, turn on the Google provider and enter your Google OAuth client ID and secret. Add `<your-url>/auth/callback` to the allowed redirect URLs. For local development, also add `http://localhost:3000/auth/callback`.

5. Create `.env.local` in the project root:

   ```sh
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |

6. Start the dev server:

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You land on `/login`. Sign in with a Google account to reach `/submit`.

Other scripts:

```sh
npm run build   # production build
npm run start   # serve the build from npm run build
npm run lint    # ESLint
```

## Running a vote

Open and close voting, and reveal authors, from the Supabase SQL Editor. Members see the change the next time they load a page.

```sql
update public.settings set voting_open = false where id = 1;
update public.settings set reveal_authors = true where id = 1;
```

## How it works

Pages are Server Components. They read Supabase with the signed-in user's cookie, so RLS applies to every query. The middleware checks the session on each request and refreshes its cookie. Votes and deletes run as Server Actions in `src/lib/actions.ts`.

The voting and upload forms are client components. The results page loads the leaderboard on the server. Then `LiveResults` subscribes to `votes` and refetches all votes on each change.

```
src/app/
  login/            Google sign-in page and button
  auth/callback/    OAuth code exchange
  submit/           Logo upload page and form
  vote/             Ranking page and UI
  results/          Live leaderboard
src/components/Nav.tsx   Top navigation and sign-out
src/lib/actions.ts       Server Actions: sign out, delete logo, cast votes
src/lib/supabase/        Browser, server and cached Supabase clients
src/lib/types.ts         Shared types
src/middleware.ts        Route guards and session refresh
supabase/schema.sql      Tables, RLS policies, profile trigger, storage bucket
```

## Known gaps

- **Sign-in is not limited to the team.** The code accepts any Google account. Nothing checks the email domain or an allowlist. Restrict sign-in in your Supabase Auth settings before you share the URL.
- **Author names reach the browser.** The results page sends each logo's author profile to the client, so names are in the page data even when `reveal_authors` is false. The flag hides names in the interface only.
- **Submissions and deletes stay open after voting closes.** `voting_open` blocks only `castVotes`.
- **The two-logo limit is enforced in the form only.** The database does not count submissions per member.
- **Logo files are public.** The `logos` bucket is public, so anyone with a file's URL can open it.

## License

MIT. See [LICENSE](LICENSE).
