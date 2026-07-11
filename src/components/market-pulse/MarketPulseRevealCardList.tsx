"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Unlock, XCircle } from "lucide-react";

import {
  MarketPulseProofChip,
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  MATCH_BONUS_POINTS,
  PARTICIPATION_POINTS,
  STREAK_BONUS_POINTS,
  getSignalTone,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import {
  formatMarketPulseCardDayLabelLocalized,
} from "@/lib/market-pulse/card-play-order";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";
import type { MarketPulseRevealCardRow } from "@/lib/market-pulse/types";
import type { MessageKey } from "@/lib/i18n/messages";

const focusRing = MP_FOCUS_RING;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: MARKET_PULSE_EASE },
  }),
};

function formatPoints(value: number): string {
  return new Intl.NumberFormat("en-HK").format(value);
}

function formatRevealCardDayLabel(
  card: MarketPulseRevealCardRow,
  t: (key: MessageKey) => string,
): string {
  return formatMarketPulseCardDayLabelLocalized(
    card.dayIndex,
    card.sortOrder,
    card.cardsOnDay,
    {
      single: (day) => t("mp.reveal.card.day").replace("{day}", String(day)),
      multi: (day, cardNumber) =>
        t("mp.reveal.card.dayMulti")
          .replace("{day}", String(day))
          .replace("{card}", String(cardNumber)),
    },
  );
}

function formatDecisionLabel(
  decision: MarketPulseDecision,
  t: (key: MessageKey) => string,
): string {
  return t(decision === "BULLISH" ? "signal.bullish" : "signal.cautious");
}

