# RCCG Covenant Embassy

A premium church website and member platform for **RCCG Covenant Embassy** in
Plano, Texas. The public site invites visitors to worship, watch sermons,
explore ministries, plan a visit, read the blog, and give online; a gated
member portal and an admin CMS sit behind authentication.

Built on the **Royal Covenant** design system — navy (`#0B1436`) and gold
(`#E8C66B`), Playfair Display / Inter / DM Mono, with a signature cathedral
"Arch" motif and scripture eyebrows.

---

## Tech stack

| Concern        | Choice                                                |
| -------------- | ----------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, TypeScript)         |
| Styling        | Tailwind CSS v4 (design tokens in `globals.css`)      |
| Database / ORM | Prisma v7 — SQLite in development                     |
| Auth           | NextAuth (Auth.js) v5 — Credentials + optional Google |
| Payments       | PayPal (one-time orders + recurring subscriptions)    |
| Validation     | Zod                                                   |
| Tests          | Vitest + Testing Library (jsdom)                       |

---

## Features

- **Public site:** home, about, ministries (+ detail), sermons (+ detail,
  YouTube embeds, save-for-later), events (+ detail), plan-your-visit, contact,
  blog (+ detail, Markdown), and give.
- **Giving:** PayPal one-time gifts (any amount) and recurring monthly gifts
  (fixed presets) across Tithe / Offering / Missions / Building funds, with a
  webhook that records donations and subscriptions.
- **Member portal (`/account`):** profile management and saved sermons.
- **Admin CMS (`/admin`):** CRUD for sermons, series, events, ministries, and
  blog posts, plus read-only donation and member views.
- **SEO:** per-page metadata with a title template, Open Graph + Twitter cards,
  a generated `sitemap.xml`, `robots.txt`, a branded OG image, and a gold "CE"
  monogram favicon.
- **Accessibility:** single `h1` per page, labelled form inputs with announced
  errors, a keyboard-operable mobile drawer, a skip-to-content link, a global
  gold focus ring, WCAG-AA color contrast, and `prefers-reduced-motion` support.

---

## Prerequisites

- **Node.js 20 or 22** (developed and tested on Node 22).
- **npm** (the repo ships a `package-lock.json`).

---

## Setup

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Create your local env file
cp .env.example .env

# 3. Set a real AUTH_SECRET in .env (required)
npx auth secret        # writes/updates AUTH_SECRET, or:
# openssl rand -base64 32

# 4. Create the SQLite database and apply migrations
npx prisma migrate dev

# 5. Seed demo content (sermons, events, ministries, blog, demo users)
npm run seed

# 6. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

### Demo logins

The seed creates two accounts you can sign in with at `/login`:

| Role   | Email                          | Password     |
| ------ | ------------------------------ | ------------ |
| Admin  | `admin@covenantembassy.org`    | `Admin123!`  |
| Member | `member@example.com`           | `Member123!` |

The admin account can reach the CMS at `/admin`; members land in `/account`.

---

## Tests & build

```bash
npm test          # vitest run — full unit/integration suite (157 tests)
npm run build     # production build (must be clean)
npm run lint      # eslint
```

> **Note on the test pool:** `vitest.config.ts` uses the `vmThreads` pool. The
> default `forks`/`threads` pools fail to propagate the runner config to
> workers under this Vite/Vitest/Node-on-Windows combination. The RBAC tests
> are written to be deterministic under `vmThreads` (they mock `@/lib/auth` to
> avoid loading the `next/server` runtime in the VM context, and assert against
> the real `NEXT_REDIRECT` throw shape so they don't depend on mock-hoisting
> timing).

---

## PayPal setup (sandbox)

Giving works end-to-end against the PayPal **sandbox**. Without credentials the
UI still renders, but checkout will not complete.

1. Create a sandbox app in the
   [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) and
   copy its **Client ID** and **Secret**.
2. Create a **webhook** on that app pointing at
   `https://<your-host>/api/paypal/webhook` and copy its **Webhook ID**.
3. Fill these in `.env`:

   ```dotenv
   PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"
   PAYPAL_CLIENT_ID="<sandbox client id>"
   PAYPAL_CLIENT_SECRET="<sandbox client secret>"
   PAYPAL_WEBHOOK_ID="<sandbox webhook id>"
   NEXT_PUBLIC_PAYPAL_CLIENT_ID="<sandbox client id>"   # exposed to the browser SDK
   ```

### Recurring (subscription) plans

Recurring gifts map a `(fund, amount)` pair to a pre-provisioned PayPal billing
plan. The presets are **$25 / $50 / $100 / $250** per month
(`src/lib/giving-config.ts`) across the **Tithe / Offering / Missions /
Building** funds.

