# Market Pulse — Production Deployment Checklist

Use this checklist before and after each Market Pulse production release.  
Routes: `/market-pulse`, `/market-pulse/play`, `/market-pulse/leaderboard`, `/market-pulse/reveal`, `/admin/market-pulse`, `/admin/market-pulse/cycles/[cycleId]/builder`.

---

## Launch smoke test (1 Jul 2026 HKT) — pass / fail

Run this block **immediately before pushing to production** for the public launch (1 Jul 2026 00:00 HKT). Mark each row **Pass** or **Fail**. Do not ship if any **Fail** remains unresolved.

### Automated preflight (run locally or in CI)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Targeted launch smoke suite:

```bash
npm test -- \
  src/lib/market-pulse/launch-smoke.test.ts \
  src/lib/market-pulse/play-data.launch.test.ts \
  src/lib/market-pulse/reveal-data.launch.test.ts \
  src/lib/market-pulse/launch-first-cycle-boundaries.test.ts \
  src/lib/market-pulse/admin-player-visibility-readiness.test.ts \
  src/lib/market-pulse/public-launch-ui.test.ts \
  src/lib/market-pulse/server-security.test.ts \
  src/lib/market-pulse/leaderboard-data.test.ts
```

| Check | Automated | Manual |
|-------|-----------|--------|
| Launch instant = 1 Jul 2026 00:00 HKT | `launch-first-cycle-boundaries.test.ts` | — |
| USER not blocked after launch | `launch-smoke.test.ts`, `play-data.launch.test.ts` | — |
| Guest prompted to sign in (not submit) | `launch-smoke.test.ts`, `play-data.launch.test.ts` | Guest swipe → sign-in CTA |
| ADMIN still works after launch | `launch-smoke.test.ts`, `admin-player-visibility-readiness.test.ts` | Sign in as ADMIN → `/admin/market-pulse` |
| Play gates (OPEN cycle + published card) | `play-data.launch.test.ts` | USER plays today’s card |
| Runtime CLOSED blocks play | `play-data.launch.test.ts` | Set runtime CLOSED → play closed panel |
| No active cycle blocks play | `play-data.launch.test.ts` | Unpin cycle → no play |
| No published today card | `play-data.launch.test.ts` | Unpublish today’s card → no card panel |
| PPA hidden on play before reveal | `launch-smoke.test.ts`, `server-security.test.ts` | Network tab on `/market-pulse/play` |
| PPA hidden on hub / leaderboard before reveal | `launch-smoke.test.ts`, `public-launch-ui.test.ts` | Hub + leaderboard page source |
| Leaderboard locked before reveal | `launch-smoke.test.ts`, `leaderboard-data.test.ts` | `/market-pulse/leaderboard` locked UI |
| Leaderboard revealed after scoring | `launch-smoke.test.ts`, `leaderboard-data.test.ts` | Post-reveal standings visible |
| Reveal pending before `revealAt` | `reveal-data.launch.test.ts` | `/market-pulse/reveal` countdown |
| Reveal results only when valid | `reveal-data.launch.test.ts` | Signed-in USER after admin reveal |
| `/admin/market-pulse` requires ADMIN | `launch-smoke.test.ts` | Non-admin → redirect home |
| Builder requires ADMIN | `launch-smoke.test.ts`, `admin-builder-data.test.ts` | Non-admin → redirect home |
| Launch readiness card ready/blocked | `admin-player-visibility-readiness.test.ts` | Overview card on admin dashboard |
| `/fortify-survey` unchanged | `launch-smoke.test.ts` | Page loads; no redirect |

### Manual smoke — environment & data

