# PEZA Africa — Marketplace App

Zambia-focused B2B/agri-commerce marketplace. React 19 + Vite frontend, Hono +
tRPC backend, Supabase Auth, Postgres via Drizzle. Wallet payments, Chilimba
(rotating savings circles), rider delivery with live tracking, jobs board,
chat, and Infobip SMS/WhatsApp commerce.

Live at [shop.peza.africa](https://shop.peza.africa) (marketing site at
[www.peza.africa](https://www.peza.africa) is a separate Vercel project).

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind, shadcn/ui, tRPC client
- **Backend:** Hono (serverless entry point on Vercel), tRPC routers, Drizzle ORM
- **Data:** Postgres (Supabase-hosted), Supabase Auth
- **Messaging:** Infobip (SMS + WhatsApp)

## Local development

```bash
npm install
cp .env.example .env   # fill in Supabase + DB values
npm run dev
```

Runs the Vite dev server. The tRPC API is served from `/api/*` — see
`server/app.ts` for the Hono entry point and `vercel.json` for how it's wired
into serverless functions in production.

## Database

Schema lives in `db/schema.ts` (Drizzle). Migrations are plain SQL in
`db/migrations/`, applied in order — see `DEPLOY.md` for the full first-time
setup (Supabase project creation, running `0000_init.sql`, seeding, env vars).

To add a new migration, create the next-numbered `NNNN_description.sql` file
and apply it via the Supabase SQL editor or your preferred Postgres client.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Project structure

```
src/            React app (pages, components, hooks, providers)
server/         Hono app, tRPC routers, auth context
  routers/      One file per tRPC router (order, wallet, chilimba, rider, ...)
  lib/          Server-side utilities (e.g. money.ts for cent-safe arithmetic)
db/             Drizzle schema + SQL migrations
api/            Vercel serverless function entry point(s)
```

## Deployment

See `DEPLOY.md` for the full Supabase → GitHub → Vercel → custom domain
walkthrough.
