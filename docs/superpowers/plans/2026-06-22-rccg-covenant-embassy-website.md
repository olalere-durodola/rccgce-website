# RCCG Covenant Embassy Website — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Apply frontend-design:frontend-design when building UI, and superpowers:test-driven-development for all `/lib` logic, auth, and webhook tasks.

**Goal:** Build a premium full-stack church website + member platform for RCCG Covenant Embassy (Plano, TX): marketing pages, sermon library, events, online giving via PayPal, member accounts, and a staff admin CMS.

**Architecture:** Next.js 15 (App Router) + TypeScript single codebase. Prisma ORM over SQLite (portable to PostgreSQL). Auth.js for `MEMBER`/`ADMIN` role-based auth. PayPal JS SDK + Subscriptions + webhooks for giving. Tailwind CSS encoding the "Royal Covenant" design system (navy + gold, cathedral-arch signature, scripture-reference eyebrows).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Prisma + SQLite, Auth.js (NextAuth v5), Zod, PayPal (`@paypal/react-paypal-js` + REST), Vitest + React Testing Library, Playwright (optional smoke).

**Spec:** `docs/superpowers/specs/2026-06-22-rccg-covenant-embassy-website-design.md`

---

## Design system (apply throughout)

**Color tokens** — `navy #0B1436`, `royal #1C2A5E`, `gold #E8C66B`, `gold-deep #C9A23F`, `cream #F5F3EC`, `ink #11131A`, `muted #6B7280`.
**Type** — Display: Playfair Display (700/800). Body/UI: Inter (400/500/600/700). Utility/data: DM Mono (scripture eyebrows, stats, code-like labels).
**Signature** — `<Arch>` component: rounded cathedral-arch top frame with 1px gold keyline, used on hero + feature cards. `<ScriptureEyebrow>` component: gold DM Mono uppercase label, letter-spaced, with a short reference (e.g. `GENESIS 17:7`).
**Quality floor (every page):** responsive to 360px, visible keyboard focus rings (gold), `prefers-reduced-motion` respected, semantic landmarks, alt text, AA contrast.

## File structure

```
rccgce-website/
  prisma/schema.prisma, prisma/seed.ts
  src/
    app/
      layout.tsx, globals.css, page.tsx
      (marketing)/about,ministries,sermons,events,visit,contact,blog,give/...
      (auth)/login, (auth)/register
      account/...                # MEMBER
      admin/...                  # ADMIN
      api/auth/[...nextauth]/route.ts
      api/paypal/create-order/route.ts
      api/paypal/capture-order/route.ts
      api/paypal/create-subscription/route.ts
      api/paypal/webhook/route.ts
      api/newsletter/route.ts
    components/ui/               # Button, Card, Container, Section, Input, Badge, Arch, ScriptureEyebrow
    components/site/             # Header, Footer, Hero, SermonCard, EventCard, MinistryCard, GiveWidget, NewsletterForm
    lib/                        # db.ts, auth.ts, paypal.ts, validation.ts, utils.ts, rbac.ts
    types/
  tests/                        # unit + integration
  .env.example, README.md
```

---

## Phase 0 — Scaffold & tooling

### Task 0.1: Initialize repo & Next.js app
**Files:** whole project root.
- [ ] **Step 1:** `git init` in `c:/Users/WVRF/rccgce-website` (project is not yet a git repo).
- [ ] **Step 2:** Scaffold: `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint --no-turbopack` (accept into the existing non-empty dir; keep the `docs/` folder).
- [ ] **Step 3:** Add `.gitignore` entries: `.superpowers/`, `.env`, `dev.db`, `dev.db-journal`, `/public/uploads/*` (keep `.gitkeep`).
- [ ] **Step 4:** Run `npm run dev`, confirm default page at http://localhost:3000.
- [ ] **Step 5:** Commit: `chore: scaffold Next.js app with TypeScript + Tailwind`.

### Task 0.2: Install dependencies
- [ ] **Step 1:** `npm i prisma @prisma/client next-auth@beta @auth/prisma-adapter zod bcryptjs @paypal/react-paypal-js date-fns clsx tailwind-merge`
- [ ] **Step 2:** `npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/bcryptjs`
- [ ] **Step 3:** Commit: `chore: add project dependencies`.

### Task 0.3: Test runner config
**Files:** Create `vitest.config.ts`, `vitest.setup.ts`.
- [ ] **Step 1:** Configure Vitest with `jsdom` env, React plugin, `@/*` alias, setup file importing `@testing-library/jest-dom`.
- [ ] **Step 2:** Add `"test": "vitest run"`, `"test:watch": "vitest"` to `package.json`.
- [ ] **Step 3:** Write a trivial `tests/smoke.test.ts` (`expect(1+1).toBe(2)`), run `npm test`, expect PASS.
- [ ] **Step 4:** Commit: `chore: configure Vitest`.