| # | Step | Pass |
|---|------|------|
| 1 | **Environment variables** — `POSTGRES_URL`, `AUTH_SECRET`, Google OAuth (if used), production domain in redirect URIs | ☐ |
| 2 | **Production DB connected** — `POSTGRES_URL` points at production; `npm run build` succeeds | ☐ |
| 3 | **First admin exists** — at least one `User.role = 'ADMIN'` | ☐ |
| 4 | **Runtime OPEN** — game setting `runtimeStatus = OPEN` on `/admin/market-pulse` | ☐ |
| 5 | **Active cycle OPEN** — correct cycle pinned as active; status `OPEN` | ☐ |
| 6 | **First public cycle dates** — starts 1 Jul 2026 00:00 HKT; ends/reveal per ops plan (recommended reveal 11 Jul 00:00 HKT) | ☐ |
| 7 | **Today’s card published** — day’s card `PUBLISHED` with `publishedAt` on or before now | ☐ |
| 8 | **PPA locked** — published cards have locked PPA if your publish validation requires it | ☐ |

### Manual smoke — player flows

| # | Step | Pass |
|---|------|------|
| 9 | **Guest flow** — hub loads; play shows today’s card; sign-in required to submit; no PPA in payload | ☐ |
| 10 | **USER flow** — sign in → play → confirm Bullish/Cautious → locked card; duplicate submit blocked | ☐ |
| 11 | **ADMIN flow** — `/admin/market-pulse` overview, builder, publish, readiness card accurate | ☐ |
| 12 | **EN / zh-Hant switch** — hub, play, rules, footer copy toggles; dates readable in both locales | ☐ |
| 13 | **Mobile play flow** — swipe/buttons work; page does not scroll during horizontal swipe | ☐ |
| 14 | **Leaderboard locked** — ranks visible; scores show locked label before reveal | ☐ |
| 15 | **Reveal pending** — countdown; no personal results or PPA before reveal | ☐ |
| 16 | **`/fortify-survey` unchanged** — survey renders; URL stable (QR codes) | ☐ |

**Sign-off (launch smoke):**

| Role | Name | Date | All pass |
|------|------|------|----------|
| Engineering | | | ☐ |

---

## 1. Environment checks

Confirm all required variables are set in the production host (e.g. Vercel → **Settings → Environment Variables**).

| Variable | Required | Notes |
|----------|----------|--------|
| `POSTGRES_URL` | **Yes** | Direct `postgres://` URL for Prisma (`prisma/schema.prisma`) |
| `AUTH_SECRET` | **Yes** | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | For Google login | OAuth client for production domain |
| `AUTH_GOOGLE_SECRET` | For Google login | Match production redirect URIs |
| `EMAIL_SERVER` / `EMAIL_FROM` | Optional | Email magic-link login; omit if Google-only |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Optional | KV-backed theme/settings; Prisma game runtime is primary |

**Pre-deploy verification**

- [ ] Production URL added to Google OAuth authorized redirect URIs
- [ ] `AUTH_SECRET` is unique per environment (not shared with staging)
- [ ] `POSTGRES_URL` points at the **production** database (not local/staging)
- [ ] No `.env` secrets committed to git
- [ ] `NODE_ENV=production` on the host
- [ ] Do **not** set `MARKET_PULSE_SEED=1` in production unless intentionally seeding a throwaway DB

---

## 2. Database backup recommendation

**Before every production schema or content deploy:**

1. Take a full backup of the Postgres database (Vercel Postgres snapshot, `pg_dump`, or your provider’s backup tool).
2. Record backup ID / timestamp in the deploy ticket.
3. Confirm you can restore to a staging instance (at least quarterly).

```bash
# Example manual backup (adjust connection string)
pg_dump "$POSTGRES_URL" -Fc -f "market-pulse-pre-deploy-$(date +%Y%m%d-%H%M).dump"
```

- [ ] Backup completed and labeled
- [ ] Restore procedure documented for your team
- [ ] No destructive manual SQL planned without a rollback path

---

## 3. Prisma & build commands

Run from the project root with production env vars available (or let CI run them).

```bash
# 1) Apply migrations (preferred once prisma/migrations/ exists)
npx prisma migrate deploy

# 2) Regenerate Prisma Client (also runs on postinstall)
npx prisma generate

# 3) Production build
npm run build
```

**Notes**

