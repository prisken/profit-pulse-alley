import "server-only";

import {
  validatePublishedCardsPpaForReveal,
  type RevealPpaValidationResult,
} from "@/lib/market-pulse/reveal-ppa-validation";
import { prisma } from "@/lib/prisma";

export async function validateCycleReadyForReveal(
  cycleId: string,
): Promise<RevealPpaValidationResult> {
  const cards = await prisma.marketPulseCard.findMany({
    where: { cycleId, status: "PUBLISHED" },
    select: {
      id: true,
      cycleId: true,
      dayIndex: true,
      headline: true,
      companyName: true,
      status: true,
      cardType: true,
      ppaSignal: true,
      ppaInsight: true,
      ppaSignalLockedAt: true,
    },
    orderBy: { dayIndex: "asc" },
  });

  return validatePublishedCardsPpaForReveal(cycleId, cards);
}
