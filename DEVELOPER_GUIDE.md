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
| **Recent `main`** | **Acquisition progressive profiling** — learning-interest prompt after first MP decision (PR 2); next-step preference prompt on reveal (PR 3) |
| **Feature branch** | `acquisition-admin-visibility` — guided MP admin (PRs 5–16), play empty-state timing, **email notification foundation** (`UserNotificationPreference`, `EmailDeliveryLog`, `sendProductEmail`); validated **14 Jul 2026** (`typecheck`, **861 tests**); merge to `main` for Vercel production deploy |

---

## Current site status (Jul 2026 — post-launch)

### Site strategy (current)

The public site centers on **Market Pulse** — a recurring multi-day investment challenge where members swipe **Bullish** or **Cautious** on daily market signal cards (or **claim participation** on **Market rest cards**), earn participation points, and compete on leaderboards until **PPA Insight** is revealed at cycle end. Supporting pillars: **fireside events**, **membership**, and **expert-led philosophy** (PPA Take).

**Homepage (Jul 2026 terminal revamp):** premium dark **obsidian terminal** layout (`bg-mp-obsidian`, pulse green accents, JetBrains Mono metrics) with a **Market Pulse hero** (headline *“Read the Market Rhythm. Build Your Zero-Cost Life.”*, proof chips, launch-aware CTAs, interactive **Pulse Simulator** — clearly labeled Demo, local state only, no API/decision writes), **Pipeline** (4-step Signal → Lock In → Reveal → Reward + scoring chips + Ocean Park prize note), **Pulse Board** widget (locked / revealed / sample states — no unrevealed scores, no PPA, no email/phone), **Rewards** showcase (confirmed Ocean Park ticket per cycle winner; events; PPA framed as post-reveal), then Live Events Hub, philosophy, and final CTA. **Bilingual** copy via `ppa_locale` cookie. Blog is nav/footer only. **Game logic unchanged** — scoring, active-window playability, launch gating, PPA privacy, reveal gating, leaderboard locks.