- Current `package.json` build script may use `prisma db push && next build` if migration files are not yet committed. When `prisma/migrations/` is in place, switch build to `prisma migrate deploy && next build` for safer production schema updates.
- If this is the first time using migrations on a DB already created via `db push`, baseline existing tables before `migrate deploy` (see [Prisma baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining)).
- [ ] `npx prisma migrate deploy` succeeds (or `db push` only if migrations not adopted yet — document which)
- [ ] `npx prisma generate` succeeds
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm test` passes locally or in CI — see **Launch smoke test** § automated preflight

---

## 4. Admin setup steps

Promote at least one admin before go-live:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ops@yourcompany.com';
```

Then open **`/admin/market-pulse`** (requires `role = ADMIN`).

### Primary admin workflow (fast builder)

Recommended path for creating/editing cycle cards:

| Step | Action | Check |
|------|--------|-------|
| 1 | Open **`/admin/market-pulse`** → **Cycles hub** | **Quick create next cycle** visible; existing cycles listed with **Open builder** |
| 2 | **Quick create next cycle** | Creates `DRAFT` cycle (not active, not public); redirects to builder |
| 3 | **Open builder** | `/admin/market-pulse/cycles/{id}/builder` — cycle summary, readiness, card list |
| 4 | **Add card draft** | New card gets next `dayIndex` / `sourceDate`; validation status shown |
| 5 | Edit + **Lock PPA** + preview | Admin preview shows PPA; swipe mock does not leak PPA |
| 6 | **Publish** (single or bulk) | Invalid cards skipped with reason; only valid + locked-PPA cards publish |
| 7 | **Advanced cycle settings** (`#cycles` on dashboard) | Set status `OPEN`, dates, **Set as active cycle**, prize label |
| 8 | Runtime **OPEN** | Game setting `runtimeStatus` = `OPEN` |

**Legacy:** Full create-cycle form still under **Advanced cycle settings** (`#cycles`, in `<details>`). Legacy card editor at `#cards` — use only when builder is insufficient.

**Defaults reference:** `quick-create-cycle-defaults.ts` (cycle), `cycle-card-defaults.ts` + `admin-card-scheduling.ts` (cards), `duplicate-card-data.ts` (duplicate → always `DRAFT`).

### Cycle & cards workflow (go-live checklist)

| Step | Action | Check |
|------|--------|-------|
| 1 | **Create cycle** | Quick create (draft) or advanced form; name, `startsAt`, `endsAt`, `revealAt` (HKT-aligned), prize label; status → `OPEN` when ready |
| 2 | **Create cards in builder** | One card per `dayIndex`; headline, ticker, summary; scheduling conflicts flagged in readiness panel |
| 3 | **Enter & lock PPA** | PPA signal + insight + **Lock PPA** on each card before **Publish** |
| 4 | **Publish cards** | Builder publish or bulk publish; `publishedAt` on or before play day |
| 5 | **Set active cycle** | Pin cycle in advanced settings so `activeCycleId` matches the live challenge |
| 6 | **Runtime open** | Game setting `runtimeStatus` = `OPEN` (not `CLOSED` / `MAINTENANCE`) |

**End-of-cycle (after `revealAt`)**

- [ ] All **published** cards have locked PPA signal + insight before **Reveal cycle** (blocked in admin if incomplete)
- [ ] Admin **PPA insight needed before reveal** banner appears when `revealAt` is within **72 hours** and PPA is missing (`PPA_REVEAL_WARNING_HOURS` in `constants.ts`)
- [ ] Reveal action run from admin (generates score events, sets cycle/cards to `REVEALED`)
- [ ] Prize review completed at `/admin/market-pulse?prizeCycleId=<cycleId>` if running a contest

---

## 5. Legal checklist

Legal pages must be reviewed by qualified counsel before public launch. Draft notices may still appear on some pages.

| Page | URL | Check |
|------|-----|-------|
| Terms of Service | `/terms` | Final copy; links to contest rules |
| Privacy Policy | `/privacy` | Data collection, decisions, leaderboard, prizes |
| Investment disclaimer | `/investment-disclaimer` | Educational-only; not investment advice |
| Contest rules | `/contest-rules` | Eligibility, prizes, fair play, Hong Kong context |
| Prize terms | Cycle `prizeLabel` + contest rules | Prize description matches admin settings and marketing |

