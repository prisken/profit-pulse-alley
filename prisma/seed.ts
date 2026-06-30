/**
 * Prisma seed — Market Pulse demo data (development only).
 *
 * Usage:
 *   npm run db:seed              # development (NODE_ENV=development)
 *   MARKET_PULSE_SEED=1 npm run db:seed   # explicit override (use with care)
 *   npx prisma db seed           # same as npm run db:seed when configured
 *
 * Safety:
 * - Blocked when NODE_ENV=production or VERCEL_ENV=production unless MARKET_PULSE_SEED=1
 * - Idempotent: skips if demo cycle "[DEMO] Market Pulse Local Seed" already exists
 * - Never deletes or truncates existing production rows
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "node:path";

import {
  DEMO_CARDS,
  DEMO_CYCLE_NAME,
  DEMO_CYCLE_PRIZE_LABEL,
} from "./seed-market-pulse-data";
import { assertSeedAllowed } from "./seed-guards";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

function startOfLocalDay(base: Date, dayOffset: number, hour = 9): Date {
  const date = new Date(base);
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

export async function seedMarketPulseDemo(): Promise<void> {
  assertSeedAllowed();

  const existingCycle = await prisma.marketPulseCycle.findFirst({
    where: { name: DEMO_CYCLE_NAME },
    select: { id: true, name: true },
  });

  if (existingCycle) {
    console.log(
      `[seed] Demo cycle already exists (${existingCycle.id}). Skipping — no data changed.`,
    );
    return;
  }

  const now = new Date();
  const cycleStartsAt = startOfLocalDay(now, 0);
  const cycleEndsAt = startOfLocalDay(now, 9, 18);
  const cycleRevealAt = startOfLocalDay(now, 10, 18);
  const lockedAt = startOfLocalDay(now, -1, 12);

  const cycle = await prisma.marketPulseCycle.create({
    data: {
      name: DEMO_CYCLE_NAME,
      startsAt: cycleStartsAt,
      endsAt: cycleEndsAt,
      revealAt: cycleRevealAt,
      status: "OPEN",
      prizeLabel: DEMO_CYCLE_PRIZE_LABEL,
    },
  });

  await prisma.marketPulseCard.createMany({
    data: DEMO_CARDS.map((card) => {
      const publishedAt = startOfLocalDay(cycleStartsAt, card.dayIndex - 1, 8);
      const sourceDate = startOfLocalDay(cycleStartsAt, card.dayIndex - 2, 12);

      return {
        cycleId: cycle.id,
        dayIndex: card.dayIndex,
        companyName: card.companyName,
        companyNameZh: card.companyNameZh ?? null,
        ticker: card.ticker,
        exchange: card.exchange ?? null,
        priceLabel: card.priceLabel ?? null,
        priceDirection: card.priceDirection ?? null,
        headline: card.headline,
        newsBody: card.newsBody ?? null,
        sourceName: card.sourceName,
        sourceUrl: null,
        sourceDate,
        logoInitials: card.logoInitials ?? null,
        cardImageUrl: card.cardImageUrl ?? null,
        cardImageAlt: card.cardImageAlt ?? null,
        summary: card.summary,
        userPrompt: card.userPrompt ?? null,
        ppaSignal: card.ppaSignal,
        ppaInsight: card.ppaInsight,
        ppaSignalLockedAt: lockedAt,
        status: "PUBLISHED" as const,
        publishedAt,
        revealAt: cycleRevealAt,
      };
    }),
  });

  const settings = await prisma.marketPulseGameSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, activeCycleId: true },
  });

  if (!settings) {
    await prisma.marketPulseGameSetting.create({
      data: {
        runtimeStatus: "OPEN",
        defaultLeaderboardMode: "CURRENT_CYCLE",
        activeCycleId: cycle.id,
      },
    });
    console.log("[seed] Created MarketPulseGameSetting (OPEN) with demo active cycle.");
  } else if (!settings.activeCycleId) {
    await prisma.marketPulseGameSetting.update({
      where: { id: settings.id },
      data: { activeCycleId: cycle.id },
    });
    console.log("[seed] Linked existing game settings to demo active cycle.");
  } else {
    const activeCycle = await prisma.marketPulseCycle.findUnique({
      where: { id: settings.activeCycleId },
      select: { name: true },
    });
    console.log(
      `[seed] Left activeCycleId unchanged (currently: ${activeCycle?.name ?? settings.activeCycleId}).`,
    );
  }

  console.log(
    `[seed] Created demo cycle "${DEMO_CYCLE_NAME}" with ${DEMO_CARDS.length} published cards.`,
  );
  console.log(`[seed] Cycle id: ${cycle.id}`);
  console.log(
    `[seed] Dates: ${cycleStartsAt.toISOString()} → ${cycleEndsAt.toISOString()} (reveal ${cycleRevealAt.toISOString()})`,
  );
}

async function main() {
  await seedMarketPulseDemo();
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
