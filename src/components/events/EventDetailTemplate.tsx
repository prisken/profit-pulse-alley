import { Calendar, ExternalLink, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EventDetailData } from "@/lib/events/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaPrimary =
  `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:min-h-12 sm:px-6 sm:py-3.5 ${focusRing}`;

function RegistrationCta({
  href,
  text,
  disabled,
  className = "",
}: {
  href: string;
  text: string;
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) {
    return (
      <span
        className={`${ctaPrimary} cursor-not-allowed opacity-60 ${className}`}
        aria-disabled="true"
      >
        {text}
      </span>
    );
  }

  const isExternal = href.startsWith("http");
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${ctaPrimary} ${className}`}
      >
        {text}
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link href={href} className={`${ctaPrimary} ${className}`}>
      {text}
    </Link>
  );
}

export default function EventDetailTemplate({
  title,
  subtitle,
  highlights,
  registrationLink,
  registrationText,
  registrationDisabled,
  speakersSectionTitle,
  speakers,
  agenda,
  venueDescription,
  eventDateTime,
  eventLocation,
  eventCost,
  mapHtml,
  pastEventBanner,
  heroImage,
}: EventDetailData) {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-10">
      {pastEventBanner}

      {/* Hero */}
      <section
        className="border-b border-foreground/10 pb-6 sm:pb-10"
        aria-labelledby="event-hero-heading"
      >
        <div
          className={
            heroImage
              ? "grid gap-5 sm:gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10"
              : undefined
          }
        >
          <div className={heroImage ? "order-2 min-w-0 lg:order-1" : "min-w-0"}>
            <h1
              id="event-hero-heading"
              className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-pretty text-[15px] font-medium leading-snug text-foreground/90 sm:text-lg sm:leading-relaxed">
              {subtitle}
            </p>
            <ul className="mt-4 space-y-2 text-[13px] leading-snug text-foreground/80 sm:space-y-2.5 sm:text-sm sm:leading-relaxed">
              {highlights.map((item) => (
                <li key={item.label} className="flex gap-2.5 sm:gap-3">
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ✅
                  </span>
                  <span>
                    <strong className="text-foreground/90">{item.label}</strong>{" "}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 sm:mt-6">
              <RegistrationCta
                href={registrationLink}
                text={registrationText}
                disabled={registrationDisabled}
                className="sm:max-w-md"
              />
            </div>
          </div>

          {heroImage ? (
            <div className="order-1 min-w-0 lg:order-2">
              <div className="overflow-hidden rounded-xl border border-foreground/10 bg-white shadow-sm sm:rounded-2xl">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={heroImage.mobileSrc}
                    alt={heroImage.alt}
                    fill
                    priority
                    className="object-contain object-center md:hidden"
                    sizes="(max-width: 767px) 100vw, 1px"
                  />
                  <Image
                    src={heroImage.desktopSrc}
                    alt={heroImage.alt}
                    fill
                    priority
                    className="hidden object-contain object-center md:block"
                    sizes="(min-width: 768px) 45vw, 1px"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Speakers */}
      <section
        className="border-b border-foreground/10 py-6 sm:py-10"
        aria-labelledby="event-speakers-heading"
      >
        <h2
          id="event-speakers-heading"
          className="text-center text-base font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl"
        >
          {speakersSectionTitle}
        </h2>
        <div className="mt-5 grid gap-4 sm:mt-7 md:grid-cols-2 md:gap-5">
          {speakers.map((speaker) => (
            <article
              key={speaker.name}
              className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:rounded-2xl sm:p-5"
            >
              <h3 className="text-[15px] font-semibold text-foreground sm:text-base lg:text-lg">
                {speaker.name}
              </h3>
              <p className="mt-0.5 text-sm font-medium text-foreground/70">
                {speaker.title}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/80 sm:text-sm">
                {speaker.bio}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Agenda */}
      <section
        className="border-b border-foreground/10 py-6 sm:py-10"
        aria-labelledby="event-agenda-heading"
      >
        <h2
          id="event-agenda-heading"
          className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          Agenda / 活動流程
        </h2>
        <ul className="mt-4 space-y-3 text-[13px] leading-snug text-foreground/80 sm:text-sm sm:leading-relaxed">
          {agenda.map((item) => (
            <li key={item.time} className="flex gap-2 sm:gap-3">
              <span className="shrink-0 font-semibold text-foreground/90">
                {item.time}
              </span>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Venue & details */}
      <section
        className="border-b border-foreground/10 py-6 sm:py-10"
        aria-labelledby="event-details-heading"
      >
        <h2 id="event-details-heading" className="sr-only">
          Event details
        </h2>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              Event Venue / 活動場地
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/80 sm:text-sm">
              {venueDescription}
            </p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm sm:rounded-2xl sm:p-6">
            <h4 className="text-sm font-semibold text-foreground sm:text-base">
              活動資料
            </h4>
            <dl className="mt-3 space-y-3 text-[13px] sm:text-sm">
              <div className="flex gap-3">
                <Calendar
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
                    Date &amp; Time
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground/90">
                    {eventDateTime}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
                    Location
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground/90">
                    {eventLocation}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Ticket
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
                    Cost
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {eventCost}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
        {mapHtml ? <div className="mt-6">{mapHtml}</div> : null}
      </section>

      {/* Final CTA */}
      <section className="py-6 sm:py-10" aria-labelledby="event-final-cta">
        <h2 id="event-final-cta" className="sr-only">
          Register
        </h2>
        <div className="mx-auto flex max-w-2xl justify-center">
          <RegistrationCta
            href={registrationLink}
            text={registrationText}
            disabled={registrationDisabled}
            className="w-full sm:max-w-md"
          />
        </div>
      </section>
    </main>
  );
}
