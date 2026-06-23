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
| **Hosting** | Vercel (auto-deploy from `main`) |
| **Local status** | Lint + build **pass** (23 Jun 2026); ready for deploy on `main` |

---

## Current site status (May 2026)

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
| **Member profile** | `/profile` | Members only | Name, email, scores, sign out |
| **Game Hub** | `/game` | Public leaderboard; play requires login | Top 10 scores + **Play Game** → VC challenge |
| VC Investment Challenge | `/investment-challenge` | Via Game Hub when logged in | Saves score on game over |
| **Admin dashboard** | `/admin` | `ADMIN` only | Members table + VC Game Settings |
| Game settings API | `/api/game-settings` | GET public; **POST ADMIN only** | KV-backed theme/event |
| Footer placeholder pages | `/contact`, `/faq`, `/careers`, `/terms`, `/privacy`, `/investment-disclaimer` | — | **Routes not implemented** — footer links only |

### Confirmed Fortify event details

Authoritative on **`/fortify-survey`** (QR codes) and mirrored on **`/events/fortify-your-future`**:

| Field | English | 中文 |
|-------|---------|------|
| Date | June 26th (Friday) | 6月26日 (星期五) |
| Time | 7:00 PM – 9:00 PM | 晚上 7:00 – 9:00 |
| Venue | WeWork YF Life Tower | WeWork YF Life Tower |
| Registration CTA | Register Now / 立即報名 → `/fortify-survey` | 同上 |

### Verification (local) — last run 23 Jun 2026

| Check | Result |
|-------|--------|
| **Lint** | `npm run lint` — **pass** (0 errors; 8 warnings in legacy `MandateApp.tsx` + TanStack admin table) |
| **Build** | `npm run build` — **pass** (TypeScript + static generation) |
| **Homepage** (`/`) | 200 — Market Pulse, Play Now, Live Events Hub, footer |
| **Login** (`/login`) | 200 — tabbed Sign In / Create Account (client-rendered) |
| **Onboarding** (`/auth/onboarding`) | 307 → `/login?callbackUrl=/auth/onboarding` when guest |
| **Nav routes** | `/game`, `/events`, `/concept`, `/blog` → 200 |
| **Auth guards** | `/profile` (guest) → 307 `/login?callbackUrl=/profile`; `/admin` (guest) → 307 `/` |
| **API** | `GET /api/game-settings` → 200; `POST` (guest) → 403 |
| **Import script** | `npm run import-leads` — requires `scripts/leads.csv` + Postgres env |

**Deploy prerequisites:** Run `npx prisma migrate deploy` on Vercel after push (adds `contactNumber` + `password` to `User`). Set Postgres + Auth env vars before membership features work in production.

**Auth notes:** Sessions use **JWT** strategy (required for Credentials/password login). Prisma adapter still persists users/accounts. Nodemailer registers only when `EMAIL_SERVER` + `EMAIL_FROM` are set.

**Postgres note:** Without `POSTGRES_PRISMA_URL`, leaderboard/profile/admin degrade gracefully; connect Postgres for full features.

### Vercel infrastructure checklist

- [ ] **Postgres** — `POSTGRES_URL` (from Vercel **Storage → Prisma Postgres**, linked to `profit-pulse-alley`)
- [ ] **Auth.js** — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] **Email sign-in** (optional) — `EMAIL_SERVER`, `EMAIL_FROM`
- [ ] **KV** (VC game) — `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- [ ] Run `npx prisma migrate deploy` after connecting Postgres (includes `contactNumber`, `password` on `User`)
- [ ] Promote first admin: `UPDATE "User" SET role = 'ADMIN' WHERE email = '...'`

---

## Table of contents

0. [Current site status](#current-site-status-may-2026)
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

- **Market Pulse game** — 10-day cycle countdown on homepage; Game Hub leaderboard; VC Investment Challenge; scores saved to Postgres
- **Events** — Fortify Your Future hub/detail; past-event showcase on homepage; `/fortify-survey` registration (fixed QR URL)
- **Membership** — Auth.js sign-in (Google + email), profile, role-based admin
- **Philosophy & trust** — PPA investment philosophy blockquote; expert headshots; sample testimonials data exists but is **not** on current homepage
- **Marketing** — dark-themed homepage sections, concept page, blog (linked from nav/footer only)
- **Admin** — member list + VC game theme/event settings (KV)
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
│   API routes               │   │   • Google Sheets (VC game)      │
│   auth() server sessions   │   │   • Google Forms (/fortify-survey)│
└───────────────┬───────────┘   └─────────────────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Vercel       │ │ Vercel KV    │
│ Postgres     │ │ (game-settings)│
│ User,        │ └──────────────┘
│ GameScore,   │
│ Auth tables  │
└──────────────┘
```

