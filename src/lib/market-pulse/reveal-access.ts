import type {
  MarketPulseCard,
  MarketPulseCardStatus,
  MarketPulseCycle,
  MarketPulseSignal,
} from "@prisma/client";

export type MarketPulseCardPublicPayload = {
  id: string;
  cycleId: string;
  dayIndex: number;
  companyName: string;
  companyNameZh: string | null;
  ticker: string;
  exchange: string | null;
  logoUrl: string | null;
  priceLabel: string | null;
  priceDirection: string | null;
  headline: string;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: Date | null;
  summary: string | null;
  status: MarketPulseCardStatus;
  publishedAt: Date | null;
  revealAt: Date | null;
  isRevealed: boolean;
  ppaSignal?: MarketPulseSignal;
  ppaInsight?: string | null;
};

function effectiveCardRevealAt(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "revealAt">,
): Date {
  return card.revealAt ?? cycle.revealAt;
}

export function isMarketPulseCycleRevealed(
  cycle: Pick<MarketPulseCycle, "status" | "revealAt">,
  at: Date = new Date(),
): boolean {
  return cycle.status === "REVEALED" || at >= cycle.revealAt;
}

export function isMarketPulseCardRevealed(
  card: Pick<MarketPulseCard, "revealAt">,
  cycle: Pick<MarketPulseCycle, "status" | "revealAt">,
  at: Date = new Date(),
): boolean {
  if (isMarketPulseCycleRevealed(cycle, at)) {
    return true;
  }
  return at >= effectiveCardRevealAt(card, cycle);
}

export function getMarketPulseCardPublicPayload(
  card: MarketPulseCard,
  options: {
    cycle: Pick<MarketPulseCycle, "status" | "revealAt">;
    at?: Date;
  },
): MarketPulseCardPublicPayload {
  const at = options.at ?? new Date();
  const revealed = isMarketPulseCardRevealed(card, options.cycle, at);

  const payload: MarketPulseCardPublicPayload = {
    id: card.id,
    cycleId: card.cycleId,
    dayIndex: card.dayIndex,
    companyName: card.companyName,
    companyNameZh: card.companyNameZh,
    ticker: card.ticker,
    exchange: card.exchange,
    logoUrl: card.logoUrl,
    priceLabel: card.priceLabel,
    priceDirection: card.priceDirection,
    headline: card.headline,
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    sourceDate: card.sourceDate,
    summary: card.summary,
    status: card.status,
    publishedAt: card.publishedAt,
    revealAt: card.revealAt,
    isRevealed: revealed,
  };

  if (revealed) {
    if (card.ppaSignal) {
      payload.ppaSignal = card.ppaSignal;
    }
    if (card.ppaInsight != null) {
      payload.ppaInsight = card.ppaInsight;
    }
  }

  return payload;
}
