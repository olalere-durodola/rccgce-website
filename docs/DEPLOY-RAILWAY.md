# Deploying to Railway

This app deploys to [Railway](https://railway.com) using Railway's managed
**PostgreSQL**. The same Postgres provider is used locally (see the README for
the local Docker one-liner) so there is no SQLite/Postgres mismatch.

How it works: on every `git push`, Railway runs the build, then on deploy runs
`npx prisma migrate deploy` (applying any new migrations) before starting
Next.js. This is configured in [`railway.json`](../railway.json):

```json
{
  "build":  { "buildCommand":  "npm ci && npx prisma generate && npm run build" },
  "deploy": { "startCommand":  "npx prisma migrate deploy && npm run start" }
}
```

`npm run start` is `next start -p ${PORT:-3000}` so Next binds to the `PORT`
Railway injects.

---

## 1. Create the project from GitHub

1. Railway dashboard → **New Project** → **Deploy from GitHub repo**.
2. Select `olalere-durodola/rccgce-website` and the branch you want to deploy
   (e.g. `chore/railway-deploy`, or merge to `main` first and deploy `main`).
3. Railway detects `railway.json` and uses the build/start commands above.

## 2. Add a PostgreSQL database

1. In the project → **New** → **Database** → **PostgreSQL**.
2. Railway creates a `Postgres` service exposing `DATABASE_URL`.
3. In the **web service** → **Variables**, add a reference variable so the web
   service receives the DB URL:

   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   ```

   (Railway may auto-link it; if `DATABASE_URL` is not already present on the web
   service, add the reference above manually. The `${{Postgres.DATABASE_URL}}`
   syntax pulls the value from the Postgres service.)

## 3. Set the service environment variables

On the **web service** → **Variables**:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (from step 2). |
| `AUTH_SECRET` | Generate with `npx auth secret` (or `openssl rand -base64 32`). |
| `AUTH_TRUST_HOST` | `true`. Required behind Railway's proxy so NextAuth v5 trusts the host. (Also hard-set as `trustHost: true` in code, so this is belt-and-braces.) |
| `AUTH_URL` | Optional. Your public URL, e.g. `https://<app>.up.railway.app`. Set it if you hit auth callback/redirect issues. |
| `NEXT_PUBLIC_SITE_URL` | Your Railway public URL or custom domain (no trailing slash). Drives metadata, sitemap, robots. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Only if Google sign-in is wanted. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_WEBHOOK_ID` | PayPal app credentials. |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` for testing, `https://api-m.paypal.com` for live. |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client id exposed to the browser. |
| `PAYPAL_PLAN_<FUND>_<AMOUNT>` | Optional recurring-giving plan ids, e.g. `PAYPAL_PLAN_TITHE_50`. Unset => recurring shows a friendly "not configured" message; one-time giving still works. |

> `NEXT_PUBLIC_*` values are inlined at **build** time, so changing them
> requires a redeploy.

## 4. Migrations and seeding

- **Migrations run automatically** on every deploy via the start command
  (`npx prisma migrate deploy`). No manual step needed.
- **Seed once** (optional — populates demo content + demo users). The seed is
  idempotent. Run it as a one-off against the deployed DB, either:
  - locally with the Railway CLI:
    ```bash
    railway run npm run seed
    ```
    (`railway run` injects the project's env, including `DATABASE_URL`), or
  - from the Railway dashboard via the service's one-off / shell command:
    `npm run seed`.

  Demo logins after seeding:
  - ADMIN — `admin@covenantembassy.org` / `Admin123!`
  - MEMBER — `member@example.com` / `Member123!`

  Change/remove these before any real launch.

## 5. PayPal webhook

In the PayPal developer dashboard, set the webhook URL to:

```
https://<your-railway-domain>/api/paypal/webhook
```

and put its id in `PAYPAL_WEBHOOK_ID`.

## 6. Hobby-plan cost caveat

On Railway's **Hobby** plan the web service **and** the Postgres database both
draw from the same ~$5/month usage allowance. A small always-on web service plus
Postgres can exceed that on a busy month — watch the usage meter, and consider
sleeping/scaling the service if needed.

---

## Known limitations

- **File uploads.** `src/lib/upload.ts` writes to local disk under
  `public/uploads/`. Railway containers have an ephemeral filesystem, so uploaded
  images do **not** persist across deploys/restarts. Use an object store
  (S3 / Cloudinary / UploadThing) before relying on admin image uploads in
  production — see the upload caveat in the README.
- **Build-time DB.** The DB-backed marketing pages (home, sermons, events,
  ministries, blog, and their `[slug]` detail pages) are marked
  `export const dynamic = "force-dynamic"`, so they render at request time and the
  `next build` step makes **no** DB connection. This is what lets the build
  succeed before migrations run (migrations apply on deploy, after build), and it
  means CMS content updates appear without a rebuild. Verified: `npm run build`
  passes with `DATABASE_URL` unset.

## Migration provenance

The Postgres migration in `prisma/migrations/0001_init/` was generated with
`prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
(no live DB), then verified by inspection (all tables, FKs, unique indexes, and
the `amount` `INTEGER` cents columns). It is applied for real the first time
`migrate deploy` runs against Railway's Postgres.
