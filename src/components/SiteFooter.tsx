"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const footerLinkClass =
  "text-sm text-zinc-400 transition-colors hover:text-white";

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4v2" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4l11.5 13L20 20M20 4 4 20" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
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
  );
}

const PPA_LINKS = [
  { label: "Game", href: "/game" },
  { label: "Events", href: "/events" },
  { label: "Our Philosophy", href: "/concept" },
  { label: "Blog", href: "/blog" },
] as const;

const COMMUNITY_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Careers", href: "/careers" },
] as const;

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  {
    label: "Investment Disclaimer",
    href: "/investment-disclaimer",
    emphasized: true,
  },
] as const;

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/profitpulseally",
    icon: LinkedInIcon,
  },
  {
    label: "Twitter",
    href: "https://twitter.com/profitpulseally",
    icon: TwitterIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/profitpulseally?igsh=MWY5NWV6dHYzemoxaA%3D%3D&utm_source=qr",
    icon: InstagramIcon,
  },
] as const;

function FooterLinkColumn({
  title,
  links,
}: Readonly<{
  title: string;
  links: ReadonlyArray<{
    label: string;
    href: string;
    emphasized?: boolean;
  }>;
}>) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`${footerLinkClass} ${
                link.emphasized
                  ? "font-semibold text-amber-300/90 hover:text-amber-200"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setSubscribeMessage("Please enter your email address.");
      return;
    }
    setSubscribeMessage("Thanks for subscribing! Newsletter coming soon.");
    setEmail("");
  }

  return (
    <footer className="border-t border-white/10 bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-6 sm:py-12 md:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <FooterLinkColumn title="PPA" links={PPA_LINKS} />
          <FooterLinkColumn title="Community" links={COMMUNITY_LINKS} />
          <FooterLinkColumn title="Legal" links={LEGAL_LINKS} />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Stay Connected
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Get Market Pulse updates, event invites, and community highlights in
              your inbox.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleSubscribe}>
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (subscribeMessage) setSubscribeMessage(null);
                }}
                className={`w-full rounded-lg border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
              />
              <button
                type="submit"
                className={`w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:w-auto sm:px-6 ${focusRing}`}
              >
                Subscribe
              </button>
              {subscribeMessage ? (
                <p className="text-xs text-zinc-400" role="status">
                  {subscribeMessage}
                </p>
              ) : null}
            </form>

            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white ${focusRing}`}
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:mt-12 sm:flex-row sm:pt-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="Profit Pulse Ally home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-sm"
            />
            <span className="text-sm font-semibold text-white sm:text-base">
              Profit Pulse Ally
            </span>
          </Link>
          <p className="text-center text-xs text-zinc-500 sm:text-right sm:text-sm">
            © 2026 Profit Pulse Ally. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
