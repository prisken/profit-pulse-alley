"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ImageIcon,
  Loader2,
  Minus,
} from "lucide-react";

import DecisionLockedCard from "@/components/market-pulse/DecisionLockedCard";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { translateMarketPulseError } from "@/lib/i18n/market-pulse-ui";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import {
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import type {
  MarketPulseSwipeCardData,
  MarketPulseSwipeSubmitResult,
} from "@/lib/market-pulse/types";

const SWIPE_THRESHOLD = 110;
const EXIT_DISTANCE = 720;
const DRAG_BIAS_THRESHOLD = 36;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

const springSnap = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };
const springExit = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.9 };
const springEntrance = { type: "spring" as const, stiffness: 300, damping: 28 };

type CardPhase = "idle" | "submitting" | "locked";
type DragBias = "neutral" | "bullish" | "cautious";

export type MarketPulseSwipeCardAnalyticsContext = {
  cycleId?: string;
  dayIndex?: number;
};

export type MarketPulseSwipeCardProps = {
  card: MarketPulseSwipeCardData;
  onSubmit: (decision: MarketPulseDecision) => Promise<MarketPulseSwipeSubmitResult>;
  initialDecision?: MarketPulseDecision | null;
  disabled?: boolean;
  analyticsContext?: MarketPulseSwipeCardAnalyticsContext;
  revealMessage?: string;
  lockedFooterMessage?: string;
  className?: string;
};

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function formatSourceDate(
  value: string | Date | null | undefined,
  locale: "en-HK" | "zh-HK",
): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

function priceDirectionTone(direction: string | null | undefined): {
  icon: typeof ArrowUpRight;
  pillClass: string;
  iconClass: string;
} {
  const normalized = direction?.trim().toLowerCase() ?? "";
  if (
    normalized.includes("up") ||
    normalized.includes("bull") ||
    normalized.startsWith("+")
  ) {
    return {
      icon: ArrowUpRight,
      pillClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
      iconClass: "text-emerald-400",
    };
  }
  if (
    normalized.includes("down") ||
    normalized.includes("bear") ||
    normalized.startsWith("-")
  ) {
    return {
      icon: ArrowDownRight,
      pillClass: "border-amber-500/50 bg-amber-500/15 text-amber-300",
      iconClass: "text-amber-400",
    };
  }
  return {
    icon: Minus,
    pillClass: "border-zinc-500/40 bg-zinc-800/80 text-zinc-300",
    iconClass: "text-zinc-400",
  };
}

function TriangleLeft({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 12 14"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M11 1.5v11L2 7z" />
    </svg>
  );
}

function TriangleRight({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 12 14"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M1 1.5v11l9-5.5z" />
    </svg>
  );
}

function SwipeStamp({
  label,
  opacity,
  rotate,
  tone,
}: Readonly<{
  label: string;
  opacity: MotionValue<number>;
  rotate: MotionValue<number>;
  tone: "bullish" | "cautious";
}>) {
  const isBullish = tone === "bullish";

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity, rotate }}
      className={`pointer-events-none absolute bottom-36 z-30 rounded-lg border-2 px-3 py-1.5 shadow-lg backdrop-blur-sm sm:bottom-40 ${
        isBullish
          ? "right-3 border-emerald-400/80 bg-emerald-500/20 text-emerald-100 sm:right-4"
          : "left-3 border-amber-400/80 bg-amber-500/20 text-amber-100 sm:left-4"
      }`}
    >
      <span className="text-sm font-black uppercase tracking-[0.14em] sm:text-base">
        {label}
      </span>
    </motion.div>
  );
}

function CardImage({
  imageUrl,
  imageAlt,
}: Readonly<{ imageUrl?: string | null; imageAlt?: string | null }>) {
  const { t } = useTranslations();

  if (imageUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt?.trim() || t("mp.card.imageAlt")}
          className="aspect-video w-full max-w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-2 text-zinc-600">
        <ImageIcon className="h-8 w-8 opacity-40" />
        <span className="text-[11px] font-medium uppercase tracking-wider opacity-60">
          {t("mp.card.noImage")}
        </span>
      </div>
    </div>
  );
}

