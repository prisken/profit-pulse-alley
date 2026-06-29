"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Megaphone } from "lucide-react";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  getMarketPulseLaunchMessages,
  shouldShowMarketPulsePreLaunchUi,
  type MarketPulseLocale,
} from "@/lib/market-pulse/launch-config";
import { siteLocaleToMarketPulseLocale } from "@/lib/i18n/locales";
import { MARKET_PULSE_EASE } from "@/lib/market-pulse/motion";

export type MarketPulseLaunchAnnouncementProps = {
  /** Primary locale — wire to language switcher in a later phase. */
  locale?: MarketPulseLocale;
  /** When true, show Traditional Chinese lines below English (default until i18n ships). */
  showBilingual?: boolean;
  variant?: "default" | "compact" | "hero";
  className?: string;
};

function MessageList({
  messages,
  className = "",
}: Readonly<{
  messages: ReturnType<typeof getMarketPulseLaunchMessages>;
  className?: string;
}>) {
  return (
    <ul className={`space-y-1.5 ${className}`}>
      <li>{messages.opens}</li>
      <li>{messages.firstCycle}</li>
      <li>{messages.prize}</li>
    </ul>
  );
}

export default function MarketPulseLaunchAnnouncement({
  locale: localeProp,
  showBilingual = false,
  variant = "default",
  className = "",
}: MarketPulseLaunchAnnouncementProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { locale: siteLocale, t } = useLocale();
  const locale: MarketPulseLocale =
    localeProp ?? siteLocaleToMarketPulseLocale(siteLocale);
  const primary = getMarketPulseLaunchMessages(locale);
  const secondary = showBilingual && locale !== "zh-HK"
    ? getMarketPulseLaunchMessages("zh-HK")
    : showBilingual && locale === "zh-HK"
      ? getMarketPulseLaunchMessages("en")
      : null;

  if (!shouldShowMarketPulsePreLaunchUi()) {
    return null;
  }

  const isCompact = variant === "compact";
  const isHero = variant === "hero";

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: MARKET_PULSE_EASE }}
      className={`rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/90 to-zinc-950 shadow-lg shadow-emerald-950/10 ${
        isCompact
          ? "px-3 py-3 sm:px-4 sm:py-4"
          : isHero
            ? "px-4 py-4 sm:rounded-2xl sm:px-5 sm:py-5"
            : "px-4 py-4 sm:rounded-2xl sm:px-5 sm:py-5"
      } ${className}`}
      aria-label={t("mp.announcement.ariaLabel")}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 ${
            isCompact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10"
          }`}
        >
          <Megaphone
            className={isCompact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold uppercase tracking-[0.14em] text-emerald-200/80 ${
              isCompact ? "text-[10px]" : "text-xs"
            }`}
          >
            {t("announcement.comingSoon")}
          </p>
          <MessageList
            messages={primary}
            className={`mt-2 leading-relaxed text-zinc-100 ${
              isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            }`}
          />
          {secondary ? (
            <MessageList
              messages={secondary}
              className={`mt-3 border-t border-white/10 pt-3 leading-relaxed text-zinc-400 ${
                isCompact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"
              }`}
            />
          ) : null}
        </div>
      </div>
    </motion.aside>
  );
}
