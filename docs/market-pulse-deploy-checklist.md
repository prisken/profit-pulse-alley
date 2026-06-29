# Market Pulse — Production Deployment Checklist

Use this checklist before and after each Market Pulse production release.  
Routes: `/market-pulse`, `/market-pulse/play`, `/market-pulse/leaderboard`, `/market-pulse/reveal`, `/admin/market-pulse`.

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
- [ ] `npm test` passes locally or in CI (`vitest run`)

---

## 4. Admin setup steps

Promote at least one admin before go-live:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ops@yourcompany.com';
```

Then open **`/admin/market-pulse`** (requires `role = ADMIN`).

### Cycle & cards workflow

| Step | Action | Check |
|------|--------|-------|
| 1 | **Create cycle** | Name, `startsAt`, `endsAt`, `revealAt` (HKT-aligned), prize label; status → `OPEN` when ready |
| 2 | **Create 10 cards** | One card per `dayIndex` (1–10); headline, ticker, summary |
| 3 | **Publish cards** | Status → `PUBLISHED`; `publishedAt` on or before the card’s play day (PPA lock required for **publish** in admin UI, not for player decisions on already-published cards) |
| 4 | **Enter & lock PPA** | Before reveal: set PPA signal + insight and **Lock PPA** on each published card |
| 5 | **Set active cycle** | Pin cycle in admin so `activeCycleId` matches the live challenge |
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

### Access & play

- [ ] **Logged-out view** — `/market-pulse` hub loads; play shows sign-in prompt; no scores submitted
- [ ] **Logged-in play** — `/market-pulse/play` loads today’s card; swipe/button submits once
- [ ] **Duplicate decision** — second submit on same card returns locked state / error; no duplicate DB row
- [ ] **Swipe right** — Bullish submission; card exit animation; locked success card
- [ ] **Swipe left** — Cautious submission
- [ ] **Mobile gestures** — horizontal swipe does not scroll the page; buttons reachable below card

### Leaderboard & reveal

- [ ] **Leaderboard default** — `/market-pulse/leaderboard` opens on the active/current cycle (or latest revealed if none active)
- [ ] **Cycle archive** — dropdown lists revealed past cycles; `?cycleId=` deep-links to a selected cycle
- [ ] **Leaderboard (unrevealed)** — public standings locked; no scores in page payload; signed-in user sees locked **My score** messaging only (no rank/points exposed)
- [ ] **Leaderboard (revealed)** — public standings show final scores; signed-in user sees **My score for this cycle** (total, participation, rank, optional per-card breakdown)
- [ ] **Historical retention** — switching cycles shows that cycle's standings only (scores do not carry over visually)
- [ ] **Reveal** — `/market-pulse/reveal` pending before `revealAt`; personal ceremony after reveal (authenticated)

### Admin

- [ ] **Admin authorization** — non-admin cannot access `/admin/market-pulse` (redirects home)
- [ ] **Admin authorization** — non-admin server actions return unauthorized
- [ ] Cycle create/edit, card publish, lock PPA, set active, reveal all work end-to-end

### Smoke URLs

```
/market-pulse
/market-pulse/play
/market-pulse/leaderboard
/market-pulse/reveal
/market-pulse/rules
/admin/market-pulse
```

---

## 7. Security checklist

- [ ] **Hidden PPA data not exposed** — before reveal, card API/UI has no `ppaSignal` / `ppaInsight` (check Network tab on `/market-pulse/play` and `GET /api/market-pulse/today`)
- [ ] **Reveal gating** — PPA only after `cycle.status === REVEALED` or `now >= revealAt` (server logic in `reveal-access.ts`)
- [ ] **Server-side scoring only** — clients send only `cardId` + `decision`; no client score field; match/streak points computed on reveal
- [ ] **Decision validation** — invalid decision, closed runtime, unpublished card, wrong card/day, post-deadline rejected server-side (**not** blocked by missing/unlocked PPA)
- [ ] **Admin-only actions protected** — `requireAdminSession()` on admin data/actions; PPA visible in admin UI only
- [ ] **Analytics** — `trackMarketPulseEvent` strips email and PPA fields from payloads
- [ ] **Rate limiting** — TODO: decision API rate limits not yet implemented; monitor abuse manually at launch

**Optional automated check**

```bash
npm test -- src/lib/market-pulse/server-core.test.ts src/lib/market-pulse/server-security.test.ts
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

*Related: `DEVELOPER_GUIDE.md` (env vars, Prisma, admin promotion), `src/lib/market-pulse/` (domain logic), `npm test` (unit tests).*
