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
| **Revamp branch** | `revamp-market-pulse-july-2026` — **merged to `main`** (`79033a4`, 29 Jun 2026) |
| **Production status** | **`main` deployed** on Vercel; public launch **1 Jul 2026 00:00 HKT** passed; first cycle window **1–10 Jul 2026**; **live site playable only after ops pins a real OPEN cycle** (see [Production player experience](#production-player-experience-post-launch)) |
| **Recent `main`** | Hub **“No active cycle”** chip; **Market Pulse card scheduling** (9:00 AM HKT release, multi-card per day, bilingual admin/player cards); **527** Vitest tests (82 files) |

---

## Current site status (Jul 2026 — post-launch)

### Site strategy (current)

The public site centers on **Market Pulse** — a recurring multi-day investment challenge where members swipe **Bullish** or **Cautious** on daily market signal cards, earn participation points, and compete on leaderboards until **PPA Insight** is revealed at cycle end. Supporting pillars: **fireside events**, **membership**, and **expert-led philosophy** (PPA Take).

**Homepage (Jun 2026 player journey revamp):** visual-first dark zinc layout with a **Market Pulse hero** (decorative signal preview, proof chips, launch-aware CTAs), **How it works**, **cycle loop / scoring explainer**, **PPA Insight teaser** (locked sample — no live PPA data), then events, philosophy, and final CTA. **Bilingual** copy via `ppa_locale` cookie. Blog is nav/footer only.

**Player journey UX:** Hub is a **game lobby** (cycle status chip, journey steps, prize + locked leaderboard preview). Play uses an upgraded **signal card** with Bullish/Cautious **confirmation step** before submit. Leaderboard and reveal pages use polished **locked / revealed / archive** state panels. **Scoring, launch gating, PPA privacy, and auth rules are unchanged** — see [Player journey revamp — safety unchanged](#player-journey-revamp-jun-2026--safety-unchanged).

### Production player experience (post-launch)

Public launch gate **1 Jul 2026 00:00 HKT** has passed. Pre-launch announcement banners and the admin **Setup guide** section are **hidden automatically** (`shouldShowMarketPulsePreLaunchUi()`, `shouldShowMarketPulseLaunchSetupUi()`).

| What players see | When | Hub status chip | Primary CTA |
|------------------|------|-----------------|-------------|
| **No active cycle** | Runtime `OPEN`, no playable pinned cycle (or demo cycle hidden in prod) | **No active cycle** (soft emerald) | View leaderboard |
| **Closed** | Runtime `CLOSED` / `MAINTENANCE`, or cycle exists but runtime off | **Closed** (gray) | View leaderboard |
| **Open** | Runtime `OPEN`, active cycle in window, today's card published | **Open** (green pulse) | Play today / Sign in |
| **Reveal pending** | Cycle ended, reveal time passed, not yet revealed | **Reveal pending** (amber) | View reveal |
| **Revealed** | Cycle revealed | **Revealed** (sky) | View leaderboard |

**Live production note (early Jul 2026):** If `/market-pulse` shows **No active cycle** with an empty cycle panel, ops has not finished go-live — runtime may be `OPEN` but no **real** (non-demo) cycle is pinned active with a **published card for today**. Fix via `/admin/market-pulse` (see [Making Market Pulse visible](#making-market-pulse-visible-to-players-go-live) and [Admin dashboards](#admin-dashboards-ops-reference)).

**Production data guards:** Demo/seed cycle `[DEMO] Market Pulse Local Seed` is **filtered from public paths** in production (`demo-cycle-guards.ts`). `db:seed` is blocked unless `MARKET_PULSE_SEED=1`. Hub/play/leaderboard do **not** fall back to synthetic dev data on Vercel — they return empty/safe states instead (`hub-data.production.test.ts`).

### Market Pulse launch closure (Jul 2026)

| Actor | Before 1 Jul 2026 00:00 HKT | On/after launch (current) |
|-------|------------------------------|---------------------------|
| **Guest** | Cannot submit; play → `pre_launch` | Browse hub/leaderboard; sign in to submit |
| **USER** | Blocked at server + `play-data` | Full play when runtime + cycle + card gates pass |
| **ADMIN** | Could test play/submit (bypass) | Same as USER for play; full ops on `/admin/*` |

**Source of truth:** `src/lib/market-pulse/launch-config.ts` (`MARKET_PULSE_PUBLIC_LAUNCH_AT`, `canAccessMarketPulsePlay`, `canSubmitMarketPulseDecision`, `shouldShowMarketPulsePreLaunchUi`).

**Prize copy:** One **Ocean Park ticket** per cycle winner (homepage, hub, rules, contest-rules, launch announcement).

**Pre-launch announcement:** `MarketPulseLaunchAnnouncement` on hero, hub, leaderboard (pre-launch), play (pre-launch), rules, contest-rules — **hidden automatically after public launch**.

### Feature matrix

| Feature | Route | Auth | Status |
|---------|-------|------|--------|
| **Homepage** | `/` | Public | MP hero + journey sections (How it works, cycle loop, PPA Insight teaser); Live Events Hub; philosophy; final CTA; **i18n** |
| Brand concept | `/concept` | Public | “Our Philosophy” in nav |
| Blog (EN + zh-HK) | `/blog`, `/blog/{lang}/[slug]` | Public | 3 paired articles |
| Events hub | `/events` | Public | Upcoming: Sales & Marketing; past: Fortify + Wo Leung; **i18n** |
| Fortify event (past) | `/events/fortify-your-future` | Public | **Archived** — registration closed |
| Sales & Marketing event | `/events/fortify-sales-marketing` | Public | Coming soon — 17 Jul 2026, TBC |
| Past event archive | `/events/wo-leung-yiu-dou-yiu` | Public | Registration closed |
| **Fortify registration** | `/fortify-survey` | Public | **QR-coded URL — do not change** |
| **Login** | `/login` | Public | Sign In + Create Account; Google + magic link; **i18n** |
| **OAuth onboarding** | `/auth/onboarding` | Logged-in | Contact number; `/api/auth/complete-onboarding` JWT refresh; recovery UI |
| **Member profile** | `/profile` | Members only | Profile + Market Pulse history; **i18n** |
| **Market Pulse Hub** | `/market-pulse` | Public | **Game lobby** — status chip (`Open` / `No active cycle` / `Closed` / …), journey steps, prize, locked/revealed leaderboard preview, context-aware primary CTA; **i18n** |
| **Market Pulse play** | `/market-pulse/play` | Login to submit | Upgraded signal card; Bullish/Cautious swipe/tap + **confirmation**; locked/submitted state; non-playable state panels; **i18n** |
| **Market Pulse leaderboard** | `/market-pulse/leaderboard` | Public | Locked/revealed/archive state panels; per-cycle archive (`?cycleId=`); **My score** panel (logic unchanged); **i18n** |
| **PPA Insight reveal** | `/market-pulse/reveal` | Login for personal results | Pending locked ceremony; revealed results + learning framing; PPA only post-reveal; **i18n** |
| **Market Pulse rules** | `/market-pulse/rules` | Public | Challenge rules + scoring; **i18n** |
| **Contest rules** | `/contest-rules` | Public | Prize eligibility + legal |
| **Admin dashboard** | `/admin` | `ADMIN` only | **Command center** — 4 overview cards (users, MP runtime/cycle, player visibility, system notes), quick actions, user management (**Tel** column, search/filter) |
| **Market Pulse admin** | `/admin/market-pulse` | `ADMIN` only | **Full ops dashboard** — sticky status header, alerts, cycles hub, player-visibility checklist, runtime, advanced cycles, legacy cards, reveal/scoring, prize claims, audit |
| **Market Pulse cycle builder** | `/admin/market-pulse/cycles/[cycleId]/builder` | `ADMIN` only | **Primary card workflow** — cycle summary, readiness, card list, inline editor, preview, bulk publish |
| Game settings API | `/api/game-settings` | GET public; POST ADMIN | KV theme/event (legacy API-only; no admin UI) |
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

### Verification — last run 29 Jun 2026 (527 tests)

| Check | Result |
|-------|--------|
| **Lint** | `npm run lint` — pass (0 errors; pre-existing warnings in legacy/admin) |
| **Typecheck** | `npm run typecheck` — pass |
| **Build** | `npm run build` — pass (`prisma db push && next build`; first deploy may need schema migration for `sortOrder` + `@@unique([cycleId, dayIndex, sortOrder])`) |
| **Tests** | `npm test` — **527** Vitest tests (82 files) |
| **Hub lobby chip** | `hub-lobby-state.test.ts` — `no_active_cycle` when runtime OPEN + no DB cycle; `closed` when runtime paused |
| **Launch smoke** | `launch-smoke.test.ts`, `play-data.launch.test.ts`, `reveal-data.launch.test.ts`, `launch-regression-audit.test.ts` |
| **Card release (HKT)** | `hkt-time.test.ts`, `card-release-schedule.test.ts` — fixed UTC+8 math; Day 1 = `2026-07-01T01:00:00.000Z` when cycle starts `2026-06-30T16:00:00.000Z`; dual gate (derived release + `publishedAt`) |
| **Multi-card play** | `play-data-multi-card.test.ts`, `playable-card.test.ts`, `score-calculation.test.ts` — same-day cards, streak order by `sortOrder` |
| **Card localization** | `card-localization.test.ts` — zh-Hant + EN fallback; PPA stripped pre-reveal |
| **Reveal / leaderboard multi-card** | `leaderboard-score-breakdown.test.ts`, `reveal-ppa-validation.test.ts` — duplicate `dayIndex` OK; per-card breakdown labels |
| **Public copy** | `public-market-pulse-copy.test.ts` — no stale pre-launch/dev terms in MP i18n |
| **Demo/seed guards** | `demo-cycle-guards.ts` — demo cycles hidden from public production paths; `seed-guards.ts` blocks `db:seed` in production |
| **Admin launch UI** | `shouldShowMarketPulseLaunchSetupUi()` hides Setup guide + first-cycle panel after 1 Jul 2026 HKT; operational warnings remain |
| **Player visibility** | `MarketPulsePlayerVisibilityReadinessCard` + `evaluatePlayerVisibilityReadiness()` on admin overview |
| **Admin fast builder** | Cycles hub + builder route; bilingual EN/zh-Hant card tabs; derived 9 AM HKT release (no manual card open time in normal workflow) |
| **PPA timing workflow** | Players may decide before PPA is entered/locked; reveal/scoring requires locked PPA on **all** published cards (including multiple per day); admin 72h warning (`admin-ppa-reveal-warning.ts`) |
| **Player submit without PPA** | `server-core.test.ts` — “allows submission when PPA is missing and unlocked”; no `ppaSignalLockedAt` check in `submitMarketPulseDecision` |
| **Reveal PPA gate** | `admin-reveal-action.test.ts` — blocks transaction + scoring when PPA incomplete; succeeds when complete |
| **PPA stripping** | `server-security.test.ts` — PPA omitted pre-reveal; `toMarketPulseSwipeCardData` never forwards PPA |
| **Admin-only warnings** | `/admin/market-pulse` redirects non-admin (`getMarketPulseAdminDashboardData` → `null`) |
| **Admin action reliability** | `invokeAdminAction` + `finishAdminMutation` — post-commit side effects no longer surface false errors |
| **Launch gating** | Unchanged — `launch-config.ts`; non-admin blocked before 1 Jul 2026 |
| **PPA pre-reveal** | Unchanged — `reveal-access.ts`, `player-handlers.ts` strip PPA before reveal |
| **Unrevealed scores** | Unchanged — leaderboard page returns `entries: []` when locked; viewer score panel omits points pre-reveal |
| **Scoring formulas** | Unchanged — +10 / +50 / +100 every 3 matches (`constants.ts`, `score-calculation.ts`) |
| **Player journey revamp** | Display-only UX; logic gates unchanged |
| **`/fortify-survey`** | Unchanged — full-page route; no redirect |

**Deploy checklist:** `docs/market-pulse-deploy-checklist.md`

### Player journey revamp (Jun 2026) — safety unchanged

Visual/UX pass across homepage and Market Pulse player routes. **No regressions** found in privacy/security audit (29 Jun 2026).

| Area | Changed (UI) | Unchanged (logic) |
|------|--------------|-------------------|
| **Scoring** | Homepage cycle-loop copy references +10/+50/+100 | `score-calculation.ts`, `constants.ts`, admin reveal scoring |
| **Launch gating** | Pre-launch CTAs route to hub vs play | `launch-config.ts`, `canSubmitMarketPulseDecision`, ADMIN bypass |
| **PPA privacy** | Home/hub/reveal use locked **decorative** previews | `reveal-access.ts`, `stripPpaFromCardPayload`, API stripping |
| **Leaderboard scores** | `LeaderboardStatePanel` locked UI | `leaderboard-data.ts` query gating; `leaderboard-viewer-score.ts` |
| **Auth / admin** | MP-aware login/onboarding copy when `callbackUrl` includes `/market-pulse` | JWT, middleware, `/api/auth/complete-onboarding`, `requireAdminSession` |
| **`/fortify-survey`** | — | Route + `FortifyYourFutureSurvey.tsx` untouched |

**New display-only data fields:** `hub-data.ts` (`startsAtIso`, `endsAtIso`); `play-data.ts` (`runtimeOpen`, `runtime_closed` status via `gateRuntimeClosedPageData`); `reveal-data.ts` (`revealedCycle`, `playNextAvailable` for CTAs only).

**Auth notes:** JWT strategy; `SessionProvider` hydrated from server `auth()` in root layout; middleware onboarding via `auth.config.ts`; JWT callback syncs `needsOnboarding` from DB `contactNumber` on every token refresh; stale JWT after onboarding cleared via **`GET /api/auth/complete-onboarding`** (server rewrites session cookie).

### PPA timing — manual QA matrix (29 Jun 2026)

Automated tests cover server rules below. Live browser sign-in was not re-run in this session; use this matrix for production smoke.

| # | Scenario | Verification | Result |
|---|----------|--------------|--------|
| 1 | Player decision without PPA | `submitMarketPulseDecision` has no PPA checks; test with null signal/insight/lock; `stripPpaFromCardPayload` on API | **Pass** (unit) |
| 2 | Player blocked (normal gates) | Tests: runtime closed, cycle not open, unpublished, reveal window closed, duplicate decision; errors never mention PPA | **Pass** (unit) |
| 3 | Admin missing PPA warning ≤72h | `evaluatePpaRevealWarning` → `urgent`; `MarketPulsePpaRevealWarningBanner` on dashboard; admin route gated | **Pass** (unit + code) |
| 4 | Missing PPA >72h away | `evaluatePpaRevealWarning` → `setup`; playability `ppa-setup` alert only, no red banner | **Pass** (unit) |
| 5 | PPA complete | `severity: complete`; overview `MarketPulsePpaCompleteBadge`; reveal readiness `canReveal` | **Pass** (unit) |
| 6 | Reveal/scoring safety | `validateCycleReadyForReveal` before `$transaction`; no score on failure (`admin-reveal-action.test.ts`) | **Pass** (unit) |
| 7 | Public pages no PPA leak | `server-security.test.ts`, `player-handlers.ts` strip; swipe card type excludes PPA | **Pass** (unit) |
| 8 | Admin card list PPA UX | `PpaStatusBadge`, **Needs PPA** filter, separate **Live for players** badge (`admin-card-ppa-status.ts`) | **Pass** (code) |

**Note:** Admin **Publish** still requires locked PPA (`validateCardPublishable`). Checklist #1 applies to cards that are already `PUBLISHED` (seed, migration, or future publish-rule change) — not via the normal Publish button today.

**Dead copy:** `mp.error.cardNotReady` remains in i18n but `submitMarketPulseDecision` no longer returns that string.

### July 2026 revamp — requirements closure

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Redesigned Market Pulse swipe card | **Pass** | `MarketPulseSwipeCard.tsx` — headline, news body, logo, price, 16:9 image, summary, swipe |
| 2 | Admin card fields + image guidance | **Pass** | `card-validation.ts` (`1200×675`, 16:9); `MarketPulseCardForm.tsx` |
| 3 | Admin user add / delete / role | **Pass** | `/admin` → `admin-user-actions.ts`, `AdminUserManagement.tsx` |
| 4 | Close public play until 1 Jul 2026 | **Pass** | `launch-config.ts`, `play-data.ts`, `server.ts` |
| 5 | ADMIN test before launch | **Pass** | DB role check on submit; session role for play UI |
| 6 | Launch announcements | **Pass** | `MarketPulseLaunchAnnouncement` on hero, hub, play, leaderboard |
| 7 | First cycle 1–10 Jul 2026 | **Pass** | `challenge-cycle.ts`, `first-cycle-admin-guidance.ts` |
| 8 | Ocean Park ticket per cycle winner | **Pass** | `launch-config.ts`, `prize-constants.ts`, legal pages |
| 9 | Remove other prize mentions | **Pass** | Public copy is Ocean Park only; rules *gameplay* text still references legacy arcade sim (see §16) |
| 10 | Bilingual EN / zh-Hant | **Pass** (MP cards + site chrome) | Admin builder EN/zh-Hant tabs; player card text via `card-localization.ts` + `ppa_locale`; event detail pages still static bilingual |
| 11 | Language switcher placement | **Pass** | Header, mobile nav, MP play, login, onboarding |
| 12 | Onboarding blank/loop fix | **Pass** | Server redirect via `/api/auth/complete-onboarding`; no client redirect loop |
| 13 | Fortify Your Future → past | **Pass** | `fortify-your-future.ts`, past banner on detail |
| 14 | Sales & Marketing coming soon | **Pass** | 17 Jul 2026, TBC — `/events/fortify-sales-marketing` |
| 15 | `/fortify-survey` unchanged | **Pass** | Do not modify URL or `FortifyYourFutureSurvey.tsx` |
| 16 | Market Pulse brand logo | **Pass** | `MarketPulseLogo.tsx` on homepage hero, hub hero, play header (`public/images/market-pulse-logo.png`) |
| 17 | Per-cycle leaderboard + personal score | **Pass** | `leaderboard-cycle-select.ts`, `leaderboard-viewer-score.ts`, `MarketPulseScore` model |
| 18 | Admin member Tel column | **Pass** | `AdminMembersTable` — `contactNumber` column; searchable via `user-member-filter.ts` |
| 19 | Homepage + player journey visual revamp | **Pass** | Hero, How it works, cycle loop, PPA teaser; hub lobby; play confirmation; leaderboard/reveal state panels; responsive pass — **security unchanged** |

### Production smoke test

**Primary checklist:** [`docs/market-pulse-deploy-checklist.md`](../docs/market-pulse-deploy-checklist.md) § **Launch smoke test (1 Jul 2026 HKT)** — pass/fail tables for environment, player flows, and automated preflight.

**Automated coverage:** `launch-smoke.test.ts`, `play-data.launch.test.ts`, `reveal-data.launch.test.ts`, `launch-regression-audit.test.ts`, plus `launch-first-cycle-boundaries.test.ts`, `admin-player-visibility-readiness.test.ts`, `public-launch-ui.test.ts`, `public-market-pulse-copy.test.ts`, `server-security.test.ts`, `leaderboard-data.test.ts`, `demo-cycle-guards.test.ts`, `hub-data.production.test.ts`, `seed-guards.test.ts`.

<details>
<summary>Historical — pre-launch manual notes (before 1 Jul 2026 00:00 HKT)</summary>

**Pre-launch:** guest/USER → `pre_launch` on play; USER submit blocked; ADMIN can play/submit when cycle/card gates pass; homepage hero + hub lobby show pre-launch state.

**At launch:** USER can play when runtime `OPEN` + published card exists; pre-launch UI hidden automatically via `shouldShowMarketPulsePreLaunchUi()`.

</details>

**Player journey:** Homepage journey sections load; hub lobby status/CTA correct; play confirmation step; leaderboard locked panel; reveal pending vs ceremony states.

### Rollback

- **Code:** redeploy previous Vercel deployment or revert commit on `main`.
- **Schema:** avoid rolling back DB if production has new MP card data; code-only rollback is usually safe.
- **Launch gate:** prefer promoting a prior build over editing `launch-config.ts` in prod.
- **Never change** `/fortify-survey` URL during rollback (physical QR codes).

### Admin dashboards (ops reference)

Admin UI uses a **zinc command-center** shell on both routes. Non-`ADMIN` sessions redirect to `/`. All Market Pulse mutations return `AdminActionResult` (`src/lib/admin/action-result.ts`); clients call `invokeAdminAction` so successful DB writes are not reported as errors when post-commit side effects (audit log, `revalidatePath`) fail.

#### Access

1. Sign in at `/login`.
2. Promote user: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';`
3. Open **`/admin`** (site command center) or **`/admin/market-pulse`** (Market Pulse ops — linked from `/admin` header and overview quick actions).

#### `/admin` — command center

**Route:** `src/app/admin/page.tsx` · **Layout:** full-page (no site header/footer)

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN badge · Dashboard title · signed-in email            │
│  → link to Market Pulse admin                               │
├─────────────────────────────────────────────────────────────┤
│  AdminOverviewCards (4-column grid)                         │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Users    │ Market   │ Player   │ System   │            │
│  │ total +  │ Pulse    │ visibility│ notes or │            │
│  │ admin #  │ runtime +│ playable? │ “All OK” │            │
│  │          │ active   │ + reason │            │            │
│  │          │ cycle    │          │            │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│  Quick actions: Manage MP · Hub · Play · Leaderboard        │
├─────────────────────────────────────────────────────────────┤
│  AdminUserManagement                                        │
│  · Add user (AdminAddUserForm)                              │
│  · Search/filter (AdminUserFilters + user-member-filter.ts) │
│  · Table: name, email, Tel, role, verified, joined, scores  │
│  · Change role · Delete (AdminConfirmDialog)                  │
│  · Safeguards: no self-delete, no self-demotion, keep ≥1 admin│
└─────────────────────────────────────────────────────────────┘
```

| Overview card | Data source | What it tells you |
|---------------|-------------|-------------------|
| **Users** | `prisma.user.count` + admin role count | Total members and how many admins |
| **Market Pulse** | `getAdminOverviewData()` → active cycle row | Active cycle name, runtime status pill, card count, unlocked PPA count |
| **Player visibility** | `buildMarketPulseStatusSnapshot()` | **Playable** / **Not playable** + first blocking reason (e.g. “No active cycle.”) |
| **System** | `admin-operational-warnings.ts` + first-cycle guidance | Amber notes when MP ops need attention; green “All OK” when clear |

**Not on `/admin`:** VC/KV Game Settings UI removed. `AdminGameSettings.tsx` is retained but unmounted. `/api/game-settings` remains legacy API-only.

#### `/admin/market-pulse` — Market Pulse ops dashboard

**Route:** `src/app/admin/market-pulse/page.tsx` · **Client shell:** `MarketPulseAdminDashboard.tsx` + `MarketPulseAdminShell.tsx` · **Data:** `getMarketPulseAdminDashboardData()` (returns `null` for non-admin → page redirects)

**Page order (top → bottom):**

| # | Anchor | Component / section | Purpose |
|---|--------|---------------------|---------|
| — | *(sticky)* | `MarketPulseAdminStatusHeader` | At-a-glance runtime, active cycle, player visibility, today's card, reveal date, prize |
| — | — | `MarketPulseAdminQuickActions` | Open public Hub / Play / Leaderboard / Reveal; **Quick create next cycle** |
| — | — | `MarketPulsePpaRevealWarningBanner` | Red urgent banner when reveal ≤72h and published cards missing locked PPA |
| — | — | `MarketPulseAdminAlerts` | Playability/runtime warnings (or green “no alerts”) |
| — | — | `MarketPulseAdminSectionNav` | Horizontal jump links to sections below |
| 1 | `#cycles-hub` | `MarketPulseCyclesHub` | **Primary workflow entry** — quick create, cycle table, Open builder / Edit advanced / Reveal links |
| 2 | `#overview` | Overview + `MarketPulsePlayerVisibilityReadinessCard` | Launch readiness checklist + stat grid |
| 3 | `#setup` | `FirstCycleGuidancePanel` | **Hidden after 1 Jul 2026 HKT** — first-cycle date/prize prefill |
| 4 | `#runtime` | Runtime dropdown + Save | Master `OPEN` / `CLOSED` / `MAINTENANCE` for player submissions |
| 5 | `#cycles` | `MarketPulseCycleForm` + cycle list | Create/edit cycles; pin active; close; export CSV |
| 6 | `#cards` | `MarketPulseCardList` + `MarketPulseCardPanel` | Legacy per-card editor on dashboard (prefer builder) |
| 7 | `#reveal-scoring` | `MarketPulseRevealScoringSection` | End-of-cycle reveal + score persistence |
| 8 | `#prize-claims` | `MarketPulsePrizeReview` | Review winner prize claims |
| 9 | `#audit` | Recent activity list | Admin action audit trail |

**Sticky status header fields** (`buildMarketPulseStatusSnapshot` in `admin-mp-status.ts`):

| Field | Green | Amber/red |
|-------|-------|-----------|
| **Runtime** | `OPEN` | `CLOSED` / `MAINTENANCE` |
| **Active cycle** | Name shown | “None” when unset |
| **Player visibility** | Playable now | Not playable + reason string |
| **Today's card** | Published card for current cycle day | Missing / draft / scheduled |
| **Reveal date** | From active cycle | — |
| **Prize** | `prizeLabel` | — |

**Alert panel** (`buildMarketPulsePlayabilityAlerts`) — shown when anything blocks players:

| Alert id | Severity | Typical cause |
|----------|----------|---------------|
| `runtime-not-open` | error | Runtime not `OPEN` |
| `no-active-cycle` | error | No cycle pinned active |
| `demo-cycle-active` | error (prod) / warning (dev) | `[DEMO]` cycle pinned — hidden from public in production |
| `cycle-not-playable` | warning | Outside `startsAt`–`revealAt` window |
| `today-card-issue` | warning | No published card for today's day index |
| `unpublished-cards` | warning | Draft cards remain on active cycle |
| `ppa-urgent` | error | Reveal ≤72h; published cards missing locked PPA |
| `ppa-setup` | warning | Reveal >72h; PPA still incomplete (informational) |
| `cycle-status-not-open` | warning | Active cycle status ≠ `OPEN` |

**Player visibility readiness card** (`evaluatePlayerVisibilityReadiness` in `admin-player-visibility-readiness.ts`) — checklist in `#overview`:

| Check id | Pass means |
|----------|------------|
| `runtime-open` | Runtime is `OPEN` |
| `active-cycle` | A cycle is pinned active |
| `cycle-status-open` | Active cycle status is `OPEN` |
| `cycle-play-window` | Now is within `startsAt` … `revealAt` |
| `today-card-exists` | A card exists for today's display day |
| `today-card-published` | That card is `PUBLISHED` |
| `today-card-live` | `findPlayableCardForToday()` resolves it |
| `card-day-mapping` | No duplicate day index / scheduling conflict |
| `public-launch-gate` | Public play open (info only pre-launch) |
| `leaderboard-locked` | Expected locked state pre-reveal (info) |
| `ppa-privacy` | PPA stripped from public payload pre-reveal |

Headline **Ready for players** vs **Needs attention**; badge **Players can submit today** when all blocking checks pass for `USER` role.

**Go-live sequence (admin UI path):**

```
Quick create cycle (#cycles-hub) → Builder: add/publish cards → Advanced cycles (#cycles): OPEN + pin active → Runtime (#runtime): OPEN → Overview (#overview): all checks green → Verify public Hub/Play
```

See also [Making Market Pulse visible](#making-market-pulse-visible-to-players-go-live) and `docs/market-pulse-deploy-checklist.md`.

### Market Pulse admin — fast builder workflow (primary path)

**Goal:** Create and edit an entire cycle’s cards in one place without repeated create/edit navigation.

```
/admin/market-pulse  →  Cycles hub (quick create or pick cycle)  →  Open builder  →  add / edit / preview / publish cards
```

| Step | Where | What happens |
|------|--------|----------------|
| 1 | `/admin/market-pulse` — **Cycles hub** (`#cycles-hub`) | Prominent **Quick create next cycle**; table of recent cycles with **Open builder** per row |
| 2 | Builder | `/admin/market-pulse/cycles/{cycleId}/builder` — cycle summary, readiness panel, card list, side editor |
| 3 | Add card | **Add card draft** in builder — next `dayIndex`, `sourceDate`, and scheduling warnings applied automatically |
| 4 | Edit / preview | Inline editor + admin-only PPA panel + swipe preview (PPA stripped in preview mock) |
| 5 | Publish | Single or bulk publish when validation passes; invalid cards skipped with reason |
| 6 | Go live | Return to dashboard **Advanced cycle settings** (`#cycles`) — set `OPEN`, pin active cycle, runtime `OPEN` |

**Legacy paths (kept for bookmarks):**

| Section | Anchor | Use when |
|---------|--------|----------|
| Legacy card editor | `#cards` | Old per-card panels on the dashboard |
| Advanced cycle settings | `#cycles` | Full create/edit cycle form, close/reveal, export |
| Reveal / scoring | `#reveal-scoring` | End-of-cycle reveal after PPA complete |

**Breadcrumbs:** Admin → Market Pulse (dashboard); Admin → Market Pulse → {cycle name} (builder).  
**Navigation helpers:** `src/lib/market-pulse/admin-mp-navigation.ts`, `MarketPulseAdminBreadcrumbs.tsx`.

#### Builder route

```
/admin/market-pulse/cycles/[cycleId]/builder
```

- **Page:** `src/app/admin/market-pulse/cycles/[cycleId]/builder/page.tsx`
- **Data:** `getMarketPulseCycleBuilderData(cycleId)` — `requireAdminSession()`; non-admin → `redirect("/")`
- **UI:** `MarketPulseCycleBuilder.tsx` — responsive layout (table desktop / card list mobile; `overflow-x-auto` on wide tables; sticky side editor on `lg+`)

#### Quick create cycle defaults

**Action:** `quickCreateMarketPulseCycleAction()`  
**Logic:** `src/lib/market-pulse/quick-create-cycle-defaults.ts`

| Field | Default |
|-------|---------|
| `status` | `DRAFT` (not public, not auto-active) |
| `name` | Next sequential `Cycle NN` (or date-based fallback if name collides) |
| `startsAt` | Previous cycle `endsAt`, or next HKT midnight if no cycles |
| `endsAt` | `startsAt` + prior cycle duration (or first-cycle window from `launch-config.ts`) |
| `revealAt` | Same instant as `endsAt` |
| `prizeLabel` | `FIRST_CYCLE_GUIDANCE.prizeLabel` |
| Active cycle | **Not** set — admin must pin manually before go-live |

On success, client navigates to `redirectPath` = builder URL for the new cycle.

#### Quick draft card defaults

**Action:** `quickCreateMarketPulseCardDraftAction(cycleId)`  
**Logic:** `src/lib/market-pulse/cycle-card-defaults.ts`, `admin-card-scheduling.ts`

| Field | Default |
|-------|---------|
| `status` | `DRAFT` |
| `headline` | `"Untitled signal"` |
| `companyName` | `"Untitled company"` |
| `ticker` | `"TBD"` |
| `dayIndex` | Lowest unused index in cycle (gap-fill); **multiple cards may share the same day** via distinct `sortOrder` |
| `sortOrder` | Next slot on the target day (0 = first card that day) |
| `sourceDate` | HKT calendar day for that index; skips dates already used in cycle |
| `userPrompt` | `MARKET_PULSE_DEFAULT_USER_PROMPT` (or copied from latest card in cycle) |
| PPA | Empty / unlocked — must lock before publish |

Incomplete drafts can be saved via `updateMarketPulseCardDraftAction` (lenient validation).

#### Duplicate card behavior

**Action:** `duplicateMarketPulseCardAction()`  
**Logic:** `src/lib/market-pulse/duplicate-card-data.ts`

- Creates a **new** card row — does **not** copy player decisions or score events
- `status: DRAFT`, `publishedAt: null`, `revealAt: null`, `ppaSignalLockedAt: null` (must re-lock PPA to publish)
- Content fields (headline, ticker, PPA text, etc.) copied from source
- `dayIndex` / `sourceDate` assigned via same scheduling helpers as new drafts
- Optional `targetCycleId`; defaults to source cycle
- Returns builder path for revalidation redirect

#### Readiness validator

**Module:** `src/lib/market-pulse/admin-cycle-readiness.ts`  
**UI:** `MarketPulseCycleReadinessPanel.tsx` in builder

Reports cycle-level issues (invalid dates) and per-card status. **Duplicate `dayIndex` within a cycle is allowed** when `sortOrder` differs (unique on `cycleId + dayIndex + sortOrder`).

| Card status | Meaning |
|-------------|---------|
| `published` | Live for players when release + runtime gates pass |
| `ready` | Valid draft, can publish |
| `draft_missing_fields` | Required content or PPA lock missing |
| `conflict` | Scheduling conflict (exceeds cycle length, etc.) |

#### Publish rules

**Single publish:** `publishMarketPulseCardAction`  
**Bulk:** `bulkPublishMarketPulseCardsAction`, `bulkPublishAllReadyMarketPulseCardsAction`  
**Planning:** `src/lib/market-pulse/admin-bulk-card-actions.ts`

A card is blocked from publish when any of:

- Required content missing (`validateCardPublishable` in `card-validation.ts`)
- PPA signal, insight, or lock missing
- Scheduling conflict (`getCardSchedulingPublishBlockReason`)
- Already published

**Unpublish:** blocked when players have submitted decisions on that card (`getCardUnpublishBlockReason`).

Publish does **not** bypass reveal timing — PPA remains hidden on public play until reveal (`reveal-access.ts`). On publish, `publishedAt` is set from the derived schedule when absent (`deriveCardPublishedAtFromSchedule` in `card-release-schedule.ts`).

#### Card release schedule (9:00 AM HKT)

**Modules:** `hkt-time.ts` (fixed UTC+8 math), `card-release-schedule.ts` (playability), `playable-card.ts` (today's cards).

Hong Kong Time is treated as **fixed UTC+8** (no DST). All scheduling uses UTC epoch milliseconds — never server local timezone or `new Date(y, m, d, 9, 0, 0)`.

**Algorithm for Day N release:**

1. Derive the cycle start **HKT calendar date** from `cycle.startsAt` (UTC instant).
2. Add `(dayIndex - 1)` whole HKT calendar days.
3. Release at **09:00 HKT** on that day = **01:00 UTC** on the same HKT calendar date.

**Example** — cycle `startsAt = 2026-06-30T16:00:00.000Z` (= 2026-07-01 00:00 HKT):

| Day | Release (HKT) | Release (UTC) |
|-----|---------------|---------------|
| 1 | 2026-07-01 09:00 | `2026-07-01T01:00:00.000Z` |
| 2 | 2026-07-02 09:00 | `2026-07-02T01:00:00.000Z` |
| 10 | 2026-07-10 09:00 | `2026-07-10T01:00:00.000Z` |

**Player playability** (`isCardReleasedForPlay`) — **both** must pass:

1. `now >= derivedReleaseAtUtc` (9 AM HKT for the card's cycle day)
2. `publishedAt == null || publishedAt <= now` (future manual `publishedAt` defers release; early `publishedAt` never bypasses 9 AM HKT)

Admin builder **does not** expose manual card open/reveal datetime fields in the normal workflow; legacy `publishedAt` on existing rows is still respected.

**Multiple cards per day:** Players can play all published cards for today's cycle day (`findPlayableCardsForToday`). Order: `dayIndex → sortOrder → createdAt`. Submitting one card does not lock the rest. Scoring, reveal, and leaderboard breakdowns use the same sort order.

#### PPA privacy (admin vs public)

| Surface | PPA visible? |
|---------|----------------|
| Admin preview panel (`MarketPulseAdminCardPreview`) | Yes — signal + insight |
| Admin swipe mock in preview | No — stripped via `toMarketPulseSwipeCardData()` |
| Public play / hub | No — never in client payload pre-reveal |
| Reveal page | Yes — after cycle/card reveal time |
| Leaderboard breakdown | Signal label only post-reveal; no insight prose |

Admin components under `src/components/admin/` are not imported by public `src/app/market-pulse/**` routes.

#### Admin workflow tests

Run before deploy:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Key test files for the fast builder journey:

| Area | Test file |
|------|-----------|
| Navigation / breadcrumbs | `admin-mp-navigation.test.ts` |
| Builder data gate | `admin-builder-data.test.ts` |
| Quick create cycle | `quick-create-cycle-defaults.test.ts`, `admin-quick-create-cycle.test.ts` |
| Draft card defaults | `cycle-card-defaults.test.ts`, `admin-quick-create-card-draft.test.ts` |
| Draft save | `admin-card-draft-save.test.ts` |
| Duplicate | `duplicate-card-data.test.ts`, `admin-duplicate-card.test.ts` |
| Scheduling / release | `admin-card-scheduling.test.ts`, `card-release-schedule.test.ts`, `hkt-time.test.ts` |
| Multi-card play | `play-data-multi-card.test.ts`, `playable-card.test.ts` |
| Card localization | `card-localization.test.ts` |
| Play order / reveal labels | `card-play-order.test.ts`, `leaderboard-score-breakdown.test.ts` |
| Readiness | `admin-cycle-readiness.test.ts` |
| Bulk publish/unpublish | `admin-bulk-card-actions.test.ts`, `admin-bulk-card-actions.server.test.ts` |
| PPA / public privacy | `server-security.test.ts`, `admin-card-preview.test.ts` |
| Non-admin rejection | `admin-builder-data.test.ts`, `admin-duplicate-card.test.ts`, `admin-quick-create-cycle.test.ts` |

**Last CI (29 Jun 2026):** lint pass (0 errors), typecheck pass, **527 tests** (82 files), build pass.

### Making Market Pulse visible to players (go-live)

Cards can look correct in admin but still be **hidden** on `/market-pulse/play` if any gate fails:

| Gate | Admin control | Player symptom if wrong |
|------|---------------|-------------------------|
| Runtime `OPEN` | Runtime status → Save | Cannot submit decisions |
| Cycle `OPEN` + **active** | Create/edit cycle, check “Set as active cycle” | “No active challenge…” |
| **Date window** | `startsAt ≤ now ≤ revealAt` | “No active challenge…” or “not open right now” (expired demo cycles) |
| Card **PUBLISHED** | **Publish** button (not just status dropdown) | “Today’s card is coming soon…” |
| **Release time** | Automatic — 9:00 AM HKT per cycle day (`card-release-schedule.ts`) | Card not live before 9 AM HKT on its day |
| Legacy **`publishedAt`** | Optional; set only for manual deferral on legacy rows | Future `publishedAt` blocks even after derived release |
| Day number | Day 1 = first HKT calendar day of cycle (1-based in admin form) | Wrong or missing card for today |
| **Multiple cards / day** | Add another card on same day in builder (distinct `sortOrder`) | Player sees “Card X of Y”; must play all today's cards |

**Not a player gate:** PPA signal/insight/lock. Players can submit and lock decisions on published cards even when PPA is incomplete. PPA remains hidden until reveal (`reveal-access.ts`).

**Admin publish gate (separate):** `validateCardPublishable` in `card-validation.ts` still requires PPA signal, insight, and lock before **Publish** — this controls getting a card live, not whether an already-published card accepts decisions.

**Reveal/scoring gate:** All **published** cards must have `ppaSignal`, `ppaInsight`, and `ppaSignalLockedAt` before admin reveal (`reveal-ppa-validation.ts`, `admin-reveal-status.ts`). Missing PPA blocks reveal, not play.

**Admin PPA warning:** When `revealAt` is within **72 hours** (`PPA_REVEAL_WARNING_HOURS`), `/admin/market-pulse` shows an urgent banner and per-card emphasis for published cards missing locked PPA (`admin-ppa-reveal-warning.ts`, `MarketPulseCardPanel`).

**Common pitfall:** Demo seed cycle `[DEMO] Market Pulse Local Seed` uses **2025** dates — after `revealAt` passes, admin still shows “Active” but players see no challenge. Edit cycle dates to the current window or create a new 2026 cycle.

Playability issues (runtime, cycle dates, unpublished cards — **not** missing PPA) appear in the **alert panel** on `/admin/market-pulse` (`admin-mp-status.ts`, `cycle-playability.ts`). PPA setup notes appear when reveal is **>72h** away; urgent PPA warnings when **≤72h**.

### PPA timing workflow (summary)

1. **Player decisions** — Eligibility does **not** depend on PPA being locked or complete (`submitMarketPulseDecision` in `server.ts`).
2. **Card visibility / playability** — Controlled by runtime `OPEN`, active cycle, date window, `PUBLISHED` status, and `publishedAt` — not PPA completion.
3. **Reveal / scoring** — Requires locked PPA signal + insight on every published card before admin reveal runs.
4. **Admin warnings** — Urgent banner when `revealAt` is within 72 hours and PPA is incomplete; card list shows PPA status badges and **Needs PPA** filter.
5. **Public / player UI** — PPA fields stripped before reveal; never shown on play, hub, or leaderboard pre-reveal APIs.

### First public cycle guidance (`/admin/market-pulse`)

Panel **“First public cycle guidance”** — collapsible under **Setup guide** on `/admin/market-pulse` (`FirstCycleGuidancePanel.tsx`, `first-cycle-admin-guidance.ts`):

| Setting | Recommended |
|---------|-------------|
| Start | 1 Jul 2026 00:00 HKT |
| End | 10 Jul 2026 (closes 11 Jul 00:00 HKT) |
| Reveal | On or after cycle end (recommended 11 Jul 00:00 HKT) |
| Prize label | One Ocean Park ticket |
| Runtime | `OPEN` |
| Cards | All cards **PUBLISHED** for play (PPA not required for player decisions) |
| PPA & reveal | Locked PPA signal + insight on all published cards **before reveal/scoring**; 72h admin warning if incomplete |

Inform-only (no auto-overwrite). **Prefill create-cycle form** opens recommended values; admin saves manually. Incomplete PPA does **not** block the first-cycle launch window check — only unpublished cards do (`first-cycle-admin-guidance.ts`).

### Vercel checklist (production)

- [x] **Postgres** — `POSTGRES_URL` from **Storage → Prisma Postgres** (`prisma-postgres-celeste-dog`)
- [x] **Auth.js** — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] **Email sign-in** (optional) — `EMAIL_SERVER`, `EMAIL_FROM`
- [x] **KV** (game settings) — `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- [x] **Schema sync** — automatic via `prisma db push` in `npm run build`
- [ ] **First admin** — `UPDATE "User" SET role = 'ADMIN' WHERE email = '...'`

---

## Table of contents

0. [Current site status](#current-site-status-jul-2026--post-launch)
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
- **Admin** — member + user ops (`/admin`) + Market Pulse ops (`/admin/market-pulse`)
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
│   ├── seed-guards.ts          ← Production seed block (tested)
│   └── seed-market-pulse-data.ts
├── scripts/
│   └── import-leads.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.tsx        ← User management
│   │   │   └── market-pulse/   ← Dashboard hub + cycles/[cycleId]/builder
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
│   │   ├── home/               ← Hero, HowItWorks, CycleLoop, PpaInsight, events, philosophy
│   │   ├── market-pulse/       ← Hub lobby, SwipeCard, PlayExperience, Leaderboard, Reveal, VisualPrimitives, …
│   │   ├── admin/              ← MarketPulseCyclesHub, MarketPulseCycleBuilder, legacy panels, …
│   │   └── auth/               ← LoginPage, OnboardingPage, OnboardingRecoveryPanel
│   ├── lib/
│   │   ├── i18n/               ← locales, messages (en, zh-Hant), server helpers, auth-ui, market-pulse-ui
│   │   ├── auth/onboarding-routes.ts
│   │   ├── admin-user-actions.ts, admin-user-validation.ts
│   │   ├── layout/route-chrome.ts
│   │   └── market-pulse/
│   │       ├── hub-lobby-state.ts, play-page-state.ts, analytics.ts
│   │       ├── launch-config.ts        ← Public launch Jul 2026, ADMIN bypass, setup UI gate
│   │       ├── demo-cycle-guards.ts    ← Hide demo/seed cycles on public production paths
│   │       ├── admin-player-visibility-readiness.ts
│   │       ├── admin-operational-warnings.ts
│   │       ├── first-cycle-admin-guidance.ts
│   │       ├── server.ts, cycle-playability.ts, reveal-access.ts, admin-actions.ts
│   │       ├── launch-smoke.test.ts, launch-regression-audit.test.ts, …
│   │       └── *.test.ts               ← MP unit tests (see `npm test` count)
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
| `npm test` | Vitest unit tests (`vitest run`) — **527 tests** (82 files) |
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

Files: `prisma/seed.ts` (runner), `prisma/seed-guards.ts` (production block), `prisma/seed-market-pulse-data.ts` (demo card copy).

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
| `MarketPulseScoreEvent` | Per-card participation + match + streak points (computed on reveal) |
| `MarketPulseScore` | Per-user per-cycle aggregate (`participationScore`, `decisionsSubmitted`, `totalCards`) — written on reveal |
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
- **Session hydration:** root `layout.tsx` passes server `auth()` session into `AuthSessionProvider`
- **JWT sync:** `jwt` callback re-reads `contactNumber` from DB whenever `token.id` is present
- **Onboarding submit:** `updateContactNumber()` then redirect to **`GET /api/auth/complete-onboarding`** — server verifies DB contact, re-encodes JWT with `needsOnboarding: false`, redirects home (avoids client refresh loop)
- **Stale JWT recovery:** if DB already has contact but JWT is stale, `/auth/onboarding` server page redirects to complete-onboarding instead of bouncing away
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
| `/login` | Public | Tabbed Sign In / Create Account; Google + magic link; MP-aware copy via `MarketPulseAuthPanel` when returning to `/market-pulse/*`; **i18n** |
| `/auth/onboarding` | Logged-in | Contact form; recovery buttons; OAuth grace period |
| `/profile` | Logged-in | Profile Details + Market Pulse History; sign out |
| `/admin` | `role === ADMIN` | **Command center** — overview + user management; non-admin → `/` |

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

**Immersive routes (no site chrome — product UI only):** `/market-pulse/play` — back link to hub in play header; leaderboard/disclaimer in collapsible `<details>` on mobile.

### Mobile UX & player journey polish (Jun 2026)

Responsive and accessibility improvements across public routes and the Market Pulse player journey. **No changes** to Prisma schema, scoring formulas, reveal gating, launch gating, PPA privacy, or auth logic.

| Area | Key files | Notes |
|------|-----------|--------|
| **Route chrome** | `src/lib/layout/route-chrome.ts` | `FULL_PAGE_ROUTES`, `IMMERSIVE_ROUTES`, `isMarketPulseRoute()` |
| **Mobile nav** | `src/components/layout/MobileNav.tsx` | Drawer portaled to `document.body`; elevated header z-index on Market Pulse routes (see §9) |
| **Shell** | `LayoutShell.tsx`, `globals.css`, `layout.tsx` | Safe-area insets; `overflow-x-clip`; sticky leaderboard offset under header |
| **Homepage journey** | `MarketPulseHero`, `MarketPulseHowItWorksSection`, `MarketPulseCycleLoopSection`, `MarketPulsePpaInsightSection` | Decorative previews only; zh-Hant text wrapping |
| **Hub lobby** | `MarketPulseHubPage.tsx`, `hub-lobby-state.ts` | Status chip incl. `no_active_cycle` vs `closed`; journey steps; locked score labels |
| **Play** | `MarketPulseSwipeCard`, `DecisionLockedCard`, `MarketPulsePlayExperience` | Confirmation step; mobile card height; reduced-motion on swipe |
| **Leaderboard / reveal** | `LeaderboardStatePanel`, `RevealStatePanel`, `MarketPulseLeaderboard`, `MarketPulseRevealExperience` | Locked/revealed/archive ceremony UX |
| **Auth CTAs** | `MarketPulseAuthPanel.tsx`, `market-pulse-auth-context.ts` | MP copy when `callbackUrl` includes `/market-pulse` |
| **Analytics** | `analytics.ts`, `MarketPulseTrackedLink` | New journey events; PPA/email stripped from payloads |
| **Admin** | `admin/*`, `MarketPulseAdminDashboard` | Zinc command-center shell (separate pass) |

**Breakpoints:** Most mobile patterns use `< md` (768px) or `< lg` (1024px); MP admin uses stacked sections + sticky anchor nav on all widths.

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
| `/` | `src/app/page.tsx` | **Market Pulse** homepage — 7 sections (see §10.1) |
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
| `/market-pulse/leaderboard` | `src/app/market-pulse/leaderboard/page.tsx` | Per-cycle leaderboard + cycle archive (`?cycleId=`); personal score panel when signed in |
| `/market-pulse/reveal` | `src/app/market-pulse/reveal/page.tsx` | PPA Insight results (gated until reveal) |
| `/market-pulse/rules` | `src/app/market-pulse/rules/page.tsx` | Challenge rules |
| `/contest-rules` | `src/app/contest-rules/page.tsx` | Contest / prize legal |
| `/admin` | `src/app/admin/page.tsx` | Admin command center — overview cards, user management |
| `/admin/market-pulse` | `src/app/admin/market-pulse/page.tsx` | Market Pulse Admin — full ops dashboard |
| `/fortify-survey` | `src/app/fortify-survey/page.tsx` | Fortify registration (QR URL) |
| `/events/fortify-your-future` | `src/app/events/fortify-your-future/page.tsx` | Past Fortify event |
| `/events/fortify-sales-marketing` | `src/app/events/fortify-sales-marketing/page.tsx` | Coming soon event |
| `/concept`, `/blog/*`, `/events` | … | Content & events |
| `/api/auth/[...nextauth]` | Auth.js handlers | |
| `/api/game-settings` | KV theme/event config | Legacy API-only (no admin UI) |
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

Dark zinc layout (`bg-zinc-950`). Composes seven sections in order — **no blog preview** on homepage. Shared visual primitives: `MarketPulseVisualPrimitives.tsx` (glow background, status/proof chips, surfaces).

| # | Component | Purpose | Primary CTAs |
|---|-----------|---------|--------------|
| 1 | `MarketPulseHero` | Brand logo, pre-launch/live status chip, headline, **decorative** `HomeHeroSignalPreview`, proof chips, launch-aware primary CTA | Pre-launch → hub; post-launch → play; secondary → rules |
| 2 | `MarketPulseHowItWorksSection` | 3-step player journey (read → decide → reveal) | `HowItWorksCtaLink` → hub or play |
| 3 | `MarketPulseCycleLoopSection` | Cycle leaderboard explainer; scoring pillars (+10/+50/+100 copy); **sample** locked leaderboard preview | → leaderboard, contest rules |
| 4 | `MarketPulsePpaInsightSection` | PPA feedback-loop teaser — **static locked comparison** (no live PPA from DB) | → hub, rules |
| 5 | `LiveEventsHubSection` | Upcoming Sales & Marketing; past Fortify + placeholders (`home-events-hub.ts`) | → `/events/fortify-sales-marketing` |
| 6 | `PhilosophySection` | PPA philosophy; expert headshots | — |
| 7 | `FinalCtaSection` | Ready to Test Your Instincts? | **Become a Member** → `/login` |

**Removed from homepage compose (legacy, still in repo):** `PlayLearnWinSection.tsx` — superseded by How it works + cycle loop sections.

**i18n copy locations**

| Namespace | File(s) | Keys |
|-----------|---------|------|
| Hero, How it works, cycle loop, PPA teaser | `src/lib/i18n/messages/en.ts`, `zh-Hant.ts` | `home.hero.*`, `home.howItWorks.*`, `home.cycleLoop.*`, `home.ppaInsight.*` |
| Events showcase | same + `home-events-hub.ts` | `home.events.*` |
| Philosophy / final CTA | same | `home.philosophy.*`, `home.finalCta.*` |

**Analytics:** `MarketPulseTrackedLink` + `HowItWorksCtaLink` fire `hero_cta_clicked` / `how_it_works_cta_clicked` (`analytics.ts` strips PPA/email).

**Market Pulse cycle epoch:** **1 Jul 2026 00:00 HKT** (`CHALLENGE_CYCLE_EPOCH_MS` in `challenge-cycle.ts` / `launch-config.ts`). Pre-launch badge via `isBeforePublicLaunch()` in hero.

### 10.2 Fortify registration (`/fortify-survey`)

**Do not modify** `FortifyYourFutureSurvey.tsx` or the route without explicit approval — live QR codes point here.

**Past event detail:** `src/lib/events/fortify-your-future.ts` — `registrationDisabled: true`, past banner on page.

**Upcoming event:** `src/lib/events/fortify-sales-marketing.ts` — `/events/fortify-sales-marketing`.

**Events hub i18n:** `getFortifySalesMarketingShowcase(locale)` in `upcoming-event-display.ts`.

### 10.3 Market Pulse Hub (`/market-pulse`)

**Server:** `getMarketPulseHubPageData()` — active cycle, day progress, prize label, top-5 leaderboard preview, `leaderboardRevealed`, cycle ISO dates.

**Client:** `MarketPulseHubPage.tsx` — **game lobby** layout:

| Area | Behavior |
|------|----------|
| **Lobby status** | `deriveHubLobbyStatus()` in `hub-lobby-state.ts` → `pre_launch` \| `open` \| `reveal_pending` \| `revealed` \| `no_active_cycle` \| `closed` |
| **Primary CTA** | `deriveHubPrimaryCta()` — context-aware: get ready / play today / sign in / view reveal / view leaderboard / rules |
| **Cycle panel** | Dates, reveal countdown, leaderboard live vs locked label |
| **Journey steps** | Read → Decide → Reveal → Rank (decorative) |
| **Leaderboard preview** | Top-5 ranks; **scores masked** (`scoreLocked`) until `leaderboardRevealed` |
| **Prize** | Cycle prize banner + contest rules link |

**Launch:** `MarketPulseLaunchAnnouncement` when `shouldShowMarketPulsePreLaunchUi()` (hidden after 1 Jul 2026 HKT); `canAccessMarketPulsePlay(role)` gates play for guests/USER before public launch (ADMIN bypass pre-launch only).

**Hub status chip mapping:** `no_active_cycle` → “No active cycle” (countdown/emerald style) when runtime is OPEN but no playable DB cycle; `closed` → “Closed” when runtime is off or cycle exists but runtime closed. Panel below shows dashed **No active cycle** section when `!hasDatabaseCycle`.

**Production empty state:** On Vercel, when no active cycle resolves from DB, hub uses `buildProductionSafeEmptyHubData()` — no synthetic dev fallback (`demo-cycle-guards.ts`, `hub-data.production.test.ts`). Local dev without DB may still use synthetic cycle data.

**i18n:** `market-pulse-messages.ts` — `mp.hub.lobby.*`, `mp.hub.cta.*`.

### 10.4 Market Pulse play (`/market-pulse/play`)

- **Server:** `getMarketPulsePlayPageData()` — today's published card, locked decision, sidebar leaderboard; `gateRuntimeClosedPageData()` maps playable states to `runtime_closed` when game runtime is not `OPEN`
- **Client:** `MarketPulsePlayExperience` + `MarketPulseSwipeCard` — upgraded **signal card** (headline, news body, logo, price, 16:9 image, summary); drag/tap **Bullish** or **Cautious**
- **Confirmation step:** Card phase `confirm` — user must confirm decision before submit (`decision_confirmation_opened` analytics)
- **Locked/submitted:** `DecisionLockedCard` after successful submit or when revisiting a decided card; phase `locked`
- **Submit:** `submitMarketPulseDecisionAction` → `MarketPulseDecision` row (scores persisted on admin reveal, not at submit time)
- **States:** `pre_launch`, `no_active_cycle`, `cycle_unavailable`, `runtime_closed`, `no_card_today`, `sign_in_required`, `playable`, `locked`
- **Pre-launch:** non-admin → `pre_launch` status; ADMIN bypass via `launch-config.ts`
- **Non-playable UI:** `PlayStatusCard` / status panels for each blocked state; decorative `PlayDecorativeSignalPreview` where card is hidden
- **Playability:** `getActiveMarketPulseCycle()` returns null when `revealAt < now` even if cycle is pinned active — see [Making Market Pulse visible](#making-market-pulse-visible-to-players-go-live)
- PPA signal/insight **never** exposed before reveal (`reveal-access.ts`, `stripPpaFromCardPayload`)
- **Decisions:** Players may lock Bullish/Cautious on published cards without PPA lock (`server-core.test.ts`: “allows submission when PPA is missing and unlocked”)

**i18n:** `market-pulse-messages.ts` — `mp.play.*`, `mp.swipe.*`; errors via `market-pulse-ui.ts`.

### 10.5 Leaderboard, personal scores & reveal

#### Public leaderboard (`/market-pulse/leaderboard`)

- **Component:** `MarketPulseLeaderboard.tsx` — cycle dropdown, standings table, **My score** panel (`MarketPulseLeaderboardMyScore.tsx`), polished state panels (`LeaderboardStatePanel.tsx`).
- **View states:** `ready` (revealed standings), `locked` (unrevealed cycle), `no_scores`, `no_cycles`, `unavailable` — each with dedicated title/body copy.
- **Data:** `getMarketPulseLeaderboardPageData(cycleId?, viewerUserId?)` in `leaderboard-data.ts`; cycle list/selection in `leaderboard-cycle-select.ts`.
- **Default cycle:** Active/current cycle when one exists; otherwise the most recent **revealed** cycle; empty state if none.
- **Route:** `?cycleId=<uuid>` selects a cycle. Newest-first ordering in the selector.
- **Archive:** Revealed past cycles appear as **Archived result**; active unrevealed cycle appears as **Current cycle** (locked until reveal).
- **Public standings:** Loaded only when the selected cycle is **revealed** (`viewState === ready`). Unrevealed cycles show `LeaderboardStatePanel` — **no scores in page props or client payload**.
- **Top-3 polish:** Rank badges and visual hierarchy on revealed standings (display only).
- **Scoring unchanged:** `getMarketPulseLeaderboard` + `calculateAndPersistCycleScores` on admin reveal; formulas in `score-calculation.ts` (+10 participation, +50 match, +100 streak every 3 matches).

#### My score for this cycle (logged-in only)

- **Loader:** `getLeaderboardViewerScore()` in `leaderboard-viewer-score.ts` — queries **only** `session.user.id` + `selectedCycle.id`.
- **States:** `logged_out` (sign-in prompt), `locked_participating` / `locked_no_participation` (unrevealed — **no score/rank/participation points exposed**), `revealed_no_score`, `revealed_summary` (total, participation, rank, cards played).
- **Per-card breakdown (revealed only):** `getLeaderboardViewerScoreBreakdown()` joins `MarketPulseDecision` + `MarketPulseScoreEvent` per card; PPA **signal** label only (no `ppaInsight` text on leaderboard).
- **Participation score source:**
  - **After reveal scoring:** `MarketPulseScore.participationScore` per user/cycle (written in `calculateAndPersistCycleScores`), or sum of `MarketPulseScoreEvent.participationPoints`.
  - **Pre-reveal / no aggregate row:** Derived on read as `decisionsSubmitted × 10` (`PARTICIPATION_POINTS`) — shown only in locked messaging paths that **omit numeric scores** on the public leaderboard page.
  - **Display on revealed summary:** Prefer stored `MarketPulseScore`; fallback to derived participation from decisions when historical rows are missing.

#### Hub & play sidebar (unchanged scope)

- Hub (`hub-data.ts`) and play sidebar still show **current-cycle** top-N preview only — not the full archive UI.
- Legacy API `GET /api/market-pulse/leaderboard?mode=monthly|all-time` still exists for compatibility; the **public leaderboard page** is cycle-scoped only.

#### Reveal page (`/market-pulse/reveal`)

- **Component:** `MarketPulseRevealExperience.tsx` + `RevealStatePanel.tsx` (locked / guest / no-participation variants).
- **Pending:** Countdown + locked preview (`RevealLockedPreview`) — **no PPA or personal scores** in props (`reveal-data.ts` returns `results: null`).
- **Revealed (authenticated):** Ceremony header, score summary stats, per-card results with PPA signal + insight, learning framing copy, CTAs (play next / leaderboard / rules when available).
- **Revealed (guest):** Sign-in prompt panel — no personal results.
- **PPA gating unchanged:** PPA fields only after admin reveal + `reveal?.isRevealed`; same `reveal-access.ts` rules.
- **Display-only additions:** `revealedCycle` summary and `playNextAvailable` flag in `reveal-data.ts` (CTA routing only).
- Scoring: participation (+10), match bonus, streak bonus — computed in `calculateAndPersistCycleScores` on admin reveal

### 10.6 Market Pulse rules & contest

- **`/market-pulse/rules`** — challenge overview, scoring, fair play (`legal-copy.ts`)
- **`/contest-rules`** — prize eligibility and contest terms

### 10.7 Member profile (`/profile`)

Server component: Profile Details + Market Pulse history (`getUserMarketPulseHistory`).

### 10.8 Admin

See [Admin dashboards (ops reference)](#admin-dashboards-ops-reference) for the full layout, alert IDs, and go-live sequence. Summary below.

Admin uses a **zinc command-center** shell on both `/admin` and `/admin/market-pulse`. Non-`ADMIN` sessions redirect to `/`. All mutations return a shared `AdminActionResult` (`src/lib/admin/action-result.ts`); clients use `invokeAdminAction`.

#### `/admin` — command center

| Area | Components | Behavior |
|------|------------|----------|
| **Overview** | `AdminOverviewCards`, `getAdminOverviewData()` | Four cards: user totals, MP runtime + active cycle, player visibility snapshot, system notes |
| **Quick actions** | Links in `AdminOverviewCards` | Manage Market Pulse, Hub, Play, Leaderboard |
| **User management** | `AdminUserManagement`, `AdminMembersTable`, `AdminUserFilters`, `AdminRoleBadge`, `AdminConfirmDialog`, `AdminAddUserForm` | Add user; change role; delete with modal; search/filter by name/email/tel (`user-member-filter.ts`) |
| **Safeguards** | `admin-user-validation.ts` | Block self-delete, self-demotion, final-admin demotion |

**Data loading:** `getAdminOverviewData()` loads user counts, MP settings, active cycle stats (card count, PPA gaps), playability snapshot, and operational warnings into `systemNotes` for the System card.

#### `/admin/market-pulse` — Market Pulse Admin

**Entry components:** `MarketPulseAdminDashboard.tsx` orchestrates sections; `MarketPulseAdminShell.tsx` exports status header, quick actions, alerts, PPA banner, section nav, and section wrapper.

| Section | Key components | Ops |
|---------|----------------|-----|
| **Status header** | `MarketPulseAdminStatusHeader` | Sticky six-field snapshot: runtime, active cycle, player visibility, today's card, reveal, prize |
| **Cycles hub** | `MarketPulseCyclesHub` | Quick create → builder redirect; per-cycle **Open builder**, **Edit advanced**, reveal readiness hints |
| **Overview** | `MarketPulsePlayerVisibilityReadinessCard`, stat grid, `MarketPulsePpaCompleteBadge` | 11-check launch readiness; cards/decisions/users/PPA gap stats |
| **Setup guide** | `FirstCycleGuidancePanel` (collapsible) | **Hidden after 1 Jul 2026 HKT**; Jul 2026 first-cycle prefill for create-cycle form |
| **Runtime** | Runtime `<select>` + Save | `updateMarketPulseRuntimeStatusAction` — master switch for submissions |
| **Advanced cycles** | `MarketPulseCycleForm`, cycle rows, `RevealCycleButton`, export | Create/edit; **Set as active cycle**; close cycle; CSV export |
| **Legacy cards** | `MarketPulseCardList`, `MarketPulseCardFilters`, `MarketPulseCardPanel`, `MarketPulseCardForm` | Per-card PPA badges; **Needs PPA** filter; lock/publish; prefer builder for bulk work |
| **Reveal & scoring** | `MarketPulseRevealScoringSection`, `evaluateRevealReadiness` | Blocked until all published cards have locked PPA; confirm modal; top-5 preview |
| **Prize claims** | `MarketPulsePrizeReview` | Review claims; contact number; empty states |
| **Audit** | `initialData.recentActivity` | Timestamped admin action log |

#### Cycle builder (`/admin/market-pulse/cycles/[cycleId]/builder`)

| Area | Component | Notes |
|------|-----------|-------|
| **Layout** | `MarketPulseCycleBuilder.tsx` | Cycle summary, `MarketPulseCycleReadinessPanel`, card table/list, sticky side editor on `lg+` |
| **Editor** | `MarketPulseBuilderCardEditor.tsx` | Content fields, PPA panel, image guidance |
| **Preview** | `MarketPulseAdminCardPreview.tsx` | Admin sees PPA; swipe mock strips PPA |
| **Bulk** | `MarketPulseBuilderBulkActions.tsx` | Publish all ready / unpublish with skip reasons |
| **Actions** | `admin-actions.ts` | Quick draft, duplicate, publish, bulk publish, draft save |

**Breadcrumbs:** `MarketPulseAdminBreadcrumbs.tsx` — Admin → Market Pulse → {cycle name}.

#### Card workflow (admin)

Create card → fill **English + zh-Hant** content (builder tabs) → set **PPA signal + insight** → **Lock PPA** → **Publish** (`PUBLISHED`; release at next 9:00 AM HKT for that day unless legacy `publishedAt` defers). Publish validation requires PPA (`card-validation.ts`); player decisions on published cards do not. Image guidance: `MARKET_PULSE_CARD_IMAGE_GUIDANCE` (1200×675, 16:9).

#### PPA & playability helpers

| Module | Role |
|--------|------|
| `hkt-time.ts` | Fixed UTC+8 HKT calendar math (no DST, no server TZ) |
| `card-release-schedule.ts` | Derived 9 AM HKT release + dual playability gate |
| `card-play-order.ts` | Sort + day labels (“Day 3 · Card 2”) for play/reveal/leaderboard |
| `card-localization.ts` | Player-facing EN/zh-Hant card text; PPA insight post-reveal only |
| `admin-card-ppa-status.ts` | Per-card PPA status badges; **Live for players** uses release schedule |
| `admin-ppa-reveal-warning.ts` | 72h urgent window; drives red banner + alert |
| `reveal-ppa-validation.ts` | Blocks reveal/scoring when PPA incomplete |
| `admin-mp-status.ts` | Status snapshot + playability alerts |
| `admin-player-visibility-readiness.ts` | Overview checklist |
| `admin-operational-warnings.ts` | System notes on `/admin` overview |
| `cycle-playability.ts` | Date window + status issues |
| `demo-cycle-guards.ts` | Hides demo cycles from public prod; `demo-cycle-active` alert |

**PPA timing (admin vs players):** Players may submit on published cards without PPA lock. Admin **Publish** still requires locked PPA. Reveal/scoring requires PPA on all published cards. See [PPA timing workflow](#ppa-timing-workflow-summary).

Server actions: `src/lib/market-pulse/admin-actions.ts` (wrapped with `finishAdminMutation`). Requires `role = ADMIN`. See `docs/market-pulse-deploy-checklist.md` §4.

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

### Game settings — `/api/game-settings` (legacy API-only)

| Method | Auth | Behavior |
|--------|------|----------|
| GET | Public | Returns KV settings (`theme`, `event`, …) or defaults — legacy arcade compat |
| POST | ADMIN | Writes KV settings — no admin UI; kept for compatibility |

Not shown on `/admin`. Component `AdminGameSettings.tsx` is retained but unmounted. Market Pulse runtime uses Prisma `MarketPulseGameSetting` via `/admin/market-pulse`.

### Market Pulse — `/api/market-pulse/*`

| Route | Method | Auth | Behavior |
|-------|--------|------|----------|
| `/api/market-pulse/today` | GET | User | Today's card + decision state; **PPA stripped** pre-reveal |
| `/api/market-pulse/decision` | POST | User | Submit Bullish/Cautious; **403 before public launch** unless `ADMIN` |
| `/api/market-pulse/leaderboard` | GET | Public | `?cycleId=` (page) or `?mode=current-cycle\|monthly\|all-time` (legacy API); empty array if DB unavailable |
| `/api/market-pulse/reveal` | GET | User | Personal reveal payload; 404 until cycle revealed |

Handlers: `src/lib/market-pulse/player-handlers.ts`. Core logic: `src/lib/market-pulse/server.ts`.

---

## 12. Scripts & tooling

### Unit tests (Vitest)

```bash
npm test          # vitest run — see current count in CI; MP tests under src/lib/market-pulse/**/*.test.ts
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

**Flow:** push to `main` → Vercel auto-deploys **profit-pulse-alley** → build runs `prisma db push && next build`.

```bash
# From repo root — verify, commit, push (Vercel deploys automatically)
npm run lint && npm run typecheck && npm test && npm run build
git add -A && git commit -m "your message" && git push origin main
```

**Post-deploy smoke (Market Pulse admin):** `/admin/market-pulse` → quick create cycle → builder → add card draft → publish (with locked PPA). See `docs/market-pulse-deploy-checklist.md` §4.

Revamp merged 29 Jun 2026 (`79033a4`). Admin fast builder + player journey revamp deploy from `main` the same way.

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

`submitMarketPulseDecisionAction` in `player-actions.ts` → `submitMarketPulseDecision` in `server.ts`. One decision per user per card (`MarketPulseDecision` only at submit); participation/match/streak points persisted on admin reveal. **Pre-launch:** `canSubmitMarketPulseDecision` in `launch-config.ts` blocks non-admin USER before 1 Jul 2026 HKT.

**Leaderboard:** `getMarketPulseLeaderboardPageData` in `leaderboard-data.ts` (cycle selector + viewer score); `getMarketPulseLeaderboard` in `server.ts` for public entries.

**Reveal gating:** `reveal-access.ts` — `getMarketPulseCardPublicPayload` strips `ppaSignal` / `ppaInsight` until `revealAt`.

**Admin ops:** `admin-actions.ts` — create cycle/card, lock PPA, publish, reveal + `calculateAndPersistCycleScores`. Reveal blocked when published cards lack locked PPA (`reveal-ppa-validation.server.ts`).

**Local demo data:** `npm run db:seed` (dev only).

### Update Fortify registration

Edit only with approval — update `FortifyYourFutureSurvey.tsx` `content` + form embed; **never change `/fortify-survey` URL**.

### Update homepage copy or events showcase

- **Market Pulse hero:** `MarketPulseHero.tsx`, `HomeHeroSignalPreview.tsx`, `MarketPulseLogo.tsx`, `launch-config.ts` — keys under `home.hero.*` in `en.ts` / `zh-Hant.ts`
- **How it works / cycle loop / PPA teaser:** `MarketPulseHowItWorksSection.tsx`, `MarketPulseCycleLoopSection.tsx`, `MarketPulsePpaInsightSection.tsx` — keys `home.howItWorks.*`, `home.cycleLoop.*`, `home.ppaInsight.*`
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
| `HomeHero.tsx`, `HomeEventsHub.tsx`, `HomeProofOfConcept.tsx`, `HomeTestimonials.tsx`, `PlayLearnWinSection.tsx` | Superseded homepage components — **not imported** by `page.tsx` |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Removed — admin uses DB role |
| Old inline footer in `LayoutShell` | Replaced by `SiteFooter.tsx` |
| `/images/fortify-hero-*.png`, `/hero.png` | No longer used on homepage |

---

## 16. Known inconsistencies

1. **FAQ placeholder** — `/faq` still needs full content from comms.
2. **Newsletter** — `SiteFooter` subscribe is UI-only.
3. **Social URLs** — LinkedIn/Twitter placeholders; Instagram live.
4. **Past events placeholders** — “Zero-Cost Life Salon” and “Founder's Funding Roundtable” show on homepage without archive links until detail pages exist (`archiveHref` optional in `home-events-hub.ts`).
5. **Event detail pages** — Static bilingual strings; not fully driven by `ppa_locale`.
6. **KV vs Prisma settings** — KV theme/event API (`/api/game-settings`) is legacy API-only with no admin UI; runtime game state is Prisma `MarketPulseGameSetting` on `/admin/market-pulse`. VC/KV Game Settings removed from `/admin` (Jun 2026 redesign).
7. **Demo seed dates** — `npm run db:seed` creates a cycle relative to seed time; production may retain expired `[DEMO]` cycles — update in admin or create new Jul 2026 cycle.
8. **No migration files** — Production uses `prisma db push` in build; adopt `migrate deploy` when ready.
9. **Legacy GameScore** — Profile may still show old arcade scores alongside swipe challenge history.
10. **Admin MP UI** — Operational labels mostly English; enums (`OPEN`, `PUBLISHED`) intentionally untranslated.
11. **Rules page gameplay copy** — `/market-pulse/rules` `whatIsBody` still describes the legacy arcade simulation; `scoringBody` and prize sections match current cycle leaderboard model.

---

## Quick reference — key files

| Concern | File(s) |
|---------|---------|
| Auth config | `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts` |
| Auth actions | `src/lib/auth-actions.ts`, `src/lib/auth/onboarding-routes.ts` |
| Login / onboarding | `LoginPage.tsx`, `OnboardingPage.tsx`, `MarketPulseAuthPanel.tsx`, `market-pulse-auth-context.ts`, `OnboardingRecoveryPanel.tsx`, `/auth/onboarding/*`, `/api/auth/complete-onboarding/route.ts` |
| i18n | `src/lib/i18n/*`, `LocaleProvider.tsx`, `LanguageSwitcher.tsx` |
| Admin users | `AdminUserManagement.tsx`, `AdminMembersTable.tsx`, `admin-user-actions.ts`, `admin-user-validation.ts`, `user-member-filter.ts` |
| Admin action results | `src/lib/admin/action-result.ts` — `finishAdminMutation`, `invokeAdminAction` |
| Admin overview | `AdminOverviewCards.tsx`, `admin-overview-data.ts` |
| MP admin shell | `MarketPulseAdminShell.tsx`, `admin-mp-status.ts`, `MarketPulseAdminDashboard.tsx` |
| MP admin cards | `MarketPulseCardList.tsx`, `MarketPulseCardForm.tsx`, `MarketPulseAdminCardPreview.tsx`, `admin-card-filter.ts` |
| MP reveal/prize | `MarketPulseRevealScoringSection.tsx`, `RevealCycleButton.tsx`, `admin-reveal-status.ts`, `reveal-ppa-validation.ts`, `admin-ppa-reveal-warning.ts`, `MarketPulsePrizeReview.tsx` |
| MP card admin | `MarketPulseCardPanel.tsx`, `admin-card-ppa-status.ts`, `admin-card-filter.ts` |
| Launch / pre-launch | `launch-config.ts`, `MarketPulseLaunchAnnouncement.tsx`, `shouldShowMarketPulseLaunchSetupUi` |
| Launch smoke / regression | `launch-smoke.test.ts`, `launch-regression-audit.test.ts`, `play-data.launch.test.ts`, `reveal-data.launch.test.ts` |
| Demo/seed production guards | `demo-cycle-guards.ts`, `seed-guards.ts`, `hub-data.ts` (production-safe fallback) |
| Player visibility (admin) | `admin-player-visibility-readiness.ts`, `MarketPulsePlayerVisibilityReadinessCard.tsx` |
| First-cycle admin | `first-cycle-admin-guidance.ts`, `FirstCycleGuidancePanel.tsx` |
| Content layout | `src/components/layout/ContentPageLayout.tsx` |
| Legal / info pages | `src/app/contact/`, `faq/`, `terms/`, `privacy/`, `careers/`, `investment-disclaimer/` |
| Profile | `src/app/profile/page.tsx` |
| Admin | `src/app/admin/page.tsx`, `src/app/admin/market-pulse/page.tsx`, `MarketPulseAdminDashboard.tsx` |
| Market Pulse Hub | `src/app/market-pulse/page.tsx`, `MarketPulseHubPage.tsx`, `hub-lobby-state.ts`, `hub-data.ts` |
| Market Pulse play | `src/app/market-pulse/play/page.tsx`, `MarketPulsePlayExperience.tsx`, `MarketPulseSwipeCard.tsx`, `DecisionLockedCard.tsx`, `play-page-state.ts`, `play-data.ts` |
| Leaderboard / reveal | `leaderboard/page.tsx`, `reveal/page.tsx`, `leaderboard-data.ts`, `leaderboard-cycle-select.ts`, `leaderboard-viewer-score.ts`, `LeaderboardStatePanel.tsx`, `MarketPulseLeaderboardMyScore.tsx`, `RevealStatePanel.tsx`, `reveal-data.ts` |
| Homepage journey | `src/app/page.tsx`, `MarketPulseHero.tsx`, `MarketPulseHowItWorksSection.tsx`, `MarketPulseCycleLoopSection.tsx`, `MarketPulsePpaInsightSection.tsx`, `HomeHeroSignalPreview.tsx` |
| MP visual / analytics | `MarketPulseVisualPrimitives.tsx`, `MarketPulseTrackedLink.tsx`, `analytics.ts` |
| Admin cycle stats | `admin-cycle-stats.ts`, `admin-data.ts` (`MarketPulseAdminCycleRow` participation fields) |
| Market Pulse domain | `server.ts`, `cycle-playability.ts`, `playable-card.ts`, `reveal-access.ts`, `admin-actions.ts`, `card-validation.ts` |
| Market Pulse APIs | `src/app/api/market-pulse/*`, `player-handlers.ts` |
| Deploy checklist | `docs/market-pulse-deploy-checklist.md` |
| Fortify (QR) | `FortifyYourFutureSurvey.tsx`, `fortify-your-future.ts`, `fortify-sales-marketing.ts` |
| Events hub i18n | `upcoming-event-display.ts`, `home-events-hub.ts` |
| Nav / layout | `LayoutShell.tsx`, `SiteFooter.tsx`, `MobileNav.tsx`, `route-chrome.ts` |
| Homepage | `src/app/page.tsx`, `src/components/home/*` |
| Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Unit tests | `vitest.config.ts`, `src/lib/**/*.test.ts` |
| Legacy Castle Siege | `src/legacy/castle-siege/` (unreferenced) |

---

## Support & handoff notes

- **Languages:** EN + Traditional Chinese (`ppa_locale` cookie); MP launch messages in `launch-config.ts`
- **Data stores:** Postgres (users, Market Pulse, auth), KV (legacy theme), Markdown (blog)
- **Testing:** `npm run lint`, `npm run typecheck`, `npm test` (527), `npm run build`
- **Production smoke:** [`docs/market-pulse-deploy-checklist.md`](docs/market-pulse-deploy-checklist.md) § Launch smoke test; automated suites listed in [Production smoke test](#production-smoke-test)
- **Lint warnings:** Legacy castle-siege; TanStack Table in admin members table

---

*Last updated: 29 Jun 2026 — Market Pulse card scheduling (9 AM HKT UTC+8, multi-card per day, bilingual cards); 527 tests pass; scoring/launch/PPA privacy unchanged.*
