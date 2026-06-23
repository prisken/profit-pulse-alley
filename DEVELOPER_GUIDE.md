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
| **Latest commit** | `876e3c3` — Market Pulse foundation refactor (tests, routes, domain lib) |
| **Production status** | Deployed; Google OAuth, Prisma Postgres, full footer pages live |

---

## Current site status (Jun 2026)

### Site strategy (current)

The public site is organized around **Market Pulse** — a recurring 10-day investment challenge with leaderboard prizes — plus **fireside events**, **membership**, and **expert-led philosophy** (PPA Take). The homepage is visual-first (dark zinc theme); blog preview and legacy promo sections were removed from `/`.

### Feature matrix

| Feature | Route | Auth | Status |
|---------|-------|------|--------|
| **Homepage** | `/` | Public | **Market Pulse** hero + countdown; Play Learn Win; Live Events Hub; philosophy; final CTA → `/login` |
| Brand concept | `/concept` | Public | “Our Philosophy” in nav |
| Blog (EN + zh-HK) | `/blog`, `/blog/{lang}/[slug]` | Public | 3 paired articles (not on homepage) |
| Events hub | `/events` | Public | Live |
| Fortify event detail | `/events/fortify-your-future` | Public | Synced with `/fortify-survey`; homepage **Register for Free** |
| Past event archive | `/events/wo-leung-yiu-dou-yiu` | Public | Registration closed; in homepage past-events grid |
| **Fortify registration** | `/fortify-survey` | Public | **QR-coded URL — do not change** |
| **Login** | `/login` | Public | Tabs: Sign In (email/password) + Create Account; Google + magic link below |
| **OAuth onboarding** | `/auth/onboarding` | Logged-in | Collects `contactNumber` for Google users missing it |
| **Member profile** | `/profile` | Members only | Profile Details card + **Market Pulse History** table; sign out |
| **Market Pulse Hub** | `/market-pulse` | Public leaderboard; play requires login | Current-cycle top 10 (fallback all-time); **Play Market Pulse** → `/market-pulse/play` |
| **Market Pulse game** | `/market-pulse/play` | Via Hub when logged in | `MarketPulseGame.tsx`; saves score + `cycleId` on game over |
| **Market Pulse rules** | `/market-pulse/rules` | Public | Challenge rules, scoring overview, fair play |
| **Admin dashboard** | `/admin` | `ADMIN` only | Members table + Market Pulse settings (KV) |
| Game settings API | `/api/game-settings` | GET public; **POST ADMIN only** | KV-backed theme/event/status (URL unchanged for compat) |
| **Contact** | `/contact` | Public | Placeholder — `contact@profitpulseally.com` |
| **FAQ** | `/faq` | Public | Placeholder — under construction |
| **Terms of Service** | `/terms` | Public | Placeholder — under construction |
| **Privacy Policy** | `/privacy` | Public | Placeholder — under construction |
| **Investment Disclaimer** | `/investment-disclaimer` | Public | Placeholder legal copy + attorney review warning |
| **Careers** | `/careers` | Public | Placeholder — `careers@profitpulseally.com` |

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
| **Lint** | `npm run lint` — pass (warnings in legacy `src/legacy/castle-siege/` + TanStack admin table) |
| **Build** | `npm run build` — pass locally (`prisma db push && next build`) |
| **Tests** | `npm test` — 16 Vitest tests (challenge-cycle + settings) |
| **Production deploy** | Vercel `profit-pulse-alley` — verify after merge to `main` |
| **Google OAuth** | Account picker → callback → onboarding or homepage |
| **Database** | Tables synced via `prisma db push` during Vercel build |
| **Homepage** (`/`) | 200 — Market Pulse sections |
| **Login** (`/login`) | 200 — Sign In / Create Account + Google |
| **Content pages** | `/contact`, `/faq`, `/terms`, `/privacy`, `/investment-disclaimer`, `/careers` → 200 |
| **Market Pulse** | `/market-pulse` hub; `/market-pulse/play` game; `/market-pulse/rules`; `/game` → 301 `/market-pulse`; `/investment-challenge` → 301 `/market-pulse/play` |
| **Onboarding** (`/auth/onboarding`) | 307 → `/login` when guest |
| **Auth guards** | `/profile` (guest) → login; `/admin` (guest) → `/` |
| **API** | `GET /api/game-settings` → 200; `POST` (guest) → 403 |

