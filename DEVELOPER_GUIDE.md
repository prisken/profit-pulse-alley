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
| **Latest commit** | See `git log -1` on `main` — Market Pulse swipe challenge (Prisma-backed) |
| **Production status** | Deploy from `main`; Google OAuth, Prisma Postgres, Market Pulse live routes |

---

## Current site status (Jun 2026)

### Site strategy (current)

The public site centers on **Market Pulse** — a recurring multi-day investment challenge where members swipe **Bullish** or **Cautious** on daily market signal cards, earn participation points, and compete on leaderboards until **PPA Insight** is revealed at cycle end. Supporting pillars: **fireside events**, **membership**, and **expert-led philosophy** (PPA Take). Homepage remains visual-first (dark zinc); blog is nav/footer only.

### Feature matrix

| Feature | Route | Auth | Status |
|---------|-------|------|--------|
| **Homepage** | `/` | Public | Market Pulse hero + countdown; Play Learn Win; Live Events Hub; philosophy; CTA → `/login` |
| Brand concept | `/concept` | Public | “Our Philosophy” in nav |
| Blog (EN + zh-HK) | `/blog`, `/blog/{lang}/[slug]` | Public | 3 paired articles |
| Events hub | `/events` | Public | Live |
| Fortify event detail | `/events/fortify-your-future` | Public | Synced with `/fortify-survey` |
| Past event archive | `/events/wo-leung-yiu-dou-yiu` | Public | Registration closed |
| **Fortify registration** | `/fortify-survey` | Public | **QR-coded URL — do not change** |
| **Login** | `/login` | Public | Sign In + Create Account; Google + magic link |
| **OAuth onboarding** | `/auth/onboarding` | Logged-in | Collects `contactNumber` for Google users |
| **Member profile** | `/profile` | Members only | Profile + Market Pulse history |
| **Market Pulse Hub** | `/market-pulse` | Public | Cycle progress, prize banner, top-5 leaderboard, Play CTA |
| **Market Pulse play** | `/market-pulse/play` | Login to submit | Daily swipe card (`MarketPulseSwipeCard`); locked state after submit |
| **Market Pulse leaderboard** | `/market-pulse/leaderboard` | Public | Current cycle / Monthly / All-time tabs |
| **PPA Insight reveal** | `/market-pulse/reveal` | Login for personal results | Gated until `revealAt`; no early PPA leak |
| **Market Pulse rules** | `/market-pulse/rules` | Public | Challenge rules + scoring |
| **Contest rules** | `/contest-rules` | Public | Prize eligibility + legal |
| **Admin dashboard** | `/admin` | `ADMIN` only | Members table + KV theme settings |
| **Market Pulse admin** | `/admin/market-pulse` | `ADMIN` only | Cycles, cards, publish, lock PPA, reveal, score calc, prizes |
| Game settings API | `/api/game-settings` | GET public; POST ADMIN | KV theme/event (legacy compat) |
| Market Pulse APIs | `/api/market-pulse/*` | Mixed | `today`, `decision`, `leaderboard`, `reveal` |
| **Contact** | `/contact` | Public | `contact@profitpulseally.com` |
| **FAQ** | `/faq` | Public | Placeholder |
| **Terms / Privacy** | `/terms`, `/privacy` | Public | Updated legal copy (review with counsel) |
| **Investment Disclaimer** | `/investment-disclaimer` | Public | Legal copy + attorney review notice |
| **Careers** | `/careers` | Public | `careers@profitpulseally.com` |

### Confirmed Fortify event details

Authoritative on **`/fortify-survey`** (QR codes) and mirrored on **`/events/fortify-your-future`**:

| Field | English | 中文 |
|-------|---------|------|
| Date | June 26th (Friday) | 6月26日 (星期五) |
| Time | 7:00 PM – 9:00 PM | 晚上 7:00 – 9:00 |
| Venue | WeWork YF Life Tower | WeWork YF Life Tower |
| Registration CTA | Register Now / 立即報名 → `/fortify-survey` | 同上 |

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

### Verification — last run 23 Jun 2026