### Task 0.4: Design tokens & fonts
**Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/utils.ts` (export `cn()` = clsx+twMerge).
- [ ] **Step 1:** In `layout.tsx`, load fonts via `next/font/google`: Playfair Display, Inter, DM Mono → expose as CSS vars `--font-display`, `--font-body`, `--font-mono`.
- [ ] **Step 2:** In `globals.css`, define the Tailwind v4 `@theme` block with the color tokens and font families above; set `body { background: cream; color: ink; font-family: var(--font-body); }`; add gold focus-ring utility and a `@media (prefers-reduced-motion)` reset.
- [ ] **Step 3:** Render a temporary swatch page to eyeball palette/fonts; confirm in browser; then delete it.
- [ ] **Step 4:** Commit: `feat: design tokens, fonts, and theme`.

---

## Phase 1 — UI primitives & signature components (TDD where logic exists)

### Task 1.1: `cn` util + Button + Badge
**Files:** Create `src/components/ui/button.tsx`, `badge.tsx`; Test `tests/ui/button.test.tsx`.
- [ ] **Step 1 (test):** Render `<Button variant="gold">Give</Button>`; assert it renders text and applies the gold class; render `asChild`-style link variant and assert `<a>`.
- [ ] **Step 2:** Run test — expect FAIL.
- [ ] **Step 3:** Implement Button (variants: `gold`, `navy`, `outline`, `ghost`; sizes `sm/md/lg`; rounded-full; gold focus ring) and Badge.
- [ ] **Step 4:** Run test — expect PASS.
- [ ] **Step 5:** Commit: `feat: Button and Badge primitives`.

### Task 1.2: Layout primitives — Container, Section, Card, Input
**Files:** `src/components/ui/{container,section,card,input}.tsx`; Test `tests/ui/primitives.test.tsx`.
- [ ] **Step 1 (test):** Assert `Section` renders children and accepts `tone="navy|cream"`; `Input` forwards `name`/`aria-invalid`.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Commit: `feat: layout & form primitives`.

### Task 1.3: Signature — `Arch` and `ScriptureEyebrow`
**Files:** `src/components/ui/arch.tsx`, `src/components/ui/scripture-eyebrow.tsx`; Test `tests/ui/signature.test.tsx`.
- [ ] **Step 1 (test):** `ScriptureEyebrow reference="Genesis 17:7" label="Covenant"` renders both strings in a `mono`/uppercase element. `Arch` wraps an `<img>`/children inside an arch-clipped frame (assert child renders + has the gold keyline class).
- [ ] **Step 2:** FAIL → implement (Arch via CSS `border-radius` top + SVG/clip-path arch and a gold 1px outline; reduced-motion safe) → PASS.
- [ ] **Step 3:** Build a temporary gallery page showing Arch + eyebrow over an Unsplash image; screenshot/eyeball; refine; delete page.
- [ ] **Step 4:** Commit: `feat: cathedral-arch + scripture-eyebrow signature components`.

### Task 1.4: Header & Footer
**Files:** `src/components/site/header.tsx`, `footer.tsx`; wire into `app/layout.tsx`. Test `tests/site/header.test.tsx`.
- [ ] **Step 1 (test):** Header renders nav links (About, Ministries, Sermons, Events, Visit, Give) and a gold "Give" CTA; mobile menu toggle has accessible `aria-expanded`.
- [ ] **Step 2:** FAIL → implement (sticky, navy on scroll, gold wordmark "Covenant Embassy", responsive drawer; Footer with service times, address `3900 Pebblecreek Court #102, Plano, TX`, socials, newsletter slot) → PASS.
- [ ] **Step 3:** Commit: `feat: site header and footer`.

### Task 1.5: Branded error & not-found boundaries
**Files:** `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx`.
- [ ] **Step 1:** Build brand-styled (navy + gold, arch motif) `not-found.tsx` (404) with a friendly "this page wandered off — here's the way home" message + primary nav links; `error.tsx` (500) with a recoverable "Try again" button (uses boundary `reset()`); `global-error.tsx` fallback.
- [ ] **Step 2:** Manually trigger a 404 and a thrown error to confirm the branded boundaries render.
- [ ] **Step 3:** Commit: `feat: branded error and not-found boundaries`.

---

## Phase 2 — Data layer & validation

