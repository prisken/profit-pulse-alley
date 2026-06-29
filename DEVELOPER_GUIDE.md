# Profit Pulse Ally — Developer Guide

Comprehensive reference for developers taking over or contributing to the **Profit Pulse Ally** website.

| Item | Value |
|------|-------|
| **Production URL** | https://profitpulseally.com |
| **Repository** | https://github.com/prisken/profit-pulse-alley.git |
| **App directory** | `--tailwindcss/` (Next.js project root) |
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | Vercel Postgres + Prisma 6 |
| **Auth** | Auth.js v5 (`next-auth@beta`) + Prisma Adapter |
| **Hosting** | Vercel — project `profit-pulse-alley`, auto-deploy from `main` |
| **Feature branch** | `revamp-market-pulse-july-2026` — Market Pulse July 2026 launch, i18n, admin users, onboarding fix, events update |
| **Production status** | Deploy from `main` after merge; public launch **1 Jul 2026 00:00 HKT**; first cycle **1–10 Jul 2026**; ADMIN test bypass before launch |

---

## Current site status (Jun 2026 revamp)

### Site strategy (current)

The public site centers on **Market Pulse** — a recurring multi-day investment challenge where members swipe **Bullish** or **Cautious** on daily market signal cards, earn participation points, and compete on leaderboards until **PPA Insight** is revealed at cycle end. Supporting pillars: **fireside events**, **membership**, and **expert-led philosophy** (PPA Take). Homepage is visual-first (dark zinc) with **bilingual** copy (EN / Traditional Chinese via `ppa_locale` cookie). Blog is nav/footer only.

### Market Pulse launch closure (Jul 2026)

| Actor | Before 1 Jul 2026 00:00 HKT | On/after launch |
|-------|------------------------------|-----------------|
| **Guest** | Cannot submit; play → `pre_launch` | Browse; sign in to submit |
| **USER** | Blocked at server + `play-data` | Full play when cycle/runtime allow |
| **ADMIN** | **Can test** play and submit (bypass) | Same as USER |

**Source of truth:** `src/lib/market-pulse/launch-config.ts` (`MARKET_PULSE_PUBLIC_LAUNCH_AT`, `canAccessMarketPulsePlay`, `canSubmitMarketPulseDecision`, `shouldShowMarketPulsePreLaunchUi`).

**Prize copy:** One **Ocean Park ticket** per cycle winner (homepage, hub, rules, contest-rules, launch announcement).

**Pre-launch announcement:** `MarketPulseLaunchAnnouncement` on hero, hub, leaderboard (pre-launch), play (pre-launch), rules, contest-rules — **hidden automatically after public launch**.

### Feature matrix

| Feature | Route | Auth | Status |
|---------|-------|------|--------|
| **Homepage** | `/` | Public | Market Pulse hero + launch announcement; Play Learn Win; Live Events Hub; philosophy; **i18n** |
| Brand concept | `/concept` | Public | “Our Philosophy” in nav |
| Blog (EN + zh-HK) | `/blog`, `/blog/{lang}/[slug]` | Public | 3 paired articles |
| Events hub | `/events` | Public | Upcoming: Sales & Marketing; past: Fortify + Wo Leung; **i18n** |
| Fortify event (past) | `/events/fortify-your-future` | Public | **Archived** — registration closed |
| Sales & Marketing event | `/events/fortify-sales-marketing` | Public | Coming soon — 17 Jul 2026, TBC |
| Past event archive | `/events/wo-leung-yiu-dou-yiu` | Public | Registration closed |
| **Fortify registration** | `/fortify-survey` | Public | **QR-coded URL — do not change** |
| **Login** | `/login` | Public | Sign In + Create Account; Google + magic link; **i18n** |
| **OAuth onboarding** | `/auth/onboarding` | Logged-in | Contact number; recovery UI; no redirect loop |
| **Member profile** | `/profile` | Members only | Profile + Market Pulse history; **i18n** |
| **Market Pulse Hub** | `/market-pulse` | Public | Cycle progress, prize banner, leaderboard, Play CTA; **i18n** |
| **Market Pulse play** | `/market-pulse/play` | Login to submit | News-style card + image; Bullish/Cautious + swipe; language switcher in header |
| **Market Pulse leaderboard** | `/market-pulse/leaderboard` | Public | Current / Monthly / All-time; **i18n** |
| **PPA Insight reveal** | `/market-pulse/reveal` | Login for personal results | Gated until `revealAt`; **i18n** |
| **Market Pulse rules** | `/market-pulse/rules` | Public | Challenge rules + scoring; **i18n** |
| **Contest rules** | `/contest-rules` | Public | Prize eligibility + legal |
| **Admin dashboard** | `/admin` | `ADMIN` only | **User management** (add/role/delete) + KV theme settings |
| **Market Pulse admin** | `/admin/market-pulse` | `ADMIN` only | Cycles, cards, publish, lock PPA, reveal, prizes, **first-cycle guidance** |
| Game settings API | `/api/game-settings` | GET public; POST ADMIN | KV theme/event (legacy compat) |
| Market Pulse APIs | `/api/market-pulse/*` | Mixed | `today`, `decision`, `leaderboard`, `reveal` |
| **Contact** | `/contact` | Public | `contact@profitpulseally.com` |
| **FAQ** | `/faq` | Public | Placeholder |
| **Terms / Privacy** | `/terms`, `/privacy` | Public | Updated legal copy (review with counsel) |
| **Investment Disclaimer** | `/investment-disclaimer` | Public | Legal copy + attorney review notice |
| **Careers** | `/careers` | Public | `careers@profitpulseally.com` |

### Events (current)

| Event | Status | Route | Notes |
|-------|--------|-------|-------|
| **Fortify Your Future** (June fireside) | **Past** | `/events/fortify-your-future` | Registration closed; past banner on detail |
| **Fortify Sales & Marketing** | **Coming soon** | `/events/fortify-sales-marketing` | 17 Jul 2026, location TBC |
| **《我兩樣都要》** | Past | `/events/wo-leung-yiu-dou-yiu` | Archive page |

**`/fortify-survey`** — unchanged QR URL. Do **not** modify `FortifyYourFutureSurvey.tsx` without approval.

Historical June 2026 Fortify copy (survey + archived detail):

| Field | Value |
|-------|-------|
| Date | June 26th (Friday), 7:00 PM – 9:00 PM |
| Venue | WeWork YF Life Tower |
| Registration | Closed on detail page; `/fortify-survey` still loads for QR |

