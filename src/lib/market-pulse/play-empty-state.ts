import type { SiteLocale } from "@/lib/i18n/locales";
import type { MarketPulseMessageKey } from "@/lib/i18n/messages/market-pulse-messages";
import type { CyclePlayabilityIssue } from "@/lib/market-pulse/cycle-playability";
import type { MarketPulseNextCycleStatus } from "@/lib/market-pulse/next-cycle";
import type { MarketPulsePlayPageStatus } from "@/lib/market-pulse/play-data";

export type PlayBlockedStateCopy = {
  titleKey: MarketPulseMessageKey;
  bodyKey: MarketPulseMessageKey;
  detailKey?: MarketPulseMessageKey;
  bodyParams?: Record<string, string>;
  detailParams?: Record<string, string>;
};

export function formatPlayScheduleDate(iso: string, locale: SiteLocale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-HK" : "en-HK";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

export function formatPlayScheduleDateWithHkt(
  iso: string,
  locale: SiteLocale,
  t: (key: MarketPulseMessageKey) => string,
): string {
  return t("mp.play.state.scheduleAt").replace(
    "{date}",
    formatPlayScheduleDate(iso, locale),
  );
}

function futureCycleCopy(
  startsAtIso: string,
  locale: SiteLocale,
  t: (key: MarketPulseMessageKey) => string,
): PlayBlockedStateCopy {
  return {
    titleKey: "mp.play.state.futureCycle.title",
    bodyKey: "mp.play.state.futureCycle.body",
    detailKey: "mp.play.state.futureCycle.detail",
    bodyParams: { date: formatPlayScheduleDateWithHkt(startsAtIso, locale, t) },
  };
}

function tbcCopy(): PlayBlockedStateCopy {
  return {
    titleKey: "mp.play.state.tbc.title",
    bodyKey: "mp.play.state.tbc.body",
    detailKey: "mp.play.state.tbc.detail",
  };
}

export function resolvePlayBlockedStateCopy(
  status: MarketPulsePlayPageStatus,
  nextCycle: MarketPulseNextCycleStatus,
  unavailableIssue: CyclePlayabilityIssue | null | undefined,
  nextCardReleaseAtIso: string | null | undefined,
  locale: SiteLocale,
  t: (key: MarketPulseMessageKey) => string,
  now: Date = new Date(),
): PlayBlockedStateCopy {
  if (status === "between_cycles") {
    if (nextCycle.status === "available") {
      return futureCycleCopy(nextCycle.startsAtIso, locale, t);
    }
    return tbcCopy();
  }

  if (status === "cycle_unavailable") {
    if (unavailableIssue === "not_started" && nextCycle.status === "available") {
      return futureCycleCopy(nextCycle.startsAtIso, locale, t);
    }

    return {
      titleKey: "mp.play.state.cycleUnavailable.title",
      bodyKey: "mp.play.state.cycleUnavailable.body",
    };
  }

  if (status === "no_card_today") {
    if (
      nextCardReleaseAtIso &&
      new Date(nextCardReleaseAtIso).getTime() > now.getTime()
    ) {
      return {
        titleKey: "mp.play.state.futureCard.title",
        bodyKey: "mp.play.state.futureCard.body",
        detailKey: "mp.play.state.futureCard.detail",
        bodyParams: {
          date: formatPlayScheduleDateWithHkt(nextCardReleaseAtIso, locale, t),
        },
      };
    }

    return {
      titleKey: "mp.play.state.noCard.title",
      bodyKey: "mp.play.state.noCard.body",
    };
  }

  if (status === "runtime_closed") {
    const copy: PlayBlockedStateCopy = {
      titleKey: "mp.play.state.runtimeClosed.title",
      bodyKey: "mp.play.state.runtimeClosed.body",
    };

    if (nextCycle.status === "available") {
      copy.detailKey = "mp.play.state.runtimeClosed.nextCycle";
      copy.detailParams = {
        date: formatPlayScheduleDateWithHkt(nextCycle.startsAtIso, locale, t),
      };
    }

    return copy;
  }

  return tbcCopy();
}

export function applyPlayBlockedStateCopy(
  copy: PlayBlockedStateCopy,
  t: (key: MarketPulseMessageKey) => string,
): { title: string; body: string; detail?: string } {
  const interpolate = (template: string, params?: Record<string, string>) => {
    if (!params) {
      return template;
    }

    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, value),
      template,
    );
  };

  return {
    title: t(copy.titleKey),
    body: interpolate(t(copy.bodyKey), copy.bodyParams),
    detail: copy.detailKey
      ? interpolate(t(copy.detailKey), copy.detailParams)
      : undefined,
  };
}

/**
 * Show reminder opt-in CTA on play blocked states when the next return
 * time is known (next cycle start or next card unlock) — not for TBC-only.
 */
export function shouldOfferPlayRemindersOptIn(
  status: MarketPulsePlayPageStatus,
  nextCycle: MarketPulseNextCycleStatus,
  nextCardReleaseAtIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (nextCycle.status === "available") {
    if (
      status === "between_cycles" ||
      status === "cycle_unavailable" ||
      status === "runtime_closed"
    ) {
      return true;
    }
  }

  if (
    status === "no_card_today" &&
    nextCardReleaseAtIso &&
    new Date(nextCardReleaseAtIso).getTime() > now.getTime()
  ) {
    return true;
  }

  return false;
}
