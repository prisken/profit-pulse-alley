"use client";

import {
  useCallback,
  useEffect,
  useId,
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
  Lock,
  Minus,
} from "lucide-react";

import DecisionLockedCard, {
  type DecisionLockedCardContext,
} from "@/components/market-pulse/DecisionLockedCard";
import { MP_FOCUS_RING } from "@/components/market-pulse/MarketPulseVisualPrimitives";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { translateMarketPulseError } from "@/lib/i18n/market-pulse-ui";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import {
  type MarketPulseDecision,
} from "@/lib/market-pulse/constants";
import {
  decisionToDragBias,
  resolveDragBias,
  resolveSwipeDecision,
  SWIPE_THRESHOLD,
  type DragBias,
} from "@/lib/market-pulse/decision-interaction";
import type { MarketPulseMessageKey } from "@/lib/i18n/messages/market-pulse-messages";
import type {
  MarketPulseSwipeCardData,
  MarketPulseSwipeSubmitResult,
} from "@/lib/market-pulse/types";

const EXIT_DISTANCE = 720;

const focusRing = MP_FOCUS_RING;

const springSnap = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };
const springExit = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.9 };
const springEntrance = { type: "spring" as const, stiffness: 300, damping: 28 };

type CardPhase = "idle" | "confirm" | "submitting" | "locked";

export type MarketPulseSwipeCardAnalyticsContext = {
  cycleId?: string;
  dayIndex?: number;
};