Provision one billing plan per fund/amount in PayPal, then expose each plan id
via an env var named:

```
PAYPAL_PLAN_<FUND>_<AMOUNT>
```

For example:

```dotenv
PAYPAL_PLAN_TITHE_50="P-1AB23456CD789012E"
PAYPAL_PLAN_BUILDING_100="P-9ZY87654XW321098V"
```

**Graceful fallback:** `planIdFor(fund, amount)` returns an empty string when
the matching env var is unset, so the app surfaces a friendly "recurring giving
is not configured" message instead of crashing. One-time giving works without
any plan configuration.

---

## Replacing placeholder content

The site ships with intentional placeholders marked by `TODO` comments. Search
the codebase for `TODO` to find them all. Key categories:

- **Real photography** — hero/section images currently use Unsplash URLs and
  uploaded demo images (`{/* TODO: replace with real church photography */}` in
  the home, about, sermons, events, ministries, and blog pages).
- **Service times** — home page, footer, and `/visit`
  (`// TODO: confirm service times`).
- **Staff / leadership names** — `/about` team and the home page lead-pastor
  line (`// TODO: confirm real leader`, `{/* TODO: confirm lead pastor name */}`).
- **Address verification** — `3900 Pebblecreek Court #102, Plano, TX 75023`
  appears on `/visit` and `/contact` (`// TODO: confirm church address`).
- **Contact details** — phone and email on `/contact`
  (`// TODO: confirm phone`, `// TODO: confirm email`).
- **Social URLs** — footer and `/contact`
  (`// TODO: replace with real social profile URLs`).
- **Sermon video / event venue** — sermon detail and event detail pages.
- **Live keys** — see deployment below (PayPal live credentials, `AUTH_SECRET`,
  optional Google OAuth, `NEXT_PUBLIC_SITE_URL`).

Content managed through the **admin CMS** (sermons, events, ministries, blog)
can be edited in-app once you replace the seeded demo records.

---

## Deployment (Vercel + managed Postgres)

SQLite is for local development only. For production, deploy on **Vercel** with
a managed **PostgreSQL** database.

1. **Switch the Prisma datasource to Postgres** in `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

   Set `DATABASE_URL` to your managed Postgres connection string (the URL is
   read from `prisma.config.ts` / the `DATABASE_URL` env var). Then run
   migrations against the new database:

   ```bash
   npx prisma migrate deploy
   ```

2. **Set environment variables** in the Vercel project (Production + Preview):

   - `DATABASE_URL` — managed Postgres connection string
   - `AUTH_SECRET` — a fresh production secret
   - `NEXT_PUBLIC_SITE_URL` — the canonical production URL, e.g.
     `https://www.rccgcovenantembassy.org` (drives `metadataBase`, Open Graph,
     sitemap, and robots)
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — only if Google sign-in is wanted
   - PayPal: switch sandbox → **live** by setting
     `PAYPAL_API_BASE="https://api-m.paypal.com"` and supplying live
     `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`,
     `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, and the live `PAYPAL_PLAN_*` plan ids
   - Point the PayPal **live** webhook at `https://<prod-host>/api/paypal/webhook`

3. **Seed (optional):** for a fresh production database you can run the seed
   once, or create real content through the admin CMS instead.

> **Serverless upload caveat.** `src/lib/upload.ts` (`saveUpload`) writes
> uploaded images to the local disk under `public/uploads/`. Serverless hosts
> like **Vercel** have a read-only / ephemeral filesystem, so local-disk uploads
> do **NOT** persist and **will fail at runtime**. Before deploying to a
> serverless host, replace the body of `saveUpload` with an object-store
> implementation (**S3 / UploadThing / Cloudinary**); the function signature
> `(File) => Promise<string>` is the only contract callers depend on, so nothing
> else needs to change. Self-hosted / long-running Node servers with a
> persistent filesystem are fine as-is.

---

## Project layout

```
src/
  app/
    (marketing)/   Public pages (about, ministries, sermons, events, …)
    (auth)/        Login / register
    account/       Member portal (gated)
    admin/         CMS (admin-gated)
    api/           Route handlers (NextAuth, PayPal, newsletter)
    sitemap.ts     robots.ts  icon.svg  opengraph-image.tsx
  components/      UI primitives + site components
  lib/             auth, db (Prisma), rbac, money, paypal, validation, site, …
prisma/
  schema.prisma    seed.ts    migrations/
tests/             Vitest suites mirroring src/
```
