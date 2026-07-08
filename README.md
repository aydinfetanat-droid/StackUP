# StackUp

Duolingo-style financial literacy web app for high school students. Mobile-first React + Vite app backed by Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → Providers → Email**, turn **off** "Confirm email" so students can sign up and start immediately (recommended for the pilot).
4. Copy `.env.example` to `.env.local` and fill in your Project URL and anon/public key from **Project Settings → API**.
5. `npm install`
6. `npm run dev`

## Project structure

- `src/data/lessons/*.json` — lesson content. Add a lesson by adding a JSON file here (see existing files for the card schema) and registering it in `src/data/lessons/index.ts` and `src/data/units.ts`.
- `src/components/cards/` — the five card types the lesson engine renders (explain, mcq, truefalse, slider, fillnumber).
- `src/context/AuthContext.tsx` — Supabase auth/session/profile state.
- `src/lib/analytics.ts` — event logging for pilot metrics.
- `supabase/schema.sql` — database schema + RLS policies.