### Task 2.1: Prisma schema + client
**Files:** `prisma/schema.prisma`, `src/lib/db.ts`.
- [ ] **Step 1:** Define datasource `sqlite` (`url = env("DATABASE_URL")`, default `file:./dev.db`) and all models from the spec: `User`(role enum via string), `Account`/`Session`/`VerificationToken` (Auth.js adapter), `Series`, `Sermon`, `Event`, `Ministry`, `BlogPost`, `Donation`, `Subscription`, `SavedSermon`, `NewsletterSignup`.
- [ ] **Step 2:** `npx prisma migrate dev --name init`; confirm `dev.db` created.
- [ ] **Step 3:** Implement `src/lib/db.ts` (singleton PrismaClient with global cache for dev).
- [ ] **Step 4:** Commit: `feat: Prisma schema and SQLite migration`.

### Task 2.2: Zod schemas
**Files:** `src/lib/validation.ts`; Test `tests/lib/validation.test.ts`.
- [ ] **Step 1 (test):** `registerSchema` rejects bad email & short password; `donationSchema` rejects amount ≤ 0 and unknown fund; `sermonSchema` requires title/slug.
- [ ] **Step 2:** FAIL → implement schemas (register, login, donation, subscription, sermon, event, ministry, blogPost, contact, newsletter) → PASS.
- [ ] **Step 3:** Commit: `feat: Zod validation schemas`.

---

## Phase 3 — Auth & RBAC (TDD)

> **Scope note — password reset:** Deferred from v1. Email-based password reset requires an
> email provider (SMTP/Resend) not in this build's scope; members use Google sign-in or
> admin-assisted reset for now. The `User` schema already supports it for a later phase. The
> `/login` page links to "Forgot password?" pointing at a `TODO:` placeholder explaining this.

### Task 3.1: Auth.js config
**Files:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/rbac.ts`, `.env.example`.
- [ ] **Step 1:** Configure NextAuth v5: Prisma adapter, JWT sessions, Credentials provider (verify `bcryptjs` against `User.hashedPassword`) + Google provider (env-gated). Add `role` to JWT + session callbacks.
- [ ] **Step 2:** Implement `rbac.ts`: `requireUser()`, `requireAdmin()` server helpers that read the session and redirect/403.
- [ ] **Step 3:** Add `.env.example` keys: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, all PayPal keys (see Phase 6) — with `# TODO: fill real values` comments.
- [ ] **Step 4:** Commit: `feat: Auth.js config with role-based session`.

### Task 3.2: RBAC unit tests
**Files:** Test `tests/lib/rbac.test.ts`.
- [ ] **Step 1 (test):** With a mocked session, `requireAdmin` throws/redirects for `MEMBER` and passes for `ADMIN`; `requireUser` redirects when no session.
- [ ] **Step 2:** FAIL (adjust signatures for testability — inject session getter) → make PASS.
- [ ] **Step 3:** Commit: `test: RBAC enforcement`.

### Task 3.3: Register & Login pages + server actions
**Files:** `src/app/(auth)/register/page.tsx`, `login/page.tsx`, `src/app/(auth)/actions.ts`; Test `tests/auth/register-action.test.ts`.
- [ ] **Step 1 (test):** `registerAction` hashes password, creates `MEMBER`, rejects duplicate email (mock Prisma).
- [ ] **Step 2:** FAIL → implement action + branded forms (Arch + scripture eyebrow, navy panel) using primitives → PASS.
- [ ] **Step 3:** Add `middleware.ts` protecting `/account/*` (auth) and `/admin/*` (admin).
- [ ] **Step 4:** Manual check: register → redirected to `/account`; logout/login works.
- [ ] **Step 5:** Commit: `feat: register/login flows with route protection`.

---

## Phase 4 — Public marketing pages (frontend-design applies)

> Build each page with real placeholder copy (write copy per the frontend-design writing guidance — plain, active, end-user voice), Unsplash imagery (documented `TODO:` for real assets), Arch hero, and scripture eyebrows. Pages read from Prisma (seeded in Phase 8); until then use the seed or typed fixtures.

### Task 4.1: Home page
**Files:** `src/app/page.tsx`, `src/components/site/{hero,sermon-card,event-card,ministry-card,newsletter-form}.tsx`.
- [ ] **Step 1:** Hero with cathedral-arch image, headline "A House of Covenant & Destiny", service-times strip, "Plan a Visit" + "Watch Online" CTAs.
- [ ] **Step 2:** Sections: welcome blurb, featured sermon, ministries preview (3), upcoming events (3), giving CTA band (navy + gold), newsletter signup.
- [ ] **Step 3:** Responsive + reduced-motion pass; eyeball in browser.
- [ ] **Step 4:** Commit: `feat: home page`.