**Auth notes:** Sessions use **JWT** strategy (required for Credentials login). Prisma adapter persists OAuth users/accounts. Onboarding redirect runs in **middleware** (`src/middleware.ts`) using a lightweight edge-safe config (`src/auth.config.ts`) — not in the OAuth `signIn` callback.

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

- **Market Pulse** — 10-day challenge cycles; hub leaderboard (current cycle, all-time fallback); playable game at `/market-pulse/play`; scores saved with `cycleId` + `gameVersion`
- **Events** — Fortify Your Future hub/detail; past-event showcase on homepage; `/fortify-survey` registration (fixed QR URL)
- **Membership** — Auth.js sign-in (Google + email), profile, role-based admin
- **Philosophy & trust** — PPA investment philosophy blockquote; expert headshots; sample testimonials data exists but is **not** on current homepage
- **Marketing** — dark-themed homepage sections, concept page, blog (linked from nav/footer only)
- **Admin** — member list + Market Pulse settings (theme, event, status, leaderboard mode) in KV
- **Lead migration** — one-off CSV import script for legacy Google Form responses

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
│   API routes               │   │   • Google Sheets (Market Pulse game) │
│   Auth.js v5 (JWT)         │   │   • Google Forms (/fortify-survey)│
│   Edge middleware          │   └─────────────────────────────────┘
└───────────────┬───────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Prisma       │ │ Vercel KV    │
│ Postgres     │ │ (game-settings)│
│ User,        │ └──────────────┘
│ GameScore,   │
│ Auth tables  │
└──────────────┘
```

### Rendering model

| Pattern | Where used |
|---------|------------|
| **Server Components** | Homepage, blog, events, profile, admin, Market Pulse hub, content pages (`ContentPageLayout`) |
| **Client Components** | `MarketPulseHero`, `ChallengeCountdown`, Login, `GameHub`, `MarketPulseGame`, `LayoutShell`, `SiteFooter`, Fortify registration |
| **SSG** | Blog posts (`generateStaticParams`) |
| **Dynamic (ƒ)** | `/admin`, `/profile`, `/market-pulse`, `/api/auth/[...nextauth]` |

---

## 3. Repository structure

```
--tailwindcss/
├── DEVELOPER_GUIDE.md
├── vitest.config.ts
├── prisma/
│   └── schema.prisma           ← User, GameScore (+ cycleId), Auth.js models
├── scripts/
│   ├── import-leads.ts         ← CSV → User migration
│   └── leads.csv               ← place Google Form export here (gitignore recommended)
├── posts/                      ← blog markdown
├── public/
├── src/
│   ├── auth.ts                 ← Full Auth.js config (providers, adapter, callbacks)
│   ├── auth.config.ts          ← Edge-safe config for middleware (no Prisma/bcrypt)
│   ├── middleware.ts           ← OAuth onboarding redirect (needsOnboarding)
│   ├── app/
│   │   ├── admin/page.tsx      ← ADMIN dashboard (members + game settings)
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── api/game-settings/  ← GET public; POST ADMIN-only (KV)
│   │   ├── login/page.tsx
│   │   ├── profile/page.tsx    ← Profile Details + Market Pulse History
│   │   ├── market-pulse/
│   │   │   ├── page.tsx        ← Market Pulse Hub (leaderboard)
│   │   │   ├── play/page.tsx   ← Playable Market Pulse game
│   │   │   └── rules/page.tsx  ← Rules page
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── careers/page.tsx
│   │   ├── investment-disclaimer/page.tsx
│   │   ├── fortify-survey/
│   │   └── …
│   ├── components/
│   │   ├── layout/ContentPageLayout.tsx
│   │   ├── SiteFooter.tsx
│   │   ├── LayoutShell.tsx
│   │   ├── home/                   ← current homepage sections
│   │   │   ├── MarketPulseHero.tsx
│   │   │   ├── ChallengeCountdown.tsx
│   │   │   ├── PlayLearnWinSection.tsx
│   │   │   ├── LiveEventsHubSection.tsx
│   │   │   ├── PhilosophySection.tsx
│   │   │   └── FinalCtaSection.tsx
│   │   ├── admin/AdminMembersTable.tsx
│   │   ├── admin/AdminGameSettings.tsx
│   │   ├── auth/LoginPage.tsx
│   │   ├── game/GameHub.tsx        ← Hub UI (used by /market-pulse)
│   │   ├── providers/AuthSessionProvider.tsx
│   │   ├── market-pulse/MarketPulseGame.tsx
│   │   └── FortifyYourFutureSurvey.tsx  ← ⚠ DO NOT MODIFY (QR funnel)
│   ├── legacy/
│   │   └── castle-siege/           ← Castle Siege (unreferenced)
│   │       ├── MandateApp.tsx
│   │       └── gameLogic.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth-actions.ts
│   │   ├── market-pulse/           ← Market Pulse domain
│   │   │   ├── actions.ts          ← saveMarketPulseScore server action
│   │   │   ├── challenge-cycle.ts  ← 10-day cycle math + stable cycleId
│   │   │   ├── challenge-cycle.test.ts
│   │   │   ├── queries.ts          ← Leaderboard + profile history
│   │   │   ├── score-limits.ts     ← MIN/MAX score validation
│   │   │   ├── settings.ts         ← KV settings + parser
│   │   │   ├── settings.test.ts
│   │   │   └── types.ts
│   │   ├── blog.ts
│   │   ├── events/
│   │   │   ├── fortify-your-future.ts
│   │   │   └── home-events-hub.ts
│   │   └── home/
│   │       ├── proof-of-concept.ts
│   │       └── testimonials.ts
│   └── types/next-auth.d.ts
└── templates/event-detail.html
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
| `npm test` | Vitest unit tests (`vitest run`) |
| `npm run db:migrate` | Prisma migrate dev (when using migration files) |
| `npm run db:push` | Push schema without migration files |
| `npm run import-leads` | Import `scripts/leads.csv` → User table |

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
| `User` | Members — `email`, `name`, `image`, `contactNumber?`, `password?` (bcrypt hash), `role` (`USER` \| `ADMIN`) |
| `GameScore` | Market Pulse scores — `score`, optional `cycleId`, optional `gameVersion`, timestamps |
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
| `/market-pulse` | `src/app/market-pulse/page.tsx` | Market Pulse Hub — public leaderboard |
| `/market-pulse/play` | `src/app/market-pulse/play/page.tsx` | Playable Market Pulse game |
| `/market-pulse/rules` | `src/app/market-pulse/rules/page.tsx` | Rules and fair-play overview |
| `/admin` | `src/app/admin/page.tsx` | ADMIN dashboard — members + game settings |
| `/fortify-survey` | `src/app/fortify-survey/page.tsx` | Fortify registration (QR URL) |
| `/concept`, `/blog/*`, `/events/*` | … | Content & events |
| `/api/auth/[...nextauth]` | Auth.js handlers | |
| `/api/game-settings` | KV Market Pulse config | URL unchanged; uses `src/lib/market-pulse/settings.ts` |

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

