# Deploying PEZA: Supabase + GitHub + Vercel + your domain

This app now has a real backend (was missing from the original export): a
Postgres schema, Supabase Auth, and a tRPC API that deploys as Vercel
serverless functions. Follow these steps in order.

## 1. Create the Supabase project

1. Go to supabase.com → New project. Pick a region close to your users.
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   `db/migrations/0000_init.sql`, and run it. This creates all tables.
3. Run `db/migrations/0001_seed.sql` the same way — it loads sample products,
   suppliers, market prices, and jobs so the app isn't empty on first load.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → this is `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon public` key → this is `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY` (never expose this to the browser)
5. Go to **Project Settings → Database → Connection string**, choose the
   **Transaction pooler** (port 6543), and copy it → this is `DATABASE_URL`.
   Replace `[YOUR-PASSWORD]` with your DB password from the same page.
6. (Optional) **Authentication → Providers** — email/password is enabled by
   default. If you want the "Sign in with Google" button to work, enable
   Google there and add your OAuth credentials.
7. **Authentication → URL Configuration** — once you know your Vercel/custom
   domain (steps below), add it to "Site URL" and "Redirect URLs".

## 2. Push the code to GitHub

```bash
cd app                 # this project folder
git init
git add .
git commit -m "PEZA marketplace with Supabase backend"
gh repo create peza-marketplace --private --source=. --push
# or manually: create a repo on github.com, then
# git remote add origin https://github.com/<you>/peza-marketplace.git
# git push -u origin main
```

## 3. Deploy to Vercel

1. vercel.com → **Add New → Project** → import the GitHub repo you just made.
2. Vercel auto-detects Vite. Leave build settings as-is (`vercel.json` in
   this repo already sets the build command and output directory).
3. Before the first deploy, add these **Environment Variables**
   (Project → Settings → Environment Variables), for all environments:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the pooled Supabase connection string from step 1.5 |
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |
   | `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

4. Click **Deploy**. Vercel installs dependencies, builds the frontend, and
   turns everything under `/api` into serverless functions automatically.
5. Once deployed, visit `https://<your-project>.vercel.app/api/health` — you
   should see `{"ok":true}`. If not, check the Function logs in Vercel first
   (Supabase connection issues show up there).

## 4. Connect your custom domain

1. In Vercel: Project → **Settings → Domains** → add your domain
   (e.g. `peza.africa` or `www.peza.africa`).
2. Vercel shows you either an A record + CNAME, or nameservers, depending on
   your setup. Add those records at your domain registrar (GoDaddy,
   Namecheap, Google Domains, etc.).
3. Wait for DNS to propagate (usually minutes, can take a few hours) — Vercel
   auto-provisions an SSL certificate once it verifies.
4. Go back to Supabase → **Authentication → URL Configuration** and update
   "Site URL" to your real domain, and add it to "Redirect URLs" too,
   otherwise login/OAuth redirects will send people to the old Vercel URL.

## 5. Local development (optional but recommended before deploying)

```bash
npm install
cp .env.example .env     # fill in the same values as step 3.3
npm run dev               # http://localhost:3000
```

`npm run dev` runs the Vite dev server with the Hono/tRPC API mounted at
`/api` via `@hono/vite-dev-server`, so the whole app — frontend and backend —
works locally exactly like it will on Vercel.

## What changed from the original export

- Added the entire backend: `db/schema.ts`, `db/index.ts`, `api/*` (tRPC
  routers for auth, products, orders, wallet, suppliers, market prices,
  jobs, chat, notifications) — none of this existed in the uploaded zip.
- Switched the database from MySQL to Postgres (Supabase requires Postgres).
- Replaced the proprietary Kimi OAuth login with Supabase Auth
  (email/password + optional Google OAuth) in `src/pages/Login.tsx` and
  `src/hooks/useAuth.ts`.
- Removed `kimi-plugin-inspect-react`, a private dev-only dependency that
  isn't published to the public npm registry and would have broken
  `npm install` anywhere outside Kimi's own build environment.
- Fixed two broken image references (`/peza-logo.png`, `/banners/*.jpg`)
  that were used in the code but never included in the export.
- Deleted `package-lock.json` (it referenced the private package above) —
  a clean one will be generated the first time you run `npm install`.

## Notes

- The shopping cart stays client-side (`localStorage`), matching the
  original design — no backend change needed there.
- Row Level Security is enabled on every table with no policies, since the
  app talks to Postgres only through the server-side `DATABASE_URL`
  connection, never through Supabase's public REST API.
- To make yourself an admin later, run in the SQL editor:
  `update profiles set role = 'admin' where email = 'you@example.com';`
