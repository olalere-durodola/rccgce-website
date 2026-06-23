# RCCG Covenant Embassy — Website Design Spec

**Date:** 2026-06-22
**Status:** Approved (pending spec review)
**Reference:** https://www.rccgcovenantembassy.org/

## 1. Overview

A premium full-stack web application for **RCCG Covenant Embassy**, a Redeemed Christian
Church of God parish in Plano, Texas. The site serves as the church's primary online
presence and member platform: marketing/welcome pages for visitors, a sermon library,
events, online giving via PayPal, member accounts, and a staff-facing content management
system (CMS).

**Goals**
- Convey a dignified, trustworthy, "royal covenant" identity (premium church brand).
- Make it effortless for a first-time visitor to plan a visit and for members to give,
  watch sermons, and stay connected.
- Let non-technical staff manage content (sermons, events, ministries, blog) without code.

**Non-goals (YAGNI for v1)**
- Event RSVP/registration with ticketing.
- Live streaming infrastructure (we embed YouTube/Vimeo links instead).
- Mobile apps.
- Multi-campus / multi-tenant support.

## 2. Visual System — "Royal Covenant"

- **Palette:** midnight navy `#0B1436` (primary), royal blue `#1C2A5E`, gold `#E8C66B`
  (accent), warm cream `#F5F3EC` (light background), near-black ink and white for text.
- **Typography:** `Playfair Display` for headlines (serif, authoritative); `Inter` for
  body and UI (clean, legible).
- **Aesthetic:** generous whitespace, soft shadows, 12px rounded cards, gold hairline
  dividers, subtle fade-in-on-scroll motion. Premium, dignified, trustworthy.
- **Responsive:** mobile-first; all pages fully usable from 360px up to wide desktop.
- **Accessibility:** WCAG AA color contrast, semantic HTML, keyboard-navigable, alt text,
  focus states.

## 3. Sitemap

### Public pages
1. **Home** (`/`) — hero, welcome blurb, service times, "Plan a Visit" CTA, featured
   sermon, ministries preview, upcoming events, giving CTA, newsletter signup.
2. **About** (`/about`) — vision/mission, our story, statement of beliefs, leadership/pastor
   bios.
3. **Ministries** (`/ministries`) — grid of ministries (children, youth, men, women,
   worship, outreach), each with a detail view.
4. **Sermons** (`/sermons`) — searchable/filterable library by series and date; embedded
   video/audio; latest sermon highlighted. Detail page at `/sermons/[slug]`.
5. **Events** (`/events`) — upcoming services and programs as a list/calendar. Detail page
   at `/events/[slug]`.
6. **Give** (`/give`) — online tithes/offerings via PayPal: one-time and recurring, with a
   fund selector (Tithe / Offering / Missions / Building).
7. **Visit / I'm New** (`/visit`) — what to expect, service times, location, embedded map.
8. **Contact** (`/contact`) — contact form, address (Plano, TX), phone/email, social links.
9. **Blog** (`/blog`, `/blog/[slug]`) — optional articles/announcements (CMS-managed).

### Authenticated areas
- **Member portal** (`/account`) — profile, giving history, saved sermons. Role: `MEMBER`.
  A save/unsave control appears on `/sermons/[slug]` for logged-in members (writes to
  `SavedSermon`); saved sermons surface in `/account`.
- **Admin CMS** (`/admin`) — protected dashboard to create/edit/delete sermons, series,
  events, ministries, blog posts; view donations and members. Role: `ADMIN`.

### System
- Auth routes (`/login`, `/register`, password reset), `404`, `500`.

## 4. Architecture

- **Framework:** Next.js 15 (App Router) + TypeScript.
- **Styling:** Tailwind CSS with a custom theme encoding the Royal Covenant palette/fonts;
  a small set of reusable UI primitives (Button, Card, Section, Container, Input, Badge).
- **Data layer:** Prisma ORM. **SQLite** for local development (zero setup); the schema is
  written to be portable to PostgreSQL for production via the Prisma datasource provider.
- **Auth:** Auth.js (NextAuth) with Credentials + Google providers. Session strategy: JWT.
  Role-based access (`MEMBER`, `ADMIN`) enforced in middleware and server actions/route
  handlers.