- **Server:** `page.tsx` calls `getGameHubLeaderboardView()` — current-cycle top 10; falls back to all-time with a notice if the cycle board is empty
- **Client:** `GameHub.tsx` — leaderboard, link to **Rules** (`/market-pulse/rules`), **Play Market Pulse** → `/market-pulse/play`
- Play enabled only when `useSession()` is authenticated; else disabled + link to `/login?callbackUrl=/market-pulse/play`

### 10.4 Market Pulse game (`/market-pulse/play`)

Google Sheets CSV for game data; `/api/game-settings` for theme/event. **Entry:** Hub **Play Market Pulse** → `/market-pulse/play` (requires login).

**Score persistence:** On game over, `MarketPulseGame.tsx` calls `saveMarketPulseScore()` from `src/lib/market-pulse/actions.ts`, which validates the score, attaches the current `cycleId` from `getCurrentMarketPulseCycle()`, and writes to `GameScore` with `gameVersion`.

**Legacy redirects:** `/game` → `/market-pulse`; `/investment-challenge` → `/market-pulse/play` (301 in `next.config.ts`).

### 10.5 Market Pulse rules (`/market-pulse/rules`)

Static rules page — challenge overview, scoring summary, fair-play notes. Linked from `GameHub.tsx`.

### 10.6 Member profile (`/profile`)