export type MarketPulseSwipeCardProps = {
  card: MarketPulseSwipeCardData;
  onSubmit: (decision: MarketPulseDecision) => Promise<MarketPulseSwipeSubmitResult>;
  initialDecision?: MarketPulseDecision | null;
  disabled?: boolean;
  /** When true with `disabled`, shows Bullish/Cautious buttons in a non-interactive state. */
  showDecisionControls?: boolean;
  analyticsContext?: MarketPulseSwipeCardAnalyticsContext;
  revealMessage?: string;
  lockedCycleContext?: DecisionLockedCardContext;
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
  companyInitialsLabel,
}: Readonly<{
  imageUrl?: string | null;
  imageAlt?: string | null;
  companyInitialsLabel?: string;
}>) {
  const { t } = useTranslations();
  const frameClass =
    "relative w-full shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900 to-black shadow-inner shadow-black/40 ring-1 ring-emerald-500/10 aspect-[16/10] sm:aspect-video";

  const trimmedUrl = imageUrl?.trim();

  if (trimmedUrl) {
    return (
      <div className={frameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trimmedUrl}
          alt={imageAlt?.trim() || t("mp.card.imageAlt")}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      className={`${frameClass} flex items-center justify-center border-dashed`}
      role="img"
      aria-label={t("mp.card.noImage")}
    >
      {companyInitialsLabel ? (
        <span
          className="pointer-events-none select-none text-4xl font-black tracking-tight text-white/[0.07] sm:text-5xl"
          aria-hidden="true"
        >
          {companyInitialsLabel}
        </span>
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
        <ImageIcon className="h-9 w-9 opacity-35" aria-hidden="true" />
        <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">
          {t("mp.card.noImage")}
        </span>
      </div>
    </div>
  );
}

function PpaLockedNote() {
  const { t } = useTranslations();

  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-snug text-zinc-500 sm:text-xs">
      <Lock className="h-3 w-3 shrink-0 text-amber-400/80" aria-hidden="true" />
      {t("mp.play.stage.ppaNote")}
    </p>
  );
}

function CompanyIdentity({
  card,
  initials,
}: Readonly<{ card: MarketPulseSwipeCardData; initials: string }>) {
  const priceTone = priceDirectionTone(card.priceDirection);
  const PriceIcon = priceTone.icon;

  return (
    <div className="flex items-start gap-3">
      {card.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.logoUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl border border-white/20 bg-white/5 object-cover shadow-sm sm:h-14 sm:w-14"
        />
      ) : (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-sm font-bold text-emerald-100 shadow-sm sm:h-14 sm:w-14 sm:text-base"
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-200 sm:text-xs">
            {card.ticker}
          </span>
          {card.exchange ? (
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[11px]">
              {card.exchange}
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 break-words text-base font-bold text-white sm:text-lg">
          {card.companyName}
        </p>
        {card.companyNameZh ? (
          <p className="line-clamp-2 break-words text-xs text-zinc-500">{card.companyNameZh}</p>
        ) : null}
        {(card.priceLabel || card.priceDirection) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {card.priceLabel ? (
              <span className="inline-flex rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
                {card.priceLabel}
              </span>
            ) : null}
            {card.priceDirection ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priceTone.pillClass}`}
              >
                <PriceIcon className={`h-3 w-3 ${priceTone.iconClass}`} aria-hidden="true" />
                {card.priceDirection}
              </span>
            ) : null}
          </div>
        )}
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
  const initials =
    card.logoInitials?.trim() || companyInitials(card.companyName);

  return (
    <>
      <header className="shrink-0 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/90 sm:text-[11px]">
          {t("mp.play.stage.todaySignal")}
        </p>
        <CompanyIdentity card={card} initials={initials} />
      </header>

      <CardImage
        imageUrl={card.cardImageUrl}
        imageAlt={card.cardImageAlt}
        companyInitialsLabel={initials}
      />

      <section className="shrink-0 space-y-2">
        <h3
          id={`card-headline-${card.id}`}
          className="break-words text-balance text-lg font-bold leading-snug text-white sm:text-xl"
        >
          {card.headline}
        </h3>
        {card.newsBody ? (
          <p className="break-words text-pretty text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
            {card.newsBody}
          </p>
        ) : null}
      </section>

      {card.summary ? (
        <section className="shrink-0 rounded-xl border border-white/10 bg-zinc-950/70 p-3 sm:p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t("mp.card.label.summary")}
          </p>
          <p className="mt-1.5 break-words text-pretty text-sm leading-relaxed text-zinc-200">
            {card.summary}
          </p>
        </section>
      ) : null}

      {(card.sourceName || sourceDateLabel) && (
        <div className="shrink-0 flex flex-wrap justify-end gap-x-1.5 gap-y-0.5 text-right text-[11px] text-zinc-500 sm:text-xs">
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

      <PpaLockedNote />
    </>
  );
}

function CardPrompt({
  card,
}: Readonly<{ card: MarketPulseSwipeCardData }>) {
  const { t } = useTranslations();
  const promptText = card.userPrompt?.trim() || t("prompt.defaultRead");

  return (
    <p className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-center text-sm font-semibold leading-snug text-zinc-100 sm:text-[15px]">
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

function confirmTitleKey(decision: MarketPulseDecision): MarketPulseMessageKey {
  return decision === "BULLISH"
    ? "mp.decision.confirm.bullish"
    : "mp.decision.confirm.cautious";
}

function confirmSubmitAriaKey(decision: MarketPulseDecision): MarketPulseMessageKey {
  return decision === "BULLISH"
    ? "mp.decision.aria.confirmBullish"
    : "mp.decision.aria.confirmCautious";
}

function chooseAriaKey(decision: MarketPulseDecision): MarketPulseMessageKey {
  return decision === "BULLISH"
    ? "mp.decision.aria.chooseBullish"
    : "mp.decision.aria.chooseCautious";
}

function DecisionConfirmPanel({
  decision,
  onConfirm,
  onCancel,
  isSubmitting,
}: Readonly<{
  decision: MarketPulseDecision;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}>) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion() ?? false;
  const titleId = useId();
  const warningId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const isBullish = decision === "BULLISH";
  const label = t(isBullish ? "signal.bullish" : "signal.cautious");

  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, [decision]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onCancel]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      transition={reduceMotion ? { duration: 0.12 } : springSnap}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={warningId}
      aria-label={t("mp.decision.aria.confirmDialog")}
      className={`rounded-xl border-2 p-3.5 sm:p-4 ${
        isBullish
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-amber-500/50 bg-amber-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
            isBullish
              ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200"
              : "border-amber-400/70 bg-amber-500/15 text-amber-200"
          }`}
          aria-hidden="true"
        >
          {isBullish ? (
            <TriangleRight className="h-4 w-4" />
          ) : (
            <TriangleLeft className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4
            id={titleId}
            className={`text-base font-bold sm:text-lg ${
              isBullish ? "text-emerald-100" : "text-amber-100"
            }`}
          >
            {t(confirmTitleKey(decision))}
          </h4>
          <p className="mt-1 text-sm font-semibold text-white">{label}</p>
          <p id={warningId} className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {t("mp.decision.confirm.warning")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-zinc-950/80 px-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          {t("mp.decision.confirm.cancel")}
        </button>
        <button
          ref={confirmButtonRef}
          type="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          aria-label={t(confirmSubmitAriaKey(decision))}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold text-zinc-950 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${focusRing} ${
            isBullish
              ? "border-emerald-300 bg-emerald-400 hover:bg-emerald-300"
              : "border-amber-300 bg-amber-400 hover:bg-amber-300"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2
                className={`h-4 w-4 ${reduceMotion ? "" : "animate-spin"}`}
                aria-hidden="true"
              />
              {t("mp.decision.confirm.submitting")}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              {t("mp.decision.confirm.submit")}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function DecisionButton({
  decision,
  highlighted,
  pending,
  disabled,
  reduceMotion,
  onClick,
}: Readonly<{
  decision: MarketPulseDecision;
  highlighted: boolean;
  pending: boolean;
  disabled: boolean;
  reduceMotion: boolean;
  onClick: () => void;
}>) {
  const { t } = useTranslations();
  const isBullish = decision === "BULLISH";
  const label = t(isBullish ? "signal.bullish" : "signal.cautious");
  const isActive = highlighted || pending;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={t(chooseAriaKey(decision))}
      aria-pressed={isActive}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: isActive ? 1.02 : 1,
            }
      }
      transition={springSnap}
      className={`inline-flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[3.875rem] sm:text-lg ${focusRing} ${
        isBullish
          ? pending
            ? "border-emerald-300 bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-900/30"
            : isActive
              ? "border-emerald-400 bg-emerald-500/20 text-emerald-50 ring-2 ring-emerald-400/50"
              : "border-emerald-500/80 bg-emerald-500/5 text-emerald-100 hover:border-emerald-400 hover:bg-emerald-500/15"
          : pending
            ? "border-amber-300 bg-amber-400 text-zinc-950 shadow-lg shadow-amber-900/30"
            : isActive
              ? "border-amber-400 bg-amber-500/20 text-amber-50 ring-2 ring-amber-400/50"
              : "border-amber-500/80 bg-amber-500/5 text-amber-100 hover:border-amber-400 hover:bg-amber-500/15"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {!isBullish ? (
          <TriangleLeft className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        ) : null}
        <span>{label}</span>
        {isBullish ? (
          <TriangleRight className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        ) : null}
      </span>
    </motion.button>
  );
}

export default function MarketPulseSwipeCard({
  card,
  onSubmit,
  initialDecision = null,
  disabled = false,
  showDecisionControls = false,
  analyticsContext,
  revealMessage,
  lockedCycleContext,
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
  const [pendingDecision, setPendingDecision] = useState<MarketPulseDecision | null>(
    null,
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
    setDragBias(resolveDragBias(latest));
  });

  const interactionsDisabled =
    disabled || phase === "submitting" || phase === "locked";
  const swipeEnabled = !interactionsDisabled && !reduceMotion && phase === "idle";
  const cardRegionLabel = disabled
    ? t("mp.card.aria.preview").replace("{company}", card.companyName)
    : t("mp.card.aria.playable").replace("{company}", card.companyName);

  const cancelConfirm = useCallback(() => {
    if (submittingRef.current) {
      return;
    }
    setPendingDecision(null);
    setPhase("idle");
    setDragBias("neutral");
    x.set(0);
  }, [x]);

  const requestConfirm = useCallback(
    (decision: MarketPulseDecision) => {
      if (interactionsDisabled || submittingRef.current || phase === "confirm") {
        return;
      }

      setErrorMessage(null);
      setPendingDecision(decision);
      setPhase("confirm");
      setDragBias(decisionToDragBias(decision));
      x.set(0);

      trackMarketPulseEvent(MARKET_PULSE_ANALYTICS_EVENTS.decision_selected, {
        cardId: card.id,
        cycleId: analyticsContext?.cycleId,
        dayIndex: analyticsContext?.dayIndex,
        decision,
        surface: "play",
        route: "/market-pulse/play",
      });
      trackMarketPulseEvent(
        MARKET_PULSE_ANALYTICS_EVENTS.decision_confirmation_opened,
        {
          cardId: card.id,
          cycleId: analyticsContext?.cycleId,
          dayIndex: analyticsContext?.dayIndex,
          decision,
          surface: "play",
          route: "/market-pulse/play",
        },
      );
    },
    [analyticsContext, card.id, interactionsDisabled, phase, x],
  );

  const submitDecision = useCallback(
    async (decision: MarketPulseDecision) => {
      if (interactionsDisabled || submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setErrorMessage(null);
      setPhase("submitting");
      setExitX(decision === "BULLISH" ? EXIT_DISTANCE : -EXIT_DISTANCE);
      setDragBias(decisionToDragBias(decision));

      try {
        const result = await onSubmit(decision);

        if (!result.ok) {
          submittingRef.current = false;
          setExitX(0);
          setPhase("confirm");
          setDragBias(decisionToDragBias(decision));
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
            route: "/market-pulse/play",
          },
        );

        await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 120 : 340));
        setPendingDecision(null);
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
        setPhase("confirm");
        setDragBias(decisionToDragBias(decision));
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

  const handleConfirmSubmit = useCallback(() => {
    if (!pendingDecision) {
      return;
    }
    void submitDecision(pendingDecision);
  }, [pendingDecision, submitDecision]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (interactionsDisabled || submittingRef.current) {
        x.set(0);
        return;
      }

      const offset = info.offset.x;
      const velocity = info.velocity.x;
      const swipedDecision = resolveSwipeDecision(offset, velocity);

      if (swipedDecision) {
        requestConfirm(swipedDecision);
        return;
      }

      setDragBias("neutral");
    },
    [interactionsDisabled, requestConfirm, x],
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
        <p className="sr-only" role="status" aria-live="polite">
          {t("mp.decision.success.locked")}
        </p>
        <DecisionLockedCard
          decision={lockedDecision}
          revealMessage={revealMessage ?? t("mp.play.reveal.default")}
          cycleContext={lockedCycleContext}
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
                className={`relative z-20 flex min-h-0 max-h-[min(72dvh,calc(100dvh-11rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-zinc-950 via-black to-black p-3 shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:max-h-[min(82dvh,44rem)] sm:rounded-2xl sm:p-4 ${
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

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3.5 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch] sm:gap-4">
                    <CardBody card={card} />
                  </div>
                </motion.div>

                {disabled && !showDecisionControls ? (
                  <div className="mt-3 shrink-0 border-t border-white/10 pt-3">
                    <CardPrompt card={card} />
                  </div>
                ) : null}

                {!disabled || showDecisionControls ? (
                  <div className="mt-3 shrink-0 space-y-2.5 border-t border-white/15 pt-3">
                    <CardPrompt card={card} />
                    {!disabled ? (
                      <AnimatePresence mode="wait">
                        {phase === "confirm" && pendingDecision ? (
                          <DecisionConfirmPanel
                            key="confirm"
                            decision={pendingDecision}
                            onConfirm={handleConfirmSubmit}
                            onCancel={cancelConfirm}
                            isSubmitting={false}
                          />
                        ) : (
                          <fieldset
                            key="choices"
                            className="grid grid-cols-2 gap-2.5 border-0 p-0 sm:gap-3"
                          >
                            <legend className="sr-only">
                              {t("mp.decision.section.label")}
                            </legend>
                            <DecisionButton
                              decision="CAUTIOUS"
                              highlighted={dragBias === "cautious"}
                              pending={pendingDecision === "CAUTIOUS"}
                              disabled={interactionsDisabled}
                              reduceMotion={reduceMotion}
                              onClick={() => requestConfirm("CAUTIOUS")}
                            />
                            <DecisionButton
                              decision="BULLISH"
                              highlighted={dragBias === "bullish"}
                              pending={pendingDecision === "BULLISH"}
                              disabled={interactionsDisabled}
                              reduceMotion={reduceMotion}
                              onClick={() => requestConfirm("BULLISH")}
                            />
                          </fieldset>
                        )}
                      </AnimatePresence>
                    ) : (
                      <fieldset
                        disabled
                        aria-disabled="true"
                        className="grid grid-cols-2 gap-2.5 border-0 p-0 sm:gap-3"
                      >
                        <legend className="sr-only">
                          {t("mp.decision.section.label")}
                        </legend>
                        <DecisionButton
                          decision="CAUTIOUS"
                          highlighted={false}
                          pending={false}
                          disabled
                          reduceMotion={reduceMotion}
                          onClick={() => undefined}
                        />
                        <DecisionButton
                          decision="BULLISH"
                          highlighted={false}
                          pending={false}
                          disabled
                          reduceMotion={reduceMotion}
                          onClick={() => undefined}
                        />
                      </fieldset>
                    )}
                  </div>
                ) : null}

                {phase === "submitting" ? (
                  <div
                    className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur-[2px]"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <div
                      className={`flex flex-col items-center gap-2 rounded-xl border px-5 py-4 text-center ${
                        dragBias === "bullish"
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-amber-500/40 bg-amber-500/10"
                      }`}
                    >
                      <Loader2
                        className={`h-6 w-6 text-white ${reduceMotion ? "" : "animate-spin"}`}
                        aria-hidden="true"
                      />
                      <p className="text-sm font-semibold text-white">
                        {t("mp.card.submitting")}
                      </p>
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
