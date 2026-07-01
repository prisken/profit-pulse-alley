"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Sparkles,
  Trophy,
  Unlock,
  XCircle,
} from "lucide-react";

import MarketPulseCountdown from "@/components/market-pulse/MarketPulseCountdown";
import MarketPulseInlineDisclaimer from "@/components/market-pulse/MarketPulseInlineDisclaimer";
import RevealStatePanel, {
  RevealLockedPreview,
} from "@/components/market-pulse/RevealStatePanel";
import {
  MarketPulseGlowBackground,
  MarketPulseProofChip,
  MarketPulseStatusChip,
  MarketPulseSurface,
  MP_FOCUS_RING,
  mergeMpClasses,
} from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  PARTICIPATION_POINTS,
  MATCH_BONUS_POINTS,
  STREAK_BONUS_POINTS,
  getSignalTone,
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import type {
  MarketPulseRevealCardRow,
  MarketPulseRevealPageData,
} from "@/lib/market-pulse/types";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";
import {
  formatMarketPulseCardDayLabelLocalized,
} from "@/lib/market-pulse/card-play-order";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
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

function ScoreStat({
  label,
  value,
  index,
  highlight = false,
}: Readonly<{
  label: string;
  value: string;
  index: number;
  highlight?: boolean;
}>) {
  const reduceMotion = useReducedMotion() ?? false;
  const className = mergeMpClasses(
    "rounded-xl border bg-zinc-950/50 px-3 py-3 text-center sm:rounded-2xl sm:px-4 sm:py-4",
    highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800/80",
  );
  const content = (
    <>
      <p className="text-[10px] font-semibold normal-case tracking-wide text-zinc-500 sm:text-xs">
        {label}
      </p>
      <p
        className={mergeMpClasses(
          "mt-1.5 text-xl font-bold tabular-nums sm:mt-2 sm:text-2xl",
          highlight ? "text-emerald-300" : "text-white",
        )}
      >
        {value}
      </p>
    </>
  );

  if (reduceMotion) {
    return <div className={className}>{content}</div>;
  }

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className={className}
    >
      {content}
    </motion.div>
  );
}