| Check | Result |
|-------|--------|
| **Lint** | `npm run lint` — pass (0 errors; warnings in legacy castle-siege + TanStack admin) |
| **Typecheck** | `npm run typecheck` — pass (`tsc --noEmit`) |
| **Build** | `npm run build` — pass (`prisma db push && next build`) |
| **Prisma** | `npx prisma validate` — pass |
| **Tests** | `npm test` — **57** Vitest tests (10 files: server, scoring, reveal gating, swipe, analytics, validation, settings, challenge-cycle, seed) |
| **Production deploy** | Vercel `profit-pulse-alley` — auto-deploy from `main` |
| **Routes (local smoke)** | `/market-pulse`, `/play`, `/leaderboard`, `/reveal`, `/rules`, `/contest-rules` → 200 |
| **Auth guards** | `/profile` (guest) → login; `/admin`, `/admin/market-pulse` (guest) → `/` |
| **API** | `GET /api/game-settings` → 200; `GET /api/market-pulse/leaderboard` → 200 (empty if DB unavailable); `GET /api/market-pulse/today` → 401 when guest |

**Deploy checklist:** `docs/market-pulse-deploy-checklist.md` — env, backup, admin workflow, QA, rollback.

**Auth notes:** Sessions use **JWT** strategy. Prisma adapter persists OAuth users. Onboarding redirect in **middleware** (`src/middleware.ts`) via edge-safe `src/auth.config.ts`.

### Vercel checklist (production)

