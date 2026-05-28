# MCCC Greens OS

Standalone web app for Merion Cricket Club greens committee operations: meetings, actions, strategic plan, trees, capital, committee roster, governance, and institutional continuity.

## Prerequisites

- Node.js 18 or newer
- A [Supabase](https://supabase.com) project (Postgres, Auth, Storage)
- A [Vercel](https://vercel.com) account (for deployment)

## Local setup

1. Install dependencies:

   ```bash
   cd mccc-greens-os
   npm install
   ```

2. Copy environment template and fill in values from the Supabase dashboard (Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

   Required for the app:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Recommended:

   - `OPENAI_API_KEY` — LLM meeting extraction and governance synthesis
   - `SUPABASE_DB_URL` — **server-only** Postgres URI for in-app migrations (see below)

3. **Automatic database setup (recommended)**

   Add `SUPABASE_DB_URL` to `.env.local` (Supabase → Project Settings → Database → connection string URI, mode: session or transaction).

   Start the app:

   ```bash
   npm run dev
   ```

   Sign in, then open **Governance → System setup** (`/admin/setup`):

   - Click **Run pending migrations**
   - Click **Run governance seeds**
   - Click **Verify database**

   No manual SQL copy/paste in the Supabase SQL editor is required when `SUPABASE_DB_URL` is set.

4. **Manual setup (fallback)**

   If you do not set `SUPABASE_DB_URL`, run files in `supabase/migrations/` in order in the Supabase SQL Editor, then run `seed_governance_bible_framework.sql`.

5. Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are sent to `/login`.

## Supabase checklist

1. **Auth** — disable email confirmation if you want immediate password login for dashboard-created users.
2. **Storage** — bucket `mccc-greens` for meeting files (authenticated read/write).
3. **First user** — Authentication → Users → Add user. `profiles` row is created via trigger.

## Vercel deploy

1. Push to Git and import in Vercel.
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - **`SUPABASE_DB_URL`** (server-only; required for `/admin/setup` migrations)
3. Deploy.
4. Sign in → **`/admin/setup`** → Run pending migrations → Run governance seeds → Verify database.

## Automatic governance updates

After transcripts are saved, extraction is applied, or backfill is approved, the app runs **targeted** governance synthesis (a few relevant Bible sections—not all 18). Full synthesis is available from System setup.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
- Supabase (`@supabase/ssr`)
- OpenAI for extraction and synthesis
- `postgres` package for server-side migration runner
