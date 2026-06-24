"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useId, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

import {
  MARKET_PULSE_ANALYTICS_EVENTS,
  trackMarketPulseEvent,
} from "@/lib/market-pulse/analytics";
import { isMarketPulseRoute } from "@/lib/layout/route-chrome";

const DESKTOP_NAV_MEDIA = "(min-width: 48rem)";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const menuLinkClass =
  `flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-foreground/85 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 ${focusRing}`;

type MobileNavProps = Readonly<{
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
}>;

const MAIN_LINKS = [
  { label: "Market Pulse", href: "/market-pulse" },
  { label: "Events", href: "/events", analyticsCta: "nav_events" as const },
  { label: "Our Philosophy", href: "/concept" },
  { label: "Blog", href: "/blog" },
] as const;

function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.dataset.mobileNavScrollY = String(scrollY);
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  const scrollY = Number(document.body.dataset.mobileNavScrollY ?? "0");
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  delete document.body.dataset.mobileNavScrollY;
  window.scrollTo(0, scrollY);
}

export function MobileNavMenuButton({
  isOpen,
  onOpen,
  onClose,
  controlsId,
  menuButtonRef,
}: Readonly<{
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  controlsId: string;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}>) {
  return (
    <button
      ref={menuButtonRef}
      type="button"
      className={`relative z-[1] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground md:hidden ${focusRing}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls={isOpen ? controlsId : undefined}
      onClick={isOpen ? onClose : onOpen}
    >
      {isOpen ? (
        <X className="h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

export default function MobileNav({
  isOpen,
  onOpen,
  onClose,
  isAuthenticated,
  isLoadingSession,
}: MobileNavProps) {
  const pathname = usePathname();
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const marketPulseRoute = isMarketPulseRoute(pathname);

  const handleNavClick = useCallback(
    (analyticsCta?: "nav_events") => {
      if (analyticsCta && marketPulseRoute) {
        trackMarketPulseEvent(
          MARKET_PULSE_ANALYTICS_EVENTS.webinar_cta_clicked,
          { cta: analyticsCta, surface: "nav" },
        );
      }
      onClose();
    },
    [marketPulseRoute, onClose],
  );

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    lockBodyScroll();

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const mediaQuery = window.matchMedia(DESKTOP_NAV_MEDIA);
    const handleViewportChange = () => {
      if (mediaQuery.matches) {
        onClose();
      }
    };

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    mediaQuery.addEventListener("change", handleViewportChange);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      unlockBodyScroll();
      mediaQuery.removeEventListener("change", handleViewportChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const menuOverlay =
    isOpen ? (
      <div className="fixed inset-0 z-[200] md:hidden" role="presentation">
        <button
          type="button"
          tabIndex={-1}
          className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] ${focusRing}`}
          aria-label="Close menu"
          onClick={onClose}
        />
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="absolute inset-y-0 right-0 z-[201] flex w-[min(100%,20rem)] max-w-[calc(100vw-3rem)] flex-col border-l border-foreground/10 bg-background shadow-xl pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))]"
        >
          <div className="flex items-center justify-between border-b border-foreground/10 px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Menu</p>
            <button
              ref={closeButtonRef}
              type="button"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground/80 hover:bg-foreground/5 ${focusRing}`}
              aria-label="Close menu"
              onClick={onClose}
            >
              <X className="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          </div>

          <nav
            aria-label="Main"
            className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
          >
            <ul className="space-y-1">
              {MAIN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`${menuLinkClass} ${
                      pathname === link.href ||
                      pathname.startsWith(`${link.href}/`)
                        ? "bg-foreground/5 text-foreground"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavClick(
                        "analyticsCta" in link ? link.analyticsCta : undefined,
                      )
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-foreground/10 pt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-foreground/45">
                Account
              </p>
              <ul className="mt-2 space-y-1">
                {isLoadingSession ? (
                  <li className="px-3 py-2 text-sm text-foreground/50">
                    Checking session…
                  </li>
                ) : isAuthenticated ? (
                  <>
                    <li>
                      <Link
                        href="/profile"
                        className={menuLinkClass}
                        onClick={() => {
                          if (marketPulseRoute) {
                            trackMarketPulseEvent(
                              MARKET_PULSE_ANALYTICS_EVENTS.profile_cta_clicked,
                              { cta: "nav_profile", surface: "nav" },
                            );
                          }
                          onClose();
                        }}
                      >
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`${menuLinkClass} w-full text-left`}
                        onClick={() => {
                          onClose();
                          void signOut({ callbackUrl: "/" });
                        }}
                      >
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        href="/login"
                        className={menuLinkClass}
                        onClick={onClose}
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/login"
                        className={`${menuLinkClass} font-semibold text-foreground`}
                        onClick={onClose}
                      >
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    ) : null;

  return (
    <>
      <MobileNavMenuButton
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        controlsId={panelId}
        menuButtonRef={menuButtonRef}
      />

      {menuOverlay && typeof document !== "undefined"
        ? createPortal(menuOverlay, document.body)
        : null}
    </>
  );
}