- [x] **Postgres** — `POSTGRES_URL` from **Storage → Prisma Postgres** (`prisma-postgres-celeste-dog`)
- [x] **Auth.js** — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] **Email sign-in** (optional) — `EMAIL_SERVER`, `EMAIL_FROM`
- [x] **KV** (game settings) — `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- [x] **Schema sync** — automatic via `prisma db push` in `npm run build`
- [ ] **First admin** — `UPDATE "User" SET role = 'ADMIN' WHERE email = '...'`

---

## Table of contents

0. [Current site status](#current-site-status-jun-2026)
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

- **Market Pulse** — Prisma-backed daily swipe challenge: cycles, cards, decisions, score events, leaderboards, reveal gating; admin CMS at `/admin/market-pulse`
- **Events** — Fortify Your Future hub/detail; `/fortify-survey` registration (fixed QR URL)
- **Membership** — Auth.js sign-in (Google + email), profile, role-based admin
- **Philosophy & trust** — PPA investment philosophy; expert headshots on homepage
- **Marketing** — dark-themed homepage, concept page, blog (nav/footer)
- **Admin** — member list (`/admin`) + Market Pulse ops (`/admin/market-pulse`) + KV theme settings
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
│   │   │   ├── page.tsx        ← Members + KV settings
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
│   │   ├── market-pulse/       ← Hub, SwipeCard, PlayExperience, Leaderboard, Reveal
│   │   └── admin/              ← MarketPulseAdminDashboard, forms, prize review
│   └── lib/market-pulse/
│       ├── server.ts           ← Core Prisma queries + decision submit + scoring
│       ├── reveal-access.ts    ← PPA gating (no early leak)
│       ├── admin-actions.ts    ← Admin server actions
│       ├── hub-data.ts, play-data.ts, leaderboard-data.ts, reveal-data.ts
│       ├── analytics.ts        ← trackMarketPulseEvent
│       └── *.test.ts           ← 57 unit tests
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
| `npm test` | Vitest unit tests (`vitest run`) — 57 tests |
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

- **Vercel build:** `prisma db push` runs automatically before `next build` (see [§13](#13-deployment) to switch to `migrate deploy`)
- **Local dev:** `npm run db:push` or `npm run db:migrate` after schema changes

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
| `MarketPulseCard` | Daily signal card — headline, ticker, `ppaSignal` (admin-only until reveal), `status` |
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
- **Google OAuth:** account saved via Prisma adapter on callback; JWT gets `needsOnboarding` if no `contactNumber`
- **Middleware:** after login, users with `needsOnboarding` are redirected to `/auth/onboarding`
- **Onboarding form** → `updateContactNumber()` + `session.update()` clears the flag

### Pages

| Route | Protection | Behavior |
|-------|------------|----------|
| `/login` | Public | Tabbed Sign In / Create Account; Google + magic link below; full-page |
| `/auth/onboarding` | Logged-in | Contact number form; redirects if already set or if guest |
| `/profile` | Logged-in | Profile Details + Market Pulse History cards; sign out |
| `/admin` | `role === ADMIN` | Members + game settings; others → `/` |

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

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
| `/admin` | `src/app/admin/page.tsx` | Members + KV settings |
| `/admin/market-pulse` | `src/app/admin/market-pulse/page.tsx` | Cycle/card CMS, reveal, scoring, prizes |
| `/fortify-survey` | `src/app/fortify-survey/page.tsx` | Fortify registration (QR URL) |
| `/concept`, `/blog/*`, `/events/*` | … | Content & events |
| `/api/auth/[...nextauth]` | Auth.js handlers | |
| `/api/game-settings` | KV theme/event config | Legacy compat |
| `/api/market-pulse/today` | Today's card (auth) | PPA stripped pre-reveal |
| `/api/market-pulse/decision` | Submit decision (auth) | POST only |
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

**Root layout:** Geist fonts → `AuthSessionProvider` → `LayoutShell` → children

### Header (`LayoutShell.tsx` — `useSession()`)

| Position | Items |
|----------|--------|
| **Left** | Logo → `/`; nav: **Market Pulse** (`/market-pulse`), **Events** (`/events`), **Our Philosophy** (`/concept`), **Blog** (`/blog`) |
| **Right (loading or guest)** | **Login** (text link) + **Sign Up** (solid pill) → both `/login` |
| **Right (logged in)** | **My Profile** → `/profile`; **Sign Out** button (`signOut({ callbackUrl: "/" })`) |

### Footer (`SiteFooter.tsx`)

Four columns (stack on mobile, 4-col on `lg`):

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
| 1 | `MarketPulseHero` | **Market Pulse** title, Ocean Park prize copy, live 10-day countdown (`challenge-cycle.ts`) | **Play Now** → `/market-pulse` |
| 2 | `PlayLearnWinSection` | **Play. Learn. Win.** — Daily Challenge, Expert Fireside Chats, Win Real Prizes | — |
| 3 | `LiveEventsHubSection` | Upcoming Fortify fireside (headshot + **Register for Free**); **What You've Missed** past-event cards (`home-events-hub.ts`) | → `/events/fortify-your-future` |
| 4 | `PhilosophySection` | PPA philosophy blockquote; **The Minds Behind the Market Pulse** expert headshots (`proof-of-concept.ts`) | — |
| 5 | `FinalCtaSection` | **Ready to Test Your Instincts?** | **Become a Member** → `/login` |

**Market Pulse cycle:** 10-day windows from epoch `2026-01-01 00:00 HKT`; countdown ticks client-side via `ChallengeCountdown.tsx`.

### 10.2 Fortify registration (`/fortify-survey`)

**Do not modify** `FortifyYourFutureSurvey.tsx` or the route without explicit approval — live QR codes point here. See [Confirmed Fortify event details](#confirmed-fortify-event-details) above. Google Form embed height ~1789px.

**Event detail mirror:** `src/lib/events/fortify-your-future.ts` — keep in sync when event copy changes.

### 10.3 Market Pulse Hub (`/market-pulse`)

- **Server:** `getMarketPulseHubPageData()` — active cycle, day progress, prize label, top-5 leaderboard
- **Client:** `MarketPulseHubPage.tsx` — hero, `CycleProgress`, `PrizeBanner`, `RevealCountdown`, Play CTA
- Falls back to synthetic cycle data if Prisma is unavailable (dev without `POSTGRES_URL`)

### 10.4 Market Pulse play (`/market-pulse/play`)

- **Server:** `getMarketPulsePlayPageData()` — today's published card, locked decision, sidebar leaderboard
- **Client:** `MarketPulsePlayExperience` + `MarketPulseSwipeCard` — drag/tap Bullish or Cautious
- **Submit:** `submitMarketPulseDecisionAction` → `MarketPulseDecision` row + participation score event
- **States:** `no_active_cycle`, `no_card_today`, `sign_in_required`, `playable`, `locked`
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

**`/admin`** — members table + KV theme settings (`AdminGameSettings`).

**`/admin/market-pulse`** — full ops dashboard (`MarketPulseAdminDashboard`):

1. Set active cycle + runtime status (open / closed / maintenance)
2. Create/edit cycles and daily cards
3. Lock PPA signal on a card
4. Publish card for play
5. Reveal cycle + calculate scores
6. Prize claim review

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
| `/api/market-pulse/decision` | POST | User | Submit Bullish/Cautious for today's card |
| `/api/market-pulse/leaderboard` | GET | Public | `?mode=current-cycle\|monthly\|all-time`; empty array if DB unavailable |
| `/api/market-pulse/reveal` | GET | User | Personal reveal payload; 404 until cycle revealed |

Handlers: `src/lib/market-pulse/player-handlers.ts`. Core logic: `src/lib/market-pulse/server.ts`.

---

## 12. Scripts & tooling

### Unit tests (Vitest)

```bash
npm test          # vitest run — 57 tests across market-pulse domain
npm run typecheck # tsc --noEmit
```

Config: `vitest.config.ts`. Tests live beside domain code under `src/lib/market-pulse/*.test.ts`.

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

**Flow:** push to `main` → Vercel auto-deploys **profit-pulse-alley** → build runs `prisma db push && next build`.

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

`submitMarketPulseDecisionAction` in `player-actions.ts` → `submitMarketPulseDecision` in `server.ts`. One decision per user per card; participation points on submit; match/streak on reveal.

**Leaderboard:** `getMarketPulseLeaderboard` in `server.ts`; page loaders in `hub-data.ts`, `leaderboard-data.ts`.

**Reveal gating:** `reveal-access.ts` — `getMarketPulseCardPublicPayload` strips `ppaSignal` / `ppaInsight` until `revealAt`.

**Admin ops:** `admin-actions.ts` — create cycle/card, lock PPA, publish, reveal + `calculateAndPersistCycleScores`.

**Local demo data:** `npm run db:seed` (dev only).

### Update Fortify registration

Edit only with approval — update `FortifyYourFutureSurvey.tsx` `content` + form embed; **never change `/fortify-survey` URL**.

### Update homepage copy or events showcase

- **Market Pulse hero:** `MarketPulseHero.tsx`
- **Past events grid:** `PAST_EVENTS_SHOWCASE` in `src/lib/events/home-events-hub.ts`
- **Upcoming event data:** `fortifyYourFutureEvent` in `src/lib/events/fortify-your-future.ts` (wired in `page.tsx`)
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
4. **Past events data** — Some homepage archive paths are placeholders.
5. **KV vs Prisma settings** — KV theme/event on `/admin` is legacy; runtime game state is Prisma `MarketPulseGameSetting`.
6. **No migration files** — Production uses `prisma db push` in build; adopt `migrate deploy` when ready.
7. **Legacy GameScore** — Profile may still show old arcade scores alongside new swipe challenge history.

---

## Quick reference — key files

| Concern | File(s) |
|---------|---------|
| Auth config | `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts` |
| Auth actions | `src/lib/auth-actions.ts` |
| Login / onboarding | `LoginPage.tsx`, `OnboardingPage.tsx`, `/auth/onboarding` |
| Content layout | `src/components/layout/ContentPageLayout.tsx` |
| Legal / info pages | `src/app/contact/`, `faq/`, `terms/`, `privacy/`, `careers/`, `investment-disclaimer/` |
| Profile | `src/app/profile/page.tsx` |
| Admin | `src/app/admin/page.tsx`, `src/app/admin/market-pulse/page.tsx`, `MarketPulseAdminDashboard.tsx` |
| Market Pulse Hub | `src/app/market-pulse/page.tsx`, `MarketPulseHubPage.tsx`, `hub-data.ts` |
| Market Pulse play | `src/app/market-pulse/play/page.tsx`, `MarketPulsePlayExperience.tsx`, `MarketPulseSwipeCard.tsx` |
| Leaderboard / reveal | `leaderboard/page.tsx`, `reveal/page.tsx`, `leaderboard-data.ts`, `reveal-data.ts` |
| Market Pulse domain | `src/lib/market-pulse/server.ts`, `reveal-access.ts`, `admin-actions.ts`, `analytics.ts` |
| Market Pulse APIs | `src/app/api/market-pulse/*`, `player-handlers.ts` |
| Deploy checklist | `docs/market-pulse-deploy-checklist.md` |
| Fortify (QR) | `src/components/FortifyYourFutureSurvey.tsx`, `src/lib/events/fortify-your-future.ts` |
| Nav / layout | `LayoutShell.tsx`, `SiteFooter.tsx` |
| Homepage | `src/app/page.tsx`, `src/components/home/*` |
| Market Pulse countdown | `src/lib/market-pulse/challenge-cycle.ts`, `ChallengeCountdown.tsx` |
| Homepage events data | `src/lib/events/home-events-hub.ts` |
| Philosophy / experts | `src/lib/home/proof-of-concept.ts` |
| Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Import leads | `scripts/import-leads.ts` |
| Unit tests | `vitest.config.ts`, `src/lib/market-pulse/*.test.ts` |
| Legacy Castle Siege | `src/legacy/castle-siege/` (unreferenced) |

---

## Support & handoff notes

- **Languages:** Mixed EN + Traditional Chinese (zh-Hant)
- **Data stores:** Postgres (users, Market Pulse, auth), KV (legacy theme), Markdown (blog)
- **Testing:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; smoke-test routes on `npm run dev`
- **Lint warnings:** Legacy `src/legacy/castle-siege/` unused vars; TanStack Table React Compiler notice in admin table

---

*Last updated: 23 Jun 2026 — Market Pulse swipe challenge (Prisma cycles/cards/decisions, leaderboard, reveal gating, admin CMS, 57 Vitest tests). See `docs/market-pulse-deploy-checklist.md` before production deploy.*