### Rendering model

| Pattern | Where used |
|---------|------------|
| **Server Components** | Homepage sections (events data), blog, events, profile, admin, game page |
| **Client Components** | `MarketPulseHero`, `ChallengeCountdown`, Login, Game Hub, VC game, `LayoutShell`, `SiteFooter`, Fortify registration |
| **SSG** | Blog posts (`generateStaticParams`) |
| **Dynamic (ƒ)** | `/admin`, `/profile`, `/api/auth/[...nextauth]` |

---

## 3. Repository structure

```
--tailwindcss/
├── DEVELOPER_GUIDE.md
├── prisma/
│   └── schema.prisma           ← User, GameScore, Auth.js models
├── scripts/
│   ├── import-leads.ts         ← CSV → User migration
│   └── leads.csv               ← place Google Form export here (gitignore recommended)
├── posts/                      ← blog markdown
├── public/
├── src/
│   ├── auth.ts                 ← Auth.js config (handlers, auth, signIn, signOut)
│   ├── app/
│   │   ├── admin/page.tsx      ← ADMIN dashboard (members + game settings)
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── api/game-settings/  ← GET public; POST ADMIN-only
│   │   ├── game/page.tsx       ← Game Hub
│   │   ├── login/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── fortify-survey/
│   │   └── …
│   ├── components/
│   │   ├── SiteFooter.tsx          ← four-column footer + newsletter (client)
│   │   ├── LayoutShell.tsx         ← header nav + footer wrapper
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
│   │   ├── game/GameHub.tsx
│   │   ├── providers/AuthSessionProvider.tsx
│   │   ├── vc-challenge/VCInvestmentGame.tsx
│   │   └── FortifyYourFutureSurvey.tsx  ← ⚠ DO NOT MODIFY (QR funnel)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth-actions.ts
│   │   ├── game-actions.ts
│   │   ├── game-challenge-cycle.ts  ← Market Pulse 10-day countdown math
│   │   ├── blog.ts
│   │   ├── game-settings.ts
│   │   ├── events/
│   │   │   ├── fortify-your-future.ts
│   │   │   └── home-events-hub.ts   ← past-event showcase placeholders
│   │   └── home/
│   │       ├── proof-of-concept.ts  ← philosophy + experts
│   │       └── testimonials.ts      ← sample quotes (unused on homepage)
│   └── types/next-auth.d.ts    ← Session.user.id + role augmentation
└── templates/event-detail.html
```

---

## 4. Local development

```bash
cd --tailwindcss
npm install          # runs prisma generate via postinstall
cp .env.example .env.local   # fill in Postgres, Auth, optional KV/SMTP
npx prisma migrate dev       # first-time DB setup
npm run dev
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Production build + typecheck |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:push` | Push schema without migration |
| `npm run import-leads` | Import `scripts/leads.csv` → User table |

---

## 5. Environment variables

