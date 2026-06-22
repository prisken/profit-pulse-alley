# Profit Pulse Ally — Developer Guide

Comprehensive reference for developers taking over or contributing to the **Profit Pulse Ally** website.

| Item | Value |
|------|-------|
| **Production URL** | https://profitpulseally.com |
| **Repository** | https://github.com/prisken/profit-pulse-alley.git |
| **App directory** | `--tailwindcss/` (Next.js project root) |
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Hosting** | Vercel (typical deployment target) |

---

## Table of contents

1. [What this site does](#1-what-this-site-does)
2. [Architecture overview](#2-architecture-overview)
3. [Repository structure](#3-repository-structure)
4. [Local development](#4-local-development)
5. [Environment variables](#5-environment-variables)
6. [Routing & pages](#6-routing--pages)
7. [Layout & navigation](#7-layout--navigation)
8. [Feature areas](#8-feature-areas)
9. [Backend & API](#9-backend--api)
10. [Data & external services](#10-data--external-services)
11. [Static assets](#11-static-assets)
12. [Deployment](#12-deployment)
13. [How to extend the site](#13-how-to-extend-the-site)
14. [Legacy & unused code](#14-legacy--unused-code)
15. [Known inconsistencies](#15-known-inconsistencies)

---

## 1. What this site does

Profit Pulse Ally is a bilingual (English / Traditional Chinese) community site for new-generation investors and founders. It combines:

- **Marketing & content** — homepage, brand concept page, blog
- **Events** — upcoming *Fortify Your Future* event hub, detail pages, and a past-event archive
- **Lead capture** — bilingual survey landing page with embedded Google Form
- **Interactive games** — VC Investment Challenge (live) and Castle Siege / MandateApp (legacy, not routed)

There is **no traditional user authentication** for visitors. The only “auth” is a lightweight client-side password gate on `/admin` for game configuration.

---

## 2. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (client)                         │
│  React components ("use client") + Next.js Server Components     │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│   Next.js App Router       │   │   External data sources          │
│   (SSR / SSG at build)     │   │   • Google Sheets (CSV export)   │
│                            │   │   • Google Forms (iframe embed)  │
│   pages in src/app/        │   │   • picsum.photos (blog fallback)│
│   API routes in src/app/api│   └─────────────────────────────────┘
└───────────────┬───────────┘
                │
                ▼
┌───────────────────────────┐
│   Vercel KV / Upstash      │
│   Redis (game-settings)    │
└───────────────────────────┘
```

### Rendering model

| Pattern | Where used |
|---------|------------|
| **Server Components** (default) | Homepage, blog listing/posts, events pages, concept page |
| **Client Components** (`"use client"`) | LayoutShell, BlogHub, Fortify survey, VC game, admin panel |
| **Static generation** | Blog posts via `generateStaticParams` |
| **API Routes** | `GET/POST /api/game-settings` |

### Path alias

TypeScript resolves `@/*` → `src/*` (see `tsconfig.json`).

---

## 3. Repository structure

```
--tailwindcss/
├── DEVELOPER_GUIDE.md          ← this file
├── .env.example                ← env var template (note: .gitignore uses .env*)
├── next.config.ts              ← redirects, image remote patterns
├── package.json
├── posts/                      ← blog markdown (not in src/)
│   ├── en/*.md
│   └── zh-hk/*.md
├── public/                     ← static files served at /
│   ├── logo.png
│   ├── images/                 ← Fortify hero & event posters
│   ├── event/                  ← past event imagery
│   ├── blog/                   ← post cover images
│   └── …headshots, hero assets
├── src/
│   ├── app/                    ← Next.js App Router (routes + API)
│   ├── components/             ← shared & feature UI
│   └── lib/                    ← server utilities, types, KV helpers
└── templates/
    └── event-detail.html       ← reference HTML (not used at runtime)
```

---

## 4. Local development

```bash
cd --tailwindcss
npm install
npm run dev
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (default http://localhost:3000, Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

Copy `.env.example` to `.env.local` and fill in values for KV and admin password when testing game settings persistence.

---

## 5. Environment variables

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| `KV_REST_API_URL` | Production (game settings) | `@vercel/kv`, `/api/game-settings` | Upstash/Vercel Redis REST URL |
| `KV_REST_API_TOKEN` | Production (game settings) | Same | Redis REST token (read/write) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Recommended in prod | `/admin` | Client-side admin gate. If unset, admin is open (dev convenience). |

`.env.local` is gitignored. **Never commit secrets.** Rotate tokens if exposed.

Optional / unused by current live code:

- `KV_URL`, `REDIS_URL` — direct Redis URLs; the app uses REST via `@vercel/kv`
- `src/lib/kv.ts` — alternate KV wrapper with `getKv()` / `isKvConfigured()` (used by older `game-master` scaffold, not the live admin API)

---

## 6. Routing & pages

### Public routes

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/` | `src/app/page.tsx` | Server | Homepage — Fortify hero, speakers, event promo, blog teaser, Castle Siege CTA |
| `/concept` | `src/app/concept/page.tsx` | Server | “零成本人生” brand concept page |
| `/blog` | `src/app/blog/page.tsx` | Server | Blog hub with language tabs |
| `/blog/en` | `src/app/blog/en/page.tsx` | Server | English post index |
| `/blog/zh-hk` | `src/app/blog/zh-hk/page.tsx` | Server | Chinese (HK) post index |
| `/blog/en/[slug]` | `src/app/blog/en/[slug]/page.tsx` | SSG | English article |
| `/blog/zh-hk/[slug]` | `src/app/blog/zh-hk/[slug]/page.tsx` | SSG | Chinese article |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Redirect | → `/blog/zh-hk/[slug]` |
| `/events` | `src/app/events/page.tsx` | Server | Events hub (upcoming + past) |
| `/events/fortify-your-future` | `src/app/events/fortify-your-future/page.tsx` | Server | Fortify event detail |
| `/events/wo-leung-yiu-dou-yiu` | `src/app/events/wo-leung-yiu-dou-yiu/page.tsx` | Server | Past event archive |
| `/fortify-survey` | `src/app/fortify-survey/page.tsx` | Client | Bilingual interest survey + Google Form |
| `/investment-challenge` | `src/app/investment-challenge/page.tsx` | Client | VC Investment Challenge game |
| `/admin` | `src/app/admin/page.tsx` | Client | Game Master admin (theme/event) |

### Redirects

| Source | Destination | Config |
|--------|-------------|--------|
| `/event` | `/events` | `next.config.ts` + `src/app/event/page.tsx` |
| `/game` | `/investment-challenge` | `src/app/game/page.tsx` |

### Full-page routes (no site header/footer)

Configured in `LayoutShell.tsx`:

- `/fortify-survey`
- `/admin`

All other routes get the global header (logo, nav) and footer (links, social).

---

## 7. Layout & navigation

### Root layout — `src/app/layout.tsx`

- Loads **Geist** fonts
- Sets site-wide `metadata` (title, description, `metadataBase`)
- Wraps all pages in `<LayoutShell>`

### Layout shell — `src/components/LayoutShell.tsx`

Client component that reads `usePathname()`:

- **Full-page mode** — renders children only (no chrome)
- **Standard mode** — sticky header + footer

**Header nav links:**

| Label | Path |
|-------|------|
| Home | `/` |
| The Concept | `/concept` |
| Blog | `/blog` |
| 活動 | `/events` |
| 城堡攻防戰 | `/investment-challenge` |

**Footer social:** Instagram, Facebook, Threads (hardcoded URLs).

---

## 8. Feature areas

### 8.1 Homepage (`src/app/page.tsx`)

Server component. Sections include:

1. Value proposition (Chinese tagline)
2. **Hero** — responsive images `fortify-hero-1600.png` (mobile) / `fortify-hero-1920.png` (desktop)
3. **Meet the Speakers** — Vicky Huang, Marcy Chan
4. **Event promo** — links to `/fortify-survey` and `/events/fortify-your-future`
5. **Why You Should Attend** — highlight cards (note: may still reference WeWork — see [Known inconsistencies](#15-known-inconsistencies))
6. **Our Network of Experts**
7. **Testimonial** placeholder
8. **Blog** — latest 3 posts (prefers `zh-hk` if posts exist)
9. **Castle Siege** promo → `/investment-challenge`

Blog data loaded via `getAllPosts()` from `src/lib/blog.ts`.

---

### 8.2 The Concept (`/concept`)

Static marketing page explaining the “零成本人生” philosophy. Uses Lucide icons, pillar cards, achievement grid, CTAs to blog and investment challenge.

---

### 8.3 Blog system

**Content location:** `posts/en/` and `posts/zh-hk/` as Markdown files.

**Frontmatter fields:**

```yaml
---
title: Article title
date: 2026-03-30
cover: /blog/01.png   # optional; falls back to picsum.photos
---
```

**Processing pipeline** (`src/lib/blog.ts`):

1. `gray-matter` parses frontmatter + body
2. `remark` + `remark-html` converts Markdown → HTML
3. Posts sorted by `date` descending
4. Excerpt auto-generated from first ~160 chars

**UI** (`src/components/BlogHub.tsx`):

- Client-side language toggle (`zh-hk` | `en`)
- Article cards with cover image, excerpt, date
- Links to `/blog/{lang}/{slug}`

**Current posts (paired EN/zh-hk):**

- `zero-cost-life-philosophy`
- `money-mindset-spender-to-investor`
- `passive-income-first-step-5-ideas`

---

### 8.4 Events system

#### Events hub (`/events`)

Hardcoded upcoming card for **Fortify Your Future** with poster image and link to detail page. Past events list links to archive pages.

#### Event detail template

**Component:** `src/components/events/EventDetailTemplate.tsx`

Reusable layout driven by `EventDetailData` (`src/lib/events/types.ts`):

- Hero (title, subtitle, highlights, CTA, optional poster image)
- Speakers grid
- Agenda
- Venue + date/location/cost sidebar
- Optional `mapHtml`, `pastEventBanner`
- Registration CTA (internal `Link` or external `<a>`)

#### Fortify Your Future (`/events/fortify-your-future`)

**Data file:** `src/lib/events/fortify-your-future.ts`

- Speakers: Vicky Huang, Marcy Chan
- Registration → `/fortify-survey`
- Date/location: “To Be Confirmed”
- Hero: `/images/fortify-event-poster.png`

To update copy, edit the data file — no template changes needed unless layout changes.

#### Past event archive (`/events/wo-leung-yiu-dou-yiu`)

**Component:** `src/components/events/WoLeungYiuDouYiuArchive.tsx`

Custom one-off page (not using `EventDetailTemplate`):

- Red “past event” banner
- Registration disabled
- Full historical content, venue map iframe, sticky mobile CTA

---

### 8.5 Fortify survey landing (`/fortify-survey`)

**Component:** `src/components/FortifyYourFutureSurvey.tsx`

- Standalone dark theme (no site header)
- EN / 中文 toggle via local `content` object
- Google Form embedded via `dangerouslySetInnerHTML` (iframe HTML string)
- Form URL: Google Forms `viewform?embedded=true`

**Layout:** `src/app/fortify-survey/layout.tsx` passes children through (metadata only).

To change form: update `GOOGLE_FORM_EMBED_HTML` constant.

---

### 8.6 VC Investment Challenge (`/investment-challenge`)

**Component:** `src/components/vc-challenge/VCInvestmentGame.tsx`

Client-side game simulating a VC fund manager.

#### Data sources

| Source | URL / endpoint | Content |
|--------|----------------|---------|
| Game settings | `GET /api/game-settings` | Weekly theme + market event |
| Startups | Google Sheets CSV (gid=0) | Deal pipeline |
| News events | Google Sheets CSV (gid=1253735167) | Year-end multipliers |

#### Game settings (from admin)

| Field | Options | Effect |
|-------|---------|--------|
| `theme` | Wildcard, AI Frenzy, Green Tech, FinTech | Filters startup deals by `theme_week` column |
| `event` | None, Market Crash, Unicorn Day | Market Crash: −30% valuations; Unicorn Day: doubles news multiplier impact |

#### Core mechanics

| Rule | Value |
|------|-------|
| Starting cash | HKD $100,000,000 |
| Valuation formula | `(team_rating + hype_rating + idea_rating) × $2M` |
| Investment ask | 10% of valuation |
| Year-end trigger | Every 3 deals reviewed |
| Year-end event | Random news row; applies `multiplier` to matching portfolio companies |
| Game over | Cash < 0, or all deals exhausted |

#### UI layout

Dark two-column: deal card + portfolio sidebar, activity log, modals for year-end summary and game over.

#### CSV parsing note

`parseCsv()` handles both tab- and comma-delimited rows (Google Sheets export quirk).

---

### 8.7 Admin panel (`/admin`)

**File:** `src/app/admin/page.tsx`

- Password gate via `NEXT_PUBLIC_ADMIN_PASSWORD` (compared client-side)
- Loads settings from `GET /api/game-settings`
- Saves via `POST /api/game-settings` with `{ theme, event }`
- Dropdowns populated from `WEEKLY_THEMES` and `MARKET_EVENTS` in `src/lib/game-settings.ts`

**Security note:** This is a **client-side gate only**. The POST endpoint has no server-side auth. For production, restrict `/admin` via Vercel deployment protection or add API authentication.

---

### 8.8 Castle Siege / MandateApp (legacy)

**Files:**

- `src/app/investment-challenge/MandateApp.tsx` (~3300 lines)
- `src/app/investment-challenge/gameLogic.ts`

A separate, more complex investment simulation (philosophy selection, risk mandates, 5/10-day modes, Recharts, Framer Motion). **Not mounted on any route** — `/investment-challenge` renders `VCInvestmentGame` instead.

Nav label “城堡攻防戰” still points to the VC game route.

---

## 9. Backend & API

### `GET /api/game-settings`

**File:** `src/app/api/game-settings/route.ts`

Returns stored settings from KV key `game-settings`, or defaults:

```json
{ "theme": "Wildcard", "event": "None" }
```

On KV error, returns defaults (does not 500).

### `POST /api/game-settings`

Body: `{ "theme": "<WeeklyTheme>", "event": "<MarketEvent>" }`

- Validates via `parseGameSettings()` in `src/lib/game-settings.ts`
- Persists to KV
- Returns saved settings or 400/500

### Types — `src/lib/game-settings.ts`

```typescript
type GameSettings = { theme: WeeklyTheme; event: MarketEvent };
```

Constants: `GAME_SETTINGS_KEY`, `DEFAULT_GAME_SETTINGS`, validation helpers.

---

## 10. Data & external services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Vercel KV / Upstash Redis** | Persist game theme/event | `@vercel/kv` in API route |
| **Google Sheets** | VC game startup & news data | Public CSV export URLs, fetched client-side |
| **Google Forms** | Fortify interest registration | iframe embed on survey page |
| **picsum.photos** | Blog cover fallback | Allowed in `next.config.ts` `images.remotePatterns` |
| **Google Maps** | Past event venue map | iframe embed in archive page |

### Google Sheets columns (expected)

**Startups (gid=0):**

- `company_name`, `one_liner_pitch`, `team_rating`, `hype_rating`, `idea_rating`, `theme_week`

**News (gid=1253735167):**

- `event_name`, `event_description`, `theme_target`, `multiplier`

---

## 11. Static assets

All files in `public/` are served from the site root.

| Path | Usage |
|------|-------|
| `/logo.png` | Header branding |
| `/images/fortify-hero-*.png` | Homepage hero |
| `/images/fortify-event-poster.png` | Event hub + detail |
| `/images/wework-logo.png` | Homepage highlight (may be outdated) |
| `/vicky-headshot.png`, `/marcy-chan-headshot.png` | Speaker photos |
| `/event/*` | Past event visuals |
| `/blog/*.png` | Blog cover images |
| `/hero-loop.mp4`, `/hero.png` | Legacy hero assets |

Add new images to `public/` and reference as `/path/from/public`.

---

## 12. Deployment

Typical flow: push to `main` → Vercel auto-deploy.

### Vercel checklist

1. Connect GitHub repo
2. Set root directory to `--tailwindcss` if monorepo-style, or deploy from that folder
3. Add **Redis/KV** storage in Vercel project → auto-injects `KV_REST_API_*`
4. Set `NEXT_PUBLIC_ADMIN_PASSWORD` in Environment Variables
5. Redeploy after env changes

### `next.config.ts`

- Permanent redirect `/event` → `/events`
- Remote images allowed for `picsum.photos`

### Metadata base URL

`layout.tsx` sets `metadataBase` to `https://profit-pulse-alley.vercel.app`. Update if canonical domain differs from Vercel preview URL.

---

## 13. How to extend the site

### Add a blog post

1. Create matching files: `posts/en/my-slug.md` and `posts/zh-hk/my-slug.md`
2. Add frontmatter (`title`, `date`, optional `cover`)
3. Write Markdown body
4. Rebuild/redeploy — `generateStaticParams` picks up new slugs

### Add a new event

**Option A — reuse template (recommended):**

1. Create `src/lib/events/my-event.ts` exporting `EventDetailData`
2. Add `src/app/events/my-event/page.tsx`:

   ```tsx
   import EventDetailTemplate from "@/components/events/EventDetailTemplate";
   import { myEvent } from "@/lib/events/my-event";

   export default function Page() {
     return <EventDetailTemplate {...myEvent} />;
   }
   ```

3. Link from `src/app/events/page.tsx` hub

**Option B — custom page** (like past event archive) for unique layouts.

### Change VC game content

Edit the Google Sheet — no code deploy needed unless column names change.

### Change game theme/event for all players

Use `/admin` or `POST /api/game-settings` directly.

### Add a full-page route (no header/footer)

Add path to `FULL_PAGE_ROUTES` in `LayoutShell.tsx`.

### Add an API route

Create `src/app/api/<name>/route.ts` exporting `GET`, `POST`, etc.

---

## 14. Legacy & unused code

| Item | Location | Status |
|------|----------|--------|
| `MandateApp.tsx` | `src/app/investment-challenge/` | Not routed; full Castle Siege game |
| `gameLogic.ts` | Same folder | Used only by MandateApp |
| `src/lib/game-master/*` | `types.ts`, `settings.ts` | Older KV schema (`game-master:settings`); **not wired to admin API** |
| `src/lib/kv.ts` | `getKv()` wrapper | Used by game-master scaffold only |
| `templates/event-detail.html` | `templates/` | Design reference, not rendered |
| `fortify-hero-chess-king.png` | `public/images/` | Superseded by cropped hero images |

---

## 15. Known inconsistencies

Items a new developer should be aware of:

1. **Homepage WeWork card** — `src/app/page.tsx` still shows “Exclusive WeWork Partnership” while Fortify event pages were updated to remove WeWork.
2. **Two KV schemas** — Live admin uses `game-settings` key; `game-master:settings` scaffold is unused.
3. **Admin security** — Password is client-side only; API POST is unauthenticated.
4. **Nav label vs game** — “城堡攻防戰” links to VC Challenge, not MandateApp/Castle Siege.
5. **`.env.example`** — May be gitignored by `.env*` pattern in `.gitignore`; copy manually if missing locally.
6. **Fortify event TBC** — Date and venue are placeholders until confirmed.

---

## Quick reference — key files

| Concern | File(s) |
|---------|---------|
| Homepage | `src/app/page.tsx` |
| Global layout / nav | `src/components/LayoutShell.tsx`, `src/app/layout.tsx` |
| Blog engine | `src/lib/blog.ts`, `posts/` |
| Events data | `src/lib/events/fortify-your-future.ts` |
| Event UI template | `src/components/events/EventDetailTemplate.tsx` |
| Survey page | `src/components/FortifyYourFutureSurvey.tsx` |
| VC game | `src/components/vc-challenge/VCInvestmentGame.tsx` |
| Game API | `src/app/api/game-settings/route.ts` |
| Game types | `src/lib/game-settings.ts` |
| Admin UI | `src/app/admin/page.tsx` |
| Redirects | `next.config.ts` |

---

## Support & handoff notes

- **Primary language:** Mixed EN + Traditional Chinese (zh-Hant) depending on page
- **No database** — blog is filesystem Markdown; game content is Google Sheets; settings are Redis
- **No test suite** in repo currently
- **Linting:** `npm run lint` (ESLint + eslint-config-next)

For questions about business content (speakers, event dates, form URLs), coordinate with the site owner before changing production copy.

---

*Last updated: June 2026*