**In-product**

- [ ] `MarketPulseInlineDisclaimer` visible on hub, play, leaderboard, reveal
- [ ] Contest rules linked from footer and Market Pulse pages
- [ ] `LEGAL_DRAFT_NOTICE` removed or replaced after legal sign-off
- [ ] Prize wording on homepage / hub matches `/contest-rules` and admin `prizeLabel`

---

## 6. QA checklist

Test in **production-like** build (`npm run build && npm start`) on desktop and mobile.

### Homepage & hub (player journey UX)

- [ ] **Homepage hero** — pre-launch badge + hub CTA; post-launch play CTA; decorative signal preview shows no live PPA
- [ ] **How it works / cycle loop** — steps and scoring copy match rules (+10/+50/+100); sample leaderboard shows locked scores
- [ ] **PPA Insight teaser** — locked comparison only; no real PPA data in page source
- [ ] **Hub lobby** — cycle status chip matches runtime/cycle state; primary CTA (play / sign in / reveal / leaderboard) is context-correct
- [ ] **Hub leaderboard preview** — ranks visible pre-reveal; numeric scores show **Locked** label, not final match/streak totals

### Access & play

- [ ] **Logged-out view** — `/market-pulse` hub loads; play shows sign-in prompt; no scores submitted
- [ ] **Logged-in play** — `/market-pulse/play` loads today's card; swipe/button opens **confirmation** before submit
- [ ] **Duplicate decision** — second submit on same card returns locked state / error; no duplicate DB row
- [ ] **Swipe right** — Bullish: confirm → submit; card exit animation; `DecisionLockedCard`
- [ ] **Swipe left** — Cautious: confirm → submit
- [ ] **Runtime closed** — when admin sets runtime `CLOSED`, play shows `runtime_closed` panel (not playable card)
- [ ] **Mobile gestures** — horizontal swipe does not scroll the page; buttons reachable below card

### Leaderboard & reveal

- [ ] **Leaderboard default** — `/market-pulse/leaderboard` opens on the active/current cycle (or latest revealed if none active)
- [ ] **Cycle archive** — dropdown lists revealed past cycles; `?cycleId=` deep-links to a selected cycle
- [ ] **Leaderboard (unrevealed)** — `LeaderboardStatePanel` locked UI; no scores in page payload; signed-in user sees locked **My score** messaging only (no rank/points exposed)
- [ ] **Leaderboard (revealed)** — public standings show final scores; top ranks styled; signed-in user sees **My score for this cycle** (total, participation, rank, optional per-card breakdown)
- [ ] **Historical retention** — switching cycles shows that cycle's standings only (scores do not carry over visually)
- [ ] **Reveal (pending)** — locked countdown panel; no PPA or personal results in props
- [ ] **Reveal (live)** — ceremony header, score summary, per-card PPA signal + insight, learning copy; guest sees sign-in panel only

### Auth (Market Pulse return path)

- [ ] **Login from MP** — `/login?callbackUrl=/market-pulse/play` shows MP-aware copy; successful sign-in returns to callback
- [ ] **Onboarding** — new OAuth user completes contact → `/api/auth/complete-onboarding` → original MP destination

### Admin (fast builder + legacy)

- [ ] **Admin authorization** — non-admin cannot access `/admin/market-pulse` or builder routes (redirects home)
- [ ] **Admin authorization** — non-admin server actions return unauthorized
- [ ] **Quick create cycle** — creates `DRAFT`, not active; lands in builder
- [ ] **Builder** — cycle summary, card list, empty state, add draft, inline editor, preview
- [ ] **Duplicate card** — new draft; original unchanged; next day/date assigned
- [ ] **Bulk publish** — valid cards publish; invalid skipped with reason
- [ ] **Bulk unpublish** — blocked when decisions exist on card
- [ ] **Breadcrumbs** — Admin → Market Pulse → cycle name on builder
- [ ] **Legacy routes** — `#cards`, `#cycles`, `#reveal-scoring` still reachable from dashboard nav
- [ ] Advanced create/edit cycle, set active, reveal all work end-to-end