function CardBody({
  card,
}: Readonly<{ card: MarketPulseSwipeCardData }>) {
  const { t, locale } = useLocale();
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  const sourceDateLabel = formatSourceDate(card.sourceDate, intlLocale);
  const priceTone = priceDirectionTone(card.priceDirection);
  const PriceIcon = priceTone.icon;
  const initials =
    card.logoInitials?.trim() || companyInitials(card.companyName);

  return (
    <>
      <section className="shrink-0">
        <p className="text-xs font-bold uppercase tracking-wide text-red-500">
          {t("mp.card.label.headline")}
        </p>
        <h3
          id={`card-headline-${card.id}`}
          className="mt-1 break-words text-balance text-base font-bold leading-snug text-white sm:text-lg"
        >
          {card.headline}
        </h3>
        {card.newsBody ? (
          <p className="mt-2 break-words text-pretty text-sm leading-relaxed text-zinc-300">
            {card.newsBody}
          </p>
        ) : null}
        {(card.sourceName || sourceDateLabel) && (
          <div className="mt-3 flex flex-wrap justify-end gap-x-1.5 gap-y-0.5 text-right text-[11px] text-zinc-500 sm:text-xs">
            {card.sourceName ? (
              <span className="font-medium text-zinc-400">{card.sourceName}</span>
            ) : null}
            {card.sourceName && sourceDateLabel ? (
              <span className="text-zinc-600" aria-hidden="true">
                ·
              </span>
            ) : null}
            {sourceDateLabel ? (
              <time
                dateTime={
                  card.sourceDate instanceof Date
                    ? card.sourceDate.toISOString()
                    : card.sourceDate ?? undefined
                }
              >
                {sourceDateLabel}
              </time>
            ) : null}
          </div>
        )}
      </section>

      <section className="shrink-0">
        <div className="flex items-center gap-3">
          {card.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.logoUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-white/20 bg-white/5 object-cover"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-zinc-900 text-sm font-bold text-white"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white sm:text-base">
              {card.companyName}
            </p>
            {card.companyNameZh ? (
              <p className="truncate text-[11px] text-zinc-500">{card.companyNameZh}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-full border border-white/20 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-white sm:text-[11px]">
                {card.ticker}
              </span>
              {card.exchange ? (
                <span className="text-[10px] text-zinc-500 sm:text-[11px]">
                  {card.exchange}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {(card.priceLabel || card.priceDirection) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {card.priceLabel ? (
              <span className="inline-flex rounded-full border border-white/20 bg-black px-2.5 py-1 text-xs font-semibold tabular-nums text-white sm:text-sm">
                {card.priceLabel}
              </span>
            ) : null}
            {card.priceDirection ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${priceTone.pillClass}`}
              >
                <PriceIcon className={`h-3 w-3 ${priceTone.iconClass}`} aria-hidden="true" />
                {card.priceDirection}
              </span>
            ) : null}
          </div>
        )}
      </section>

      <CardImage imageUrl={card.cardImageUrl} imageAlt={card.cardImageAlt} />

      {card.summary ? (
        <section className="shrink-0 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("mp.card.label.summary")}
          </p>
          <p className="mt-1.5 break-words text-pretty text-sm leading-relaxed text-zinc-200">
            {card.summary}
          </p>
        </section>
      ) : null}
    </>
  );
}

function CardPrompt({
  card,
}: Readonly<{ card: MarketPulseSwipeCardData }>) {
  const { t } = useTranslations();
  const promptText = card.userPrompt?.trim() || t("prompt.defaultRead");

  return (
    <p className="text-center text-sm font-medium leading-snug text-zinc-300">
      {promptText}
    </p>
  );
}

function SwipeHint({ reduceMotion }: Readonly<{ reduceMotion: boolean }>) {
  const { t } = useTranslations();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.35 }}
      className="mb-1.5 flex shrink-0 items-center justify-center gap-2 text-[11px] text-zinc-500 sm:mb-2 sm:gap-3 sm:text-xs"
      aria-hidden="true"
    >
      <motion.span
        animate={reduceMotion ? undefined : { x: [-2, -5, -2] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center gap-0.5 text-amber-400/90"
      >
        <ArrowLeft className="h-3 w-3" />
        {t("signal.cautious")}
      </motion.span>
      <span className="text-zinc-600">{t("mp.card.swipe.orTap")}</span>
      <motion.span
        animate={reduceMotion ? undefined : { x: [2, 5, 2] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center gap-0.5 text-emerald-400/90"
      >
        {t("signal.bullish")}
        <ArrowRight className="h-3 w-3" />
      </motion.span>
    </motion.div>
  );
}

function DecisionButton({
  decision,
  active,
  disabled,
  reduceMotion,
  onClick,
}: Readonly<{
  decision: MarketPulseDecision;
  active: boolean;
  disabled: boolean;
  reduceMotion: boolean;
  onClick: () => void;
}>) {
  const { t } = useTranslations();
  const isBullish = decision === "BULLISH";
  const label = t(isBullish ? "signal.bullish" : "signal.cautious");

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={t("mp.card.aria.choose").replace("{label}", label)}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: active ? 1.02 : 1,
            }
      }
      transition={springSnap}
      className={`inline-flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-xl border-2 bg-black px-3 py-3 text-base font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-14 sm:text-lg ${focusRing} ${
        isBullish
          ? `border-emerald-500 hover:bg-emerald-500/10 ${
              active ? "bg-emerald-500/15 ring-2 ring-emerald-500/40" : ""
            }`
          : `border-amber-500 hover:bg-amber-500/10 ${
              active ? "bg-amber-500/15 ring-2 ring-amber-500/40" : ""
            }`
      }`}
    >
      {!isBullish ? (
        <TriangleLeft className="h-3.5 w-3.5 shrink-0 text-amber-400 sm:h-4 sm:w-4" />
      ) : null}
      <span>{label}</span>
      {isBullish ? (
        <TriangleRight className="h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4" />
      ) : null}
    </motion.button>
  );
}

export default function MarketPulseSwipeCard({
  card,
  onSubmit,
  initialDecision = null,
  disabled = false,
  analyticsContext,
  revealMessage,
  lockedFooterMessage,
  className = "",
}: MarketPulseSwipeCardProps) {
  const { t, locale } = useLocale();
  const reduceMotion = useReducedMotion() ?? false;
  const submittingRef = useRef(false);

  const [phase, setPhase] = useState<CardPhase>(
    initialDecision ? "locked" : "idle",
  );
  const [lockedDecision, setLockedDecision] = useState<MarketPulseDecision | null>(
    initialDecision,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exitX, setExitX] = useState(0);
  const [dragBias, setDragBias] = useState<DragBias>("neutral");

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-280, 0, 280], reduceMotion ? [0, 0, 0] : [-10, 0, 10]);
  const scale = useTransform(x, [-180, 0, 180], reduceMotion ? [1, 1, 1] : [1.02, 1, 1.02]);
  const cardOpacity = useTransform(x, [-280, -120, 0, 120, 280], [0.94, 1, 1, 1, 0.94]);

  const bullishStampOpacity = useTransform(x, [0, 50, SWIPE_THRESHOLD], [0, 0.55, 1]);
  const cautiousStampOpacity = useTransform(x, [-SWIPE_THRESHOLD, -50, 0], [1, 0.55, 0]);
  const bullishStampRotate = useTransform(x, [0, SWIPE_THRESHOLD], [8, -6]);
  const cautiousStampRotate = useTransform(x, [-SWIPE_THRESHOLD, 0], [6, -8]);

  const bullishGlow = useTransform(x, [0, 40, 140], [0, 0.15, 0.35]);
  const cautiousGlow = useTransform(x, [-140, -40, 0], [0.35, 0.15, 0]);

  useMotionValueEvent(x, "change", (latest) => {
    if (phase !== "idle") {
      return;
    }
    if (latest > DRAG_BIAS_THRESHOLD) {
      setDragBias("bullish");
    } else if (latest < -DRAG_BIAS_THRESHOLD) {
      setDragBias("cautious");
    } else {
      setDragBias("neutral");
    }
  });

  const interactionsDisabled =
    disabled || phase === "submitting" || phase === "locked";
  const swipeEnabled = !interactionsDisabled && !reduceMotion;
  const cardRegionLabel = disabled
    ? t("mp.card.aria.preview").replace("{company}", card.companyName)
    : t("mp.card.aria.playable").replace("{company}", card.companyName);

  const submitDecision = useCallback(
    async (decision: MarketPulseDecision) => {
      if (interactionsDisabled || submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setErrorMessage(null);
      setPhase("submitting");
      setExitX(decision === "BULLISH" ? EXIT_DISTANCE : -EXIT_DISTANCE);
      setDragBias(decision === "BULLISH" ? "bullish" : "cautious");

      try {
        const result = await onSubmit(decision);

        if (!result.ok) {
          submittingRef.current = false;
          setExitX(0);
          setPhase("idle");
          setDragBias("neutral");
          setErrorMessage(
            translateMarketPulseError(locale, result.error ?? t("mp.error.generic")),
          );
          x.set(0);
          return;
        }

        trackMarketPulseEvent(
          MARKET_PULSE_ANALYTICS_EVENTS.decision_submitted,
          {
            cardId: card.id,
            cycleId: analyticsContext?.cycleId,
            dayIndex: analyticsContext?.dayIndex,
            decision,
            surface: "play",
          },
        );

        await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 120 : 340));
        setLockedDecision(decision);
        setPhase("locked");

        trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.decision_locked, {
          cardId: card.id,
          cycleId: analyticsContext?.cycleId,
          dayIndex: analyticsContext?.dayIndex,
          decision,
          surface: "play",
        });
      } catch {
        submittingRef.current = false;
        setExitX(0);
        setPhase("idle");
        setDragBias("neutral");
        setErrorMessage(t("mp.error.generic"));
        x.set(0);
      }
    },
    [
      analyticsContext,
      card.id,
      interactionsDisabled,
      onSubmit,
      reduceMotion,
      x,
      locale,
      t,
    ],
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (interactionsDisabled || submittingRef.current) {
        x.set(0);
        return;
      }

      const offset = info.offset.x;
      const velocity = info.velocity.x;

      if (offset > SWIPE_THRESHOLD || velocity > 520) {
        void submitDecision("BULLISH");
        return;
      }
      if (offset < -SWIPE_THRESHOLD || velocity < -520) {
        void submitDecision("CAUTIOUS");
        return;
      }

      setDragBias("neutral");
    },
    [interactionsDisabled, submitDecision, x],
  );

  const exitRotate = exitX > 0 ? 12 : -12;

  const cardAnimate = useMemo(() => {
    if (phase === "submitting") {
      return {
        x: exitX,
        opacity: 0,
        rotate: reduceMotion ? 0 : exitRotate,
        scale: reduceMotion ? 1 : 0.92,
      };
    }
    if (phase === "locked") {
      return { x: exitX, opacity: 0, rotate: 0, scale: 0.95 };
    }
    return { x: 0, opacity: 1, rotate: 0, scale: 1 };
  }, [exitRotate, exitX, phase, reduceMotion]);

  if (phase === "locked" && lockedDecision) {
    return (
      <div className={`mx-auto w-full max-w-md overflow-x-hidden overflow-y-auto ${className}`}>
        <DecisionLockedCard
          decision={lockedDecision}
          revealMessage={revealMessage ?? t("mp.play.reveal.default")}
          footerMessage={lockedFooterMessage ?? t("mp.play.locked.footerShort")}
        />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex w-full min-h-0 max-w-md flex-col overflow-x-hidden ${className}`}
    >
      {!interactionsDisabled && !reduceMotion ? (
        <SwipeHint reduceMotion={reduceMotion} />
      ) : null}

      {reduceMotion && !interactionsDisabled ? (
        <p className="mb-1.5 shrink-0 text-center text-[11px] text-zinc-500 sm:mb-2 sm:text-xs">
          {t("mp.card.reducedMotionHint")}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden overscroll-x-contain">
          <motion.div
            aria-hidden="true"
            style={{ opacity: bullishGlow }}
            className="pointer-events-none absolute -inset-2 rounded-[1.25rem] bg-emerald-500/20 blur-xl"
          />
          <motion.div
            aria-hidden="true"
            style={{ opacity: cautiousGlow }}
            className="pointer-events-none absolute -inset-2 rounded-[1.25rem] bg-amber-500/15 blur-xl"
          />

          <AnimatePresence mode="wait">
            {phase !== "locked" ? (
              <motion.div
                key={card.id}
                initial={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 20, scale: 0.98 }
                }
                animate={cardAnimate}
                transition={phase === "submitting" ? springExit : springEntrance}
                className={`relative z-20 flex min-h-0 max-h-[min(82dvh,44rem)] flex-1 flex-col overflow-hidden rounded-2xl border-2 border-white/85 bg-black p-3 shadow-xl shadow-black/50 sm:rounded-2xl sm:p-4 ${
                  disabled ? "opacity-90" : ""
                } ${phase === "submitting" ? "pointer-events-none" : ""}`}
                role="region"
                aria-labelledby={`card-headline-${card.id}`}
                aria-label={cardRegionLabel}
              >
                <motion.div
                  style={
                    swipeEnabled
                      ? {
                          x,
                          rotate,
                          scale,
                          opacity: cardOpacity,
                          touchAction: "pan-y",
                        }
                      : undefined
                  }
                  drag={swipeEnabled ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.72}
                  dragMomentum={false}
                  dragPropagation={false}
                  onDragEnd={handleDragEnd}
                  className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
                    swipeEnabled ? "cursor-grab active:cursor-grabbing" : ""
                  }`}
                >
                  {!reduceMotion ? (
                    <>
                      <SwipeStamp
                        label={t("signal.bullish")}
                        opacity={bullishStampOpacity}
                        rotate={bullishStampRotate}
                        tone="bullish"
                      />
                      <SwipeStamp
                        label={t("signal.cautious")}
                        opacity={cautiousStampOpacity}
                        rotate={cautiousStampRotate}
                        tone="cautious"
                      />
                    </>
                  ) : null}

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
                    <CardBody card={card} />
                    {disabled ? <CardPrompt card={card} /> : null}
                  </div>
                </motion.div>

                {!disabled ? (
                  <div className="mt-3 shrink-0 space-y-2.5 border-t border-white/15 pt-3">
                    <CardPrompt card={card} />
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <DecisionButton
                        decision="CAUTIOUS"
                        active={dragBias === "cautious"}
                        disabled={interactionsDisabled}
                        reduceMotion={reduceMotion}
                        onClick={() => void submitDecision("CAUTIOUS")}
                      />
                      <DecisionButton
                        decision="BULLISH"
                        active={dragBias === "bullish"}
                        disabled={interactionsDisabled}
                        reduceMotion={reduceMotion}
                        onClick={() => void submitDecision("BULLISH")}
                      />
                    </div>
                  </div>
                ) : null}

                {phase === "submitting" ? (
                  <div
                    className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/75 backdrop-blur-[2px]"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Loader2
                        className={`h-5 w-5 ${reduceMotion ? "" : "animate-spin"}`}
                        aria-hidden="true"
                      />
                      {t("mp.card.submitting")}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {errorMessage ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-2 shrink-0 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-center text-sm text-rose-200"
          >
            {translateMarketPulseError(locale, errorMessage)}
          </motion.p>
        ) : null}
      </div>

      <p className="sr-only">
        {t("mp.card.aria.keyboard")}
      </p>
    </div>
  );
}