| Variable | Required | Used by |
|----------|----------|---------|
| `POSTGRES_URL` | Yes (membership, game hub, admin, Google login) | Prisma — direct Postgres from Vercel Prisma Postgres |
| `DATABASE_URL` | Optional | May mirror `POSTGRES_URL` depending on integration |
| `PRISMA_DATABASE_URL` | Optional | Prisma Postgres integration (often `prisma+postgres://`) |
| `AUTH_SECRET` | Yes (production) | Auth.js (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | For Google login | Auth.js Google provider |
| `AUTH_GOOGLE_SECRET` | For Google login | Auth.js Google provider |
| `EMAIL_SERVER` | For email login | Nodemailer provider (e.g. `smtp://user:pass@host:587`) |
| `EMAIL_FROM` | For email login | Magic-link sender address |
| `KV_REST_API_URL` | VC game settings | `@vercel/kv` |
| `KV_REST_API_TOKEN` | VC game settings | `@vercel/kv` |

`.env.local` is gitignored. **Never commit secrets.**

Nodemailer is **omitted from Auth.js providers** when `EMAIL_SERVER` / `EMAIL_FROM` are unset — allows local build without SMTP.

---

## 6. Database & Prisma

**Schema:** `prisma/schema.prisma`  
**Client:** `src/lib/prisma.ts` (singleton)

**Migrations:** Run locally after schema changes:

```bash
npx prisma migrate dev --name add-password-auth   # adds contactNumber + password
npx prisma migrate deploy                        # production (Vercel)
```

Or `npm run db:push` for prototyping only.

### Models

| Model | Purpose |
|-------|---------|
| `User` | Members — `email`, `name`, `image`, `contactNumber?`, `password?` (bcrypt hash), `role` (`USER` \| `ADMIN`) |
| `GameScore` | Scores linked to `User` — `score`, timestamps |
| `Account`, `Session`, `VerificationToken` | Auth.js Prisma Adapter |

### First admin user

After signing up via `/login`, promote in SQL or Prisma Studio:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

---

## 7. Authentication & membership

**Config:** `src/auth.ts`  
**Actions:** `src/lib/auth-actions.ts` — `signUpWithPassword`, `updateContactNumber`, `signOutAction`  
**Route:** `src/app/api/auth/[...nextauth]/route.ts`  
**Session:** **JWT** strategy (supports Credentials + OAuth); `jwt` + `session` callbacks add `id` and `role`

### Providers

| Provider | Purpose |
|----------|---------|
| **Google OAuth** | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` |
| **Credentials** | Email + password (`bcrypt.compare` against `User.password`) |
| **Nodemailer** | Magic link when `EMAIL_SERVER` + `EMAIL_FROM` set |

### Sign-up & onboarding

- **Create Account** tab on `/login` → `signUpWithPassword()` hashes password with bcrypt, stores `contactNumber`
- **OAuth onboarding:** middleware redirects logged-in users without `contactNumber` → `/auth/onboarding` (after Google OAuth completes)
- **Onboarding form** → `updateContactNumber()` updates the logged-in user

### Pages

| Route | Protection | Behavior |
|-------|------------|----------|
| `/login` | Public | Tabbed Sign In / Create Account; Google + magic link below; full-page |
| `/auth/onboarding` | Logged-in | Contact number form; redirects if already set or if guest |
| `/profile` | Logged-in | Name, email, role, game scores; sign out |
| `/admin` | `role === ADMIN` | Members + VC game settings; others → `/` |

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

### Client session

`AuthSessionProvider` wraps the app in `layout.tsx` for `useSession()` (Game Hub Play button).

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
| `/profile` | `src/app/profile/page.tsx` | Member profile + scores |
| `/game` | `src/app/game/page.tsx` | Game Hub — public leaderboard |
| `/admin` | `src/app/admin/page.tsx` | ADMIN dashboard — members + VC game settings |
| `/fortify-survey` | `src/app/fortify-survey/page.tsx` | Fortify registration (QR URL) |
| `/investment-challenge` | `src/app/investment-challenge/page.tsx` | VC game |
| `/concept`, `/blog/*`, `/events/*` | … | Content & events |
| `/api/auth/[...nextauth]` | Auth.js handlers | |
| `/api/game-settings` | KV game config | |

### Redirects

| Source | Destination |
|--------|-------------|
| `/event` | `/events` |
| `/game` | *(no longer redirects)* — Game Hub lives at `/game` |

---

## 9. Layout & navigation

**Root layout:** Geist fonts → `AuthSessionProvider` → `LayoutShell` → children

### Header (`LayoutShell.tsx` — `useSession()`)

| Position | Items |
|----------|--------|
| **Left** | Logo → `/`; nav: **Game** (`/game`), **Events** (`/events`), **Our Philosophy** (`/concept`), **Blog** (`/blog`) |
| **Right (loading or guest)** | **Login** (text link) + **Sign Up** (solid pill) → both `/login` |
| **Right (logged in)** | **My Profile** → `/profile`; **Sign Out** button (`signOut({ callbackUrl: "/" })`) |

### Footer (`SiteFooter.tsx`)

Four columns (stack on mobile, 4-col on `lg`):

| Column | Links / content |
|--------|------------------|
| **PPA** | Game, Events, Our Philosophy, Blog |
| **Community** | Contact Us, FAQs, Careers → placeholder routes |
| **Legal** | Terms, Privacy, **Investment Disclaimer** (emphasized) → placeholder routes |
| **Stay Connected** | Email + Subscribe (client-only UI); LinkedIn, Twitter, Instagram — **inline SVGs** (not lucide brand icons) |

Bottom bar: logo left; `© 2026 Profit Pulse Ally. All Rights Reserved.` right.

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

---

## 10. Feature areas

### 10.1 Homepage (`src/app/page.tsx`)

Dark zinc layout (`bg-zinc-950`). Composes five sections — **no blog preview** on homepage.

| # | Component | Purpose | Primary CTAs |
|---|-----------|---------|--------------|
| 1 | `MarketPulseHero` | **Market Pulse** title, Ocean Park prize copy, live 10-day countdown (`game-challenge-cycle.ts`) | **Play Now** → `/game` |
| 2 | `PlayLearnWinSection` | **Play. Learn. Win.** — Daily Challenge, Expert Fireside Chats, Win Real Prizes | — |
| 3 | `LiveEventsHubSection` | Upcoming Fortify fireside (headshot + **Register for Free**); **What You've Missed** past-event cards (`home-events-hub.ts`) | → `/events/fortify-your-future` |
| 4 | `PhilosophySection` | PPA philosophy blockquote; **The Minds Behind the Market Pulse** expert headshots (`proof-of-concept.ts`) | — |
| 5 | `FinalCtaSection` | **Ready to Test Your Instincts?** | **Become a Member** → `/login` |

**Market Pulse cycle:** 10-day windows from epoch `2026-01-01 00:00 HKT`; countdown ticks client-side via `ChallengeCountdown.tsx`.

### 10.2 Fortify registration (`/fortify-survey`)

**Do not modify** `FortifyYourFutureSurvey.tsx` or the route without explicit approval — live QR codes point here. See [Confirmed Fortify event details](#confirmed-fortify-event-details) above. Google Form embed height ~1789px.

**Event detail mirror:** `src/lib/events/fortify-your-future.ts` — keep in sync when event copy changes.

### 10.3 Game Hub (`/game`)

- **Server:** fetches top 10 `GameScore` with user names
- **Client:** `GameHub.tsx` — leaderboard + **Play Game**
- Play enabled only when `useSession()` is authenticated; else disabled + link to `/login?callbackUrl=/game`

### 10.4 VC Investment Challenge

Google Sheets CSV for game data; `/api/game-settings` for theme/event. **Entry:** Game Hub **Play Game** → `/investment-challenge` (requires login).

**Score persistence:** On game over, `VCInvestmentGame.tsx` calls `saveGameScore()` from `src/lib/game-actions.ts`, which writes total net worth to `GameScore` for the logged-in user.

### 10.5 Admin (`/admin`)

Server-side `ADMIN` role check (non-admins → `/`). Two panels:

1. **Members** — `AdminMembersTable.tsx` (TanStack React Table): sortable user list (email, name, role, created).
2. **VC Game Settings** — `AdminGameSettings.tsx`: loads/saves theme + event via GET/POST `/api/game-settings` (POST requires admin session cookie).

Replaced legacy password gate (`NEXT_PUBLIC_ADMIN_PASSWORD`) and old Game Master-only UI.

### 10.6 Blog, events, concept

Blog and concept are reachable via header/footer nav; events detail pages unchanged. Explore `src/app/blog`, `src/app/events`, `src/app/concept`.

### 10.7 Site footer

Documented in §9. Newsletter subscribe shows a client-side confirmation only — wire to an API or email provider when ready.

---

## 11. Backend & API

### Auth.js — `/api/auth/[...nextauth]`

Standard Auth.js v5 endpoints (sign-in, sign-out, callbacks, session).

### Game settings — `/api/game-settings`

| Method | Auth | Behavior |
|--------|------|----------|
| GET | Public | Returns KV `{ theme, event }` or defaults (VC game reads this at runtime) |
| POST | `ADMIN` only | Validates body via `parseGameSettings`, saves to KV; 403 if not admin |

Admin UI: `AdminGameSettings.tsx` on `/admin`.

---

## 12. Scripts & tooling

### `scripts/import-leads.ts`

Migrates Google Form CSV exports into `User` rows.

```bash
# 1. Export form responses → scripts/leads.csv
# 2. Ensure POSTGRES_* in .env.local
npm run import-leads
```

- Skips existing emails
- Auto-detects email/name columns from Google Forms headers
- Logs per-row actions + summary

---

## 13. Deployment

1. Push local changes to `main` → Vercel auto-deploy
2. Connect **Prisma Postgres** in Vercel → project **profit-pulse-alley** → **Storage** → link `prisma-postgres-celeste-dog` (env vars must have **non-empty** `DATABASE_URL`)
3. Set all [environment variables](#5-environment-variables)
4. Create tables in production:

```bash
cd --tailwindcss
npx vercel link --project profit-pulse-alley
npx vercel env pull .env.production.local --environment=production
set -a && source .env.production.local && set +a
npx prisma db push
```

5. Redeploy after env changes
6. Promote an `ADMIN` user in production DB
7. Verify `/login`, Google OAuth, `/game`, `/admin` on production

### Google login shows “Server error / Configuration”

This usually means **Postgres is not connected** or **`DATABASE_URL` is empty**. Google OAuth starts (account picker works) but the callback fails when Auth.js tries to save the user via the Prisma adapter.

**Fix:** Vercel → **profit-pulse-alley** → **Storage** → connect **Prisma Postgres** → confirm `DATABASE_URL` is populated → redeploy → run `npx prisma db push` (above).

Google Cloud Console redirect URIs must include:

- `https://profitpulseally.com/api/auth/callback/google`
- `https://profit-pulse-alley.vercel.app/api/auth/callback/google`

---

## 14. How to extend the site

### Add a member-only page

```typescript
const session = await auth();
if (!session?.user?.id) redirect("/login?callbackUrl=/your-path");
```

### Save a game score

Implemented in `src/lib/game-actions.ts` — `saveGameScore(score)` server action. Requires logged-in session; rounds score, writes to `GameScore`, returns `{ saved: boolean }`. Called from `VCInvestmentGame.tsx` on game over.

### Update Fortify registration

Edit only with approval — update `FortifyYourFutureSurvey.tsx` `content` + form embed; **never change `/fortify-survey` URL**.

### Update homepage copy or events showcase

- **Market Pulse hero:** `MarketPulseHero.tsx`
- **Past events grid:** `PAST_EVENTS_SHOWCASE` in `src/lib/events/home-events-hub.ts`
- **Upcoming event data:** `fortifyYourFutureEvent` in `src/lib/events/fortify-your-future.ts` (wired in `page.tsx`)
- **Philosophy / experts:** `src/lib/home/proof-of-concept.ts`

### Import legacy leads

`npm run import-leads` with `scripts/leads.csv`.

---

## 15. Legacy & unused code

| Item | Status |
|------|--------|
| `MandateApp.tsx` + `gameLogic.ts` | Castle Siege — not routed |
| `src/lib/game-master/*` | Unused KV scaffold |
| `HomeHero.tsx`, `HomeEventsHub.tsx`, `HomeProofOfConcept.tsx`, `HomeTestimonials.tsx` | Superseded homepage components — **not imported** by `page.tsx` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Removed — admin uses DB role |
| Old inline footer in `LayoutShell` | Replaced by `SiteFooter.tsx` |
| `/images/fortify-hero-*.png`, `/hero.png` | No longer used on homepage |

---

## 16. Known inconsistencies

1. **Footer placeholder routes** — `/contact`, `/faq`, `/careers`, `/terms`, `/privacy`, `/investment-disclaimer`, and some past-event archive URLs return 404 until pages are built.
2. **Newsletter** — `SiteFooter` subscribe is UI-only; no backend or mailing list integration.
3. **Social URLs** — LinkedIn/Twitter in footer use placeholder company URLs; Instagram uses the live profile link.
4. **Past events data** — Two of three homepage past-event cards use placeholder archive paths under `/events/archive/…`.
5. **Production Postgres** — Run `npx prisma migrate deploy` on Vercel after deploy (`contactNumber`, `password` columns).
6. **Agenda times** — Event detail agenda slots vs registration page headline times may differ slightly.
7. **Branding** — Public copy says **Market Pulse**; VC game route remains `/investment-challenge`; Game Hub nav label is **Game**.

---

## Quick reference — key files

| Concern | File(s) |
|---------|---------|
| Auth config | `src/auth.ts`, `src/types/next-auth.d.ts` |
| Auth actions | `src/lib/auth-actions.ts` |
| Login / onboarding | `LoginPage.tsx`, `OnboardingPage.tsx`, `/auth/onboarding` |
| Profile | `src/app/profile/page.tsx` |
| Admin | `src/app/admin/page.tsx`, `AdminMembersTable.tsx`, `AdminGameSettings.tsx` |
| Game Hub | `src/app/game/page.tsx`, `src/components/game/GameHub.tsx` |
| Game scores | `src/lib/game-actions.ts`, `VCInvestmentGame.tsx` |
| Game settings API | `src/app/api/game-settings/route.ts`, `src/lib/game-settings.ts` |
| Fortify (QR) | `src/components/FortifyYourFutureSurvey.tsx`, `src/lib/events/fortify-your-future.ts` |
| Nav / layout | `LayoutShell.tsx`, `SiteFooter.tsx` |
| Homepage | `src/app/page.tsx`, `src/components/home/*` |
| Market Pulse countdown | `src/lib/game-challenge-cycle.ts`, `ChallengeCountdown.tsx` |
| Homepage events data | `src/lib/events/home-events-hub.ts` |
| Philosophy / experts | `src/lib/home/proof-of-concept.ts` |
| Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Import leads | `scripts/import-leads.ts` |
| VC game | `src/components/vc-challenge/VCInvestmentGame.tsx` |

---

## Support & handoff notes

- **Languages:** Mixed EN + Traditional Chinese (zh-Hant)
- **Data stores:** Postgres (users/scores/auth), KV (game settings), Markdown (blog), Google Sheets (game content)
- **Testing:** `npm run lint` + `npm run build`; smoke-test key routes with `node`/`fetch` against `npm run dev` (see [Verification](#verification-local--last-run-23-jun-2026)); no automated test suite
- **Lint warnings:** Legacy `MandateApp.tsx` unused vars; TanStack Table React Compiler notice in admin table

---

*Last updated: 23 Jun 2026 — Market Pulse homepage, membership (password + OAuth onboarding), JWT auth, SiteFooter; lint/build verified; pushed to `main`*