### Public regression (admin workflow)

- [ ] **Draft cards hidden** — unpublished cards not on `/market-pulse/play`
- [ ] **PPA privacy** — no `ppaSignal` / `ppaInsight` in play network payload pre-reveal
- [ ] **Leaderboard / reveal** — locked states unchanged; scoring only after admin reveal
- [ ] **Mobile admin** — builder usable on tablet; tables scroll horizontally; card list on narrow screens

### Smoke URLs

```
/market-pulse
/market-pulse/play
/market-pulse/leaderboard
/market-pulse/reveal
/market-pulse/rules
/admin/market-pulse
/admin/market-pulse/cycles/<cycleId>/builder
```

---

## 7. Security checklist

**Jun 2026 admin fast builder:** Navigation and UI workflow changes only. **Scoring, launch gating, ADMIN pre-launch bypass, PPA privacy, and unrevealed score hiding are unchanged.** `/fortify-survey` not modified.

- [ ] **Hidden PPA data not exposed** — before reveal, card API/UI has no `ppaSignal` / `ppaInsight` (check Network tab on `/market-pulse/play` and `GET /api/market-pulse/today`; homepage/hub use decorative locked previews only)
- [ ] **Reveal gating** — PPA only after `cycle.status === REVEALED` or `now >= revealAt` (server logic in `reveal-access.ts`)
- [ ] **Server-side scoring only** — clients send only `cardId` + `decision`; no client score field; match/streak points computed on reveal
- [ ] **Decision validation** — invalid decision, closed runtime, unpublished card, wrong card/day, post-deadline rejected server-side (**not** blocked by missing/unlocked PPA)
- [ ] **Admin-only actions protected** — `requireAdminSession()` on admin data/actions; PPA visible in admin UI only
- [ ] **Analytics** — `trackMarketPulseEvent` strips email and PPA fields from payloads
- [ ] **Rate limiting** — TODO: decision API rate limits not yet implemented; monitor abuse manually at launch

**Optional automated check**

```bash
npm test -- src/lib/market-pulse/admin-mp-navigation.test.ts src/lib/market-pulse/admin-builder-data.test.ts src/lib/market-pulse/admin-quick-create-cycle.test.ts src/lib/market-pulse/duplicate-card-data.test.ts src/lib/market-pulse/admin-bulk-card-actions.test.ts src/lib/market-pulse/server-core.test.ts src/lib/market-pulse/server-security.test.ts src/lib/market-pulse/leaderboard-data.test.ts
```

---

## 8. Rollback notes

### Application rollback

1. Revert to the previous deployment in Vercel (or redeploy the last known-good git tag).
2. Confirm `AUTH_SECRET` and DB URL unchanged unless intentionally rotated.

### Database rollback

- **Schema:** If `migrate deploy` failed mid-way, restore from pre-deploy backup; do not run partial migrations manually without DBA review.
- **Content:** Reverting app code does not undo admin cycle/card changes. To “pause” play without rollback:
  - Set game `runtimeStatus` → `CLOSED` or `MAINTENANCE` in `/admin/market-pulse`
  - Unpin or close the active cycle (`status` → `CLOSED`)
- **Reveal:** Reveal is destructive for scoring rows (score events regenerated). Do not re-reveal without ops approval; restore DB backup if reveal was mistaken.

### Post-rollback verification

- [ ] Hub and play pages load
- [ ] No new decisions accepted if game is intentionally closed
- [ ] Leaderboard reflects last consistent DB state
- [ ] Incident noted with deploy ID, backup ID, and root cause

---

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Engineering | | | ☐ |
| Product / Ops | | | ☐ |
| Legal (if prizes live) | | | ☐ |

---

*Related: `DEVELOPER_GUIDE.md` (§ Market Pulse admin fast builder workflow), `src/lib/market-pulse/` (domain logic). Automated launch smoke: `launch-smoke.test.ts`, `play-data.launch.test.ts`, `reveal-data.launch.test.ts`.*
