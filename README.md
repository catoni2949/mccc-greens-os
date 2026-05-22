# MCCC Greens OS

Standalone web app for Merion Cricket Club greens committee operations: meetings, actions, strategic plan, trees, capital, committee roster, and communications.

## Prerequisites

- Node.js 18 or newer
- A [Supabase](https://supabase.com) project (Postgres, Auth, Storage)
- A [Vercel](https://vercel.com) account (for deployment)

## Local setup

1. Clone or copy this project and install dependencies:

   ```bash
   cd mccc-greens-os
   npm install
   ```

2. Copy environment template and fill in values from the Supabase dashboard (Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

   Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY` for server-only admin tasks later.

3. Apply the database schema in the Supabase SQL Editor: open `supabase/migrations/001_initial_schema.sql`, paste, and run.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are sent to `/login`.

## Supabase setup checklist

1. **Auth — disable email confirmation**  
   In Supabase: Authentication → Providers → Email → turn off “Confirm email”. Users created in the dashboard can sign in immediately with password.

2. **Run migration**  
   Execute `supabase/migrations/001_initial_schema.sql` in the SQL Editor (creates tables, `updated_at` triggers, and `handle_new_user` on `auth.users`).

3. **Storage bucket**  
   Create a bucket named `mccc-greens`. Policy: authenticated users can read and write objects in that bucket (adjust RLS policies as needed for production).

4. **First admin user**  
   Authentication → Users → Add user (email + password). No in-app sign-up; additional users are created the same way. A `profiles` row is created automatically on signup via the trigger.

## Vercel deploy

1. Push this app to its own Git repository (standalone from other projects).
2. Import the repo in Vercel → New Project.
3. Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` if you use it.
4. Deploy. Ensure Supabase Auth redirect URLs include your production origin (e.g. `https://your-app.vercel.app/auth/callback`) if you enable OAuth later.

## Stack

- Next.js 14 (App Router), TypeScript, `src/` directory, `@/*` imports
- Tailwind CSS, shadcn/ui (slate, CSS variables)
- Supabase (`@supabase/ssr`) for auth and future data
- lucide-react icons

## Current scope

Scaffold, schema migration, login, protected app shell with navigation, and placeholder pages. Data lists, forms, and dashboard content are planned for the next build.