### Production infrastructure (Jun 2026)

| Service | Vercel resource | Env vars | Status |
|---------|-----------------|----------|--------|
| **Prisma Postgres** | `prisma-postgres-celeste-dog` | `POSTGRES_URL` (required), `DATABASE_URL`, `PRISMA_DATABASE_URL` (optional) | Connected |
| **Auth.js** | — | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Set |
| **Upstash KV** | `upstash-kv-carmine-zebra` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Connected |
| **Google OAuth** | Google Cloud Console | Redirect URIs below | Configured |

Google OAuth redirect URIs (must match exactly):

- `https://profitpulseally.com/api/auth/callback/google`
- `https://profit-pulse-alley.vercel.app/api/auth/callback/google`

**Note:** Prisma uses `POSTGRES_URL` (direct `postgres://` URL). Do **not** point Prisma at `DATABASE_URL` or `PRISMA_DATABASE_URL` alone — those may use non-`postgres://` formats from the Prisma Postgres integration.

### Verification — last run 29 Jun 2026 (revamp QA)

| Check | Result |
|-------|--------|
| **Lint** | `npm run lint` — pass (0 errors; 10 pre-existing warnings) |
| **Typecheck** | `npm run typecheck` — pass |
| **Build** | `npm run build` — pass (`prisma db push && next build`) |
| **Tests** | `npm test` — **109** Vitest tests (20 files) |
| **Launch gating** | Non-admin blocked before 1 Jul 2026; ADMIN bypass; announcement hidden after launch |
| **Onboarding** | No redirect loop; recovery UI on `/auth/onboarding` |

**Deploy checklist:** `docs/market-pulse-deploy-checklist.md`

**Auth notes:** JWT strategy; middleware onboarding via `auth.config.ts`; JWT `update` re-fetches `contactNumber` from DB.

### Admin access

1. Sign in at `/login`.
2. Promote user: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';`
3. Open **`/admin/market-pulse`** (or `/admin` → “Market Pulse admin →”).

### Making Market Pulse visible to players (go-live)

Cards can look correct in admin but still be **hidden** on `/market-pulse/play` if any gate fails:

| Gate | Admin control | Player symptom if wrong |
|------|---------------|-------------------------|
| Runtime `OPEN` | Runtime status → Save | Cannot submit decisions |
| Cycle `OPEN` + **active** | Create/edit cycle, check “Set as active cycle” | “No active challenge…” |
| **Date window** | `startsAt ≤ now ≤ revealAt` | “No active challenge…” or “not open right now” (expired demo cycles) |
| Card **PUBLISHED** | **Publish** button (not just status dropdown) | “Today’s card is coming soon…” |
| PPA **locked** | Lock PPA signal before Publish | Publish disabled / submit rejected |
| `publishedAt ≤ now` | Published at field or Publish button | Card filtered out |
| Day number | Day 1 = first day of cycle (1-based in admin form) | Wrong or missing card for today |

**Common pitfall:** Demo seed cycle `[DEMO] Market Pulse Local Seed` uses **2025** dates — after `revealAt` passes, admin still shows “Active” but players see no challenge. Edit cycle dates to the current window or create a new 2026 cycle.

Admin dashboard shows an amber **“Active cycle is not visible to players”** banner when dates/status block playability (`cycle-playability.ts`).

### First public cycle guidance (`/admin/market-pulse`)

Panel **“First public cycle guidance”** (`FirstCycleGuidancePanel.tsx`, `first-cycle-admin-guidance.ts`):

| Setting | Recommended |
|---------|-------------|
| Start | 1 Jul 2026 00:00 HKT |
| End | 10 Jul 2026 (closes 11 Jul 00:00 HKT) |
| Reveal | On or after cycle end (recommended 11 Jul 00:00 HKT) |
| Prize label | One Ocean Park ticket |
| Runtime | `OPEN` |
| Cards | `PUBLISHED` + locked PPA |

Inform-only (no auto-overwrite). **Prefill create-cycle form** opens recommended values; admin saves manually.

### Vercel checklist (production)

- [x] **Postgres** — `POSTGRES_URL` from **Storage → Prisma Postgres** (`prisma-postgres-celeste-dog`)
- [x] **Auth.js** — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] **Email sign-in** (optional) — `EMAIL_SERVER`, `EMAIL_FROM`
- [x] **KV** (game settings) — `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- [x] **Schema sync** — automatic via `prisma db push` in `npm run build`
- [ ] **First admin** — `UPDATE "User" SET role = 'ADMIN' WHERE email = '...'`

---

## Table of contents

0. [Current site status](#current-site-status-jun-2026-revamp)
1. [What this site does](#1-what-this-site-does)
2. [Architecture overview](#2-architecture-overview)
3. [Repository structure](#3-repository-structure)
4. [Local development](#4-local-development)
5. [Environment variables](#5-environment-variables)
6. [Database & Prisma](#6-database--prisma)
7. [Authentication & membership](#7-authentication--membership)
8. [Routing & pages](#8-routing--pages)
9. [Layout & navigation](#9-layout--navigation)
10. [Feature areas](#10-feature-areas)
11. [Backend & API](#11-backend--api)
12. [Scripts & tooling](#12-scripts--tooling)
13. [Deployment](#13-deployment)
14. [How to extend the site](#14-how-to-extend-the-site)
15. [Legacy & unused code](#15-legacy--unused-code)
16. [Known inconsistencies](#16-known-inconsistencies)

---

## 1. What this site does

Profit Pulse Ally is a bilingual (English / Traditional Chinese) learning community for new-generation investors and founders. The current product narrative centers on **Market Pulse**:

- **Market Pulse** — Prisma-backed daily swipe challenge with **Jul 2026 public launch**; cycles, cards (incl. news body + card image), decisions, leaderboards, reveal gating; admin CMS at `/admin/market-pulse`
- **Events** — Fortify past archive + Sales & Marketing coming soon; `/fortify-survey` registration (fixed QR URL)
- **Membership** — Auth.js sign-in (Google + email), profile, role-based admin, **admin user management**
- **i18n** — Cookie `ppa_locale` (`en` / `zh-Hant`); `LanguageSwitcher` in header, mobile nav, play header
- **Philosophy & trust** — PPA investment philosophy; expert headshots on homepage
- **Admin** — member + user ops (`/admin`) + Market Pulse ops (`/admin/market-pulse`) + KV theme settings
- **Lead migration** — `scripts/import-leads.ts` for legacy Google Form CSV

---

## 2. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (client)                         │
│  React + next-auth/react (SessionProvider, useSession)           │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│   Next.js App Router       │   │   External services              │
│   Server + Client comps    │   │   • Google OAuth / SMTP          │
│   API routes (/api/market-pulse/*)   │   │   • Google Forms (/fortify-survey)│
│   Auth.js v5 (JWT)                   │   └─────────────────────────────────┘
│   Edge middleware                    │
└───────────────┬───────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Prisma       │ │ Vercel KV    │
│ Postgres     │ │ (theme/event)│
│ User,        │ └──────────────┘
│ MarketPulse* │
│ Auth tables  │
└──────────────┘
```