Server component using `auth()` + Prisma:

1. **Profile Details** — name, email, role, avatar, Sign Out (`signOutAction`)
2. **Market Pulse History** — `getUserMarketPulseHistory()` (score, date, optional cycle label); empty state links to `/market-pulse`

### 10.7 Admin (`/admin`)

Server-side `ADMIN` role check (non-admins → `/`). Two panels:

1. **Members** — `AdminMembersTable.tsx` (TanStack React Table): sortable user list (email, name, role, created).
2. **Game Settings** — `AdminGameSettings.tsx`: theme, event, status (`open` \| `closed` \| `maintenance`), leaderboard mode (`current-cycle` \| `all-time`), optional prize label; loads/saves via GET/POST `/api/game-settings` (POST requires admin session cookie). **Note:** `status` and `leaderboardMode` are persisted but not yet wired to gate play or hub display at runtime.

Replaced legacy password gate (`NEXT_PUBLIC_ADMIN_PASSWORD`) and old Game Master-only UI.

### 10.8 Blog, events, concept

Blog and concept are reachable via header/footer nav; events detail pages unchanged. Explore `src/app/blog`, `src/app/events`, `src/app/concept`.

### 10.9 Site footer

Documented in §9. Newsletter subscribe shows a client-side confirmation only — wire to an API or email provider when ready.

### 10.10 Content pages (`ContentPageLayout`)

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
| GET | Public | Returns KV settings (`theme`, `event`, `status`, `leaderboardMode`, optional `prizeLabel`, `updatedAt`) or defaults (`MarketPulseGame` reads this at runtime) |
| POST | `ADMIN` only | Validates body via `parseMarketPulseSettings`, saves to KV key `game-settings`; 403 if not admin |

Admin UI: `AdminGameSettings.tsx` on `/admin`.

---

## 12. Scripts & tooling

### Unit tests (Vitest)