function ScoreLine({
  label,
  points,
  highlight,
}: Readonly<{
  label: string;
  points: number | null;
  highlight?: boolean;
}>) {
  if (points == null || points <= 0) {
    return null;
  }

  return (
    <li
      className={mergeMpClasses(
        "flex items-center justify-between text-sm",
        highlight ? "font-semibold text-emerald-300" : "text-zinc-400",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">+{points}</span>
    </li>
  );
}

function RevealCardItem({
  card,
  index,
}: Readonly<{ card: MarketPulseRevealCardRow; index: number }>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const isRestCard = card.isRestCard;
  const played = card.played;
  const userTone =
    !isRestCard && played && card.viewerDecision
      ? getSignalTone(card.viewerDecision as MarketPulseDecision)
      : null;
  const ppaTone =
    isRestCard || !card.ppaSignal
      ? null
      : getSignalTone(card.ppaSignal as MarketPulseDecision);

  const articleClassName = mergeMpClasses(
    "overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-900/90 to-zinc-950 shadow-xl shadow-black/25 sm:rounded-2xl",
    !played
      ? "border-zinc-700/80"
      : isRestCard
        ? "border-sky-500/25"
        : card.isMatch === true
          ? "border-emerald-500/25"
          : "border-zinc-800",
  );

  const articleBody = (
    <>
      <div className="border-b border-zinc-800/80 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs">
            {formatRevealCardDayLabel(card, t)}
          </p>
          <MarketPulseProofChip
            label={played ? t("mp.reveal.card.played") : t("mp.reveal.card.notPlayed")}
            variant={played ? "participation" : "lockedUntilReveal"}
          />
          {isRestCard ? (
            <MarketPulseProofChip
              label={t("mp.cardType.rest")}
              variant="lockedUntilReveal"
            />
          ) : null}
          {played && !isRestCard && card.isMatch === true ? (
            <MarketPulseProofChip
              label={t("mp.reveal.card.match")}
              variant="participation"
              icon={<CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
            />
          ) : null}
          {played && !isRestCard && card.isMatch === false ? (
            <MarketPulseProofChip
              label={t("mp.reveal.card.noMatch")}
              variant="lockedUntilReveal"
              icon={<XCircle className="h-3 w-3" aria-hidden="true" />}
            />
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 break-words text-base font-semibold text-white sm:text-lg">
          {isRestCard ? card.headline : card.companyName}
        </h3>
        {!isRestCard ? (
          <>
            {card.ticker ? (
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:text-sm">
                {card.ticker}
              </p>
            ) : null}
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:mt-1 sm:text-sm">
              {card.headline}
            </p>
          </>
        ) : null}
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5">
        {isRestCard ? (
          <div className="rounded-lg border border-sky-500/15 bg-sky-500/5 px-2.5 py-2 sm:col-span-2 sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              {t("mp.reveal.card.restParticipation")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-sky-300 sm:mt-1">
              {played
                ? t("mp.play.completion.acknowledged")
                : t("mp.reveal.card.restNotClaimed")}
            </p>
            {!played ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                {t("mp.reveal.card.skippedHint")}
              </p>
            ) : null}
          </div>
        ) : played ? (
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2 sm:col-span-2 sm:border-0 sm:bg-transparent sm:p-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              {t("mp.reveal.card.yourCall")}
            </p>
            <p
              className={mergeMpClasses(
                "mt-0.5 text-sm font-semibold sm:mt-1",
                userTone ? userTone.textClass : "text-zinc-500",
              )}
            >
              {card.viewerDecision
                ? formatDecisionLabel(card.viewerDecision as MarketPulseDecision, t)
                : "—"}
            </p>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500 sm:col-span-2 sm:text-sm">
            {t("mp.reveal.card.skippedHint")}
          </p>
        )}

        {!isRestCard ? (
          <div className="rounded-lg border border-sky-500/15 bg-sky-500/5 px-2.5 py-2 sm:col-span-2 sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              {t("mp.reveal.card.ppaSignal")}
            </p>
            <p
              className={mergeMpClasses(
                "mt-0.5 text-sm font-semibold sm:mt-1",
                ppaTone ? ppaTone.textClass : "text-zinc-500",
              )}
            >
              {card.ppaSignal
                ? formatDecisionLabel(card.ppaSignal as MarketPulseDecision, t)
                : "—"}
            </p>
          </div>
        ) : null}

        {played ? (
          <div
            className={mergeMpClasses(
              "rounded-lg border bg-zinc-950/60 p-2.5 sm:rounded-xl sm:p-4",
              isRestCard ? "border-sky-500/15 sm:col-span-2" : "border-emerald-500/15 sm:col-span-2",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              {t("mp.reveal.card.score")}
            </p>
            {card.totalPoints != null ? (
              <>
                <ul className="mt-1.5 space-y-1 sm:mt-2 sm:space-y-1.5">
                  <ScoreLine
                    label={t("mp.reveal.card.participation").replace(
                      "{points}",
                      String(PARTICIPATION_POINTS),
                    )}
                    points={card.participationPoints}
                  />
                  {!isRestCard ? (
                    <>
                      <ScoreLine
                        label={t("mp.reveal.card.matchBonus").replace(
                          "{points}",
                          String(MATCH_BONUS_POINTS),
                        )}
                        points={card.matchBonus}
                        highlight
                      />
                      <ScoreLine
                        label={t("mp.reveal.card.streakBonus").replace(
                          "{points}",
                          String(STREAK_BONUS_POINTS),
                        )}
                        points={card.streakBonus}
                        highlight
                      />
                    </>
                  ) : null}
                </ul>
                <p className="mt-2 border-t border-zinc-800 pt-2 text-sm font-bold tabular-nums text-emerald-300 sm:mt-3 sm:pt-3">
                  {t("mp.reveal.card.points").replace(
                    "{points}",
                    formatPoints(card.totalPoints),
                  )}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">{t("mp.reveal.card.scorePending")}</p>
            )}
          </div>
        ) : null}
      </div>

      {card.ppaInsight && !isRestCard ? (
        <details className="group border-t border-emerald-500/15 bg-emerald-500/5">
          <summary
            className={`cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 marker:content-none sm:px-5 sm:py-3 sm:text-[11px] [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="group-open:hidden">
                {t("mp.reveal.card.showInsight")}
              </span>
              <span className="hidden group-open:inline">
                {t("mp.reveal.card.hideInsight")}
              </span>
              <span className="sr-only">{t("mp.reveal.card.ppaInsight")}</span>
            </span>
          </summary>
          <div className="border-t border-emerald-500/10 px-3 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-3">
            <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">{card.ppaInsight}</p>
          </div>
        </details>
      ) : null}
    </>
  );

  if (reduceMotion) {
    return <article className={articleClassName}>{articleBody}</article>;
  }

  return (
    <motion.article
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className={articleClassName}
    >
      {articleBody}
    </motion.article>
  );
}

export default function MarketPulseRevealCardList({
  cards,
}: Readonly<{ cards: MarketPulseRevealCardRow[] }>) {
  return (
    <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
      {cards.map((card, index) => (
        <RevealCardItem key={card.cardId} card={card} index={index} />
      ))}
    </div>
  );
}
