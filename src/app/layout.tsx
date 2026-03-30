import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Profit Pulse Alley",
  description: "News, insights, and events for profit-minded builders.",
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
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
              aria-label="Profit Pulse Alley home"
            >
              <span className="text-base sm:text-lg">Profit Pulse Alley</span>
            </Link>

            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium sm:justify-end sm:gap-6">
              <Link
                href="/"
                className="text-foreground/70 transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/concept"
                className="text-foreground/70 transition-colors hover:text-foreground"
              >
                The Concept
              </Link>
              <Link
                href="/blog"
                className="text-foreground/70 transition-colors hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                href="/event"
                className="text-foreground/70 transition-colors hover:text-foreground"
              >
                Event
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-foreground/70">
              Copyright {new Date().getFullYear()} Profit Pulse Alley. All
              rights reserved.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Twitter / X"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {/* Placeholder social icon */}
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
                  <path d="M16 4l-4 6 8 10-3 0-6-8-4 6H4l6-9L5 4h3l4 6 4-6h0z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {/* Placeholder social icon */}
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
                  <path d="M9 19c-4 1.5-4-2.5-5-3m10 6v-3.5c0-1 .1-1.4-.5-2 2-.2 4-.9 4-4a3.1 3.1 0 0 0-.9-2.1 3 3 0 0 0-.1-2.1s-.8-.3-2.5 1a8.5 8.5 0 0 0-4.6 0c-1.7-1.3-2.5-1-2.5-1a3 3 0 0 0-.1 2.1A3.1 3.1 0 0 0 6 11.9c0 3.1 2 3.8 4 4-.4.3-.5.8-.5 1.6V22" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {/* Placeholder social icon */}
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
                  <path d="M22 12s0-4-1-5-4-1-9-1-8 0-9 1-1 5-1 5 0 4 1 5 4 1 9 1 8 0 9-1 1-5 1-5z" />
                  <path d="M10 15l5-3-5-3v6z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