**Player journey UX:** Hub is a **game lobby** (cycle status chip, journey steps, prize + locked leaderboard preview). Play uses an upgraded **signal card** with Bullish/Cautious **confirmation step** before submit. Leaderboard and reveal pages use polished **locked / revealed / archive** state panels; after reveal, leaderboard **My score** links to the full **cycle review** on `/market-pulse/reveal`. **Scoring, launch gating, PPA privacy, and auth rules are unchanged** — see [Player journey revamp — safety unchanged](#player-journey-revamp-jun-2026--safety-unchanged).

### Production player experience (post-launch)

Public launch gate **1 Jul 2026 00:00 HKT** has passed. Pre-launch announcement banners and the admin **Setup guide** section are **hidden automatically** (`shouldShowMarketPulsePreLaunchUi()`, `shouldShowMarketPulseLaunchSetupUi()`).

| What players see | When | Hub status chip | Primary CTA |
|------------------|------|-----------------|-------------|
| **No active cycle** | Runtime `OPEN`, no playable pinned cycle (or demo cycle hidden in prod) | **No active cycle** (soft emerald) | **Explore rules** when next cycle is TBC; otherwise view leaderboard / play when next cycle is scheduled |
| **Closed** | Runtime `CLOSED` / `MAINTENANCE`, or cycle exists but runtime off | **Closed** (gray) | View leaderboard |
| **Open** | Runtime `OPEN`, active cycle in window, today's card published | **Open** (green pulse) | Play today / Sign in |
| **Reveal pending** | Cycle ended, reveal time passed, not yet revealed | **Reveal pending** (amber) | View reveal |
| **Revealed** | Cycle revealed | **Revealed** (sky) | View leaderboard |

**Live production note (early Jul 2026):** If `/market-pulse` shows **No active cycle** with an empty cycle panel, ops has not finished go-live — runtime may be `OPEN` but no **real** (non-demo) cycle is pinned active with a **published card for today**. Fix via `/admin/market-pulse` (see [Making Market Pulse visible](#making-market-pulse-visible-to-players-go-live) and [Admin dashboards](#admin-dashboards-ops-reference)).

**Between cycles:** When runtime is `OPEN` but no cycle is in the active play window, `/market-pulse/play` returns `between_cycles` with **Next challenge: TBC** or the scheduled next cycle start (`next-cycle.ts`). The play page empty state shows the **earliest public-eligible future `OPEN` cycle start time** (HKT-labelled) when known — this is display-only and does **not** change which cycle is pinned active for actual play. Hub shows the same **Next cycle** signal in the cycle panel.

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
| **Homepage** | `/` | Public | MP hero + Pulse Simulator (demo) + Pipeline + Pulse Board + Rewards; Live Events Hub; philosophy; final CTA; **i18n** |
| Brand concept | `/concept` | Public | “Our Philosophy” in nav |
| Blog (EN + zh-HK) | `/blog`, `/blog/{lang}/[slug]` | Public | 3 paired articles |
| Events hub | `/events` | Public | Upcoming: Sales & Marketing; past: Fortify + Wo Leung; **i18n** |
| Fortify event (past) | `/events/fortify-your-future` | Public | **Archived** — registration closed |
| Sales & Marketing event | `/events/fortify-sales-marketing` | Public | Coming soon — 17 Jul 2026, TBC |
| Past event archive | `/events/wo-leung-yiu-dou-yiu` | Public | Registration closed |
| **Fortify registration** | `/fortify-survey` | Public | **QR-coded URL — do not change** |
| **Login** | `/login` | Public | Sign In + Create Account; Google + magic link; **i18n** |
| **OAuth onboarding** | `/auth/onboarding` | Logged-in | **Optional** contact number; skip to play; `/api/auth/complete-onboarding` JWT refresh |
| **Member profile** | `/profile` | Members only | Profile + Market Pulse history; **i18n** |
| **Market Pulse Hub** | `/market-pulse` | Public | **Game lobby** — status chip (`Open` / `No active cycle` / `Closed` / …), journey steps, prize, locked/revealed leaderboard preview, context-aware primary CTA; **i18n** |
| **Market Pulse play** | `/market-pulse/play` | Login to submit | Signal cards: Bullish/Cautious swipe/tap + **confirmation**; **rest cards:** Claim participation (`ACKNOWLEDGED`); locked/submitted state; non-playable state panels; **i18n** |
| **Market Pulse leaderboard** | `/market-pulse/leaderboard` | Public | Locked/revealed/archive state panels; per-cycle archive (`?cycleId=`); **My score** panel with **View cycle review** → reveal; **i18n** |
| **PPA Insight reveal** | `/market-pulse/reveal` | Login for personal results | Pending locked ceremony; revealed results + learning framing; PPA only post-reveal; **i18n** |
| **Market Pulse rules** | `/market-pulse/rules` | Public | Challenge rules + scoring; **i18n** |
| **Contest rules** | `/contest-rules` | Public | Prize eligibility + legal |
| **Admin dashboard** | `/admin` | `ADMIN` only | **Command center** — 4 overview cards (users, MP runtime/cycle, player visibility, system notes), quick actions, user management (**Tel**, **Learning**, **Next Step** columns; acquisition filters; CSV export) |
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

### Verification — last run 11 Jul 2026 (656 tests)

| Check | Result |
|-------|--------|
| **Lint** | `npm run lint` — pass (0 errors; pre-existing warnings in legacy/admin) |
| **Typecheck** | `npm run typecheck` — pass |
| **Build** | `npm run build` — pass (`prisma db push && next build`) |
| **Tests** | `npm test` — **656** Vitest tests (92 files) |
| **Hub lobby chip** | `hub-lobby-state.test.ts` — `no_active_cycle` when runtime OPEN + no DB cycle; `closed` when runtime paused |
| **Launch smoke** | `launch-smoke.test.ts`, `play-data.launch.test.ts`, `reveal-data.launch.test.ts`, `launch-regression-audit.test.ts` |
| **Card release (HKT)** | `hkt-time.test.ts`, `card-release-schedule.test.ts` — fixed UTC+8 math; Day 1 = `2026-07-01T01:00:00.000Z` when cycle starts `2026-06-30T16:00:00.000Z`; dual gate (derived release + `publishedAt`) |
| **Admin cycle datetimes (HKT)** | `cycle-validation.test.ts`, `hkt-time.test.ts` — `parseHktDatetimeLocal` / `toHktDatetimeLocalValue` round-trip; TZ-independent on Vercel UTC |
| **Multi-card play** | `play-data-multi-card.test.ts`, `playable-card.test.ts`, `score-calculation.test.ts` — same-day cards, streak order by `sortOrder` |
| **Active-window playability** | `today-only-playability.test.ts`, `playable-card.test.ts`, `server-core.test.ts` — seamless card windows across overnight gaps; HKT 9 AM handoff; submit rejects stale/future cards |
| **Market rest cards** | `card-type.test.ts`, `play-rest-card.test.ts`, `player-handlers.test.ts`, `score-calculation.test.ts` — `ACKNOWLEDGED` on REST; +10 only; REST skipped in `computeSignalMatchStreak`; reveal/leaderboard participation-only rows |
| **Card localization** | `card-localization.test.ts` — zh-Hant + EN fallback; PPA stripped pre-reveal |
| **Reveal / leaderboard multi-card** | `leaderboard-score-breakdown.test.ts`, `reveal-ppa-validation.test.ts` — duplicate `dayIndex` OK; per-card breakdown labels |
| **Post-cycle reveal review** | `reveal-cycle-review.test.ts`, `reveal-data.launch.test.ts` — full card list (played + skipped); cards with `PUBLISHED` or `REVEALED` status after admin reveal/scoring; zero/partial participation; pre-reveal empty `cards` |
| **Leaderboard → reveal CTA** | `public-market-pulse-copy.test.ts` — `mp.leaderboard.myScore.viewCycleReview` EN/zh; `MarketPulseLeaderboardMyScore.tsx` links to `/market-pulse/reveal` |
| **Next-cycle TBC** | `next-cycle.test.ts`, `hub-data.production.test.ts`, `hub-lobby-state.test.ts`, `play-data.launch.test.ts` — nearest future `OPEN` cycle or `{ status: "tbc" }`; demo filtered in prod; hub rules CTA when TBC |
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
| **Scoring formulas** | +10 participation per card; +50 match on SIGNAL cards when decision matches PPA; +100 streak every 3 consecutive correct **SIGNAL** matches — REST cards are streak-neutral (`score-calculation.ts`, `constants.ts`) |
| **Player journey revamp** | Display-only UX; logic gates unchanged |
| **`/fortify-survey`** | Unchanged — full-page route; no redirect |

**Deploy checklist:** `docs/market-pulse-deploy-checklist.md`

### Player journey revamp (Jun 2026) — safety unchanged

Visual/UX pass across homepage and Market Pulse player routes. **No regressions** found in privacy/security audit (29 Jun 2026).

| Area | Changed (UI) | Unchanged (logic) |
|------|--------------|-------------------|
| **Scoring** | Homepage pipeline copy references +10/+50/+100 | `score-calculation.ts`, `constants.ts`, admin reveal scoring |
| **Launch gating** | Pre-launch CTAs route to hub vs play | `launch-config.ts`, `canSubmitMarketPulseDecision`, ADMIN bypass |
| **PPA privacy** | Home/hub/reveal use locked **decorative** previews | `reveal-access.ts`, `stripPpaFromCardPayload`, API stripping |
| **Leaderboard scores** | `LeaderboardStatePanel` locked UI | `leaderboard-data.ts` query gating; `leaderboard-viewer-score.ts` |
| **Auth / admin** | MP-aware login/onboarding copy when `callbackUrl` includes `/market-pulse` | JWT, middleware, `/api/auth/complete-onboarding`, `requireAdminSession` |
| **`/fortify-survey`** | — | Route + `FortifyYourFutureSurvey.tsx` untouched |

**New display-only data fields:** `hub-data.ts` (`startsAtIso`, `endsAtIso`); `play-data.ts` (`runtimeOpen`, `runtime_closed` status via `gateRuntimeClosedPageData`); `reveal-data.ts` (`revealedCycle`, `playNextAvailable` for CTAs only).

**Auth notes:** JWT strategy; `SessionProvider` hydrated from server `auth()` in root layout; `resolveJwtUserState()` does **not** block on missing `contactNumber`; optional phone via profile/onboarding; stale session cleared via **`GET /api/auth/complete-onboarding`**.

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
| 19 | Admin acquisition visibility | **Pass** | `AdminMembersTable` — Learning + Next Step from `UserAcquisitionProfile`; filters + client CSV export (`members-data.ts`) |
| 19 | Homepage + player journey visual revamp | **Pass** | Jul 2026 terminal homepage: hero + Pulse Simulator, Pipeline, Pulse Board, Rewards; hub lobby; play confirmation; leaderboard/reveal state panels; responsive + reduced-motion pass — **security unchanged** |

### Production smoke test

**Primary checklist:** [`docs/market-pulse-deploy-checklist.md`](../docs/market-pulse-deploy-checklist.md) § **Launch smoke test (1 Jul 2026 HKT)** — pass/fail tables for environment, player flows, and automated preflight.

**Automated coverage:** `launch-smoke.test.ts`, `play-data.launch.test.ts`, `reveal-data.launch.test.ts`, `launch-regression-audit.test.ts`, plus `launch-first-cycle-boundaries.test.ts`, `admin-player-visibility-readiness.test.ts`, `public-launch-ui.test.ts`, `public-market-pulse-copy.test.ts`, `server-security.test.ts`, `leaderboard-data.test.ts`, `demo-cycle-guards.test.ts`, `hub-data.production.test.ts`, `seed-guards.test.ts`, `homepage-compose.test.ts`, `homepage-pulse-preview.test.ts`, `home-market-pulse-simulator.safety.test.ts`, `today-only-playability.test.ts`.

<details>
<summary>Historical — pre-launch manual notes (before 1 Jul 2026 00:00 HKT)</summary>

**Pre-launch:** guest/USER → `pre_launch` on play; USER submit blocked; ADMIN can play/submit when cycle/card gates pass; homepage hero + hub lobby show pre-launch state.

**At launch:** USER can play when runtime `OPEN` + published card exists; pre-launch UI hidden automatically via `shouldShowMarketPulsePreLaunchUi()`.

</details>

**Player journey:** Homepage sections load (hero simulator, pipeline, pulse board locked/sample/revealed, rewards); hub lobby status/CTA correct; play confirmation step; leaderboard locked panel; reveal pending vs ceremony states.

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
│  · Table: name, email, Tel, Learning, Next Step, role, verified, joined, scores │
│  · Acquisition filters + Export acquisition CSV (filtered rows)              │
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
| `today-card-live` | `findPlayableCardsForToday()` / `findPlayableCardForToday()` resolves today's HKT day only |
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

#### Admin operations manual — cycles, cards, and go-live

Use this as the **end-to-end ops playbook**. UI labels are English; player card copy is bilingual (EN + zh-Hant tabs in the builder).

**Recommended path (new cycle):**

```
1. /admin/market-pulse → #cycles-hub → Quick create next cycle
2. Builder opens → add signal/rest drafts → edit content → Lock PPA → Publish each card
3. #cycles (advanced) → set cycle status OPEN → check “Set as active cycle” → Save
4. #runtime → Runtime OPEN → Save
5. #overview → Player visibility readiness → all blocking checks green
6. Public smoke → /market-pulse → /market-pulse/play
7. After cycle ends → complete PPA on all published SIGNAL cards → #reveal-scoring → Reveal cycle
8. #prize-claims → review winner claim
```

##### Creating a Market Pulse cycle

| Method | Where | Action | Result |
|--------|-------|--------|--------|
| **Guided create** (fastest for full draft templates) | `#cycles-hub` → **Create guided cycle** | `/admin/market-pulse/guided-cycle/new` | `createGuidedMarketPulseCycleAction()` → `DRAFT` cycle + SIGNAL/REST draft cards from day plan; does **not** pin active, publish, or open runtime |
| **Quick create** | `#cycles-hub` or sticky quick actions | **Quick create next cycle** | `quickCreateMarketPulseCycleAction()` → new cycle in `DRAFT`, redirects to builder |
| **Advanced create** | `#cycles` | `MarketPulseCycleForm` create mode | `createMarketPulseCycleAction()` — full control over name, dates, status, prize, pin active |
| **First-cycle prefill** | `#setup` (`FirstCycleGuidancePanel`) | **Prefill create-cycle form** | Inform-only Jul 2026 window; admin saves manually |

**Quick create defaults** (`quick-create-cycle-defaults.ts`):

| Field | Value |
|-------|--------|
| `status` | `DRAFT` — not player-visible until you set `OPEN` and pin active |
| `name` | Next `Cycle NN` (collision-safe fallback) |
| `startsAt` | Previous cycle `endsAt`, or next HKT midnight |
| `endsAt` | Prior cycle duration, or first-cycle window from `launch-config.ts` |
| `revealAt` | Same instant as `endsAt` (editable later) |
| `prizeLabel` | `FIRST_CYCLE_GUIDANCE.prizeLabel` (Ocean Park ticket copy) |
| **Active cycle** | **Not** auto-pinned — you must pin in `#cycles` before go-live |

**Advanced cycle form** (`MarketPulseCycleForm.tsx`, `cycle-validation.ts`):

| Field | Notes |
|-------|--------|
| **Name** | Display name on hub, play, leaderboard, reveal |
| **Starts / Ends / Reveal** | Entered as **HKT wall-clock** (`parseHktDatetimeLocal`) — not browser local, not Vercel UTC |
| **Status** | `DRAFT` \| `OPEN` \| `CLOSED` \| `REVEALED` \| `ARCHIVED` — players need **`OPEN`** on the **pinned** cycle |
| **Prize label** | Required when status is player-facing (`OPEN` / `CLOSED` / `REVEALED`) |
| **Set as active cycle** | Writes `MarketPulseGameSetting.activeCycleId` — required for hub/play/leaderboard |
| **Close cycle** | `closeMarketPulseCycleAction()` → status `CLOSED` (stops new play in window rules) |

**Pin active cycle:** Only one cycle is “active” at a time (`setActiveMarketPulseCycleAction` or checkbox on save). Demo cycles (`[DEMO]` prefix) trigger `demo-cycle-active` alerts in production and are hidden from public paths.

**After creating a cycle:** Open **builder** from the cycles hub table (**Open builder**) — this is where almost all card work happens.

##### Creating and editing cards (cycle builder)

**Route:** `/admin/market-pulse/cycles/[cycleId]/builder`  
**Data:** `getMarketPulseCycleBuilderData(cycleId)` · **UI:** `MarketPulseCycleBuilder.tsx`

| Builder action | Server action | What it creates |
|----------------|---------------|-----------------|
| **Add card draft** | `quickCreateMarketPulseCardDraftAction` | `SIGNAL` card in `DRAFT` with scheduling defaults |
| **Add rest card draft** | `quickCreateMarketPulseRestCardDraftAction` | `REST` card in `DRAFT` (participation-only, no PPA) |
| **Duplicate** | `duplicateMarketPulseCardAction` | Copy content to new `DRAFT` row (no decisions copied) |
| **Save draft** | `updateMarketPulseCardDraftAction` | Lenient validation; forces `DRAFT`, clears `publishedAt` |
| **Full save** | `updateMarketPulseCardAction` | Strict validation; PPA lock changes need `changeReason` |
| **Lock PPA** | `lockMarketPulseCardPpaAction` | Sets `ppaSignalLockedAt` when signal + insight present |
| **Publish** | `publishMarketPulseCardAction` | `DRAFT` → `PUBLISHED`; sets `publishedAt` from schedule if absent |
| **Unpublish** | `unpublishMarketPulseCardAction` | Blocked if players have decisions on that card |
| **Reorder** | `reorderMarketPulseCardAction` | ↑↓ within day (`sortOrder`) |
| **Bulk publish** | `bulkPublishMarketPulseCardsAction` / `bulkPublishAllReadyMarketPulseCardsAction` | Skips invalid cards with reasons |

**Scheduling fields** (unique: `@@unique([cycleId, dayIndex, sortOrder])`):

| Field | Meaning |
|-------|---------|
| `dayIndex` | 1-based cycle calendar day from `cycle.startsAt` (HKT) |
| `sortOrder` | 0-based order within that day — UI shows **Card {sortOrder + 1}** |
| `sourceDate` | News date for display; auto-suggested per day |

**Quick-add behavior:** Repeated **Add card draft** on the same calendar day stacks **Day N — Card 1, Card 2, …** until you change **Day number** in the editor and **Save draft**.

**Editor tabs:** English + **zh-Hant** for headline, summary, news body, user prompt, PPA insight, image alt (`MarketPulseBuilderCardEditor`).

**Readiness panel** (`evaluateCycleReadiness` in `admin-cycle-readiness.ts`, `MarketPulseCycleReadinessPanel.tsx`):

| Per-card status | Meaning |
|-----------------|---------|
| `published` | `PUBLISHED` — live when release + runtime gates pass |
| `ready` | Draft passes publish validation — can click Publish |
| `draft_missing_fields` | Missing required content or PPA lock |
| `conflict` | Scheduling conflict (day beyond cycle length, duplicate slot, etc.) |

**Builder pitfalls:**

- **Publish does not save the form** — save draft first, then publish.
- **Save draft on a published card unpublishes** — no silent save on `PUBLISHED` rows; plan edits before first publish or accept unpublish.
- **Table vs form mismatch** — list shows DB; side editor shows unsaved local state until **Save draft**.

**Legacy card editor:** `#cards` on the main MP admin dashboard (`MarketPulseCardPanel` + `MarketPulseCardForm`) — same actions, prefer builder for multi-card cycles.

##### Card publish requirements (admin **Publish** button)

`validateCardPublishable()` in `card-validation.ts` — **SIGNAL** vs **REST**:

| Requirement | SIGNAL card | REST card |
|-------------|-------------|-----------|
| Headline | Required | Required (rest title) |
| Company name | Required | — |
| Ticker | Required | — |
| Summary | Required | — |
| Body | — | `newsBody` or `summary` (rest body) |
| PPA signal | Required (`BULLISH` / `CAUTIOUS`) | Not used |
| PPA insight | Required | Not used |
| PPA locked | `ppaSignalLockedAt` required | Not used |
| Card image | If `cardImageUrl` set → `cardImageAlt` required | Same |
| Scheduling | No conflict (`getCardSchedulingPublishBlockReason`) | Same |
| Unique slot | `cycleId + dayIndex + sortOrder` | Same |

**Also blocks publish:** card already `PUBLISHED`; invalid URLs on logo/source/card image.

**REST cards:** No PPA; players **Claim participation** (`ACKNOWLEDGED`); +10 participation only; streak-neutral.

##### What must be true for players to see and play a cycle

Three different gate layers — do not confuse them:

| Layer | Purpose | Key modules |
|-------|---------|-------------|
| **A. Player play gates** | Can a `USER` submit on `/market-pulse/play`? | `play-data.ts`, `playable-card.ts`, `cycle-playability.ts`, `launch-config.ts` |
| **B. Admin publish gates** | Can admin click **Publish** on a card? | `card-validation.ts`, `admin-actions.ts` |
| **C. Reveal/scoring gates** | Can admin run end-of-cycle reveal? | `reveal-ppa-validation.ts`, `admin-reveal-status.ts` |

**Layer A — Player play gates (all required):**

| # | Gate | Admin fix |
|---|------|-----------|
| 1 | `MarketPulseGameSetting.runtimeStatus === OPEN` | `#runtime` → OPEN |
| 2 | Active cycle pinned (`activeCycleId`) | `#cycles` → **Set as active cycle** |
| 3 | Pinned cycle `status === OPEN` | `#cycles` → status OPEN |
| 4 | `startsAt ≤ now ≤ revealAt` | Edit cycle dates (HKT) |
| 5 | At least one card `PUBLISHED` for today's active schedule day | Builder → Publish |
| 6 | Card release time passed — **9:00 AM HKT** on card's `dayIndex` | Automatic (`card-release-schedule.ts`) |
| 7 | Legacy `publishedAt` not in future | Avoid future `publishedAt` unless intentional deferral |
| 8 | Public launch passed (`canAccessMarketPulsePlay`) | Automatic after 1 Jul 2026 HKT for `USER` |
| 9 | Not a demo cycle (production) | Pin a real cycle; demo hidden via `demo-cycle-guards.ts` |

**PPA is NOT in layer A.** Players may submit on published cards with incomplete PPA; PPA is stripped from public payloads until reveal (`reveal-access.ts`).

**Layer B — Admin publish:** Locked PPA required for SIGNAL cards (table above). Players can still play already-published cards if PPA was incomplete when published via seed/migration — normal workflow requires lock before publish.

**Layer C — Reveal/scoring:** Every **published SIGNAL** card must have `ppaSignal`, `ppaInsight`, and `ppaSignalLockedAt` before `revealMarketPulseCycleAction`. REST cards excluded. `evaluateRevealReadiness()` drives the **Reveal cycle** button.

**Verify in UI:**

| Panel | Location | Green means |
|-------|----------|-------------|
| Sticky status header | Top of `/admin/market-pulse` | Runtime, active cycle, today's card, player visibility |
| Alert panel | Below header | No red/amber playability alerts |
| Player visibility readiness | `#overview` | **Ready for players** + **Players can submit today** badge |
| Cycle readiness | Builder | All cards `published` or `ready`; no conflicts |

##### Reveal and scoring (end of cycle)

**UI:** `#reveal-scoring` → `MarketPulseRevealScoringSection` + `RevealCycleButton`

**Before reveal:**

1. Cycle reached end of play window (recommended; reveal can run early if PPA complete — `reveal_scheduled` is informational).
2. All **published SIGNAL** cards have complete locked PPA (`validatePublishedCardsPpaForReveal`).
3. Cycle not already `REVEALED`.

**Action:** `revealMarketPulseCycleAction(cycleId)`:

1. `validateCycleReadyForReveal(cycleId)` — server-side PPA check
2. Transaction: cycle → `REVEALED`; published cards → `REVEALED`
3. `calculateAndPersistCycleScores(cycleId)` — participation, match (+50), streak (+100 every 3 SIGNAL matches)
4. Audit log + revalidate public MP routes

**After reveal:** `/market-pulse/reveal` shows PPA + personal scores; leaderboard unlocks; `#prize-claims` for winner fulfillment; optional leaderboard CSV via `exportMarketPulseLeaderboardAction`.

**PPA admin warnings:** ≤72h to `revealAt` with incomplete PPA → red `MarketPulsePpaRevealWarningBanner` + `ppa-urgent` alert (`PPA_REVEAL_WARNING_HOURS = 72`).

##### User management and acquisition (`/admin`)

| Feature | Implementation |
|---------|----------------|
| **Load members** | `loadAdminMembers()` — `User` + optional `acquisitionProfile` |
| **Columns** | Tel, **Learning** (`learningInterest` label), **Next Step** (`nextStepPreference` label), `—` when unset |
| **Search** | Name, email, `contactNumber` only (`filterAdminMembers`) |
| **Filters** | Role; learning interest (ALL / Not set / slug); next step (ALL / Not set / slug) |
| **CSV export** | Client-side **Export acquisition CSV** on filtered rows (`buildAcquisitionMembersCsv`) |
| **Labels** | `acquisition/admin-labels.ts` + `acquisition-messages` keys |
| **Safeguards** | No self-delete, no self-demotion, keep ≥1 admin (`admin-user-validation.ts`) |

Does **not** expose PPA, unrevealed scores, or gameplay internals — acquisition profile fields only.

##### Key server actions (`admin-actions.ts`)

All require `requireAdminSession()` (`admin-auth.ts`). Wrapped with `finishAdminMutation` → `AdminActionResult`.

| Category | Actions |
|----------|---------|
| **Runtime / cycle** | `updateMarketPulseRuntimeStatusAction`, `setActiveMarketPulseCycleAction`, `createMarketPulseCycleAction`, `quickCreateMarketPulseCycleAction`, `updateMarketPulseCycleAction`, `closeMarketPulseCycleAction`, `revealMarketPulseCycleAction` |
| **Cards** | `createMarketPulseCardAction`, `quickCreateMarketPulseCardDraftAction`, `quickCreateMarketPulseRestCardDraftAction`, `duplicateMarketPulseCardAction`, `updateMarketPulseCardAction`, `updateMarketPulseCardDraftAction`, `reorderMarketPulseCardAction`, `fillMissingCardSourceDatesAction` |
| **Publish** | `publishMarketPulseCardAction`, `unpublishMarketPulseCardAction`, `bulkPublishMarketPulseCardsAction`, `bulkPublishAllReadyMarketPulseCardsAction`, `bulkUnpublishMarketPulseCardsAction` |
| **PPA** | `lockMarketPulseCardPpaAction` |
| **Prizes / export** | `exportMarketPulseLeaderboardAction`, `createMarketPulsePrizeClaimAction`, `createAllMarketPulsePrizeClaimsAction`, `updateMarketPulsePrizeClaimStatusAction` |

**Data loaders:**

| Function | File |
|----------|------|
| `getAdminOverviewData` | `admin-overview-data.ts` |
| `getMarketPulseAdminDashboardData` | `admin-data.ts` |
| `getMarketPulseCycleBuilderData` | `admin-builder-data.ts` |
| `getMarketPulseRevealSectionData` | `admin-reveal-data.ts` |
| `getMarketPulsePrizeReviewData` | `prize-review-data.ts` |
| `loadAdminMembers` | `members-data.ts` |

**Revalidation after mutations:** `revalidateAdminPaths()` touches `/admin/market-pulse`, `/market-pulse`, `/market-pulse/play`, `/market-pulse/leaderboard`, `/market-pulse/reveal`.

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

#### Guided cycle creation (PR 5)

**Route:** `/admin/market-pulse/guided-cycle/new`  
**Action:** `createGuidedMarketPulseCycleAction()`  
**Logic:** `src/lib/market-pulse/guided-cycle.ts`, `hkt-time.ts` (date-only HKT helpers)

Admin enters **HKT calendar dates only** (no datetimes). Stored instants:

| Field | HKT wall clock | Example (`2026-08-01` start) |
|-------|----------------|------------------------------|
| `startsAt` | 09:00 on start date | `2026-08-01T01:00:00.000Z` |
| `endsAt` | 21:00 on end date | `2026-08-10T13:00:00.000Z` |
| `revealAt` | 09:00 on reveal date | `2026-08-11T01:00:00.000Z` |

**Validation:** `endDate >= startDate`; **`revealDate > endDate`** (strict — reveal at 09:00 HKT must fall after cycle end at 21:00 HKT on the end date).

**Day plan:** inclusive start→end HKT days. Each **signal day** creates N `SIGNAL` `DRAFT` cards; each **rest day** creates exactly one `REST` `DRAFT` card (no PPA fields). Auto-sets `dayIndex`, `sortOrder`, `sourceDate` (`getCycleDayReleaseAt`).

**Does not:** pin active cycle, set runtime `OPEN`, publish cards, or set cycle `OPEN`. Success screen links to the existing builder for this cycle.

**Tests:** `guided-cycle.test.ts`, `admin-guided-cycle.test.ts`, `hkt-time.test.ts` (date-only conversions).

#### Guided card editor (PR 6)

**Route:** `/admin/market-pulse/cycles/[cycleId]/guided-cards`  
**Data:** `getGuidedCycleCardsPageData(cycleId)`  
**Actions:** `updateGuidedMarketPulseCardAction`, `approveGuidedMarketPulseCardPpaAction`

Simplified checklist + editor for filling guided draft templates:

| Concern | Guided behavior |
|---------|-----------------|
| **Save card** | Content fields only; keeps existing `status` (does not publish); **blocks save on `PUBLISHED` cards** with message to use advanced builder |
| **Approve PPA** | SIGNAL only; requires `ppaSignal` + `ppaInsight` only (not full article copy); sets/refreshes `ppaSignalLockedAt`; supports re-approval without change reason |
| **REST cards** | Title (`headline`) + body (`newsBody`); `summary` auto-filled from body on save |
| **Status** | `Published` / `Missing content` / `Missing PPA` / `Ready` via `guided-card-status.ts` |
| **Display price** | Optional `priceLabel` field in SIGNAL editor |

Advanced builder unchanged for publish, scheduling, locked-PPA edits with change reason, and published-card edits.

**Tests:** `guided-card-status.test.ts`, `guided-card-validation.test.ts`, `admin-guided-card-actions.test.ts`, `guided-cycle-cards-page-data.test.ts`, `guided-card-field-readiness.test.ts`.

#### Guided card readiness guidance (PR 10)

The guided card editor shows a **Readiness** panel and optional inline field hints based on `getGuidedCardFieldReadiness` in `guided-card-field-readiness.ts`. This is **UI guidance only** — it does not change gameplay, launch gating, or server validation.

| Concern | Behavior |
|---------|----------|
| **Source of truth** | `getGuidedCardStatus`, `validateGuidedCardSave`, `validateGuidedPpaApprove`, and guided server actions remain authoritative |
| **Basis** | Readiness is computed from the **saved card** prop; the panel updates after a successful save refreshes parent state |
| **Content fields** | Reuses `collectGuidedSignalMissingContentFields` / `collectGuidedRestMissingContentFields` (same rules as PR 6 status) |
| **Save-only fields** | Day index and image alt (when URL set) come from `collectGuidedSaveBlockingFields` — shown as “required before saving”, not launch blockers |
| **PPA fields** | SIGNAL only; maps `getMissingPpaFields` for launch readiness; approve action still requires only decision + insight |
| **Published cards** | Status `published` only; no missing-field lists; advanced-builder notice |

#### Guided review & launch (PR 7)

**Route:** `/admin/market-pulse/cycles/[cycleId]/guided-launch`  
**Data:** `getGuidedCycleLaunchPageData(cycleId)`  
**Action:** `launchGuidedMarketPulseCycleAction(cycleId)`

Admin can **view** the launch page for any existing cycle. The **launch action** is allowed only when cycle status is **`DRAFT`** or **`OPEN`**. **`CLOSED`**, **`REVEALED`**, and **`ARCHIVED`** cycles show a disabled launch area with eligibility reasons; hub “Review & launch” links appear only for **`DRAFT`** / **`OPEN`**.

There is **no `SCHEDULED` cycle status** in the schema. Guided launch sets launched cycles to **`OPEN`**.

| Concern | Guided behavior |
|---------|-----------------|
| **Readiness** | Card/content/PPA requirements (`evaluateGuidedLaunchReadiness`) |
| **Eligibility** | Cycle status gate (`evaluateGuidedLaunchEligibility`) |
| **Launch sequence** | Publish ready cards → cycle `OPEN` → `activeCycleId` → runtime `OPEN` (mirrors manual builder go-live) |
| **Publish** | Uses `getCardPublishBlockReason` + `deriveCardPublishedAtFromSchedule`; preserves existing `publishedAt` |
| **Idempotency** | Success when all cards published + cycle `OPEN` + active pin + runtime `OPEN`; partial OPEN cycles publish remaining ready cards |
| **Audit** | Reuses `PUBLISH`, `STATUS_CHANGE`, `SET_ACTIVE` with reason text noting guided launch |

**Tests:** `guided-launch-readiness.test.ts`, `guided-launch-publish.test.ts`, `guided-cycle-launch-page-data.test.ts`, `admin-guided-launch-action.test.ts`, `guided-launch-preview.test.ts`.

#### Guided launch preview and confirmation (PR 11)

The guided launch page shows a **Launch preview** section and confirmation dialog based on `getGuidedLaunchPreview` in `guided-launch-preview.ts`. This is **UI guidance only** — it does not change launch transaction behavior.

| Concern | Behavior |
|---------|----------|
| **Source of truth** | `launchGuidedMarketPulseCycleAction` re-validates eligibility and readiness inside its transaction |
| **Preview helper** | Reuses `evaluateGuidedLaunchEligibility`, `evaluateGuidedLaunchReadiness`, and `getGuidedCardStatus` |
| **Launch allowed** | `preview.launchAllowed` = eligibility.eligible && readiness.ready; client also blocks when `alreadyLaunched` |
| **PPA privacy** | Preview rows expose `isPpaApproved` boolean only — never `ppaSignal`, `ppaInsight`, or `ppaSignalLockedAt` |
| **Counts** | `readyCount` uses guided status `ready`; `publishedCount` is separate |
| **Confirmation** | `AdminConfirmDialog` summarizes cycle and card counts before calling the launch action |

#### Guided lifecycle regression coverage (PR 12)

End-to-end guided workflow invariants are covered by **`guided-lifecycle-regression.test.ts`** using mocked Prisma and real guided server actions/helpers (Vitest only — no Playwright or component render tests).

| Protected invariant | Coverage |
|---------------------|----------|
| **Create does not launch** | Happy path asserts `runtimeStatus` / `activeCycleId` unchanged after `createGuidedMarketPulseCycleAction` |
| **Save / PPA are separate** | Lifecycle saves SIGNAL + REST content, then approves SIGNAL PPA before launch |
| **Preview is advisory** | `getGuidedLaunchPreview` reports `launchAllowed` before launch; launch action re-validates |
| **Launch is authoritative** | `launchGuidedMarketPulseCycleAction` sets cycle `OPEN`, pins active cycle, runtime `OPEN`, publishes cards |
| **PPA-safe runtime output** | Post-launch SIGNAL card through `sanitizeMarketPulseApiCardPayload` / `toMarketPulseSwipeCardData` omits PPA fields |
| **Blocking paths** | Incomplete SIGNAL content, missing PPA, incomplete REST, published + ready mix, failed launch, idempotent relaunch |
| **Workflow milestones** | Hub next-action transitions (`fill_guided_cards` → `review_and_launch` → `launched`), dashboard/hub progress counts, idempotent relaunch emits no audit rows |

**Related tests:** `admin-guided-cycle.test.ts`, `admin-guided-card-actions.test.ts`, `admin-guided-launch-action.test.ts`, `guided-launch-readiness.test.ts`, `guided-launch-preview.test.ts`, `guided-flow-safety.test.ts`, `guided-launch-audit-reason.test.ts`, `guided-card-dashboard.test.ts`, `guided-hub-progress.test.ts`, `guided-workflow-privacy-regression.test.ts`.

#### Guided post-launch state and audit clarity (PR 13)

Post-launch UI on the guided launch page is **informational only**. `launchGuidedMarketPulseCycleAction` remains **authoritative and idempotent**.

| Concern | Behavior |
|---------|----------|
| **Post-launch panel** | When `alreadyLaunched`, shows cycle/runtime/active-pin/published counts and next-action links (play, admin hub, builder) — no launch button or blocking reasons |
| **Launch success message** | Client uses `data.publishedCount` with copy noting server re-checked readiness; then `router.refresh()` |
| **Audit rows** | Unchanged volume/shape: per-card `PUBLISH`, optional cycle `STATUS_CHANGE`, optional `SET_ACTIVE` |
| **Audit reason** | `formatGuidedLaunchAuditReason` enriches existing `reason` with PPA-free operational fields (`cycleId`, `publishedCount`, `runtimeStatus`, `activeCycleId`) |
| **Audit safety** | Must not include PPA fields, article body, or full card payloads |
| **Hub** | Launched cycles use `kind: launched` (muted); no primary “launch now” CTA |

#### Guided card dashboard and filters (PR 14)

The guided cards page shows a **Card completion dashboard** and client-side **filters** based on `getGuidedCardDashboard` in `guided-card-dashboard.ts`. This is **UI guidance only** — it does not change gameplay, launch, audit, hub, or editor semantics.

| Concern | Behavior |
|---------|----------|
| **Source of truth** | `getGuidedCardStatus`, `getGuidedCardFieldReadiness`, guided save/PPA actions, and `launchGuidedMarketPulseCycleAction` remain authoritative |
| **Dashboard helper** | Returns PPA-safe aggregates and per-card row metadata (`missingContentCount`, `missingPpaCount`, `saveBlockingCount`) — never full card payloads |
| **Next focus** | Priority: missing PPA SIGNAL → missing content → save-blocking → unpublished ready; in-page `setSelectedCardId` only (no URL hash) |
| **Filters** | Client-side over loaded cycle cards via `filterGuidedCycleCardDashboardRows`; hidden rows do not clear the selected editor |
| **PPA privacy** | Dashboard and list badges must not render `ppaSignal`, `ppaInsight`, `ppaSignalLockedAt`, article body, image URL, or image alt text |

**Related tests:** `guided-card-dashboard.test.ts`, `guided-card-field-readiness.test.ts`, `guided-cycle-cards-page-data.test.ts`.

#### Guided hub progress summary (PR 15)

The Market Pulse admin **cycles hub** shows a compact **Guided progress** block per DRAFT/OPEN cycle from `buildGuidedHubProgressSummary` in `guided-card-dashboard.ts`. This is **UI guidance only** — it does not change launch, audit, editor, or hub button semantics.

| Concern | Behavior |
|---------|----------|
| **Source of truth** | `getMarketPulseCycleNextAction` remains authoritative for hub CTAs |
| **Server derivation** | `enrichCycleRowsWithGuidedProgress` attaches `guidedProgress` when building `MarketPulseAdminDashboardData` |
| **Hub UI** | Renders only `cycle.guidedProgress` counts/reason — **not** computed from full card rows in the client |
| **PPA safety** | `guidedProgress` must not include card IDs, PPA fields, article body, image URL/alt, `cardRows`, `cardsByStatus`, or full card payloads |
| **Terminal cycles** | CLOSED / REVEALED / ARCHIVED → `guidedProgress: null` |

**Related tests:** `guided-hub-progress.test.ts`, `admin-cycle-next-action.test.ts`.

#### Guided workflow release checklist (PR 16)

**Status (13 Jul 2026):** Complete. Final QA for PRs 5–15 — regression tests, privacy sweeps, copy alignment, and docs only (no gameplay/scoring/reveal/runtime/public-route changes). Commits: guided implementation (PRs 5–15), then `test: harden guided market pulse workflow release coverage` (lifecycle + privacy regression, hub next-focus i18n, release checklist).

Final QA for the guided admin workflow (PR 5–15). **No product behavior changes** — regression tests, privacy sweeps, and docs only.

| Step | Verify |
|------|--------|
| 1. **Create guided cycle** | DRAFT cycle + SIGNAL/REST templates; no pin/publish/runtime |
| 2. **Fill SIGNAL and REST cards** | Guided cards page; content saved via guided save action |
| 3. **Approve SIGNAL PPA** | PPA decision + insight only (not full article copy) |
| 4. **Card dashboard** | `getGuidedCardDashboard` counts/filters match readiness; no PPA values in output |
| 5. **Hub progress + next action** | `cycle.guidedProgress` counts; `getMarketPulseCycleNextAction` CTA matches stage |
| 6. **Review launch preview** | `getGuidedLaunchPreview` advisory; no PPA/body/image in serialized preview |
| 7. **Launch** | `launchGuidedMarketPulseCycleAction` authoritative; publishes expected cards |
| 8. **Post-launch state** | `alreadyLaunched` / `isGuidedLaunchAlreadyComplete`; published === total |
| 9. **Idempotent relaunch** | Returns already-launched; no extra audit rows |
| 10. **Audit** | Existing row shape; `formatGuidedLaunchAuditReason` has no PPA/body/card payloads |
| 11. **Privacy** | Preview, dashboard, hub progress, audit reason exclude sensitive markers |
| 12. **Non-guided cycles** | CLOSED/REVEALED/ARCHIVED not guided-actionable; manual cycles use advanced builder |

**Related tests:** `guided-lifecycle-regression.test.ts`, `guided-workflow-privacy-regression.test.ts`, `guided-card-dashboard.test.ts`, `guided-hub-progress.test.ts`, `admin-cycle-next-action.test.ts`, `admin-guided-launch-action.test.ts`.

#### Guided next actions in cycle hub (PR 8)

**Module:** `src/lib/market-pulse/admin-cycle-next-action.ts`  
**UI:** `MarketPulseCyclesHub.tsx`

The cycles hub recommends a **next guided action** per cycle so admins do not need to interpret internal statuses. This is **UI guidance only** — server actions (`launchGuidedMarketPulseCycleAction`, guided card save/PPA) still enforce eligibility and readiness independently.

| `kind` | When | Primary CTA |
|--------|------|-------------|
| `fill_guided_cards` | DRAFT/OPEN with no cards, missing content, or missing PPA | Guided cards |
| `review_and_launch` | DRAFT/OPEN ready but not fully launched | Guided launch |
| `launched` | All cards published + cycle OPEN + active pin + runtime OPEN | Muted; **View launch status** → guided-launch (not public play) |
| `closed` / `revealed` / `archived` | Terminal cycle statuses | Muted; advanced builder secondary only |
| `advanced_builder` | `cards == null` (readiness unknown) | Builder |

Uses PR 7 helpers: `evaluateGuidedLaunchReadiness`, `isGuidedLaunchAlreadyComplete`, `canUseGuidedFlowForCycle` (DRAFT/OPEN only). No extra DB queries — groups existing dashboard `cards` by `cycleId`.

**Tests:** `admin-cycle-next-action.test.ts`.

#### Market Pulse guided-flow safety invariants (PR 9)

Hardening guarantees for the guided admin workflow (PR 5–8). **No gameplay, scoring, reveal scoring, runtime rules, or public player-route behavior changes.**

| Invariant | Enforcement |
|-----------|-------------|
| **PPA privacy** | `ppaSignal`, `ppaInsight`, and `ppaSignalLockedAt` are stripped from play/today API payloads (`stripPpaFromCardPayload`, `toMarketPulseSwipeCardData`, `sanitizeMarketPulseApiCardPayload`) even when the underlying card is revealed |
| **Post-reveal PPA** | `/market-pulse/reveal` and reveal API intentionally expose `ppaSignal` / `ppaInsight` for **SIGNAL** cards only after reveal (`getMarketPulseCardPublicPayload`); REST cards never receive PPA |
| **Hub recommendations** | `admin-cycle-next-action.ts` is **advisory UI only**; `launchGuidedMarketPulseCycleAction` re-reads eligibility/readiness server-side |
| **Admin auth** | All guided mutations require `requireAdminSession` and re-load records by ID server-side |
| **Published cards** | Guided save and guided PPA approve **do not mutate** `PUBLISHED` cards (`isGuidedCardSaveAllowed`) |
| **Guided launch** | Transactional; **DRAFT/OPEN only**; rolls back on readiness or publish-validation failure; idempotent when already fully launched |

**Tests:** `guided-flow-safety.test.ts`, `server-security.test.ts`.

#### Quick draft card defaults

**Action:** `quickCreateMarketPulseCardDraftAction(cycleId)`  
**Logic:** `src/lib/market-pulse/cycle-card-defaults.ts`, `admin-card-scheduling.ts`

| Field | Default |
|-------|---------|
| `status` | `DRAFT` |
| `headline` | `"Untitled signal"` |
| `companyName` | `"Untitled company"` |
| `ticker` | `"TBD"` |
| `dayIndex` | **Current cycle calendar day** (`getCurrentCycleDayIndex` from `startsAt` / `now`); before cycle start defaults to **1** |
| `sortOrder` | Next free slot on that day (`nextSortOrderForDay`) — **0 = first card that day**; repeated quick-add on the same day stacks Card 1, Card 2, … |
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

**Today's playable cards** (`findPlayableCardsForToday` in `playable-card.ts`) — used by `/market-pulse/play`, `/api/market-pulse/today`, and `submitMarketPulseDecision`:

1. Find the **active schedule day** with `findActiveScheduleDayIndex`: highest 1-based schedule day among `PUBLISHED` cards where `isCardReleasedForPlay` and `isCardWithinRevealWindow` pass at `now` (derived 9 AM HKT release + `publishedAt` deferral gate).
2. Include only cards on that schedule day (`scheduleDayIndexForCard(card.dayIndex) === activeDay`).
3. Require `status === PUBLISHED`, `isCardReleasedForPlay`, and `isCardWithinRevealWindow` per card.
4. Sort by `dayIndex → sortOrder → createdAt`.
5. **Seamless windows:** the active card batch stays playable from its `availableAt` (`getCardAvailableAt` / `getEffectiveCardReleaseAt`) until the **next** planned card day's release — including overnight before the next 9 AM HKT drop. Example: Day 10 card at 22:00 HKT Jul 10 stays active; at 08:59 HKT Jul 11 still Day 10; at 09:00 HKT Jul 11 switches to Day 11.
6. **No future cards:** a card is never playable before its `availableAt`.
7. **No stale cards:** `isCardWithinActivePlayWindow` + submit validation reject cards after the next day's release (`getCardActiveWindowEnd`).
8. `findPlayableCardForToday()` returns the first card in the active batch only.

**Manual QA (Jul 2026 cycle start `2026-07-01 00:00 HKT`):**

| Time (HKT) | Expected `/market-pulse/play` |
|------------|-------------------------------|
| 2026-07-01 09:05 | Day 1 card |
| 2026-07-01 22:00 | Day 1 card (still active overnight) |
| 2026-07-02 08:59 | Day 1 card — Day 2 must **not** appear yet |
| 2026-07-02 09:00 | Day 2 card — Day 1 must **not** appear even if unplayed |

Admin builder **does not** expose manual card open/reveal datetime fields in the normal workflow; legacy `publishedAt` on existing rows is still respected.

#### Admin cycle dates (Starts / Ends / Reveal)

Cycle create/edit forms (`MarketPulseCycleForm` on `/admin/market-pulse` and the cycle builder) treat all **Starts**, **Ends**, and **Reveal** datetime-local values as **Hong Kong wall-clock time (UTC+8, no DST)** — not browser local time and not Vercel server UTC.

| Module | Role |
|--------|------|
| `hkt-time.ts` | `parseHktDatetimeLocal`, `toHktDatetimeLocalValue` — TZ-independent parse/format |
| `cycle-validation.ts` | `parseCycleDate`, `toDatetimeLocalValue` — thin wrappers used by form + server actions |
| `admin-actions.ts` | `updateMarketPulseCycleAction` / `createMarketPulseCycleAction` persist parsed UTC instants |
| `MarketPulseCycleForm.tsx` | Helper text “All times are Hong Kong (HKT, UTC+8)”; resyncs on prop change; awaits `router.refresh()` after save |

**Example:** admin enters `2026-07-01T00:00` → stored as `2026-06-30T16:00:00.000Z` (= 1 Jul 2026 00:00 HKT).

**After save:** `updateMarketPulseCycleAction` revalidates `/admin/market-pulse` and the cycle builder path; the form uses a `key` tied to saved timestamps so reopened edits show fresh values.

**Common pitfall (pre-fix):** datetime-local strings were parsed with `new Date(value)` on the server (UTC on Vercel) while the admin UI displayed browser-local time — cycle saves could appear to revert or not stick. Fixed in `66b3855`.

**Multiple cards per day:** Players can play all published cards for today's cycle day (`findPlayableCardsForToday`). Order: `dayIndex → sortOrder → createdAt`. Submitting one card does not lock the rest. Scoring, reveal, and leaderboard breakdowns use the same sort order.

#### Builder card list — day labels vs form fields

The cycle builder table **Day** column (`MarketPulseCycleBuilder.tsx`) shows labels from saved database fields only:

| UI label | Source | Example |
|----------|--------|---------|
| `Day {N}` | `MarketPulseCard.dayIndex` (1-based cycle day) | Form **天數 / Day number** `5` → list **Day 5** |
| `Card {M}` | `sortOrder + 1` (display is 1-based; storage is 0-based) | Form **當日順序 / Order within day** `0` → list **Card 1** |

**Formatter:** `formatBuilderDayCardLabel(dayIndex, sortOrder)` in `admin-card-scheduling.ts` → ``Day ${dayIndex} — Card ${sortOrder + 1}``.

**Common admin confusion (not a DB bug):** The side editor can show **Day 5 / order 0** while the table still reads **Day 1 — Card 4** when:

1. **Changes are unsaved** — the table reflects committed rows; the form holds local state until **Save draft**.
2. **Quick-add stacked cards on one day** — `suggestQuickDraftSlot()` assigns the current cycle day and the next `sortOrder` on that day, so multiple **Add card draft** / **Add rest card draft** clicks often produce **Day 1 — Card 1 … Card 4** until you change **天數** and save.

**Saving scheduling in the builder:**

| Action | Server handler | Notes |
|--------|----------------|-------|
| **Save draft** (and save-and-add/duplicate intents) | `updateMarketPulseCardDraftAction` | Persists `dayIndex` + `sortOrder`; forces `status: DRAFT` and clears `publishedAt` |
| **Publish** | `publishMarketPulseCardAction` | Does not apply unsaved form fields — save first |

After a successful save, `router.refresh()` reloads builder data; the **Day** column should match the form. Unique constraint: `@@unique([cycleId, dayIndex, sortOrder])` — duplicate day + order on the same cycle returns a validation error.

**Player-facing labels** use `formatMarketPulseCardDayLabel` in `card-play-order.ts` (may omit “Card N” when only one card exists on that day). Admin builder always shows both day and card number when multiple cards share a day.

**Known gap:** Published cards have no separate “save without unpublishing” path in the builder — scheduling edits require **Save draft** (which unpublishes) or editing before first publish. See [§16](#16-known-inconsistencies).

#### Market rest cards (`REST`)

Some cycle days publish a **Market rest card** instead of a signal card. Rest cards are **participation-only**, **PPA-free**, and **prediction-free**.

| Concern | Behavior |
|---------|----------|
| **Schema** | `MarketPulseCard.cardType`: `SIGNAL` (default) \| `REST`; decisions use `MarketPulseSignal.ACKNOWLEDGED` |
| **Player UI** | `MarketPulseRestCard.tsx` — “Claim participation”; no Bullish/Cautious; `MarketPulsePlayExperience` routes by card type |
| **Validation** | `card-type.ts` — `validatePlayerDecisionForCard()` rejects `BULLISH`/`CAUTIOUS` on REST; rejects `ACKNOWLEDGED` on SIGNAL |
| **Scoring** | `buildScoreEventsForUser()` — REST + `ACKNOWLEDGED`: +10 participation only; no match or streak bonus |
| **Streak logic** | `isStreakNeutralScoreEntry()` skips REST; `computeSignalMatchStreak()` walks play order — REST does not increment, reset, or break the signal-match streak; +100 every 3 consecutive correct SIGNAL matches |
| **Reveal / leaderboard** | REST rows in per-card breakdown: `isRestCard: true`, `ppaSignal: null`, participation points only |
| **Admin** | Card type in builder/form; quick-create rest draft; cycle stats (signal/rest counts); type filters; `today-card-issue` and `ppa-urgent` alerts **ignore** REST cards |
| **API** | `/api/market-pulse/today` includes `cardType`; `/decision` accepts `ACKNOWLEDGED` for REST only; PPA stripped from REST payloads |

**Key modules:** `card-type.ts`, `score-calculation.ts`, `player-handlers.ts`, `leaderboard-score-breakdown.ts`, `reveal-data.ts`, `admin-mp-status.ts`, `admin-player-visibility-readiness.ts`.

**Tests:** `card-type.test.ts`, `play-rest-card.test.ts`, `player-handlers.test.ts`, `score-calculation.test.ts` (REST-neutral streak scenarios), `leaderboard-score-breakdown.test.ts`.

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
| Cycle admin datetimes | `cycle-validation.test.ts`, `first-cycle-admin-guidance.test.ts` |
| Multi-card play | `play-data-multi-card.test.ts`, `playable-card.test.ts` |
| Active-window playability | `today-only-playability.test.ts`, `playable-card.test.ts`, `server-core.test.ts` |
| Market rest cards | `card-type.test.ts`, `play-rest-card.test.ts`, `player-handlers.test.ts`, `score-calculation.test.ts` |
| Card localization | `card-localization.test.ts` |
| Play order / reveal labels | `card-play-order.test.ts`, `leaderboard-score-breakdown.test.ts` |
| Readiness | `admin-cycle-readiness.test.ts` |
| Bulk publish/unpublish | `admin-bulk-card-actions.test.ts`, `admin-bulk-card-actions.server.test.ts` |
| PPA / public privacy | `server-security.test.ts`, `admin-card-preview.test.ts` |
| Non-admin rejection | `admin-builder-data.test.ts`, `admin-duplicate-card.test.ts`, `admin-quick-create-cycle.test.ts` |

**Last CI:** lint pass (0 errors), typecheck pass, **694 tests** (95 files), build pass.

### Making Market Pulse visible to players (go-live)

Cards can look correct in admin but still be **hidden** on `/market-pulse/play` if any gate fails:

| Gate | Admin control | Player symptom if wrong |
|------|---------------|-------------------------|
| Runtime `OPEN` | Runtime status → Save | Cannot submit decisions |
| Cycle `OPEN` + **active** | Create/edit cycle, check “Set as active cycle” | “No active challenge…” |
| **Date window** | `startsAt ≤ now ≤ revealAt` | “No active challenge…” or “not open right now” (expired demo cycles) |
| Card **PUBLISHED** | **Publish** button (not just status dropdown) | “Today’s card is coming soon…” |
| **Release time** | Automatic — 9:00 AM HKT per cycle day (`card-release-schedule.ts`) | Card not live before 9 AM HKT on its day; prior day's card stays active overnight until the next release |
| Legacy **`publishedAt`** | Optional; set only for manual deferral on legacy rows | Future `publishedAt` blocks even after derived release |
| Active card batch | `findActiveScheduleDayIndex` in `playable-card.ts` | Wrong or missing card; overnight gap before next 9 AM HKT release |
| **Multiple cards / day** | Add another card on same day in builder (distinct `sortOrder`) | Player sees “Card X of Y”; must play all today's cards |

**Not a player gate:** PPA signal/insight/lock. Players can submit and lock decisions on published cards even when PPA is incomplete. PPA remains hidden until reveal (`reveal-access.ts`).

**Admin publish gate (separate):** `validateCardPublishable` in `card-validation.ts` still requires PPA signal, insight, and lock before **Publish** — this controls getting a card live, not whether an already-published card accepts decisions.

**Reveal/scoring gate:** All **published** cards must have `ppaSignal`, `ppaInsight`, and `ppaSignalLockedAt` before admin reveal (`reveal-ppa-validation.ts`, `admin-reveal-status.ts`). Missing PPA blocks reveal, not play.

**Admin PPA warning:** When `revealAt` is within **72 hours** (`PPA_REVEAL_WARNING_HOURS`), `/admin/market-pulse` shows an urgent banner and per-card emphasis for published cards missing locked PPA (`admin-ppa-reveal-warning.ts`, `MarketPulseCardPanel`).

**Common pitfall:** Demo seed cycle `[DEMO] Market Pulse Local Seed` uses **2025** dates — after `revealAt` passes, admin still shows “Active” but players see no challenge. Edit cycle dates to the current window or create a new 2026 cycle. Cycle times in the edit form are **HKT** — e.g. 1 Jul 2026 00:00 HKT is `2026-07-01T00:00` in the picker, not UTC.

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
   - [Admin dashboards (ops reference)](#admin-dashboards-ops-reference)
   - [Admin operations manual](#admin-operations-manual--cycles-cards-and-go-live)
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
│   │   ├── home/               ← Hero, Simulator, Pipeline, PulseBoard, Rewards, events, philosophy
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
| `npm test` | Vitest unit tests (`vitest run`) — **610 tests** (87 files) |
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
| `EMAIL_SERVER` | Auth magic link + product email | Nodemailer SMTP URL (e.g. Zoho `smtp://user:pass@host:587`) |
| `EMAIL_FROM` | Auth magic link + product email | From address; display name OK (`Profit Pulse Ally <priskenlo@profitpulseally.com>`) |
| `EMAIL_REPLY_TO` | Product email (optional) | Default Reply-To (e.g. `priskenlo@profitpulseally.com`) |
| `KV_REST_API_URL` | Game settings (Market Pulse) | `@vercel/kv` |
| `KV_REST_API_TOKEN` | Game settings (Market Pulse) | `@vercel/kv` |

`.env.local` is gitignored. **Never commit secrets.**

Nodemailer Auth.js provider is **omitted** when `EMAIL_SERVER` / `EMAIL_FROM` are unset — allows local build without SMTP. Product mail (`src/lib/email/email-sender.ts`) returns `{ ok: false, skipped: true }` in the same case and never throws during import/build.

**Product email (Zoho):** `sendProductEmail()` — server-only; shares SMTP credentials with Auth.js magic link; logs errors without message bodies. Preference + delivery models: `UserNotificationPreference`, `EmailDeliveryLog` (no notification campaigns wired yet).

---

## 6. Database & Prisma

**Schema:** `prisma/schema.prisma` — uses `env("POSTGRES_URL")`  
**Client:** `src/lib/prisma.ts` (singleton)

There are **no committed migration files** (`prisma/migrations/`). Schema is synced via:

- **Vercel build:** `prisma db push` runs automatically before `next build`
- **Local dev:** `npm run db:push` or `npm run db:migrate` after schema changes

**Revamp schema additions** (`MarketPulseCard`): `newsBody`, `logoInitials`, `cardImageUrl`, `cardImageAlt`, `userPrompt` — nullable; `cardType` (`SIGNAL` \| `REST`, default `SIGNAL`); `MarketPulseSignal.ACKNOWLEDGED` for rest-card decisions — **`db push` required** on deploy if not already applied.

**First migration (when ready):**

```bash
npx prisma migrate dev --name init
```

Then change `package.json` build to `prisma migrate deploy && next build` and baseline production if tables already exist from `db push`.

### Models

| Model | Purpose |
|-------|---------|
| `User` | Members — `email`, `name`, `image`, `contactNumber?`, `password?`, `role` (`USER` \| `ADMIN`); optional `acquisitionProfile` |
| `UserAcquisitionProfile` | Progressive profiling — `learningInterest` (+ capture/dismiss timestamps); `nextStepPreference` (+ capture/dismiss timestamps) |
| `MarketPulseCycle` | Challenge window — `startsAt`, `endsAt`, `revealAt`, `status`, `prizeLabel` |
| `MarketPulseCard` | Daily card — `cardType` (`SIGNAL` \| `REST`), headline, ticker, `newsBody`, `cardImageUrl`/`cardImageAlt`, `logoInitials`, `userPrompt`, `ppaSignal` (SIGNAL only; admin-only until reveal), `status` |
| `MarketPulseDecision` | User decision per card — `BULLISH` / `CAUTIOUS` on signal cards; `ACKNOWLEDGED` on rest cards (`@@unique([userId, cardId])`) |
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
**Middleware:** `src/middleware.ts` — invalid-session sign-out only (no phone gate)  
**Actions:** `src/lib/auth-actions.ts` — `signUpWithPassword`, `updateContactNumber`, `signOutAction`  
**Route:** `src/app/api/auth/[...nextauth]/route.ts`  
**Session:** **JWT** strategy; `jwt` callback sets `id`, `role`, `needsOnboarding` (always `false` for valid users); `session` callback exposes them to the client

### Why two auth config files?

Vercel Edge middleware has a **1 MB bundle limit**. Importing `@/auth` in middleware pulled in Prisma, bcrypt, and all providers (~1.08 MB). `auth.config.ts` holds only session/JWT passthrough callbacks; middleware imports that instead.

### Providers

| Provider | Purpose |
|----------|---------|
| **Google OAuth** | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` |
| **Credentials** | Email + password (`bcrypt.compare` against `User.password`) |
| **Nodemailer** | Magic link when `EMAIL_SERVER` + `EMAIL_FROM` set |
| **Product email** | `sendProductEmail` in `src/lib/email/email-sender.ts` — same SMTP env; default `EMAIL_REPLY_TO` |

### Sign-up & onboarding

- **Create Account** tab on `/login` → `signUpWithPassword()` hashes password with bcrypt; `contactNumber` optional at sign-up
- **Google OAuth:** account saved via Prisma adapter; **no forced onboarding** for missing `contactNumber`
- **Market Pulse play:** logged-in users can access `/market-pulse/play` and submit decisions without a phone number
- **Optional enrichment:** `/auth/onboarding` (voluntary) and `/profile` (`ProfileContactNumberCard`)
- **Session hydration:** root `layout.tsx` passes server `auth()` session into `AuthSessionProvider`
- **Onboarding submit / skip:** `updateContactNumber()` or skip → **`GET /api/auth/complete-onboarding`** — re-encodes JWT and redirects (no phone required to skip)
- **Recovery UI:** `OnboardingRecoveryPanel`, `loading.tsx`, `error.tsx` on `/auth/onboarding`

### Acquisition — progressive profiling

**Player journey:**

```txt
Play → submit decision → learning-interest prompt (once, PR 2)
→ cycle ends → admin reveal/scoring
→ visit /market-pulse/reveal → personal review + PPA learning
→ next-step preference prompt (once, PR 3)
```

#### Learning interest prompt (PR 2 — play)

- **When:** after a logged-in user submits their **first** `MarketPulseDecision`, `/market-pulse/play` may show a one-time optional prompt below the locked/submitted card — *“What would you like to understand better?”*
- **Eligibility:** `shouldShowLearningInterestPrompt(userId)` — requires `MarketPulseDecision.count >= 1` and no `learningInterestCapturedAt` / `learningInterestPromptDismissedAt` on `UserAcquisitionProfile`
- **Actions:** `saveLearningInterestAction()`, `dismissLearningInterestPromptAction()`
- **Play wiring:** `getMarketPulsePlayPageData()` → `acquisition.showLearningInterestPrompt`; UI in `LearningInterestPrompt.tsx` inside `MarketPulsePlayExperience` when `locked` or just-submitted session
- **Options:** `market_outlook`, `long_term_investing`, `risk_management`, `retirement_planning`, `insurance_protection`, `business_owner_planning`, `just_challenge` — validated in `src/lib/acquisition/constants.ts`

#### Next-step preference prompt (PR 3 — reveal)

- **When:** on `/market-pulse/reveal`, after a logged-in user views **personal revealed results** (cycle review + PPA), a one-time optional prompt appears below the review — *“What would you like next from PPA?”*
- **Eligibility:** `shouldShowNextStepPreferencePrompt(userId)` — no `nextStepCapturedAt` / `nextStepPromptDismissedAt`; reveal loader only sets the flag when `status === "revealed"`, user is authenticated, and personal `results` are loaded (post `getMarketPulseRevealForUser().isRevealed`)
- **Never shown:** guests; `pending` / locked reveal ceremony; before personal results are available
- **Actions:** `saveNextStepPreferenceAction()`, `dismissNextStepPreferencePromptAction()`
- **Reveal wiring:** `getMarketPulseRevealPageData()` → `acquisition.showNextStepPreferencePrompt`; UI in `NextStepPreferencePrompt.tsx` inside `AuthenticatedRevealResults` after `CycleReviewSection` (only when `results.cards.length > 0`)
- **Options:** `next_challenge`, `market_recap`, `attend_event`, `clarity_call`, `just_browsing`
- **Post-selection CTAs (no phone on this surface):**
  - `next_challenge` → `/market-pulse/play` when `playNextAvailable`, else `/market-pulse`
  - `market_recap` → save + confirmation only
  - `attend_event` → `/events`
  - `clarity_call` → `/contact?intent=clarity-call`
  - `just_browsing` → save + close confirmation

#### Shared rules

- **Guests:** never prompted on play or reveal surfaces
- **One-time:** answer **or** skip → never show again for that prompt
- **No phone** collected on acquisition prompts (optional phone remains on profile/onboarding only)
- **Module:** `src/lib/acquisition/` — `constants.ts`, `profile.ts`, `actions.ts`, `prompts.ts`, `admin-labels.ts`
- **i18n:** `acquisition-messages.ts` + `acquisition-messages.zh-Hant.ts`
- **Out of scope:** Market Pulse scoring/gameplay, PPA privacy (`reveal-access.ts` unchanged), leaderboard privacy, launch gating, admin permissions, `/fortify-survey`

#### Admin visibility (PR 4)

- **Where:** `/admin` → User management (`AdminMembersTable`)
- **Columns:** Tel (existing), **Learning** (`learningInterest` label), **Next Step** (`nextStepPreference` label); `—` when absent
- **Filters:** learning interest + next step (`ALL` / Not set / each slug) via `user-member-filter.ts`; search still name/email/tel only
- **Loader:** `loadAdminMembers()` joins `User.acquisitionProfile` only — no PPA, scores, or gameplay internals
- **Export:** `buildAcquisitionMembersCsv()` in `members-csv.ts` (client-safe)
- **Permissions:** unchanged — `ADMIN` only via `admin/page.tsx` redirect

### Bilingual (i18n)

| Piece | Location |
|-------|----------|
| Locales | `en`, `zh-Hant` — cookie `ppa_locale` (`src/lib/i18n/locales.ts`) |
| Server copy | `getServerTranslations()`, `getServerSiteLocale()` |
| Client copy | `LocaleProvider`, `useTranslations()` |
| Switcher | `LanguageSwitcher` — header, mobile nav, play header, login, onboarding |
| Message files | `src/lib/i18n/messages/en.ts`, `zh-Hant.ts`, `market-pulse-messages.ts`, `auth-app-messages.ts`, `acquisition-messages.ts` |
| MP errors | `src/lib/i18n/market-pulse-ui.ts` maps server strings to keys |

Event **detail** pages and admin MP operational UI remain largely static bilingual or English.

### Pages

| Route | Protection | Behavior |
|-------|------------|----------|
| `/login` | Public | Tabbed Sign In / Create Account; Google + magic link; MP-aware copy via `MarketPulseAuthPanel` when returning to `/market-pulse/*`; **i18n** |
| `/auth/onboarding` | Logged-in | Contact form; recovery buttons; OAuth grace period |
| `/profile` | Logged-in | Profile Details + Market Pulse History; sign out |
| `/admin` | `role === ADMIN` | **Command center** — overview + user management (Tel, Learning, Next Step, acquisition CSV); non-admin → `/` |
| `/admin/market-pulse` | `role === ADMIN` | **Market Pulse ops** — cycles hub, builder, runtime, reveal/scoring; see [Admin operations manual](#admin-operations-manual--cycles-cards-and-go-live) |

**Full-page routes (no header/footer):** `/fortify-survey`, `/login`, `/admin`, `/auth/onboarding`

**Immersive routes (no site chrome — product UI only):** `/market-pulse/play` — back link to hub in play header; leaderboard/disclaimer in collapsible `<details>` on mobile.

### Mobile UX & player journey polish (Jun 2026)

Responsive and accessibility improvements across public routes and the Market Pulse player journey. **No changes** to Prisma schema, scoring formulas, reveal gating, launch gating, PPA privacy, or auth logic.

| Area | Key files | Notes |
|------|-----------|--------|
| **Route chrome** | `src/lib/layout/route-chrome.ts` | `FULL_PAGE_ROUTES`, `IMMERSIVE_ROUTES`, `isMarketPulseRoute()` |
| **Mobile nav** | `src/components/layout/MobileNav.tsx` | Drawer portaled to `document.body`; elevated header z-index on Market Pulse routes (see §9) |
| **Shell** | `LayoutShell.tsx`, `globals.css`, `layout.tsx` | Safe-area insets; `overflow-x-clip`; sticky leaderboard offset under header |
| **Homepage journey** | `MarketPulseHero`, `HomeMarketPulseSimulator`, `MarketPulsePipelineSection`, `HomePulseBoardWidget`, `HomeRewardsShowcase`, `homepage-pulse-preview.ts` | Simulator is demo-only (no API); Pulse Board respects reveal privacy; zh-Hant text wrapping |
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

Premium dark terminal layout (`bg-mp-obsidian`, `overflow-x-hidden`). Composes seven sections in order — **no blog preview** on homepage. Shared visual primitives: `MarketPulseVisualPrimitives.tsx` (glow background, status/proof chips) + `visual-primitives.ts` (terminal panels, pulse tokens, focus rings).

| # | Component | Purpose | Primary CTAs |
|---|-----------|---------|--------------|
| 1 | `MarketPulseHero` | Brand logo, pre-launch/live status chip, headline, proof chips, launch-aware primary CTA; mounts **`HomeMarketPulseSimulator`** | Pre-launch → hub; post-launch → play; secondary → leaderboard |
| 2 | `MarketPulsePipelineSection` | 4-step game flow (Signal → Lock In → Reveal → Reward); scoring chips (+10/+50/+100 copy); Ocean Park prize note | Text links → leaderboard, contest rules |
| 3 | `HomePulseBoardWidget` | Mini leaderboard preview — **privacy-safe** via `getHomePulseBoardPreview()` | → `/market-pulse/leaderboard` |
| 4 | `HomeRewardsShowcase` | Confirmed prize (Ocean Park ticket), events community, PPA post-reveal framing | → contest rules, events, rules |
| 5 | `LiveEventsHubSection` | Upcoming Sales & Marketing; past Fortify + placeholders (`home-events-hub.ts`) | → `/events/fortify-sales-marketing` |
| 6 | `PhilosophySection` | PPA philosophy; expert headshots | — |
| 7 | `FinalCtaSection` | Ready to Test Your Instincts? | **Become a Member** → `/login`; secondary → Market Pulse hub |

**Pulse Simulator (`HomeMarketPulseSimulator.tsx`):** Client-only demo. Clearly labeled **PULSE SIMULATOR** + Demo badge. Bullish/Cautious buttons update local `useState` only — **no `fetch`, no decision API, no DB writes**. Disclaimer copy states choices are not saved or scored. Link to real play is launch-aware (`/market-pulse` vs `/market-pulse/play`).

**Pulse Board privacy (`homepage-pulse-preview.ts`):**

| State | When | Data exposed |
|-------|------|--------------|
| **locked** | Active unrevealed cycle (`pendingActiveCycle`) | Cycle name + reveal time; placeholder rows — **no ranks, no scores**; does **not** call `getMarketPulseLeaderboard` |
| **revealed** | Cycle revealed | Top rows with `isRevealed: true` only; strips `userId`, email, phone, PPA fields |
| **sample** | No DB / no revealed rows | i18n sample player names (`Sample · Player A`, …); **no scores**; sample badge + note |

**Removed from homepage compose (deleted or legacy):** `MarketPulseHowItWorksSection.tsx`, `MarketPulseCycleLoopSection.tsx` (deleted); `MarketPulsePpaInsightSection.tsx`, `PlayLearnWinSection.tsx`, `HomeHeroSignalPreview.tsx` — **not imported** by `page.tsx`.

**i18n copy locations**

| Namespace | File(s) | Keys |
|-----------|---------|------|
| Hero + simulator | `src/lib/i18n/messages/en.ts`, `zh-Hant.ts` | `home.hero.*`, `home.hero.simulator.*` |
| Pipeline | same | `home.pipeline.*` |
| Pulse Board | same | `home.pulseBoard.*` |
| Rewards | same | `home.rewards.*` |
| Events showcase | same + `home-events-hub.ts` | `home.events.*` |
| Philosophy / final CTA | same | `home.philosophy.*`, `home.finalCta.*` |

**Analytics:** `MarketPulseTrackedLink` fires `hero_cta_clicked` (`analytics.ts` strips PPA/email).

**Market Pulse cycle epoch:** **1 Jul 2026 00:00 HKT** (`CHALLENGE_CYCLE_EPOCH_MS` in `challenge-cycle.ts` / `launch-config.ts`). Pre-launch badge via `isBeforePublicLaunch()` in hero.

**Accessibility / motion:** `MP_FOCUS_RING` on interactive elements; simulator uses `aria-pressed`, `role="status"`, `aria-live`; `motion-reduce` on hero pulse chip, simulator trendline, event card hovers; `min-w-0` + `overflow-x-hidden` for mobile overflow guard.

### 10.2 Fortify registration (`/fortify-survey`)

**Do not modify** `FortifyYourFutureSurvey.tsx` or the route without explicit approval — live QR codes point here.

**Past event detail:** `src/lib/events/fortify-your-future.ts` — `registrationDisabled: true`, past banner on page.

**Upcoming event:** `src/lib/events/fortify-sales-marketing.ts` — `/events/fortify-sales-marketing`.

**Events hub i18n:** `getFortifySalesMarketingShowcase(locale)` in `upcoming-event-display.ts`.

### 10.3 Market Pulse Hub (`/market-pulse`)

**Server:** `getMarketPulseHubPageData()` — active cycle, day progress, prize label, top-5 leaderboard preview, `leaderboardRevealed`, cycle ISO dates, **`nextCycle`** (`loadMarketPulseNextCycleStatus()` from `next-cycle.ts`).

**Client:** `MarketPulseHubPage.tsx` — **game lobby** layout:

| Area | Behavior |
|------|----------|
| **Lobby status** | `deriveHubLobbyStatus()` in `hub-lobby-state.ts` → `pre_launch` \| `open` \| `reveal_pending` \| `revealed` \| `no_active_cycle` \| `closed` |
| **Primary CTA** | `deriveHubPrimaryCta()` — context-aware: get ready / play today / sign in / view reveal / view leaderboard / rules; when `no_active_cycle` and `nextCycle.status === "tbc"`, primary CTA is **Explore rules** (not “Play today”) |
| **Cycle panel** | Dates, reveal countdown, leaderboard live vs locked label; when no active cycle, **Next cycle** row shows scheduled name/date or **TBC** + body copy |
| **Journey steps** | Read → Decide → Reveal → Rank (decorative) |
| **Leaderboard preview** | Top-5 ranks; **scores masked** (`scoreLocked`) until `leaderboardRevealed` |
| **Prize** | Cycle prize banner + contest rules link |

**Launch:** `MarketPulseLaunchAnnouncement` when `shouldShowMarketPulsePreLaunchUi()` (hidden after 1 Jul 2026 HKT); `canAccessMarketPulsePlay(role)` gates play for guests/USER before public launch (ADMIN bypass pre-launch only).

**Hub status chip mapping:** `no_active_cycle` → “No active cycle” (countdown/emerald style) when runtime is OPEN but no playable DB cycle; `closed` → “Closed” when runtime is off or cycle exists but runtime closed. Panel below shows dashed **No active cycle** section when `!hasDatabaseCycle`.

**Production empty state:** On Vercel, when no active cycle resolves from DB, hub uses `buildProductionSafeEmptyHubData()` — no synthetic dev fallback (`demo-cycle-guards.ts`, `hub-data.production.test.ts`). Local dev without DB may still use synthetic cycle data.

**i18n:** `market-pulse-messages.ts` — `mp.hub.lobby.*`, `mp.hub.cta.*`.

### 10.4 Market Pulse play (`/market-pulse/play`)

- **Server:** `getMarketPulsePlayPageData()` — today's published card, locked decision, sidebar leaderboard; `gateRuntimeClosedPageData()` maps playable states to `runtime_closed` when game runtime is not `OPEN`
- **Client:** `MarketPulsePlayExperience` + `MarketPulseSwipeCard` (signal) or `MarketPulseRestCard` (rest) — signal card shows headline, news body, logo, price, 16:9 image, summary; drag/tap **Bullish** or **Cautious**; rest card shows **Claim participation**
- **Confirmation step:** Card phase `confirm` — user must confirm decision before submit (`decision_confirmation_opened` analytics)
- **Locked/submitted:** `DecisionLockedCard` after successful submit or when revisiting a decided card; phase `locked`
- **Submit:** `submitMarketPulseDecisionAction` → `MarketPulseDecision` row (`BULLISH`/`CAUTIOUS` or `ACKNOWLEDGED` on rest cards; scores persisted on admin reveal, not at submit time)
- **States:** `pre_launch`, `no_active_cycle`, **`between_cycles`**, `cycle_unavailable`, `runtime_closed`, `no_card_today`, `sign_in_required`, `playable`, `locked`
- **`between_cycles`:** Runtime OPEN but no active playable cycle (gap after a cycle ends, before the next opens). Empty-state copy from `play-empty-state.ts` — **Next challenge begins soon** + HKT start time when `nextCycle` is available, else **Next challenge: TBC** (`next-cycle.ts`, `play-data.ts`). Display-only; does not change active-cycle pinning.
- **`no_card_today`:** Active cycle but no playable card yet — shows **Today's signal unlocks soon** + HKT unlock time when `nextCardReleaseAtIso` is computed (`findEarliestFuturePublishedCardReleaseAt` in `playable-card.ts`).
- **`cycle_unavailable` (not started):** Pinned/future cycle before `startsAt` — same future-cycle timing copy when `nextCycle` is available; other issues keep existing closed/revealed messaging.
- **`runtime_closed`:** Existing closed copy; optional **Next scheduled cycle** detail when a future cycle exists (does not imply playability).
- **Pre-launch:** non-admin → `pre_launch` status; ADMIN bypass via `launch-config.ts`
- **Non-playable UI:** `PlayStatusCard` via `resolvePlayBlockedStateCopy` / `applyPlayBlockedStateCopy` (`play-empty-state.ts`); decorative `PlayDecorativeSignalPreview` where card is hidden
- **Related tests:** `play-empty-state.test.ts`, `play-data.launch.test.ts`, `next-cycle.test.ts`, `playable-card.test.ts`
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
- **Scoring:** `getMarketPulseLeaderboard` + `calculateAndPersistCycleScores` on admin reveal; formulas in `score-calculation.ts` (+10 participation per card, +50 SIGNAL match, +100 every 3 consecutive correct SIGNAL matches; REST cards streak-neutral)

#### My score for this cycle (logged-in only)

- **Loader:** `getLeaderboardViewerScore()` in `leaderboard-viewer-score.ts` — queries **only** `session.user.id` + `selectedCycle.id`.
- **States:** `logged_out` (sign-in prompt), `locked_participating` / `locked_no_participation` (unrevealed — **no score/rank/participation points exposed**), `revealed_no_score`, `revealed_summary` (total, participation, rank, cards played).
- **Per-card breakdown (revealed only):** `getLeaderboardViewerScoreBreakdown()` joins `MarketPulseDecision` + `MarketPulseScoreEvent` per card; PPA **signal** label only (no `ppaInsight` text on leaderboard).
- **Link to full cycle review:** `MarketPulseLeaderboardMyScore.tsx` shows **View cycle review** → `/market-pulse/reveal` when the selected cycle is revealed (or **View reveal** while scores are still locked but the user participated). Leaderboard breakdown shows PPA **signal** labels only; full **PPA insight** prose lives on the reveal page.

**Player path — view card details after cycle end**

1. Sign in (personal review requires auth).
2. Open **`/market-pulse/leaderboard`** and select the ended/revealed cycle (or use hub **View reveal** when status is reveal pending / revealed).
3. In the **My score for this cycle** sidebar, click **View cycle review**.
4. On **`/market-pulse/reveal`**, scroll **Your cycle review** for every published card (played + skipped), PPA signal/insight, match chips, and scores (or **Score pending** until admin reveal/scoring runs).

Admin must run **Reveal & score** in `/admin/market-pulse` `#reveal-scoring` for final points and public standings; card + PPA details appear on the reveal page once `revealAt` has passed.
- **Participation score source:**
  - **After reveal scoring:** `MarketPulseScore.participationScore` per user/cycle (written in `calculateAndPersistCycleScores`), or sum of `MarketPulseScoreEvent.participationPoints`.
  - **Pre-reveal / no aggregate row:** Derived on read as `decisionsSubmitted × 10` (`PARTICIPATION_POINTS`) — shown only in locked messaging paths that **omit numeric scores** on the public leaderboard page.
  - **Display on revealed summary:** Prefer stored `MarketPulseScore`; fallback to derived participation from decisions when historical rows are missing.

#### Hub & play sidebar (unchanged scope)

- Hub (`hub-data.ts`) and play sidebar still show **current-cycle** top-N preview only — not the full archive UI.
- Legacy API `GET /api/market-pulse/leaderboard?mode=monthly|all-time` still exists for compatibility; the **public leaderboard page** is cycle-scoped only.

#### Reveal page (`/market-pulse/reveal`)

- **Components:** `MarketPulseRevealExperience.tsx`, `MarketPulseRevealCardList.tsx`, `RevealStatePanel.tsx` (locked / guest variants).
- **Pending:** Countdown + locked preview (`RevealLockedPreview`) — **no PPA or personal scores** in props (`reveal-data.ts` returns `results: null`, `cards: []` from server pre-reveal gate).
- **Revealed (authenticated):** Ceremony header, **Your cycle review** summary (`You played X of Y cards`), score summary stats, **full published card list** (played + skipped), learning framing copy, CTAs (play next when an active cycle exists; else next-cycle start date or **TBC**).
- **Revealed (guest):** Sign-in prompt panel — no personal results.
- **Zero participation:** Banner above the full card list (not an empty state) — user still sees every published card with PPA for learning; skipped cards show **Not played** badges.
- **PPA gating unchanged:** PPA fields only after admin reveal + `reveal?.isRevealed`; same `reveal-access.ts` rules. Skipped signal cards still receive PPA post-reveal (learning); REST cards never expose PPA on reveal rows.
- **Display-only additions:** `revealedCycle`, `playNextAvailable`, and **`nextCycle`** in `reveal-data.ts` (CTA routing only).
- Scoring: participation (+10), match bonus, streak bonus — computed in `calculateAndPersistCycleScores` on admin reveal (**unchanged**; reveal page only reads score events).

##### Post-cycle reveal data model (Jul 2026)

**Server:** `getMarketPulseRevealForUser()` in `server.ts` loads **all cycle cards** with status **`PUBLISHED` or `REVEALED`** (admin **Reveal & score** sets published rows to `REVEALED`; both must be included or the reveal page shows an empty list and a false “You did not play this cycle” banner while leaderboard scores still exist). Play order: `dayIndex → sortOrder → createdAt`. Joins viewer decisions and score events; returns **one row per card**.

| Field | Played | Skipped |
|-------|--------|---------|
| `played` | `true` | `false` |
| `viewerDecision` | decision value | `null` |
| `decidedAt` | timestamp | `null` |
| `isMatch` (signal) | `true` / `false` vs locked PPA | `null` |
| `isMatch` (REST) | always `null` | `null` |
| Score fields | from `MarketPulseScoreEvent`, or `null` if missing | all `null` |

**Totals** sum only non-null score fields on played cards — no `PARTICIPATION_POINTS` fallback when events are absent.

**Page mapping:** `reveal-data.ts` → `MarketPulseRevealCardRow`; derives `totalPlayed`, `totalSkipped`, `totalPublished`, `matchesCount`, `bestStreak` (played signal cards with `isMatch === true` only).

##### Next-cycle TBC (`next-cycle.ts`)

When no cycle is currently playable, hub, play, and reveal loaders attach **`nextCycle`**:

| `nextCycle.status` | Meaning |
|--------------------|---------|
| `available` | Nearest future `OPEN` cycle with `startsAt > now`, passing `shouldTreatCycleAsActiveForPublic` (demo/seed hidden in production) |
| `tbc` | No qualifying future cycle scheduled |

`firstCardReleaseAtIso`: earliest published card’s `getCardReleaseTime()`, else day-1 `getCycleDayReleaseAt()`.

### 10.6 Market Pulse rules & contest

- **`/market-pulse/rules`** — challenge overview, signal + rest card scoring, fair play (`market-pulse-messages.ts`)
- **`/contest-rules`** — prize eligibility and contest terms

### 10.7 Member profile (`/profile`)

Server component: Profile Details + Market Pulse history (`getUserMarketPulseHistory`).

### 10.8 Admin

**Full ops manual:** [Admin dashboards (ops reference)](#admin-dashboards-ops-reference) — especially [Admin operations manual — cycles, cards, and go-live](#admin-operations-manual--cycles-cards-and-go-live) for step-by-step cycle creation, card publishing, player gate matrix, reveal/scoring, server actions, and user acquisition visibility.

Admin uses a **zinc command-center** shell on both `/admin` and `/admin/market-pulse`. Non-`ADMIN` sessions redirect to `/`. All mutations return a shared `AdminActionResult` (`src/lib/admin/action-result.ts`); clients use `invokeAdminAction`.

#### `/admin` — command center

| Area | Components | Behavior |
|------|------------|----------|
| **Overview** | `AdminOverviewCards`, `getAdminOverviewData()` | Four cards: user totals, MP runtime + active cycle, player visibility snapshot, system notes |
| **Quick actions** | Links in `AdminOverviewCards` | Manage Market Pulse, Hub, Play, Leaderboard |
| **User management** | `AdminUserManagement`, `AdminMembersTable`, `AdminUserFilters`, `AdminRoleBadge`, `AdminConfirmDialog`, `AdminAddUserForm` | Add user; change role; delete with modal; search/filter by name/email/tel; **acquisition filters** (learning interest, next step); **Learning** + **Next Step** columns; export acquisition CSV (`members-data.ts`, `user-member-filter.ts`) |
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
| **Advanced cycles** | `MarketPulseCycleForm`, cycle rows, `RevealCycleButton`, export | Create/edit; **Starts/Ends/Reveal in HKT**; **Set as active cycle**; close cycle; CSV export |
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

#### Card workflow (admin) — summary

Full checklist: [Card publish requirements](#card-publish-requirements-admin-publish-button) and [player play gates](#what-must-be-true-for-players-to-see-and-play-a-cycle).

Create card in **builder** → fill **English + zh-Hant** → **Lock PPA** (SIGNAL only) → **Publish**. Release at **9:00 AM HKT** on the card's `dayIndex` unless legacy `publishedAt` defers. Image guidance: `MARKET_PULSE_CARD_IMAGE_GUIDANCE` (1200×675, 16:9).

#### PPA & playability helpers

| Module | Role |
|--------|------|
| `hkt-time.ts` | Fixed UTC+8 HKT calendar math + admin datetime-local parse/format (no DST, no server TZ) |
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
| `/api/market-pulse/today` | GET | User | Today's card(s) + decision state; **PPA stripped** pre-reveal; REST cards omit PPA |
| `/api/market-pulse/decision` | POST | User | Submit `BULLISH`/`CAUTIOUS` (signal) or `ACKNOWLEDGED` (rest); **403 before public launch** unless `ADMIN` |
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

- **Market Pulse hero:** `MarketPulseHero.tsx`, `HomeMarketPulseSimulator.tsx`, `MarketPulseLogo.tsx`, `launch-config.ts` — keys under `home.hero.*`, `home.hero.simulator.*` in `en.ts` / `zh-Hant.ts`
- **Pipeline / Pulse Board / Rewards:** `MarketPulsePipelineSection.tsx`, `HomePulseBoardWidget.tsx`, `HomeRewardsShowcase.tsx`, `homepage-pulse-preview.ts` — keys `home.pipeline.*`, `home.pulseBoard.*`, `home.rewards.*`
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
| `HomeHero.tsx`, `HomeEventsHub.tsx`, `HomeProofOfConcept.tsx`, `HomeTestimonials.tsx`, `PlayLearnWinSection.tsx`, `HomeHeroSignalPreview.tsx`, `MarketPulsePpaInsightSection.tsx` | Superseded homepage components — **not imported** by `page.tsx` |
| `MarketPulseHowItWorksSection.tsx`, `MarketPulseCycleLoopSection.tsx` | **Removed** (Jul 2026) — replaced by `MarketPulsePipelineSection`, `HomePulseBoardWidget`, `HomeRewardsShowcase` |
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
10. **Admin MP UI** — Operational labels mostly English; enums (`OPEN`, `PUBLISHED`, `SIGNAL`, `REST`) intentionally untranslated.
11. **Builder save on published cards** — Cycle builder **Save draft** persists scheduling via `updateMarketPulseCardDraftAction`, which sets `status: DRAFT` and clears `publishedAt`. There is no builder button that calls `updateMarketPulseCardAction` while keeping a card `PUBLISHED`; admins may see form day/order differ from the table until they save (and accept unpublish) or edit before publish.

---

## Quick reference — key files

| Concern | File(s) |
|---------|---------|
| Auth config | `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts` |
| Auth actions | `src/lib/auth-actions.ts`, `src/lib/auth/onboarding-routes.ts` |
| Login / onboarding | `LoginPage.tsx`, `OnboardingPage.tsx`, `MarketPulseAuthPanel.tsx`, `market-pulse-auth-context.ts`, `OnboardingRecoveryPanel.tsx`, `/auth/onboarding/*`, `/api/auth/complete-onboarding/route.ts` |
| i18n | `src/lib/i18n/*`, `LocaleProvider.tsx`, `LanguageSwitcher.tsx` |
| Admin users | `AdminUserManagement.tsx`, `AdminMembersTable.tsx`, `admin-user-actions.ts`, `admin-user-validation.ts`, `user-member-filter.ts`, `members-data.ts`, `members-csv.ts`, `members-types.ts`, `acquisition/admin-labels.ts` |
| Admin action results | `src/lib/admin/action-result.ts` — `finishAdminMutation`, `invokeAdminAction` |
| Admin overview | `AdminOverviewCards.tsx`, `admin-overview-data.ts` |
| MP admin shell | `MarketPulseAdminShell.tsx`, `admin-mp-status.ts`, `MarketPulseAdminDashboard.tsx` |
| MP admin cards | `MarketPulseCardList.tsx`, `MarketPulseCardForm.tsx`, `MarketPulseAdminCardPreview.tsx`, `admin-card-filter.ts` |
| MP reveal/prize | `MarketPulseRevealScoringSection.tsx`, `RevealCycleButton.tsx`, `admin-reveal-status.ts`, `reveal-ppa-validation.ts`, `admin-ppa-reveal-warning.ts`, `MarketPulsePrizeReview.tsx` |
| MP card admin | `MarketPulseCardPanel.tsx`, `admin-card-ppa-status.ts`, `admin-card-filter.ts`, `admin-card-scheduling.ts` (`formatBuilderDayCardLabel`, `suggestQuickDraftSlot`) |
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
| Market Pulse play | `src/app/market-pulse/play/page.tsx`, `MarketPulsePlayExperience.tsx`, `MarketPulseSwipeCard.tsx`, `MarketPulseRestCard.tsx`, `DecisionLockedCard.tsx`, `play-page-state.ts`, `play-data.ts`, `card-type.ts` |
| Leaderboard / reveal | `leaderboard/page.tsx`, `reveal/page.tsx`, `leaderboard-data.ts`, `leaderboard-cycle-select.ts`, `leaderboard-viewer-score.ts`, `LeaderboardStatePanel.tsx`, `MarketPulseLeaderboardMyScore.tsx`, `RevealStatePanel.tsx`, `MarketPulseRevealCardList.tsx`, `reveal-data.ts`, `next-cycle.ts` |
| Homepage journey | `src/app/page.tsx`, `MarketPulseHero.tsx`, `HomeMarketPulseSimulator.tsx`, `MarketPulsePipelineSection.tsx`, `HomePulseBoardWidget.tsx`, `HomeRewardsShowcase.tsx`, `homepage-pulse-preview.ts` |
| MP visual / analytics | `MarketPulseVisualPrimitives.tsx`, `MarketPulseTrackedLink.tsx`, `analytics.ts` |
| Admin cycle stats | `admin-cycle-stats.ts`, `admin-data.ts` (`MarketPulseAdminCycleRow` participation fields) |
| Market Pulse domain | `server.ts`, `cycle-playability.ts`, `playable-card.ts` (`findActiveScheduleDayIndex`, `getCardActiveWindowEnd`, `isCardWithinActivePlayWindow`), `reveal-access.ts`, `admin-actions.ts`, `card-validation.ts`, `score-calculation.ts`, `card-type.ts` |
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
- **Testing:** `npm run lint`, `npm run typecheck`, `npm test` (656), `npm run build`
- **Production smoke:** [`docs/market-pulse-deploy-checklist.md`](docs/market-pulse-deploy-checklist.md) § Launch smoke test; automated suites listed in [Production smoke test](#production-smoke-test)
- **Lint warnings:** Legacy castle-siege; TanStack Table in admin members table

---

*Last updated: 12 Jul 2026 — Reveal cycle review includes `REVEALED` cards after admin scoring; leaderboard My score → reveal link; post-cycle review, next-cycle TBC.*