`MarketPulse*` = Cycle, Card, Decision, ScoreEvent, PrizeClaim, AuditLog, GameSetting.

### Rendering model

| Pattern | Where used |
|---------|------------|
| **Server Components** | Homepage, blog, events, profile, admin, Market Pulse pages (`hub-data`, `play-data`, etc.) |
| **Client Components** | `MarketPulseHubPage`, `MarketPulseSwipeCard`, `LoginPage`, `LayoutShell`, Fortify survey |
| **SSG** | Blog posts (`generateStaticParams`) |
| **Dynamic (ƒ)** | `/profile`, `/market-pulse/play`, `/market-pulse/reveal`, `/admin`, `/admin/market-pulse`, APIs |

---

## 3. Repository structure

```
--tailwindcss/
├── DEVELOPER_GUIDE.md
├── docs/market-pulse-deploy-checklist.md
├── vitest.config.ts
├── prisma/
│   ├── schema.prisma           ← User, MarketPulse*, Auth.js models
│   ├── seed.ts                 ← Dev-only Market Pulse demo seed
│   └── seed-market-pulse-data.ts
├── scripts/
│   └── import-leads.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.tsx        ← User management + KV settings
│   │   │   └── market-pulse/   ← Cycle/card CMS, reveal, prizes
│   │   ├── api/market-pulse/   ← today, decision, leaderboard, reveal
│   │   ├── market-pulse/
│   │   │   ├── page.tsx        ← Hub
│   │   │   ├── play/           ← Daily swipe challenge
│   │   │   ├── leaderboard/
│   │   │   ├── reveal/
│   │   │   └── rules/
│   │   └── contest-rules/
│   ├── components/
│   │   ├── i18n/LanguageSwitcher.tsx
│   │   ├── providers/LocaleProvider.tsx
│   │   ├── layout/
│   │   │   ├── MobileNav.tsx
│   │   │   └── ContentPageLayout.tsx
│   │   ├── market-pulse/       ← Hub, SwipeCard, LaunchAnnouncement, PlayExperience, …
│   │   ├── admin/              ← MarketPulseAdminDashboard, FirstCycleGuidancePanel, AdminUserManagement, …
│   │   └── auth/               ← LoginPage, OnboardingPage, OnboardingRecoveryPanel
│   ├── lib/
│   │   ├── i18n/               ← locales, messages (en, zh-Hant), server helpers, auth-ui, market-pulse-ui
│   │   ├── auth/onboarding-routes.ts
│   │   ├── admin-user-actions.ts, admin-user-validation.ts
│   │   ├── layout/route-chrome.ts
│   │   └── market-pulse/
│   │       ├── launch-config.ts        ← Public launch Jul 2026, ADMIN bypass
│   │       ├── first-cycle-admin-guidance.ts
│   │       ├── server.ts, cycle-playability.ts, reveal-access.ts, admin-actions.ts
│   │       └── *.test.ts               ← 109 unit tests total (repo)
└── …
```

---

## 4. Local development

```bash
cd --tailwindcss
npm install          # runs prisma generate via postinstall
cp .env.example .env.local   # fill in POSTGRES_URL, Auth, optional KV/SMTP
npm run db:push              # first-time local DB setup (or db:migrate)
npm run dev
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | **`prisma db push && next build`** (Vercel uses this) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Vitest unit tests (`vitest run`) — **109 tests** |
| `npm run db:migrate` | Prisma migrate dev (when using migration files) |
| `npm run db:push` | Push schema without migration files |
| `npm run db:seed` | Seed **demo Market Pulse** data (dev only — see [§4.1](#41-market-pulse-demo-seed)) |
| `npm run import-leads` | Import `scripts/leads.csv` → User table |

### 4.1 Market Pulse demo seed

Safe, idempotent local seed for the Prisma-backed Market Pulse game. It creates:

- One `MarketPulseGameSetting` (only if none exists; otherwise links `activeCycleId` when empty)
- One **OPEN** demo cycle: `[DEMO] Market Pulse Local Seed`
- **10 published cards** with locked PPA signals, sample headlines (TSMC, NVIDIA, HSBC, …), and dates relative to **now**

**Safety**

- Blocked when `NODE_ENV=production` or `VERCEL_ENV=production`
- Override only with explicit `MARKET_PULSE_SEED=1` (not recommended on production databases)
- **Idempotent:** if the demo cycle name already exists, the script exits without changing data
- Does **not** delete or truncate existing rows

**Run**

```bash
# Ensure schema is applied first
npm run db:push

# Seed demo Market Pulse content (development)
npm run db:seed