### Task 4.2: About
**Files:** `src/app/(marketing)/about/page.tsx`.
- [ ] Vision/mission, our story, statement of beliefs (accordion), leadership grid (arch portraits + bios). Commit: `feat: about page`.

### Task 4.3: Ministries (list + detail)
**Files:** `ministries/page.tsx`, `ministries/[slug]/page.tsx`, reuse `MinistryCard`.
- [ ] List grid from `Ministry`; detail page with description, leader, meeting times. Commit: `feat: ministries pages`.

### Task 4.4: Sermons (list + detail + search/filter)
**Files:** `sermons/page.tsx`, `sermons/[slug]/page.tsx`, `src/components/site/sermon-filter.tsx`.
- [ ] **Step 1:** List with search box + series filter (client component over server data); featured/latest highlighted.
- [ ] **Step 2:** Detail: embedded video (responsive iframe), scripture, description, audio link, **Save** button (members; writes `SavedSermon` via server action — gated, no-op→login for guests).
- [ ] **Step 3:** Commit: `feat: sermons library with search and save`.

### Task 4.5: Events (list + detail)
**Files:** `events/page.tsx`, `events/[slug]/page.tsx`.
- [ ] Upcoming events sorted by `startsAt` (date-fns), detail with location/map link. Commit: `feat: events pages`.

### Task 4.6: Visit & Contact
**Files:** `visit/page.tsx`, `contact/page.tsx`, `src/app/api/newsletter/route.ts` + contact action.
- [ ] **Step 1 (test):** Contact action validates with Zod and persists/echoes; newsletter route dedupes email.
- [ ] **Step 2:** FAIL → implement; Visit = what to expect, times, embedded Google Map for Plano address; Contact = form + details + socials → PASS.
- [ ] **Step 3:** Commit: `feat: visit and contact pages`.

### Task 4.7: Blog (list + detail)
**Files:** `blog/page.tsx`, `blog/[slug]/page.tsx`.
- [ ] Render `BlogPost` (markdown → HTML via a small renderer), cover image arch, author/date. Commit: `feat: blog pages`.

---

## Phase 5 — Giving via PayPal (TDD on lib + webhook)

### Task 5.1: PayPal server client
**Files:** `src/lib/paypal.ts`; Test `tests/lib/paypal.test.ts`.
- [ ] **Step 1 (test):** `mapWebhookEvent()` maps `PAYMENT.CAPTURE.COMPLETED` → donation payload and `BILLING.SUBSCRIPTION.ACTIVATED` → subscription payload; unknown event → null. `verifyWebhook()` returns false on bad signature (mock fetch).
- [ ] **Step 2:** FAIL → implement: OAuth token fetch, `createOrder`, `captureOrder`, `createSubscription`, `verifyWebhookSignature` (REST `/v1/notifications/verify-webhook-signature`), `mapWebhookEvent`. Sandbox base URL via env → PASS.
- [ ] **Step 3:** Commit: `feat: PayPal server client and webhook mapping`.

### Task 5.2: Order & subscription routes
**Files:** `api/paypal/create-order/route.ts`, `capture-order/route.ts`, `create-subscription/route.ts`; Test `tests/api/paypal-routes.test.ts`.
- [ ] **Step 1 (test):** create-order validates amount/fund via Zod (rejects ≤0); capture-order records a `Donation` (status from capture) — Prisma + paypal mocked.
- [ ] **Step 2:** FAIL → implement routes (recurring restricted to predefined plan amounts $25/$50/$100/$250 per fund from config) → PASS.
- [ ] **Step 3:** Commit: `feat: PayPal order/subscription API routes`.

### Task 5.3: Webhook handler (idempotent)
**Files:** `api/paypal/webhook/route.ts`; Test `tests/api/paypal-webhook.test.ts`.
- [ ] **Step 1 (test):** Valid signed `PAYMENT.CAPTURE.COMPLETED` creates one `Donation`; re-delivering the same event id does NOT duplicate (idempotency by paypal id); bad signature → 401.
- [ ] **Step 2:** FAIL → implement (verify → map → upsert by unique paypal id) → PASS.
- [ ] **Step 3:** Commit: `feat: idempotent PayPal webhook handler`.

