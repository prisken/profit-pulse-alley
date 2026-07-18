"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useState } from "react";

import MobileNav from "@/components/layout/MobileNav";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/providers/LocaleProvider";
import SiteFooter from "@/components/SiteFooter";
import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import {
  isFullPageRoute,
  isImmersiveRoute,
  isMarketPulseRoute,
} from "@/lib/layout/route-chrome";

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 sm:px-3 sm:py-2";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mp-pulse/80 focus-visible:ring-offset-2 focus-visible:ring-offset-mp-obsidian";

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { status } = useSession();
  const { t } = useTranslations();
  const isAuthenticated = status === "authenticated";
  const isLoadingSession = status === "loading";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fullPage = isFullPageRoute(pathname) || isImmersiveRoute(pathname);
  const marketPulseRoute = isMarketPulseRoute(pathname);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const openMobileNav = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  if (fullPage) {
    return <div className="flex min-w-0 flex-1 flex-col">{children}</div>;
  }

  const headerZIndexClass = mobileNavOpen
    ? "z-[203]"
    : marketPulseRoute
      ? "z-[100]"
      : "z-50";

  return (
    <>
      <header
        className={`site-header sticky top-0 ${headerZIndexClass} border-b border-white/[0.08] bg-mp-obsidian/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur supports-[backdrop-filter]:bg-mp-obsidian/90`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:h-[3.75rem]">
          <div
            className="flex min-w-0 flex-1 items-center gap-4 md:gap-6 lg:gap-8"
            {...(mobileNavOpen ? { inert: true } : {})}
          >
            <Link
              href="/"
              className={`inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2 font-semibold tracking-tight transition-opacity active:opacity-80 ${focusRing}`}
              aria-label={t("common.brandHomeAria")}
            >
              <Image
                src="/logo.png"
                alt={t("common.brandLogoAlt")}
                width={32}
                height={32}
                priority
                className="h-7 w-7 object-contain md:h-8 md:w-8"
              />
              <span className="hidden text-sm sm:inline md:text-base lg:text-lg">
                {t("common.brandName")}
              </span>
            </Link>

            <nav
              aria-label={t("common.navMainAria")}
              className="hidden min-w-0 flex-wrap items-center gap-0.5 text-[13px] font-medium md:flex md:gap-1 md:text-sm"
            >
              <Link href="/market-pulse" className={navLinkClass}>
                {t("nav.marketPulse")}
              </Link>
              <Link href="/matching-pulse" className={navLinkClass}>
                {t("nav.matchingPulse")}
              </Link>
              <Link
                href="/events"
                className={navLinkClass}
                onClick={() => {
                  if (marketPulseRoute) {
                    trackMarketPulseEvent(
                      MARKET_PULSE_ANALYTICS_EVENTS.webinar_cta_clicked,
                      { cta: "nav_events", surface: "nav" },
                    );
                  }
                }}
              >
                {t("nav.events")}
              </Link>
              <Link href="/concept" className={navLinkClass}>
                {t("nav.philosophy")}
              </Link>
              <Link href="/blog" className={navLinkClass}>
                {t("nav.blog")}
              </Link>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1 md:gap-2.5">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <div
              className="hidden items-center gap-2 md:flex"
              aria-label="Account"
              {...(mobileNavOpen ? { inert: true } : {})}
            >
              {isLoadingSession || !isAuthenticated ? (
                <>
                  <Link href="/login" className={navLinkClass}>
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/login"
                    className={`inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90 md:px-5 md:text-sm ${focusRing}`}
                  >
                    {t("nav.signUp")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className={navLinkClass}
                    onClick={() => {
                      if (marketPulseRoute) {
                        trackMarketPulseEvent(
                          MARKET_PULSE_ANALYTICS_EVENTS.profile_cta_clicked,
                          { cta: "nav_profile", surface: "nav" },
                        );
                      }
                    }}
                  >
                    {t("nav.profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: "/" })}
                    className={`inline-flex min-h-9 items-center justify-center rounded-full border border-foreground/20 bg-background px-3.5 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:border-foreground/35 hover:bg-foreground/5 md:px-4 md:text-sm ${focusRing}`}
                  >
                    {t("nav.signOut")}
                  </button>
                </>
              )}
            </div>

            <MobileNav
              isOpen={mobileNavOpen}
              onOpen={openMobileNav}
              onClose={closeMobileNav}
              isAuthenticated={isAuthenticated}
              isLoadingSession={isLoadingSession}
            />
          </div>
        </div>
      </header>

      <div
        className={`flex min-w-0 flex-1 flex-col${marketPulseRoute ? " overflow-x-hidden" : ""}`}
        {...(mobileNavOpen ? { inert: true } : {})}
      >
        {children}
      </div>

      <div {...(mobileNavOpen ? { inert: true } : {})}>
        <SiteFooter />
      </div>
    </>
  );
}