# Or via Prisma CLI (same entrypoint)
npx prisma db seed
```

Optional explicit flag (staging / intentional runs):

```bash
MARKET_PULSE_SEED=1 npm run db:seed
```

Files: `prisma/seed.ts` (runner + guards), `prisma/seed-market-pulse-data.ts` (demo card copy).

---

## 5. Environment variables

| Variable | Required | Used by |
|----------|----------|---------|
| `POSTGRES_URL` | **Yes** | Prisma — direct `postgres://` URL from Vercel Prisma Postgres |
| `AUTH_SECRET` | **Yes** (production) | Auth.js (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | For Google login | Auth.js Google provider |
| `AUTH_GOOGLE_SECRET` | For Google login | Auth.js Google provider |
| `DATABASE_URL` | Auto-injected | Vercel Prisma Postgres (do not use as Prisma `url` — wrong protocol) |
| `PRISMA_DATABASE_URL` | Auto-injected | Prisma Postgres integration (`prisma+postgres://` format) |
| `EMAIL_SERVER` | For email login | Nodemailer provider (e.g. `smtp://user:pass@host:587`) |
| `EMAIL_FROM` | For email login | Magic-link sender address |
| `KV_REST_API_URL` | Game settings (Market Pulse) | `@vercel/kv` |
| `KV_REST_API_TOKEN` | Game settings (Market Pulse) | `@vercel/kv` |

`.env.local` is gitignored. **Never commit secrets.**

Nodemailer is **omitted from Auth.js providers** when `EMAIL_SERVER` / `EMAIL_FROM` are unset — allows local build without SMTP.

---

## 6. Database & Prisma

**Schema:** `prisma/schema.prisma` — uses `env("POSTGRES_URL")`  
**Client:** `src/lib/prisma.ts` (singleton)

There are **no committed migration files** (`prisma/migrations/`). Schema is synced via:

- **Vercel build:** `prisma db push` runs automatically before `next build`
- **Local dev:** `npm run db:push` or `npm run db:migrate` after schema changes

**Revamp schema additions** (`MarketPulseCard`): `newsBody`, `logoInitials`, `cardImageUrl`, `cardImageAlt`, `userPrompt` — nullable; **`db push` required** on deploy if not already applied.

**First migration (when ready):**

```bash
npx prisma migrate dev --name init
```

Then change `package.json` build to `prisma migrate deploy && next build` and baseline production if tables already exist from `db push`.

### Models

| Model | Purpose |
|-------|---------|
| `User` | Members — `email`, `name`, `image`, `contactNumber?`, `password?`, `role` (`USER` \| `ADMIN`) |
| `MarketPulseCycle` | Challenge window — `startsAt`, `endsAt`, `revealAt`, `status`, `prizeLabel` |
| `MarketPulseCard` | Daily signal card — headline, ticker, `newsBody`, `cardImageUrl`/`cardImageAlt`, `logoInitials`, `userPrompt`, `ppaSignal` (admin-only until reveal), `status` |
| `MarketPulseDecision` | User's Bullish/Cautious call per card (`@@unique([userId, cardId])`) |
| `MarketPulseScoreEvent` | Participation + match + streak points (computed on reveal) |
| `MarketPulsePrizeClaim` | Prize fulfillment workflow |
| `MarketPulseAuditLog` | Admin action audit trail |
| `MarketPulseGameSetting` | Runtime singleton — `activeCycleId`, `runtimeStatus`, leaderboard mode |
| `GameScore` | **Legacy** arcade game scores (superseded by swipe challenge) |
| `Account`, `Session`, `VerificationToken` | Auth.js Prisma Adapter |

### First admin user

After signing up via `/login`, promote in SQL or Prisma Studio:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

---

## 7. Authentication & membership

**Config:** `src/auth.ts` (full) + `src/auth.config.ts` (edge-safe, for middleware)  
**Middleware:** `src/middleware.ts` — redirects users with `needsOnboarding` → `/auth/onboarding`  
**Actions:** `src/lib/auth-actions.ts` — `signUpWithPassword`, `updateContactNumber`, `signOutAction`  
**Route:** `src/app/api/auth/[...nextauth]/route.ts`  
**Session:** **JWT** strategy; `jwt` callback sets `id`, `role`, `needsOnboarding`; `session` callback exposes them to the client

### Why two auth config files?

Vercel Edge middleware has a **1 MB bundle limit**. Importing `@/auth` in middleware pulled in Prisma, bcrypt, and all providers (~1.08 MB). `auth.config.ts` holds only session/JWT passthrough callbacks; middleware imports that instead.

### Providers

| Provider | Purpose |
|----------|---------|
| **Google OAuth** | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` |
| **Credentials** | Email + password (`bcrypt.compare` against `User.password`) |
| **Nodemailer** | Magic link when `EMAIL_SERVER` + `EMAIL_FROM` set |

### Sign-up & onboarding

- **Create Account** tab on `/login` → `signUpWithPassword()` hashes password with bcrypt, stores `contactNumber`
- **Google OAuth:** account saved via Prisma adapter; JWT gets `needsOnboarding` if no `contactNumber`
- **Middleware:** users with `needsOnboarding` redirected to `/auth/onboarding` (except onboarding route itself)
- **Onboarding:** `updateContactNumber()` + `session.update()` clears flag; JWT update **re-fetches DB** `contactNumber`
- **No redirect loop:** server does not redirect away when DB has contact but JWT is stale — client syncs session first
- **Recovery UI:** `OnboardingRecoveryPanel`, `loading.tsx`, `error.tsx` on `/auth/onboarding`

### Bilingual (i18n)

| Piece | Location |
|-------|----------|
| Locales | `en`, `zh-Hant` — cookie `ppa_locale` (`src/lib/i18n/locales.ts`) |
| Server copy | `getServerTranslations()`, `getServerSiteLocale()` |
| Client copy | `LocaleProvider`, `useTranslations()` |
| Switcher | `LanguageSwitcher` — header, mobile nav, play header, login, onboarding |
| Message files | `src/lib/i18n/messages/en.ts`, `zh-Hant.ts`, `market-pulse-messages.ts`, `auth-app-messages.ts` |
| MP errors | `src/lib/i18n/market-pulse-ui.ts` maps server strings to keys |

Event **detail** pages and admin MP operational UI remain largely static bilingual or English.

### Pages

| Route | Protection | Behavior |
|-------|------------|----------|
| `/login` | Public | Tabbed Sign In / Create Account; Google + magic link below; full-page |
| `/auth/onboarding` | Logged-in | Contact form; recovery buttons; OAuth grace period |
| `/profile` | Logged-in | Profile Details + Market Pulse History; sign out |
| `/admin` | `role === ADMIN` | **User management** + game settings; others → `/` |

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

**Immersive routes (no site chrome — product UI only):** `/market-pulse/play` — back link to hub in play header; leaderboard/disclaimer in collapsible `<details>` on mobile.

### Mobile UX pass (Jun 2026)

Responsive and accessibility improvements across public routes. **No changes** to Prisma schema, server actions, scoring, reveal gating, or auth logic.

| Area | Key files | Notes |
|------|-----------|--------|
| **Route chrome** | `src/lib/layout/route-chrome.ts` | `FULL_PAGE_ROUTES`, `IMMERSIVE_ROUTES`, `isMarketPulseRoute()` |
| **Mobile nav** | `src/components/layout/MobileNav.tsx` | Drawer portaled to `document.body`; elevated header z-index on Market Pulse routes (see §9) |
| **Shell** | `LayoutShell.tsx`, `globals.css`, `layout.tsx` | `overflow-x-clip`; `viewportFit: cover`; `scroll-padding-top` for sticky header; `inert` on main/footer when menu open |
| **Footer** | `SiteFooter.tsx` | Accordion link groups on mobile; `min-h-11` tap targets |
| **Market Pulse** | `MarketPulse*`, `MarketPulseSwipeCard` | Mobile play layout; button + swipe paths; reduced-motion support; PPA still stripped pre-reveal |
| **Admin** | `admin/*`, `MarketPulseAdminDashboard` | Card lists on mobile; accordions; sticky playability warning |
| **Home / events / auth** | `src/components/home/*`, `events/*`, `LoginPage` | Compact sections; touch-friendly forms |

**Breakpoints:** Most mobile patterns use `< md` (768px) or `< lg` (1024px) for admin accordions vs desktop stacks.

### Client session

`AuthSessionProvider` wraps the app in `layout.tsx` for `useSession()` (Market Pulse Hub play button).

### Server-side checks

```typescript
import { auth } from "@/auth";

const session = await auth();
if (!session?.user?.id) redirect("/login?callbackUrl=/profile");
if (session.user.role !== "ADMIN") redirect("/");
```

---

## 8. Routing & pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | **Market Pulse** homepage — 5 sections (see §10.1) |
| `/login` | `src/app/login/page.tsx` | Tabbed login + registration |
| `/auth/onboarding` | `src/app/auth/onboarding/page.tsx` | OAuth contact-number onboarding |
| `/profile` | `src/app/profile/page.tsx` | Member profile + Market Pulse game history |
| `/contact` | `src/app/contact/page.tsx` | Contact email (placeholder) |
| `/faq` | `src/app/faq/page.tsx` | FAQ placeholder |
| `/terms` | `src/app/terms/page.tsx` | Terms placeholder |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy placeholder |
| `/investment-disclaimer` | `src/app/investment-disclaimer/page.tsx` | Investment disclaimer (placeholder legal text) |
| `/careers` | `src/app/careers/page.tsx` | Careers placeholder |
| `/game` | — | **301** → `/market-pulse` (`next.config.ts`) |
| `/market-pulse` | `src/app/market-pulse/page.tsx` | Hub — cycle progress, prizes, top-5 leaderboard |
| `/market-pulse/play` | `src/app/market-pulse/play/page.tsx` | Daily swipe card (Bullish / Cautious) |
| `/market-pulse/leaderboard` | `src/app/market-pulse/leaderboard/page.tsx` | Full leaderboard (current / monthly / all-time) |
| `/market-pulse/reveal` | `src/app/market-pulse/reveal/page.tsx` | PPA Insight results (gated until reveal) |
| `/market-pulse/rules` | `src/app/market-pulse/rules/page.tsx` | Challenge rules |
| `/contest-rules` | `src/app/contest-rules/page.tsx` | Contest / prize legal |
| `/admin` | `src/app/admin/page.tsx` | User management + KV settings |
| `/admin/market-pulse` | `src/app/admin/market-pulse/page.tsx` | Cycle/card CMS, reveal, scoring, prizes |
| `/fortify-survey` | `src/app/fortify-survey/page.tsx` | Fortify registration (QR URL) |
| `/events/fortify-your-future` | `src/app/events/fortify-your-future/page.tsx` | Past Fortify event |
| `/events/fortify-sales-marketing` | `src/app/events/fortify-sales-marketing/page.tsx` | Coming soon event |
| `/concept`, `/blog/*`, `/events` | … | Content & events |
| `/api/auth/[...nextauth]` | Auth.js handlers | |
| `/api/game-settings` | KV theme/event config | Legacy compat |
| `/api/market-pulse/today` | Today's card (auth) | PPA stripped pre-reveal |
| `/api/market-pulse/decision` | `player-handlers.ts` | POST — submit decision; **403 pre-launch** unless `ADMIN` |
| `/api/market-pulse/leaderboard` | Leaderboard JSON | Public GET |
| `/api/market-pulse/reveal` | User reveal payload (auth) | Gated |

### Redirects

| Source | Destination | Notes |
|--------|-------------|-------|
| `/event` | `/events` | 301 permanent |
| `/game` | `/market-pulse` | 301 permanent — legacy Game Hub URL |
| `/investment-challenge` | `/market-pulse/play` | 301 permanent — legacy play URL |

---

## 9. Layout & navigation

**Root layout:** Geist fonts → `AuthSessionProvider` → `LocaleProvider` (server `initialLocale` from `ppa_locale` cookie) → `LayoutShell` → children. `layout.tsx` sets `viewportFit: "cover"` for safe-area support on notched devices.

**Route chrome:** `src/lib/layout/route-chrome.ts` — consumed by `LayoutShell` and `MobileNav`.

| Constant | Routes | Chrome |
|----------|--------|--------|
| `FULL_PAGE_ROUTES` | `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding` | No header/footer |
| `IMMERSIVE_ROUTES` | `/market-pulse/play` | No header/footer; play-specific header |
| *(default)* | All other routes | Sticky header + footer |

### Header (`LayoutShell.tsx` — `useSession()`)

| Position | Desktop (`md+`) | Mobile (`< md`) |
|----------|-----------------|-----------------|
| **Left** | Logo → `/`; nav: Market Pulse, Events, Our Philosophy, Blog | Logo only |
| **Right (guest)** | **Language switcher** + Login + Sign Up pill | **Menu** button → `MobileNav` drawer |
| **Right (member)** | **Language switcher** + My Profile + Sign Out | **Menu** button → drawer |

Desktop nav links fire Market Pulse analytics when on `/market-pulse/*` (`trackMarketPulseEvent`).

### Mobile nav (`MobileNav.tsx`)

- Slide-in drawer from the right; backdrop dismiss; **Escape** closes
- Drawer + backdrop are **portaled to `document.body`** (`z-[200]`/`z-[201]`) so Framer Motion layers on Market Pulse pages cannot block the menu
- **`LayoutShell`** raises header z-index on Market Pulse routes (`z-[100]`); `z-[203]` while menu is open so the hamburger stays tappable
- Body scroll locked while open; focus returns to menu button on close
- Main content + footer get `inert` while open; menu toggle stays interactive
- Account links: Login / Sign Up (guest) or Profile / Sign Out (member)
- **Language switcher** at bottom of drawer (`variant="compact"`)

**`/market-pulse/play` has no site mobile nav** — immersive route. Play uses `PlayChromeHeader` (back to hub, **language switcher**, leaderboard link, cycle timer).

### Footer (`SiteFooter.tsx`)

| Viewport | Layout |
|----------|--------|
| **Mobile** | Accordion sections: PPA, Community, Legal; then Stay Connected |
| **Desktop (`sm+`)** | Four-column grid |

Four columns (content):

| Column | Links / content |
|--------|------------------|
| **PPA** | Market Pulse, Events, Our Philosophy, Blog |
| **Community** | Contact Us → `/contact`, FAQs → `/faq`, Careers → `/careers` |
| **Legal** | Terms → `/terms`, Privacy → `/privacy`, **Investment Disclaimer** → `/investment-disclaimer` |
| **Stay Connected** | Email + Subscribe (client-only UI); LinkedIn, Twitter, Instagram — **inline SVGs** (not lucide brand icons) |

Bottom bar: logo left; `© 2026 Profit Pulse Ally. All Rights Reserved.` right.

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

---

## 10. Feature areas

### 10.1 Homepage (`src/app/page.tsx`)

Dark zinc layout (`bg-zinc-950`). Composes five sections — **no blog preview** on homepage.

| # | Component | Purpose | Primary CTAs |
|---|-----------|---------|--------------|
| 1 | `MarketPulseHero` | Market Pulse title, **launch announcement** (pre-launch), countdown | **Explore** / **Play Now** → `/market-pulse` |
| 2 | `PlayLearnWinSection` | Play. Learn. Win. — prize: **one Ocean Park ticket** per cycle | — |
| 3 | `LiveEventsHubSection` | **Upcoming:** Sales & Marketing (coming soon); **past:** Fortify + placeholders (`home-events-hub.ts`) | → `/events/fortify-sales-marketing` |
| 4 | `PhilosophySection` | PPA philosophy; expert headshots | — |
| 5 | `FinalCtaSection` | Ready to Test Your Instincts? | **Become a Member** → `/login` |

**Market Pulse cycle epoch:** **1 Jul 2026 00:00 HKT** (`CHALLENGE_CYCLE_EPOCH_MS` in `challenge-cycle.ts` / `launch-config.ts`). Countdown via `ChallengeCountdown.tsx`.

### 10.2 Fortify registration (`/fortify-survey`)

**Do not modify** `FortifyYourFutureSurvey.tsx` or the route without explicit approval — live QR codes point here.

**Past event detail:** `src/lib/events/fortify-your-future.ts` — `registrationDisabled: true`, past banner on page.

**Upcoming event:** `src/lib/events/fortify-sales-marketing.ts` — `/events/fortify-sales-marketing`.

**Events hub i18n:** `getFortifySalesMarketingShowcase(locale)` in `upcoming-event-display.ts`.

### 10.3 Market Pulse Hub (`/market-pulse`)

- **Server:** `getMarketPulseHubPageData()` — active cycle, day progress, prize label, top-5 leaderboard
- **Client:** `MarketPulseHubPage.tsx` — hero, `CycleProgress`, `PrizeBanner`, `RevealCountdown`, Play CTA
- Falls back to synthetic cycle data if Prisma is unavailable (dev without `POSTGRES_URL`)

### 10.4 Market Pulse play (`/market-pulse/play`)

- **Server:** `getMarketPulsePlayPageData()` — today's published card, locked decision, sidebar leaderboard
- **Client:** `MarketPulsePlayExperience` + `MarketPulseSwipeCard` — news-style card with optional **card image** (+ fallback); drag/tap Bullish or Cautious
- **Submit:** `submitMarketPulseDecisionAction` → `MarketPulseDecision` row + participation score event
- **States:** `pre_launch`, `no_active_cycle`, `cycle_unavailable`, `no_card_today`, `sign_in_required`, `playable`, `locked`
- **Pre-launch:** non-admin → `pre_launch` status; ADMIN bypass via `launch-config.ts`
- **Playability:** `getActiveMarketPulseCycle()` returns null when `revealAt < now` even if cycle is pinned active — see [Making Market Pulse visible](#making-market-pulse-visible-to-players-go-live)
- PPA signal/insight **never** exposed before reveal (`reveal-access.ts`, `stripPpaFromCardPayload`)

### 10.5 Leaderboard & reveal

- **`/market-pulse/leaderboard`** — `MarketPulseLeaderboard.tsx`; tabs: current cycle, monthly, all-time
- **`/market-pulse/reveal`** — personal results + PPA Insight after `revealAt`; pending countdown otherwise
- Scoring: participation (+10), match bonus, streak bonus — computed in `calculateAndPersistCycleScores` on admin reveal

### 10.6 Market Pulse rules & contest

- **`/market-pulse/rules`** — challenge overview, scoring, fair play (`legal-copy.ts`)
- **`/contest-rules`** — prize eligibility and contest terms

### 10.7 Member profile (`/profile`)

Server component: Profile Details + Market Pulse history (`getUserMarketPulseHistory`).

### 10.8 Admin

**`/admin`** — **user management** (`AdminUserManagement`, `AdminAddUserForm`, `AdminMembersTable`) + KV theme settings. Server actions: `admin-user-actions.ts`; safeguards in `admin-user-validation.ts` (self-delete, last-admin demotion, self-demotion).

**`/admin/market-pulse`** — full ops dashboard (`MarketPulseAdminDashboard`):

1. **First-cycle guidance** panel + optional prefill for create-cycle form
2. **Runtime** → `OPEN` (master switch for submissions)
3. **Create cycle** → status `OPEN`, Jul 2026 window, prize label, **Set as active cycle**
4. **Create cards** — day 1 = first day; headline, ticker, **news body**, **card image URL/alt**, PPA signal + insight
5. **Lock PPA signal** (required before Publish)
6. **Publish** (`PUBLISHED` + `publishedAt`)
7. **Reveal cycle** + calculate scores (after `revealAt`)
8. Prize claim review

Card image guidance in form: `MARKET_PULSE_CARD_IMAGE_GUIDANCE` (1200×675, 16:9).

Dashboard shows **Not playable** badge and playability reason when cycle dates or status block players.

Requires `role = ADMIN`. See `docs/market-pulse-deploy-checklist.md` §4.

### 10.9 Blog, events, concept

Blog and concept are reachable via header/footer nav; events detail pages unchanged. Explore `src/app/blog`, `src/app/events`, `src/app/concept`.

### 10.10 Site footer

Documented in §9. Newsletter subscribe shows a client-side confirmation only — wire to an API or email provider when ready.

### 10.11 Content pages (`ContentPageLayout`)

Shared layout at `src/components/layout/ContentPageLayout.tsx` for simple info/legal pages:

- Props: `title` (string), `children` (React nodes)
- Full-screen dark background (`bg-zinc-950`), centered card (`max-w-4xl`, `bg-zinc-900`)
- Title as `h1`; body wrapped in `prose prose-invert`

**Current routes:** `/contact`, `/faq`, `/terms`, `/privacy`, `/careers`, `/investment-disclaimer` — placeholder copy except contact and careers emails. Investment disclaimer includes an amber **attorney review** warning box.

**To add a new page:**

```tsx
import ContentPageLayout from "@/components/layout/ContentPageLayout";

export const metadata = { title: "Page Title | Profit Pulse Ally" };

export default function MyPage() {
  return (
    <ContentPageLayout title="Page Title">
      <p>Content here.</p>
    </ContentPageLayout>
  );
}
```

Then add the route to `SiteFooter.tsx` if it should appear in the footer.

---

## 11. Backend & API

### Auth.js — `/api/auth/[...nextauth]`

Standard Auth.js v5 endpoints (sign-in, sign-out, callbacks, session).

### Game settings — `/api/game-settings`

| Method | Auth | Behavior |
|--------|------|----------|
| GET | Public | Returns KV settings (`theme`, `event`, …) or defaults — legacy homepage theming |

Admin UI: `AdminGameSettings.tsx` on `/admin`.

### Market Pulse — `/api/market-pulse/*`

| Route | Method | Auth | Behavior |
|-------|--------|------|----------|
| `/api/market-pulse/today` | GET | User | Today's card + decision state; **PPA stripped** pre-reveal |
| `/api/market-pulse/decision` | POST | User | Submit Bullish/Cautious; **403 before public launch** unless `ADMIN` |
| `/api/market-pulse/leaderboard` | GET | Public | `?mode=current-cycle\|monthly\|all-time`; empty array if DB unavailable |
| `/api/market-pulse/reveal` | GET | User | Personal reveal payload; 404 until cycle revealed |

Handlers: `src/lib/market-pulse/player-handlers.ts`. Core logic: `src/lib/market-pulse/server.ts`.

---

## 12. Scripts & tooling

### Unit tests (Vitest)

```bash
npm test          # vitest run — 109 tests across MP, i18n, auth, events, admin users
npm run typecheck # tsc --noEmit
```

Config: `vitest.config.ts`. Tests under `src/lib/**/*.test.ts`, `src/lib/events/*.test.ts`.

### `scripts/import-leads.ts`

Migrates Google Form CSV exports into `User` rows.

```bash
# 1. Export form responses → scripts/leads.csv
# 2. Ensure POSTGRES_URL in .env.local
npm run import-leads
```

- Skips existing emails
- Auto-detects email/name columns from Google Forms headers
- Logs per-row actions + summary

---

## 13. Deployment

**Flow:** merge `revamp-market-pulse-july-2026` → `main` → Vercel auto-deploys **profit-pulse-alley** → build runs `prisma db push && next build`.

### First-time / infra setup

1. Vercel project **profit-pulse-alley** linked to https://github.com/prisken/profit-pulse-alley
2. **Storage → Prisma Postgres** (`prisma-postgres-celeste-dog`) connected — confirm `POSTGRES_URL` is non-empty
3. Auth env vars: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
4. Google Cloud redirect URIs (see [Production infrastructure](#production-infrastructure-jun-2026))
5. Push to `main` — tables are created automatically during build
6. Promote first admin in production DB

### Manual schema sync (optional)

If you need to push schema outside a deploy, copy `POSTGRES_URL` from Vercel Settings into local `.env.local` (sensitive vars are not included in `vercel env pull`):

```bash
cd --tailwindcss
# POSTGRES_URL=postgres://... in .env.local
npm run db:push
```

### Troubleshooting

**Google login — “Server error / Configuration”**

Usually means Postgres is missing or empty. Google OAuth reaches the account picker but fails on callback when Auth.js cannot write to the database.

1. Confirm `POSTGRES_URL` is set and non-empty in Vercel → Settings → Environment Variables
2. Do **not** use empty placeholder env vars — remove them and reconnect Storage if needed
3. Redeploy; check build logs for `The database is already in sync` or `prisma db push` errors

**Build fails — “URL must start with postgresql://”**

Prisma schema expects `POSTGRES_URL` (direct postgres URL). `DATABASE_URL` from the Prisma Postgres integration may use a different protocol — keep both vars but ensure Prisma points at `POSTGRES_URL`.

**Deploy fails — Edge middleware over 1 MB**

Middleware must import `@/auth.config`, not `@/auth`. See [Why two auth config files?](#why-two-auth-config-files)

---

## 14. How to extend the site

### Add a member-only page

```typescript
const session = await auth();
if (!session?.user?.id) redirect("/login?callbackUrl=/your-path");
```

### Submit a Market Pulse decision

`submitMarketPulseDecisionAction` in `player-actions.ts` → `submitMarketPulseDecision` in `server.ts`. One decision per user per card; participation points on submit; match/streak on reveal. **Pre-launch:** `canSubmitMarketPulseDecision` in `launch-config.ts` blocks non-admin USER before 1 Jul 2026 HKT.

**Leaderboard:** `getMarketPulseLeaderboard` in `server.ts`; page loaders in `hub-data.ts`, `leaderboard-data.ts`.

**Reveal gating:** `reveal-access.ts` — `getMarketPulseCardPublicPayload` strips `ppaSignal` / `ppaInsight` until `revealAt`.

**Admin ops:** `admin-actions.ts` — create cycle/card, lock PPA, publish, reveal + `calculateAndPersistCycleScores`.

**Local demo data:** `npm run db:seed` (dev only).

### Update Fortify registration

Edit only with approval — update `FortifyYourFutureSurvey.tsx` `content` + form embed; **never change `/fortify-survey` URL**.

### Update homepage copy or events showcase

- **Market Pulse hero:** `MarketPulseHero.tsx`, `launch-config.ts`
- **Past events grid:** `getPastEventsShowcase(locale)` in `src/lib/events/home-events-hub.ts`
- **Upcoming event:** `getFortifySalesMarketingShowcase(locale)` in `upcoming-event-display.ts`; wired in `page.tsx` + `/events`
- **Past Fortify:** `fortify-your-future.ts` (archived)
- **Philosophy / experts:** `src/lib/home/proof-of-concept.ts`

### Add a content or legal page

Use `ContentPageLayout` — see [§10.11](#1011-content-pages-contentpagelayout). Add `src/app/your-route/page.tsx` and link from `SiteFooter.tsx`.

### Import legacy leads

`npm run import-leads` with `scripts/leads.csv`.

---

## 15. Legacy & unused code

| Item | Status |
|------|--------|
| `src/legacy/castle-siege/MandateApp.tsx` + `gameLogic.ts` | Castle Siege — isolated, not imported or routed |
| `src/lib/game-master/*` | Unused KV scaffold |
| `src/lib/game-actions.ts`, `game-settings.ts`, `game-challenge-cycle.ts` | **Removed** — replaced by `src/lib/market-pulse/*` |
| `src/components/game/GameHub.tsx` | **Legacy** — superseded by `MarketPulseHubPage` |
| `src/components/market-pulse/MarketPulseGame.tsx` | **Legacy** arcade game — not used by `/play` |
| `src/lib/market-pulse/actions.ts` (`saveMarketPulseScore`) | **Legacy** `GameScore` writer |
| `HomeHero.tsx`, `HomeEventsHub.tsx`, `HomeProofOfConcept.tsx`, `HomeTestimonials.tsx` | Superseded homepage components — **not imported** by `page.tsx` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Removed — admin uses DB role |
| Old inline footer in `LayoutShell` | Replaced by `SiteFooter.tsx` |
| `/images/fortify-hero-*.png`, `/hero.png` | No longer used on homepage |

---

## 16. Known inconsistencies

1. **FAQ placeholder** — `/faq` still needs full content from comms.
2. **Newsletter** — `SiteFooter` subscribe is UI-only.
3. **Social URLs** — LinkedIn/Twitter placeholders; Instagram live.
4. **Past events placeholders** — Homepage cards for “Zero-Cost Life Salon” and “Founder's Funding Roundtable” link to `/events/archive/...` (404).
5. **Event detail pages** — Static bilingual strings; not fully driven by `ppa_locale`.
6. **KV vs Prisma settings** — KV theme/event on `/admin` is legacy; runtime game state is Prisma `MarketPulseGameSetting`.
7. **Demo seed dates** — `npm run db:seed` creates a cycle relative to seed time; production may retain expired `[DEMO]` cycles — update in admin or create new Jul 2026 cycle.
8. **No migration files** — Production uses `prisma db push` in build; adopt `migrate deploy` when ready.
9. **Legacy GameScore** — Profile may still show old arcade scores alongside swipe challenge history.
10. **Admin MP UI** — Operational labels mostly English; enums (`OPEN`, `PUBLISHED`) intentionally untranslated.

---

## Quick reference — key files

| Concern | File(s) |
|---------|---------|
| Auth config | `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts` |
| Auth actions | `src/lib/auth-actions.ts`, `src/lib/auth/onboarding-routes.ts` |
| Login / onboarding | `LoginPage.tsx`, `OnboardingPage.tsx`, `OnboardingRecoveryPanel.tsx`, `/auth/onboarding/*` |
| i18n | `src/lib/i18n/*`, `LocaleProvider.tsx`, `LanguageSwitcher.tsx` |
| Admin users | `AdminUserManagement.tsx`, `admin-user-actions.ts`, `admin-user-validation.ts` |
| Launch / pre-launch | `src/lib/market-pulse/launch-config.ts`, `MarketPulseLaunchAnnouncement.tsx` |
| First-cycle admin | `first-cycle-admin-guidance.ts`, `FirstCycleGuidancePanel.tsx` |
| Content layout | `src/components/layout/ContentPageLayout.tsx` |
| Legal / info pages | `src/app/contact/`, `faq/`, `terms/`, `privacy/`, `careers/`, `investment-disclaimer/` |
| Profile | `src/app/profile/page.tsx` |
| Admin | `src/app/admin/page.tsx`, `src/app/admin/market-pulse/page.tsx`, `MarketPulseAdminDashboard.tsx` |
| Market Pulse Hub | `src/app/market-pulse/page.tsx`, `MarketPulseHubPage.tsx`, `hub-data.ts` |
| Market Pulse play | `src/app/market-pulse/play/page.tsx`, `MarketPulsePlayExperience.tsx`, `MarketPulseSwipeCard.tsx` |
| Leaderboard / reveal | `leaderboard/page.tsx`, `reveal/page.tsx`, `leaderboard-data.ts`, `reveal-data.ts` |
| Market Pulse domain | `server.ts`, `cycle-playability.ts`, `playable-card.ts`, `reveal-access.ts`, `admin-actions.ts`, `card-validation.ts` |
| Market Pulse APIs | `src/app/api/market-pulse/*`, `player-handlers.ts` |
| Deploy checklist | `docs/market-pulse-deploy-checklist.md` |
| Fortify (QR) | `FortifyYourFutureSurvey.tsx`, `fortify-your-future.ts`, `fortify-sales-marketing.ts` |
| Events hub i18n | `upcoming-event-display.ts`, `home-events-hub.ts` |
| Nav / layout | `LayoutShell.tsx`, `SiteFooter.tsx`, `MobileNav.tsx`, `route-chrome.ts` |
| Homepage | `src/app/page.tsx`, `src/components/home/*` |
| Market Pulse countdown | `challenge-cycle.ts`, `ChallengeCountdown.tsx` |
| Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Unit tests | `vitest.config.ts`, `src/lib/**/*.test.ts` |
| Legacy Castle Siege | `src/legacy/castle-siege/` (unreferenced) |

---

## Support & handoff notes

- **Languages:** EN + Traditional Chinese (`ppa_locale` cookie); MP launch messages in `launch-config.ts`
- **Data stores:** Postgres (users, Market Pulse, auth), KV (legacy theme), Markdown (blog)
- **Testing:** `npm run lint`, `npm run typecheck`, `npm test` (109), `npm run build`
- **Production smoke:** guest/USER/ADMIN before launch; language switch; Google onboarding; admin users; card with image; `/fortify-survey` unchanged
- **Lint warnings:** Legacy castle-siege; TanStack Table in admin members table

---

*Last updated: 29 Jun 2026 — Market Pulse July 2026 revamp: launch closure, i18n, admin user management, onboarding fix, events update, first-cycle guidance, card image fields. Branch: `revamp-market-pulse-july-2026`.*
