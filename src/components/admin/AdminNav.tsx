"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const SECTIONS = [
  { href: "/admin", label: "Dashboard", match: /^\/admin$/ },
  { href: "/admin/market-pulse", label: "Market Pulse", match: /^\/admin\/market-pulse/ },
  { href: "/admin/matching-pulse", label: "Matching Pulse", match: /^\/admin\/matching-pulse/ },
  { href: "/admin/pitch", label: "Pitch Meeting leads", match: /^\/admin\/pitch/ },
  { href: "/admin/workshop", label: "Workshop leads", match: /^\/admin\/workshop/ },
] as const;

/**
 * Persistent navigation for every admin section — so admins always have a
 * path back to any console from any depth (approvals, cycle builder,
 * request detail, lead tables, …).
 */
export default function AdminNav() {
  const pathname = usePathname();
  const active = SECTIONS.find((s) => s.match.test(pathname));

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-6">
        <Link
          href="/admin"
          className={`flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold tracking-tight text-zinc-100 transition hover:bg-zinc-800/70 ${focusRing}`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-xs font-extrabold text-emerald-400 ring-1 ring-emerald-500/30">
            P
          </span>
          PPA Admin
        </Link>

        <nav
          aria-label="Admin sections"
          className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1"
        >
          {SECTIONS.map((section) => {
            const isActive = active?.href === section.href;
            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                } ${focusRing}`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>

        <a
          href="https://profitpulseally.com"
          target="_blank"
          rel="noreferrer"
          className={`hidden shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-800/60 hover:text-zinc-200 sm:inline-flex ${focusRing}`}
        >
          View site ↗
        </a>
      </div>
    </header>
  );
}