- **Giving (PayPal):**
  - Client: PayPal JS SDK Smart Payment Buttons on `/give`.
  - One-time: create order server-side → capture on approval.
  - Recurring: PayPal **Subscriptions**. v1 uses a small set of **predefined monthly
    billing plans** (e.g., $25 / $50 / $100 / $250) provisioned per fund and stored in
    seed/config — the `/give` recurring toggle presents these preset amounts (not arbitrary
    values). One-time gifts allow any amount.
  - **Webhooks** (`/api/paypal/webhook`): verify signature, handle
    `PAYMENT.CAPTURE.COMPLETED` and `BILLING.SUBSCRIPTION.*` to persist `Donation` /
    `Subscription` records.
  - Sandbox credentials in v1; live keys are `TODO` in `.env`.
- **Images/uploads:** admin image uploads stored under `/public/uploads` in v1, behind an
  abstraction that can be swapped for S3/UploadThing later.
- **Config/secrets:** all secrets in `.env` (with `.env.example` committed). Never commit
  real keys.

### Data model (Prisma)
- `User` — id, name, email, hashedPassword? (authenticated by the Auth.js Credentials
  provider; null for OAuth-only users), image?, role (`MEMBER`|`ADMIN`), createdAt.
- `Series` — id, title, slug, description, imageUrl.
- `Sermon` — id, title, slug, speaker, date, scripture, description, videoUrl, audioUrl?,
  thumbnailUrl, seriesId?.
- `Event` — id, title, slug, description, startsAt, endsAt?, location, imageUrl, isFeatured.
- `Ministry` — id, name, slug, summary, description, imageUrl, leader?.
- `BlogPost` — id, title, slug, excerpt, body (markdown), coverImage, authorId, publishedAt.
- `Donation` — id, userId?, amount, currency, fund, paypalOrderId, status, createdAt.
- `Subscription` — id, userId?, paypalSubscriptionId, planName, amount, fund, status,
  createdAt.
- `SavedSermon` — userId, sermonId (join for member "saved" sermons).
- `NewsletterSignup` — id, email, createdAt.

## 5. Component & module boundaries

- **`/app`** — route segments (public, `(auth)`, `account`, `admin`, `api`).
- **`/components/ui`** — design-system primitives (no business logic).
- **`/components/site`** — composed sections (Header, Footer, Hero, SermonCard, EventCard,
  MinistryCard, GiveWidget, NewsletterForm).
- **`/lib`** — `db.ts` (Prisma client), `auth.ts` (Auth.js config), `paypal.ts` (server
  PayPal client + order/subscription/webhook helpers), `validation.ts` (Zod schemas).
- **`/prisma`** — `schema.prisma`, `seed.ts`.

Each unit has one clear purpose, communicates via typed props/function signatures, and is
independently testable. Business logic (PayPal, auth, data access) lives in `/lib`, not in
components.

## 6. Error handling

- Server actions / route handlers validate input with Zod; return typed errors.
- PayPal webhook verifies signatures and is idempotent (dedupe by PayPal order/subscription
  id) so retries don't double-record donations.
- Auth-gated routes redirect unauthenticated users to `/login`; non-admins get 403 on
  `/admin`.
- User-facing error and not-found boundaries (`error.tsx`, `not-found.tsx`) styled to brand.
- Forms show inline validation and friendly failure messages; network/PayPal failures show
  a recoverable retry state.

## 7. Content & data seeding

- Realistic, church-appropriate placeholder copy (Plano, TX details; pastor bios; sermon
  titles; ministry descriptions) and Unsplash imagery, with `TODO:` markers where real
  content should replace it.
- Prisma `seed.ts` populates: ~6 sermons across 2 series, ~4 events, ~6 ministries, ~3 blog
  posts, one `ADMIN` user and one `MEMBER` user (credentials documented in README).

## 8. Testing strategy

- **Unit/component:** Vitest + React Testing Library for UI primitives and key cards/forms.
- **Validation/logic:** unit tests for Zod schemas and PayPal helper logic (order/sub
  mapping, webhook idempotency) with PayPal calls mocked.
- **Integration:** auth role-gating (member vs admin access) and the PayPal webhook handler
  recording a `Donation` from a mocked event.
- Tests run in CI-friendly fashion against a fresh SQLite test database.

## 9. Deployment notes (future)

- Target: Vercel for the app; managed PostgreSQL (e.g., Neon/Supabase) for production —
  switch Prisma provider + connection string. PayPal switched from sandbox to live keys.
- This v1 delivers a fully working app locally with SQLite and PayPal sandbox.

## 10. Open items / TODO markers (handed to whoever fills real content)
- Real church photography, logo, exact service times, staff names/bios.
- Live PayPal client id/secret + webhook id; Google OAuth client; production database URL.
- Real social media URLs, phone, email, Google Maps embed for the Plano address.
