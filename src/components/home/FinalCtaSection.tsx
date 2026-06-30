import Link from "next/link";

import { getServerTranslations } from "@/lib/i18n/server";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import { MP_FOCUS_RING, mergeMpClasses } from "@/lib/market-pulse/visual-primitives";

const PLAY_CALLBACK = "/market-pulse/play";

export default async function FinalCtaSection() {
  const { t } = await getServerTranslations();
  const preLaunch = isBeforePublicLaunch();
  const guestHref = preLaunch ? "/market-pulse" : PLAY_CALLBACK;
  const guestLabel = preLaunch
    ? t("home.finalCta.playGuest")
    : t("home.hero.ctaPlayToday");
  const guestAria = preLaunch
    ? t("home.finalCta.playGuestAria")
    : t("home.hero.ctaPlayTodayAria");
  const memberHref = preLaunch
    ? "/login"
    : `/login?callbackUrl=${encodeURIComponent(PLAY_CALLBACK)}`;

  return (
    <section
      className="border-t border-emerald-500/15 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 px-3 py-8 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <h2
          id="final-cta-heading"
          className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          {t("home.finalCta.heading")}
        </h2>
        <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
          {t("home.finalCta.body")}
        </p>
        <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-7 sm:w-auto sm:flex-row sm:gap-3">
          <Link
            href={memberHref}
            aria-label={t("home.finalCta.memberAria")}
            className={mergeMpClasses(
              "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-400 px-8 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-900/30 transition-colors hover:bg-emerald-300 sm:min-w-[14rem] sm:px-10 sm:text-base",
              MP_FOCUS_RING,
            )}
          >
            {t("home.finalCta.member")}
          </Link>
          <Link
            href={guestHref}
            aria-label={guestAria}
            className={mergeMpClasses(
              "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/30 hover:bg-white/10 sm:min-w-[12rem] sm:text-base",
              MP_FOCUS_RING,
            )}
          >
            {guestLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