### Task 5.4: Give page UI
**Files:** `give/page.tsx`, `src/components/site/give-widget.tsx`.
- [ ] **Step 1:** Fund selector (Tithe/Offering/Missions/Building), one-time amount input + preset chips, one-time/recurring toggle (recurring shows preset plan amounts), `@paypal/react-paypal-js` Buttons wired to the routes.
- [ ] **Step 2:** Success/cancel/error states with branded copy; thank-you state.
- [ ] **Step 3:** Manual sandbox test: complete a sandbox one-time gift end-to-end; confirm `Donation` row.
- [ ] **Step 4:** Commit: `feat: giving page with PayPal one-time and recurring`.

---

## Phase 6 — Member portal

### Task 6.1: Account dashboard
**Files:** `account/page.tsx`, `account/giving/page.tsx`, `account/saved/page.tsx`, `account/profile/page.tsx` + update action; Test `tests/account/profile-action.test.ts`.
- [ ] **Step 1 (test):** profile update action validates and only edits the session user's record.
- [ ] **Step 2:** FAIL → implement: dashboard summary, giving history (from `Donation`/`Subscription`), saved sermons (from `SavedSermon`), editable profile → PASS.
- [ ] **Step 3:** Commit: `feat: member portal`.

---

## Phase 7 — Admin CMS

### Task 7.1: Admin shell + dashboard
**Files:** `admin/layout.tsx` (guard via `requireAdmin`), `admin/page.tsx`, `src/components/site/admin-nav.tsx`.
- [ ] Sidebar nav (Sermons, Series, Events, Ministries, Blog, Donations, Members); dashboard stats. Commit: `feat: admin shell`.

### Task 7.2: Sermons CRUD (template for other resources)
**Files:** `admin/sermons/page.tsx`, `admin/sermons/new/page.tsx`, `admin/sermons/[id]/page.tsx`, `src/app/admin/sermons/actions.ts`; Test `tests/admin/sermon-actions.test.ts`.
- [ ] **Step 1 (test):** create/update/delete actions enforce `requireAdmin` and validate with Zod (mock session + Prisma).
- [ ] **Step 2:** FAIL → implement actions + forms (image upload helper writing to `/public/uploads` behind `lib/upload.ts` abstraction) → PASS.
- [ ] **Step 3:** Commit: `feat: admin sermons CRUD`.

### Task 7.3: Events, Ministries, Series, Blog CRUD
**Files:** mirror Task 7.2 per resource.
- [ ] Reuse the established CRUD pattern + actions tests per resource. Commit per resource: `feat: admin <resource> CRUD`.

### Task 7.4: Donations & members (read-only)
**Files:** `admin/donations/page.tsx`, `admin/members/page.tsx`.
- [ ] Tables with filters; CSV export of donations (optional, YAGNI-guarded). Commit: `feat: admin donations and members views`.

---

## Phase 8 — Seed, content, polish, QA

### Task 8.1: Seed script
**Files:** `prisma/seed.ts`; add `"prisma": { "seed": "tsx prisma/seed.ts" }` + `npm i -D tsx`.
- [ ] Seed 1 ADMIN + 1 MEMBER (document creds in README), 2 series + 6 sermons, 4 events, 6 ministries, 3 blog posts, PayPal recurring plan config. Run `npx prisma db seed`. Commit: `feat: database seed`.

### Task 8.2: Content & imagery pass
- [ ] Replace lorem with church-appropriate copy (active voice, end-user framing per frontend-design writing guidance); Unsplash imagery with `TODO:` swap markers; real Plano address/service times placeholders. Commit: `content: realistic placeholder copy and imagery`.

### Task 8.3: Accessibility & responsive audit
- [ ] Keyboard-nav every page, focus rings visible, AA contrast (verify gold-on-navy and text), reduced-motion, mobile 360px. Fix issues. Commit: `fix: accessibility and responsive audit`.

### Task 8.4: SEO & metadata
- [ ] Per-page `metadata`, Open Graph, `sitemap.ts`, `robots.ts`, favicon/wordmark. Commit: `feat: SEO metadata`.

### Task 8.5: README & env
- [ ] README: setup, `.env` from `.env.example`, migrate/seed, PayPal sandbox setup, demo logins, deployment notes (Vercel + Postgres + live PayPal). Commit: `docs: project README`.

### Task 8.6: Full test + build gate
- [ ] Run `npm test` (all PASS) and `npm run build` (clean). Fix failures. Commit: `chore: green tests and production build`.

---

## Definition of done
- `npm run dev` serves all public pages, member portal, and admin CMS with branded Royal Covenant design (arch + scripture signature).
- Auth works with role gating; PayPal sandbox one-time + recurring gifts record donations via verified, idempotent webhook.
- `npm test` and `npm run build` pass clean; README documents setup, demo logins, and the `TODO:` swaps for real content/live keys.