function ScoreLine({
  label,
  points,
  highlight,
}: Readonly<{
  label: string;
  points: number;
  highlight?: boolean;
}>) {
  if (points <= 0) {
    return null;
  }
  return (
    <li
      className={`flex items-center justify-between text-sm ${
        highlight ? "font-semibold text-emerald-300" : "text-zinc-400"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">+{points}</span>
    </li>
  );
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

function RevealCardItem({
  card,
  index,
}: Readonly<{ card: MarketPulseRevealCardRow; index: number }>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const isRestCard = card.isRestCard;
  const userTone = isRestCard
    ? null
    : getSignalTone(card.userDecision as MarketPulseDecision);
  const ppaTone = isRestCard || !card.ppaSignal
    ? null
    : getSignalTone(card.ppaSignal as MarketPulseDecision);
  const formatDecision = (decision: MarketPulseDecision) =>
    t(decision === "BULLISH" ? "signal.bullish" : "signal.cautious");

  const articleClassName = `overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-900/90 to-zinc-950 shadow-xl shadow-black/25 sm:rounded-2xl ${
    isRestCard
      ? "border-sky-500/25"
      : card.isMatch
        ? "border-emerald-500/25"
        : "border-zinc-800"
  }`;

  const articleBody = (
    <>
      <div className="border-b border-zinc-800/80 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs">
                {formatRevealCardDayLabel(card, t)}
              </p>
              {isRestCard ? (
                <MarketPulseProofChip
                  label={t("mp.rest.badge")}
                  variant="lockedUntilReveal"
                />
              ) : (
                <MarketPulseProofChip
                  label={
                    card.isMatch
                      ? t("mp.reveal.card.match")
                      : t("mp.reveal.card.noMatch")
                  }
                  variant={card.isMatch ? "participation" : "lockedUntilReveal"}
                  icon={
                    card.isMatch ? (
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                    )
                  }
                />
              )}
            </div>
            <h3 className="mt-1 line-clamp-2 break-words text-base font-semibold text-white sm:text-lg">
              {isRestCard ? card.headline : card.companyName}
            </h3>
            {!isRestCard ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:mt-1 sm:text-sm">
                {card.headline}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5">
        {isRestCard ? (
          <div className="rounded-lg border border-sky-500/15 bg-sky-500/5 px-2.5 py-2 sm:col-span-2 sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              {t("mp.reveal.card.restParticipation")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-sky-300 sm:mt-1">
              {t("mp.play.completion.acknowledged")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-3">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2 sm:border-0 sm:bg-transparent sm:p-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
                {t("mp.reveal.card.yourCall")}
              </p>
              <p className={`mt-0.5 text-sm font-semibold sm:mt-1 ${userTone!.textClass}`}>
                {formatDecision(card.userDecision as MarketPulseDecision)}
              </p>
            </div>
            <div className="rounded-lg border border-sky-500/15 bg-sky-500/5 px-2.5 py-2 sm:border-0 sm:bg-transparent sm:p-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
                {t("mp.reveal.card.ppaSignal")}
              </p>
              <p className={`mt-0.5 text-sm font-semibold sm:mt-1 ${ppaTone!.textClass}`}>
                {formatDecision(card.ppaSignal as MarketPulseDecision)}
              </p>
            </div>
          </div>
        )}

        <div
          className={`rounded-lg border bg-zinc-950/60 p-2.5 sm:rounded-xl sm:p-4 ${
            isRestCard ? "border-sky-500/15 sm:col-span-2" : "border-emerald-500/15"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
            {t("mp.reveal.card.score")}
          </p>
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
            {t("mp.reveal.card.points").replace("{points}", formatPoints(card.totalPoints))}
          </p>
        </div>
      </div>

      {card.ppaInsight && !isRestCard ? (
        <details className="group border-t border-emerald-500/15 bg-emerald-500/5">
          <summary
            className={`cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 marker:content-none sm:px-5 sm:py-3 sm:text-[11px] [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="group-open:hidden">{t("mp.reveal.card.showInsight")}</span>
              <span className="hidden group-open:inline">{t("mp.reveal.card.hideInsight")}</span>
            </span>
          </summary>
          <div className="border-t border-emerald-500/10 px-3 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-3">
            <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
              {card.ppaInsight}
            </p>
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

function RevealLiveHeader({
  cycleName,
}: Readonly<{ cycleName: string }>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;

  const headerClassName =
    "relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-950 px-4 py-6 text-center shadow-2xl shadow-emerald-950/20 sm:rounded-3xl sm:px-10 sm:py-10";

  const headerContent = (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_50%)]"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-3">
        <MarketPulseStatusChip
          variant="live"
          label={t("mp.reveal.live.title")}
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          showPulse
          className="motion-reduce:[&_span]:animate-none"
        />
        <Trophy
          className="h-10 w-10 text-amber-400 sm:h-12 sm:w-12"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {t("mp.reveal.ceremony.title")}
          </h1>
          <p className="mt-1.5 text-balance text-base text-zinc-300 sm:mt-2 sm:text-lg">
            {cycleName}
          </p>
          <p className="mt-2 text-pretty text-sm text-zinc-400">
            {t("mp.reveal.live.subtitle")}
          </p>
        </div>
      </div>
    </>
  );

  if (reduceMotion) {
    return <header className={headerClassName}>{headerContent}</header>;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className={headerClassName}
    >
      {headerContent}
    </motion.header>
  );
}

function LearningFraming() {
  const { t } = useTranslations();

  return (
    <p className="mt-4 rounded-xl border border-sky-500/15 bg-sky-500/5 px-4 py-3 text-center text-sm leading-relaxed text-sky-100/90 sm:mt-6 sm:text-[15px]">
      {t("mp.reveal.learning.framing")}
    </p>
  );
}

function PersonalScoreSummary({
  results,
}: Readonly<{ results: NonNullable<MarketPulseRevealPageData["results"]> }>) {
  const { t } = useTranslations();

  return (
    <section
      className="mt-6 sm:mt-8"
      aria-labelledby="reveal-score-summary-heading"
    >
      <h2
        id="reveal-score-summary-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-xs"
      >
        {t("mp.reveal.ceremony.label")}
      </h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-5">
        <ScoreStat
          index={0}
          highlight
          label={t("mp.reveal.stats.totalScore")}
          value={formatPoints(results.totalPoints)}
        />
        <ScoreStat
          index={1}
          label={t("mp.reveal.stats.participation")}
          value={formatPoints(results.totals.participationPoints)}
        />
        <ScoreStat
          index={2}
          label={t("mp.reveal.stats.matchPoints")}
          value={formatPoints(results.totals.matchBonus)}
        />
        <ScoreStat
          index={3}
          label={t("mp.reveal.stats.streakPoints")}
          value={formatPoints(results.totals.streakBonus)}
        />
        <ScoreStat
          index={4}
          label={t("mp.reveal.stats.finalRank")}
          value={results.rank != null ? `#${results.rank}` : "—"}
        />
      </div>
    </section>
  );
}

function PendingState({
  data,
}: Readonly<{ data: MarketPulseRevealPageData }>) {
  const { t } = useTranslations();

  return (
    <div>
      <RevealStatePanel
        variant="locked"
        title={t("mp.reveal.pending.title")}
        body={
          data.pendingCycle
            ? t("mp.reveal.pending.withCycle").replace("{name}", data.pendingCycle.name)
            : t("mp.reveal.pending.noCycle")
        }
      />
      {data.pendingCycle ? (
        <MarketPulseSurface
          variant="glass"
          density="compact"
          className="mx-auto mt-6 max-w-md"
        >
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {t("mp.reveal.pending.countdownLabel")}
          </p>
          <MarketPulseCountdown targetDate={data.pendingCycle.revealAtIso} />
        </MarketPulseSurface>
      ) : null}
      <RevealLockedPreview />
      <RevealCtaBar
        playNextAvailable={data.playNextAvailable}
        reportRequested={false}
        onReportClick={() => undefined}
        showReport={false}
      />
    </div>
  );
}

function GuestRevealedState({
  data,
}: Readonly<{ data: MarketPulseRevealPageData }>) {
  const { t } = useTranslations();
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/market-pulse/reveal")}`;

  return (
    <div>
      {data.revealedCycle ? (
        <RevealLiveHeader cycleName={data.revealedCycle.name} />
      ) : null}
      <LearningFraming />
      <RevealStatePanel
        variant="guest"
        className="mt-6"
        title={t("mp.reveal.guest.title")}
        body={t("mp.reveal.guest.body")}
      />
      <div className="mt-6 flex justify-center">
        <Link
          href={loginHref}
          className={`inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-400 px-8 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 ${focusRing}`}
        >
          {t("mp.reveal.guest.signIn")}
        </Link>
      </div>
    </div>
  );
}

function NoParticipationState({
  data,
}: Readonly<{ data: MarketPulseRevealPageData }>) {
  const { t } = useTranslations();
  const cycleName =
    data.results?.cycleName ?? data.revealedCycle?.name ?? "";

  return (
    <div>
      {cycleName ? <RevealLiveHeader cycleName={cycleName} /> : null}
      <LearningFraming />
      <RevealStatePanel
        variant="no_participation"
        className="mt-6"
        title={t("mp.reveal.noParticipation.title")}
        body={t("mp.reveal.noParticipation.body")}
      />
    </div>
  );
}

export default function MarketPulseRevealExperience({
  data,
}: Readonly<{ data: MarketPulseRevealPageData }>) {
  const { t } = useTranslations();
  const [reportRequested, setReportRequested] = useState(false);

  useEffect(() => {
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.reveal_viewed, {
      status: data.status,
      cycleId: data.results?.cycleId ?? data.revealedCycle?.id,
      surface: "reveal",
      route: "/market-pulse/reveal",
    });
  }, [data.results?.cycleId, data.revealedCycle?.id, data.status]);

  const handleReportClick = () => {
    setReportRequested(true);
    trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.report_downloaded, {
      cycleId: data.results?.cycleId,
      surface: "reveal",
    });
  };

  const cycleId = data.results?.cycleId ?? data.revealedCycle?.id;

  if (data.status === "pending") {
    return (
      <MarketPulseGlowBackground accent="amber" innerClassName="min-h-screen">
        <PageShell cycleId={cycleId}>
          <PendingState data={data} />
        </PageShell>
      </MarketPulseGlowBackground>
    );
  }

  if (!data.isAuthenticated || !data.results) {
    return (
      <MarketPulseGlowBackground accent="dual" innerClassName="min-h-screen">
        <PageShell cycleId={cycleId}>
          <GuestRevealedState data={data} />
          <RevealCtaBar
            playNextAvailable={data.playNextAvailable}
            reportRequested={reportRequested}
            onReportClick={handleReportClick}
            showReport={false}
          />
        </PageShell>
      </MarketPulseGlowBackground>
    );
  }

  const { results } = data;

  if (results.cards.length === 0) {
    return (
      <MarketPulseGlowBackground accent="dual" innerClassName="min-h-screen">
        <PageShell cycleId={cycleId}>
          <NoParticipationState data={data} />
          <RevealCtaBar
            playNextAvailable={data.playNextAvailable}
            reportRequested={reportRequested}
            onReportClick={handleReportClick}
            showReport={false}
          />
        </PageShell>
      </MarketPulseGlowBackground>
    );
  }

  return (
    <MarketPulseGlowBackground accent="dual" innerClassName="min-h-screen">
      <PageShell cycleId={cycleId}>
        <RevealLiveHeader cycleName={results.cycleName} />
        <LearningFraming />
        <PersonalScoreSummary results={results} />

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 sm:mt-10"
          aria-labelledby="reveal-cards-heading"
        >
          <h2
            id="reveal-cards-heading"
            className="text-lg font-semibold text-white sm:text-2xl"
          >
            {t("mp.reveal.breakdown.title")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            {t("mp.reveal.breakdown.subtitle")}
          </p>
          <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
            {results.cards.map((card, index) => (
              <RevealCardItem key={card.cardId} card={card} index={index} />
            ))}
          </div>
        </motion.section>

        <RevealCtaBar
          playNextAvailable={data.playNextAvailable}
          reportRequested={reportRequested}
          onReportClick={handleReportClick}
          showReport
        />
      </PageShell>
    </MarketPulseGlowBackground>
  );
}

function RevealCtaBar({
  playNextAvailable,
  reportRequested,
  onReportClick,
  showReport,
}: Readonly<{
  playNextAvailable: boolean;
  reportRequested: boolean;
  onReportClick: () => void;
  showReport: boolean;
}>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { delay: 0.4 }}
      className="mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3"
    >
      <Link
        href="/market-pulse/leaderboard"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 sm:w-auto ${focusRing}`}
      >
        {t("mp.reveal.cta.leaderboard")}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link
        href="/market-pulse"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 sm:w-auto ${focusRing}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("mp.reveal.cta.hub")}
      </Link>
      {playNextAvailable ? (
        <Link
          href="/market-pulse/play"
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 sm:w-auto ${focusRing}`}
        >
          {t("mp.reveal.cta.nextChallenge")}
        </Link>
      ) : null}
      {showReport ? (
        <button
          type="button"
          onClick={onReportClick}
          aria-live="polite"
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-950/60 px-6 text-sm font-semibold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 sm:w-auto ${focusRing}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {reportRequested ? t("mp.reveal.cta.comingSoon") : t("mp.reveal.cta.download")}
        </button>
      ) : null}
    </motion.div>
  );
}

function PageShell({
  children,
  cycleId,
}: Readonly<{ children: React.ReactNode; cycleId?: string }>) {
  const { t } = useTranslations();

  return (
    <div className="relative mx-auto flex w-full min-w-0 max-w-3xl flex-col overflow-x-hidden px-3 py-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
      <Link
        href="/market-pulse"
        className={`mb-4 inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-white sm:mb-6 ${focusRing}`}
      >
        {t("mp.reveal.back")}
      </Link>
      {children}
      <MarketPulseInlineDisclaimer
        className="mt-8 sm:mt-10"
        surface="reveal"
        cycleId={cycleId}
      />
    </div>
  );
}
