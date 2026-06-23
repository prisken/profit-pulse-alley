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
  Loader2,
  Minus,
} from "lucide-react";

import DecisionLockedCard from "@/components/market-pulse/DecisionLockedCard";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import {
  SIGNAL_LABELS,
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

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

function formatSourceDate(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-HK", {
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
      pillClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
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
      pillClass: "border-rose-500/30 bg-rose-500/10 text-rose-200",
      iconClass: "text-rose-400",
    };
  }
  return {
    icon: Minus,
    pillClass: "border-zinc-600/40 bg-zinc-800/60 text-zinc-300",
    iconClass: "text-zinc-400",
  };
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
      className={`pointer-events-none absolute top-6 z-30 rounded-xl border-2 px-4 py-2 shadow-lg backdrop-blur-sm ${
        isBullish
          ? "right-6 border-emerald-400/70 bg-emerald-500/20 text-emerald-200 shadow-emerald-950/30"
          : "left-6 border-amber-400/70 bg-amber-500/20 text-amber-200 shadow-amber-950/30"
      }`}
    >
      <span className="text-lg font-black uppercase tracking-[0.18em] sm:text-xl">
        {label}
      </span>
    </motion.div>
  );
}

function CardContent({
  card,
}: Readonly<{ card: MarketPulseSwipeCardData }>) {
  const sourceDateLabel = formatSourceDate(card.sourceDate);
  const priceTone = priceDirectionTone(card.priceDirection);
  const PriceIcon = priceTone.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3.5 sm:gap-4">
        {card.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.logoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 bg-white/5 object-cover shadow-inner ring-1 ring-white/5 sm:h-14 sm:w-14"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/25 via-zinc-900 to-zinc-950 text-base font-bold text-emerald-100 shadow-inner sm:h-14 sm:w-14 sm:text-lg"
            aria-hidden="true"
          >
            {companyInitials(card.companyName)}
          </div>
        )}

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              {card.companyName}
            </h2>
            <span className="inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-emerald-300/90 sm:text-xs">
              {card.ticker}
              {card.exchange ? (
                <span className="ml-1 text-zinc-500">· {card.exchange}</span>
              ) : null}
            </span>
          </div>
          {card.companyNameZh ? (
            <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{card.companyNameZh}</p>
          ) : null}
        </div>
      </div>

      {card.priceLabel ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/70 px-3 py-1.5 text-sm font-semibold tabular-nums text-white shadow-inner">
            {card.priceLabel}
          </span>
          {card.priceDirection ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${priceTone.pillClass}`}
            >
              <PriceIcon className={`h-3.5 w-3.5 ${priceTone.iconClass}`} aria-hidden="true" />
              {card.priceDirection}
            </span>
          ) : null}
        </div>
      ) : null}

      <h3 className="mt-4 text-balance text-xl font-bold leading-tight tracking-tight text-white sm:mt-5 sm:text-2xl">
        {card.headline}
      </h3>

      {(card.sourceName || sourceDateLabel) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 sm:text-sm">
          {card.sourceName ? (
            <span className="font-medium text-zinc-400">{card.sourceName}</span>
          ) : null}
          {card.sourceName && sourceDateLabel ? (
            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>
          ) : null}
          {sourceDateLabel ? <time>{sourceDateLabel}</time> : null}
        </div>
      )}

      {card.summary ? (
        <div className="mt-4 flex-1 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3.5 sm:mt-5 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Summary
          </p>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
            {card.summary}
          </p>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <p className="mt-4 text-center text-xs font-medium text-zinc-400 sm:mt-5 sm:text-sm">
        What is your read on this market signal?
      </p>
    </div>
  );
}

function SwipeHint({ reduceMotion }: Readonly<{ reduceMotion: boolean }>) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="mb-3 flex items-center justify-center gap-3 text-xs text-zinc-500 sm:text-sm"
      aria-hidden="true"
    >
      <motion.span
        animate={reduceMotion ? undefined : { x: [-2, -6, -2] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center gap-1 text-amber-400/80"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Cautious
      </motion.span>
      <span className="text-zinc-600">Swipe</span>
      <motion.span
        animate={reduceMotion ? undefined : { x: [2, 6, 2] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center gap-1 text-emerald-400/80"
      >
        Bullish
        <ArrowRight className="h-3.5 w-3.5" />
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
  const isBullish = decision === "BULLISH";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Choose ${SIGNAL_LABELS[decision]}`}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.96 }}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: active ? 1.04 : 1,
              boxShadow: active
                ? isBullish
                  ? "0 0 28px rgba(16,185,129,0.35)"
                  : "0 0 28px rgba(245,158,11,0.3)"
                : "0 0 0 rgba(0,0,0,0)",
            }
      }
      transition={springSnap}
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl border px-4 py-3 text-base font-bold shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${
        isBullish
          ? `border-emerald-500/35 bg-gradient-to-br from-emerald-500/25 to-zinc-900 text-emerald-100 shadow-emerald-950/25 hover:border-emerald-400/55 hover:from-emerald-500/35 ${
              active ? "border-emerald-400/70 ring-2 ring-emerald-400/40" : ""
            }`
          : `border-amber-500/35 bg-gradient-to-br from-amber-500/25 to-zinc-900 text-amber-100 shadow-amber-950/25 hover:border-amber-400/55 hover:from-amber-500/35 ${
              active ? "border-amber-400/70 ring-2 ring-amber-400/40" : ""
            }`
      }`}
    >
      {SIGNAL_LABELS[decision]}
    </motion.button>
  );
}

export default function MarketPulseSwipeCard({
  card,
  onSubmit,
  initialDecision = null,
  disabled = false,
  analyticsContext,
  revealMessage = "PPA Insight reveals at the end of this challenge.",
  lockedFooterMessage,
  className = "",
}: MarketPulseSwipeCardProps) {
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
  const rotate = useTransform(x, [-280, 0, 280], reduceMotion ? [0, 0, 0] : [-16, 0, 16]);
  const scale = useTransform(x, [-180, 0, 180], reduceMotion ? [1, 1, 1] : [1.03, 1, 1.03]);
  const cardOpacity = useTransform(x, [-280, -120, 0, 120, 280], [0.92, 1, 1, 1, 0.92]);

  const bullishStampOpacity = useTransform(x, [0, 50, SWIPE_THRESHOLD], [0, 0.55, 1]);
  const cautiousStampOpacity = useTransform(x, [-SWIPE_THRESHOLD, -50, 0], [1, 0.55, 0]);
  const bullishStampRotate = useTransform(x, [0, SWIPE_THRESHOLD], [8, -6]);
  const cautiousStampRotate = useTransform(x, [-SWIPE_THRESHOLD, 0], [6, -8]);

  const bullishGlow = useTransform(x, [0, 40, 140], [0, 0.25, 0.55]);
  const cautiousGlow = useTransform(x, [-140, -40, 0], [0.55, 0.25, 0]);

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
          setErrorMessage(result.error);
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
        setErrorMessage("Something went wrong. Please try again.");
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

  const exitRotate = exitX > 0 ? 18 : -18;

  const cardAnimate = useMemo(() => {
    if (phase === "submitting") {
      return {
        x: exitX,
        opacity: 0,
        rotate: reduceMotion ? 0 : exitRotate,
        scale: reduceMotion ? 1 : 0.88,
      };
    }
    if (phase === "locked") {
      return { x: exitX, opacity: 0, rotate: 0, scale: 0.95 };
    }
    return { x: 0, opacity: 1, rotate: 0, scale: 1 };
  }, [exitRotate, exitX, phase, reduceMotion]);

  if (phase === "locked" && lockedDecision) {
    return (
      <div className={`mx-auto w-full max-w-md touch-pan-y ${className}`}>
        <DecisionLockedCard
          decision={lockedDecision}
          revealMessage={revealMessage}
          footerMessage={lockedFooterMessage ?? "Come back tomorrow"}
        />
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-md touch-pan-y ${className}`}>
      <SwipeHint reduceMotion={reduceMotion} />

      <div className="relative isolate overflow-hidden overscroll-x-contain">
        <motion.div
          aria-hidden="true"
          style={{ opacity: bullishGlow }}
          className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-emerald-500/25 blur-2xl"
        />
        <motion.div
          aria-hidden="true"
          style={{ opacity: cautiousGlow }}
          className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-amber-500/20 blur-2xl"
        />

        <div className="relative min-h-[24rem] sm:min-h-[26rem]">
          <AnimatePresence mode="wait">
            {phase !== "locked" ? (
              <motion.div
                key={card.id}
                style={
                  phase === "idle"
                    ? {
                        x,
                        rotate,
                        scale,
                        opacity: cardOpacity,
                        touchAction: "none",
                      }
                    : { touchAction: "none" }
                }
                drag={interactionsDisabled || reduceMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.72}
                dragMomentum={false}
                dragPropagation={false}
                onDragEnd={handleDragEnd}
                initial={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 36, scale: 0.94, rotate: -3 }
                }
                animate={cardAnimate}
                transition={phase === "submitting" ? springExit : springEntrance}
                className={`relative z-20 min-h-[24rem] cursor-grab rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900 to-zinc-950 p-4 shadow-2xl shadow-black/60 ring-1 ring-white/5 backdrop-blur-md active:cursor-grabbing sm:min-h-[26rem] sm:rounded-3xl sm:p-5 ${
                  interactionsDisabled ? "pointer-events-none opacity-80" : ""
                }`}
                aria-label={`Market Pulse card for ${card.companyName}. Swipe or use buttons to choose Bullish or Cautious.`}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[1.75rem] bg-gradient-to-b from-emerald-500/12 via-emerald-500/5 to-transparent sm:rounded-t-3xl"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  aria-hidden="true"
                />

                {!reduceMotion ? (
                  <>
                    <SwipeStamp
                      label={SIGNAL_LABELS.BULLISH}
                      opacity={bullishStampOpacity}
                      rotate={bullishStampRotate}
                      tone="bullish"
                    />
                    <SwipeStamp
                      label={SIGNAL_LABELS.CAUTIOUS}
                      opacity={cautiousStampOpacity}
                      rotate={cautiousStampRotate}
                      tone="cautious"
                    />
                  </>
                ) : null}

                <CardContent card={card} />

                {phase === "submitting" ? (
                  <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[1.75rem] bg-zinc-950/65 backdrop-blur-[3px] sm:rounded-3xl">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Locking your decision…
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {errorMessage ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200"
        >
          {errorMessage}
        </motion.p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:mt-5 sm:gap-4">
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

      <p className="sr-only">
        Keyboard users: use Tab to focus the Cautious or Bullish buttons and press Enter to submit.
      </p>
    </div>
  );
}