```bash
npm test          # vitest run — challenge-cycle + settings
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

### Save a Market Pulse score

Implemented in `src/lib/market-pulse/actions.ts` — `saveMarketPulseScore(score)` server action. Requires logged-in session; validates finite integer score against `score-limits.ts`; writes `GameScore` with `cycleId` and `gameVersion`; returns `{ saved: true }` or `{ saved: false, error: string }`. Called from `MarketPulseGame.tsx` on game over.

**Leaderboard queries:** `src/lib/market-pulse/queries.ts` — `getCurrentMarketPulseLeaderboard`, `getAllTimeMarketPulseLeaderboard`, `getUserMarketPulseHistory`, `getGameHubLeaderboardView`.

**Challenge cycles:** `src/lib/market-pulse/challenge-cycle.ts` — HKT-based 10-day windows; stable `cycleId` format e.g. `2026-01-01_2026-01-10`.

### Update Fortify registration

Edit only with approval — update `FortifyYourFutureSurvey.tsx` `content` + form embed; **never change `/fortify-survey` URL**.

### Update homepage copy or events showcase

- **Market Pulse hero:** `MarketPulseHero.tsx`
- **Past events grid:** `PAST_EVENTS_SHOWCASE` in `src/lib/events/home-events-hub.ts`
- **Upcoming event data:** `fortifyYourFutureEvent` in `src/lib/events/fortify-your-future.ts` (wired in `page.tsx`)
- **Philosophy / experts:** `src/lib/home/proof-of-concept.ts`

### Add a content or legal page

Use `ContentPageLayout` — see [§10.10](#1010-content-pages-contentpagelayout). Add `src/app/your-route/page.tsx` and link from `SiteFooter.tsx`.

### Import legacy leads

`npm run import-leads` with `scripts/leads.csv`.

---

## 15. Legacy & unused code

| Item | Status |
|------|--------|
| `src/legacy/castle-siege/MandateApp.tsx` + `gameLogic.ts` | Castle Siege — isolated, not imported or routed |
| `src/lib/game-master/*` | Unused KV scaffold |
| `src/lib/game-actions.ts`, `game-settings.ts`, `game-challenge-cycle.ts` | **Removed** — replaced by `src/lib/market-pulse/*` |
| `src/app/game/page.tsx` | **Removed** — `/game` redirects to `/market-pulse` |
| `HomeHero.tsx`, `HomeEventsHub.tsx`, `HomeProofOfConcept.tsx`, `HomeTestimonials.tsx` | Superseded homepage components — **not imported** by `page.tsx` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Removed — admin uses DB role |
| Old inline footer in `LayoutShell` | Replaced by `SiteFooter.tsx` |
| `/images/fortify-hero-*.png`, `/hero.png` | No longer used on homepage |

---

## 16. Known inconsistencies

1. **Placeholder legal copy** — `/terms`, `/privacy`, `/investment-disclaimer`, and `/faq` need real content from legal/comms before public launch. Investment disclaimer includes an explicit placeholder warning.
2. **Newsletter** — `SiteFooter` subscribe is UI-only; no backend or mailing list integration.
3. **Social URLs** — LinkedIn/Twitter in footer use placeholder company URLs; Instagram uses the live profile link.
4. **Past events data** — Two of three homepage past-event cards use placeholder archive paths under `/events/archive/…`.
5. **Agenda times** — Event detail agenda slots vs registration page headline times may differ slightly.
6. **Admin settings not fully wired** — `status` and `leaderboardMode` save to KV but do not yet block play or switch hub leaderboard mode at runtime.
7. **Admin UI label** — Settings panel heading may still say “VC Game Settings” while product branding is Market Pulse.
8. **No migration files** — Production relies on `prisma db push` in build; migrate to `prisma migrate deploy` when ready (see [§6](#6-database--prisma)).

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
| Admin | `src/app/admin/page.tsx`, `AdminMembersTable.tsx`, `AdminGameSettings.tsx` |
| Market Pulse Hub | `src/app/market-pulse/page.tsx`, `src/components/game/GameHub.tsx` |
| Market Pulse play | `src/app/market-pulse/play/page.tsx`, `src/components/market-pulse/MarketPulseGame.tsx` |
| Market Pulse rules | `src/app/market-pulse/rules/page.tsx` |
| Market Pulse domain | `src/lib/market-pulse/` (`actions`, `challenge-cycle`, `queries`, `settings`, `score-limits`, `types`) |
| Game settings API | `src/app/api/game-settings/route.ts`, `src/lib/market-pulse/settings.ts` |
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
- **Data stores:** Postgres (users/scores/auth), KV (game settings), Markdown (blog), Google Sheets (game content)
- **Testing:** `npm run lint`, `npm test`, `npm run build` (requires `POSTGRES_URL` locally); smoke-test routes against `npm run dev`
- **Lint warnings:** Legacy `src/legacy/castle-siege/` unused vars; TanStack Table React Compiler notice in admin table

---

*Last updated: 23 Jun 2026 — commit `876e3c3`: Market Pulse foundation refactor (domain lib, cycle-aware leaderboard, `/market-pulse` hub + `/play` + `/rules`, Vitest, legacy isolation)*
