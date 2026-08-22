import Link from "next/link";

import { getServerTranslations } from "@/lib/i18n/server";
import { isBeforePublicLaunch } from "@/lib/market-pulse/launch-config";
import { MP_FOCUS_RING, MP_HOME_SECTION, MP_PRIMARY_BTN, mergeMpClasses } from "@/lib/market-pulse/visual-primitives";

const PLAY_CALLBACK = "/market-pulse/play";

export default async function FinalCtaSection() {
  const { t } = await getServerTranslations();
  const preLaunch = isBeforePublicLaunch();
  const secondaryHref = "/market-pulse";
  const secondaryLabel = preLaunch
    ? t("home.finalCta.enterHub")
    : t("home.finalCta.exploreHub");
  const secondaryAria = preLaunch
    ? t("home.finalCta.enterHubAria")
    : t("home.finalCta.exploreHubAria");
  const memberHref = preLaunch
    ? "/login"
    : `/login?callbackUrl=${encodeURIComponent(PLAY_CALLBACK)}`;

  return (
    <section
      className={mergeMpClasses(MP_HOME_SECTION, "border-mp-pulse/10")}
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-1 text-center">
        <h2
          id="final-cta-heading"
          className="brand-display text-balance text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl"
        >
          {t("home.finalCta.heading")}
        </h2>
        <div className="mt-4 flex w-full max-w-sm flex-col gap-2.5 sm:mt-5 sm:w-auto sm:flex-row sm:gap-3">
          <Link
            href={memberHref}
            aria-label={t("home.finalCta.memberAria")}
            className={mergeMpClasses(
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-gold px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-gold-deep sm:min-w-[14rem] sm:text-base",
              MP_FOCUS_RING,
            )}
          >
            {t("home.finalCta.member")}
          </Link>
          <Link
            href={secondaryHref}
            aria-label={secondaryAria}
            className={mergeMpClasses(
              "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 bg-mp-obsidian-panel px-8 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/15 hover:bg-mp-obsidian-elevated sm:min-w-[12rem] sm:text-base",
              MP_FOCUS_RING,
            )}
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
