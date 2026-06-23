"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import SiteFooter from "@/components/SiteFooter";

const FULL_PAGE_ROUTES = ["/fortify-survey", "/admin", "/login", "/auth/onboarding"];

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 sm:px-3 sm:py-2";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoadingSession = status === "loading";

  const fullPage = FULL_PAGE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (fullPage) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6 lg:gap-8">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 font-semibold tracking-tight transition-opacity active:opacity-80"
              aria-label="Profit Pulse Ally home"
            >
              <Image
                src="/logo.png"
                alt="Profit Pulse Ally logo"
                width={32}
                height={32}
                priority
                className="h-7 w-7 rounded-sm sm:h-8 sm:w-8"
              />
              <span className="hidden text-sm sm:inline sm:text-base md:text-lg">
                Profit Pulse Ally
              </span>
            </Link>

            <nav
              aria-label="Main"
              className="flex min-w-0 flex-wrap items-center gap-0.5 text-[13px] font-medium sm:gap-1 sm:text-sm"
            >
              <Link href="/game" className={navLinkClass}>
                Market Pulse
              </Link>
              <Link href="/events" className={navLinkClass}>
                Events
              </Link>
              <Link href="/concept" className={navLinkClass}>
                Our Philosophy
              </Link>
              <Link href="/blog" className={navLinkClass}>
                Blog
              </Link>
            </nav>
          </div>

          <div
            className="flex shrink-0 items-center gap-2 sm:gap-2.5"
            aria-label="Account"
          >
            {isLoadingSession || !isAuthenticated ? (
              <>
                <Link href="/login" className={navLinkClass}>
                  Login
                </Link>
                <Link
                  href="/login"
                  className={`inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90 sm:px-5 sm:text-sm ${focusRing}`}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link href="/profile" className={navLinkClass}>
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className={`inline-flex min-h-9 items-center justify-center rounded-full border border-foreground/20 bg-background px-3.5 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:border-foreground/35 hover:bg-foreground/5 sm:px-4 sm:text-sm ${focusRing}`}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <SiteFooter />
    </>
  );
}
