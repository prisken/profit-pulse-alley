"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const footerLinkClass =
  `flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-white ${focusRing}`;

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

const PPA_LINK_KEYS: ReadonlyArray<{ labelKey: MessageKey; href: string }> = [
  { labelKey: "nav.marketPulse", href: "/market-pulse" },
  { labelKey: "nav.events", href: "/events" },
  { labelKey: "nav.philosophy", href: "/concept" },
  { labelKey: "nav.blog", href: "/blog" },
];

const COMMUNITY_LINK_KEYS: ReadonlyArray<{ labelKey: MessageKey; href: string }> =
  [
    { labelKey: "footer.link.contactUs", href: "/contact" },
    { labelKey: "footer.link.faqs", href: "/faq" },
    { labelKey: "footer.link.careers", href: "/careers" },
  ];

const LEGAL_LINK_KEYS: ReadonlyArray<{
  labelKey: MessageKey;
  href: string;
  emphasized?: boolean;
}> = [
  { labelKey: "footer.link.terms", href: "/terms" },
  { labelKey: "footer.link.privacy", href: "/privacy" },
  {
    labelKey: "footer.link.investmentDisclaimer",
    href: "/investment-disclaimer",
    emphasized: true,
  },
  { labelKey: "footer.link.contestRules", href: "/contest-rules" },
];

const SOCIAL_LINKS = [
  {
    labelKey: "footer.social.linkedin" as const,
    href: "https://www.linkedin.com/company/profitpulseally",
    icon: LinkedInIcon,
  },
  {
    labelKey: "footer.social.twitter" as const,
    href: "https://twitter.com/profitpulseally",
    icon: TwitterIcon,
  },
  {
    labelKey: "footer.social.instagram" as const,
    href: "https://www.instagram.com/profitpulseally?igsh=MWY5NWV6dHYzemoxaA%3D%3D&utm_source=qr",
    icon: InstagramIcon,
  },
] as const;

function FooterLinkColumn({
  title,
  links,
  className = "",
}: Readonly<{
  title: string;
  links: ReadonlyArray<{
    label: string;
    href: string;
    emphasized?: boolean;
  }>;
  className?: string;
}>) {
  return (
    <div className={className}>
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

function FooterAccordionSection({
  title,
  children,
  defaultOpen = false,
}: Readonly<{
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}>) {
  return (
    <details
      className="group border-b border-white/10 sm:border-0"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-white marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        {title}
        <span
          className="text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          ▾
        </span>
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );
}

function StayConnectedBlock({
  email,
  subscribeMessage,
  onEmailChange,
  onSubscribe,
}: Readonly<{
  email: string;
  subscribeMessage: string | null;
  onEmailChange: (value: string) => void;
  onSubscribe: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  const { t } = useTranslations();

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        {t("footer.column.stayConnected")}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:mt-4">
        {t("footer.newsletter.description")}
      </p>

      <form className="mt-3 space-y-3 sm:mt-4" onSubmit={onSubscribe}>
        <label htmlFor="footer-newsletter-email" className="sr-only">
          {t("footer.newsletter.emailAria")}
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t("footer.newsletter.placeholder")}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className={`w-full rounded-lg border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
        />
        <button
          type="submit"
          className={`w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 active:bg-zinc-300 sm:w-auto sm:px-6 ${focusRing}`}
        >
          {t("footer.newsletter.subscribe")}
        </button>
        {subscribeMessage ? (
          <p className="text-xs text-zinc-400" role="status">
            {subscribeMessage}
          </p>
        ) : null}
      </form>

      <div className="mt-4 flex items-center gap-2 sm:mt-5">
        {SOCIAL_LINKS.map(({ labelKey, href, icon: Icon }) => (
          <a
            key={labelKey}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(labelKey)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white ${focusRing}`}
          >
            <Icon aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function SiteFooter() {
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  const ppaLinks = useMemo(
    () => PPA_LINK_KEYS.map((link) => ({ ...link, label: t(link.labelKey) })),
    [t],
  );
  const communityLinks = useMemo(
    () =>
      COMMUNITY_LINK_KEYS.map((link) => ({ ...link, label: t(link.labelKey) })),
    [t],
  );
  const legalLinks = useMemo(
    () => LEGAL_LINK_KEYS.map((link) => ({ ...link, label: t(link.labelKey) })),
    [t],
  );

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setSubscribeMessage(t("footer.newsletter.emailRequired"));
      return;
    }
    setSubscribeMessage(t("footer.newsletter.success"));
    setEmail("");
  }

  return (
    <footer className="border-t border-white/10 bg-zinc-950 pb-[env(safe-area-inset-bottom,0px)] text-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-[max(0.75rem,env(safe-area-inset-left))] py-8 pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-12 sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:py-14">
        <div className="sm:hidden">
          <FooterAccordionSection title={t("footer.column.ppa")} defaultOpen>
            <ul className="space-y-2.5">
              {ppaLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordionSection>
          <FooterAccordionSection title={t("footer.column.community")}>
            <ul className="space-y-2.5">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordionSection>
          <FooterAccordionSection title={t("footer.column.legal")}>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
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
          </FooterAccordionSection>
        </div>

        <div className="hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <FooterLinkColumn title={t("footer.column.ppa")} links={ppaLinks} />
          <FooterLinkColumn
            title={t("footer.column.community")}
            links={communityLinks}
          />
          <FooterLinkColumn title={t("footer.column.legal")} links={legalLinks} />

          <div className="sm:col-span-2 lg:col-span-1">
            <StayConnectedBlock
              email={email}
              subscribeMessage={subscribeMessage}
              onEmailChange={(value) => {
                setEmail(value);
                if (subscribeMessage) setSubscribeMessage(null);
              }}
              onSubscribe={handleSubscribe}
            />
          </div>
        </div>

        <div className="mt-6 sm:hidden">
          <StayConnectedBlock
            email={email}
            subscribeMessage={subscribeMessage}
            onEmailChange={(value) => {
              setEmail(value);
              if (subscribeMessage) setSubscribeMessage(null);
            }}
            onSubscribe={handleSubscribe}
          />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:mt-12 sm:flex-row sm:pt-8">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center gap-2 transition-opacity hover:opacity-90 ${focusRing}`}
            aria-label={t("common.brandHomeAria")}
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-sm"
            />
            <span className="text-sm font-semibold text-white sm:text-base">
              {t("common.brandName")}
            </span>
          </Link>
          <p className="text-center text-xs text-zinc-500 sm:text-right sm:text-sm">
            {t("common.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
