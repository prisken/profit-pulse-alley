import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Profit Pulse Ally",
  description: "News, insights, and events for profit-minded builders.",
  metadataBase: new URL("https://profit-pulse-alley.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight transition-opacity active:opacity-80"
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
              <span className="text-sm sm:text-base md:text-lg">
                Profit Pulse Ally
              </span>
            </Link>

            <nav className="flex flex-wrap items-center gap-0.5 text-[13px] font-medium sm:justify-end sm:gap-1 sm:text-sm">
              <Link
                href="/"
                className="rounded-md px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 sm:px-3 sm:py-2"
              >
                Home
              </Link>
              <Link
                href="/concept"
                className="rounded-md px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 sm:px-3 sm:py-2"
              >
                The Concept
              </Link>
              <Link
                href="/blog"
                className="rounded-md px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 sm:px-3 sm:py-2"
              >
                Blog
              </Link>
              <Link
                href="/event"
                className="rounded-md px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 sm:px-3 sm:py-2"
              >
                活動
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-foreground/10 bg-background">
          <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-4 gap-y-2 border-b border-foreground/10 pb-4 text-[13px] font-medium sm:text-sm"
            >
              <Link
                href="/"
                className="text-foreground/70 transition-colors hover:text-foreground active:text-foreground/90"
              >
                Home
              </Link>
              <Link
                href="/concept"
                className="text-foreground/70 transition-colors hover:text-foreground active:text-foreground/90"
              >
                The Concept
              </Link>
              <Link
                href="/event"
                className="text-foreground/70 transition-colors hover:text-foreground active:text-foreground/90"
              >
                《我兩樣都要》活動
              </Link>
              <Link
                href="/game"
                className="text-foreground/70 transition-colors hover:text-foreground active:text-foreground/90"
              >
                城堡攻防戰
              </Link>
              <Link
                href="/blog"
                className="text-foreground/70 transition-colors hover:text-foreground active:text-foreground/90"
              >
                Blog
              </Link>
            </nav>

            <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-snug text-foreground/65 sm:text-sm sm:leading-relaxed">
                © {new Date().getFullYear()} Profit Pulse Ally. All rights
                reserved.
              </p>

              <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="https://www.instagram.com/profitpulseally?igsh=MWY5NWV6dHYzemoxaA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="7" y="7" width="10" height="10" rx="3" />
                  <path d="M16.2 7.8h.01" />
                  <circle cx="12" cy="12" r="2.7" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61582209732918"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 8h2V5h-2a4 4 0 0 0-4 4v2H8v3h2v5h3v-5h2.5l.5-3H13V9a1 1 0 0 1 1-1z" />
                </svg>
              </a>
              <a
                href="https://www.threads.com/@profitpulseally?igshid=NTc4MTIwNjQ2YQ=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Threads"
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8.2 12c0-2.4 1.7-4.2 4.1-4.2 2.5 0 4.2 1.8 4.2 4.2 0 2.9-2.1 4.9-5.1 4.9-3.1 0-5.4-2.2-5.4-5.4 0-3.9 3.1-7 7.3-7 3.3 0 6.2 1.8 7.2 4.9" />
                </svg>
              </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
