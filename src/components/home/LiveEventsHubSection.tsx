import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Flame,
  MapPin,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import type {
  PastEventAccent,
  PastEventShowcase,
} from "@/lib/events/home-events-hub";
import { getServerTranslations } from "@/lib/i18n/server";
import {
  MP_FOCUS_RING,
  MP_HOME_SECTION,
  MP_METRIC_TEXT,
  MP_PRIMARY_BTN,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const focusRing = MP_FOCUS_RING;

export type LiveUpcomingEvent =
  | {
      kind: "speaker";
      speakerName: string;
      speakerRole: string;
      speakerHeadshotSrc: string;
      topic: string;
      date: string;
      registerHref: string;
    }
  | {
      kind: "event";
      eventTitle: string;
      topic: string;
      date: string;
      location: string;
      posterSrc: string;
      registerHref: string;
      comingSoon?: boolean;
    };

type LiveEventsHubSectionProps = Readonly<{
  upcomingEvent: LiveUpcomingEvent;
  pastEvents: PastEventShowcase[];
}>;

const PAST_ACCENT_STYLES: Record<
  PastEventAccent,
  {
    card: string;
    glow: string;
    icon: string;
    bar: string;
    metric: string;
  }
> = {
  pulse: {
    card: "border-mp-pulse/25 hover:border-mp-pulse/40",
    glow: "bg-mp-pulse/20",
    icon: "border-mp-pulse/35 bg-mp-pulse/15 text-mp-pulse shadow-[0_0_28px_rgba(0,230,118,0.22)]",
    bar: "from-mp-pulse via-mp-pulse/70 to-transparent",
    metric: "text-mp-pulse/90",
  },
  amber: {
    card: "border-amber-400/25 hover:border-amber-400/40",
    glow: "bg-amber-400/15",
    icon: "border-amber-400/40 bg-amber-400/12 text-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.22)]",
    bar: "from-amber-400 via-amber-400/70 to-transparent",
    metric: "text-amber-300/90",
  },
  sky: {
    card: "border-sky-400/20 hover:border-sky-400/35",
    glow: "bg-sky-400/15",
    icon: "border-sky-400/35 bg-sky-400/12 text-sky-300 shadow-[0_0_28px_rgba(56,189,248,0.2)]",
    bar: "from-sky-400 via-sky-400/70 to-transparent",
    metric: "text-sky-300/90",
  },
};

const PAST_ICONS: LucideIcon[] = [Users, Flame, Shield];

function PastEventCard({
  event,
  index,
  archiveCta,
}: Readonly<{
  event: PastEventShowcase;
  index: number;
  archiveCta: string;
}>) {
  const styles = PAST_ACCENT_STYLES[event.accent];
  const Icon = PAST_ICONS[index % PAST_ICONS.length] ?? Users;
  const indexLabel = String(index + 1).padStart(2, "0");

  const body = (
    <>
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          styles.bar,
        )}
        aria-hidden="true"
      />
      <div
        className={mergeMpClasses(
          "pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          styles.glow,
          "opacity-70 motion-reduce:transition-none",
        )}
        aria-hidden="true"
      />
      <span
        className={mergeMpClasses(
          "pointer-events-none absolute -right-1 top-1 select-none text-5xl font-bold leading-none sm:text-6xl",
          MP_METRIC_TEXT,
          "text-white/[0.06]",
        )}
        aria-hidden="true"
      >
        {indexLabel}
      </span>

      <div className="relative flex flex-col items-start gap-4 sm:gap-5">
        <div
          className={mergeMpClasses(
            "flex h-14 w-14 items-center justify-center rounded-2xl border sm:h-16 sm:w-16",
            styles.icon,
          )}
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-bold leading-snug tracking-tight text-white sm:text-lg">
            {event.title}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            {event.summary}
          </p>
          <p
            className={mergeMpClasses(
              "mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide sm:text-[13px]",
              styles.metric,
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {event.attendeeMetric}
          </p>
          {event.archiveHref ? (
            <span
              className={mergeMpClasses(
                "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-300 transition-colors group-hover:text-white",
              )}
            >
              {archiveCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const cardClass = mergeMpClasses(
    "group relative flex h-full flex-col overflow-hidden",
    MP_TERMINAL_PANEL,
    "bg-gradient-to-b from-white/[0.05] to-transparent p-5 transition-[border-color,box-shadow,transform] duration-300 sm:p-6",
    "hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] motion-reduce:transform-none motion-reduce:transition-none",
    styles.card,
    event.archiveHref ? focusRing : "",
  );

  if (event.archiveHref) {
    return (
      <li>
        <Link href={event.archiveHref} className={cardClass}>
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <article className={cardClass}>{body}</article>
    </li>
  );
}

export default async function LiveEventsHubSection({
  upcomingEvent,
  pastEvents,
}: LiveEventsHubSectionProps) {
  const { t } = await getServerTranslations();

  const sectionLabel =
    upcomingEvent.kind === "event" && upcomingEvent.comingSoon
      ? t("home.events.comingSoonLabel")
      : t("home.events.nextLabel");

  const ctaLabel =
    upcomingEvent.kind === "event" && upcomingEvent.comingSoon
      ? t("home.events.viewDetails")
      : t("home.events.register");

  return (
    <section
      id="live-events-hub"
      className={MP_HOME_SECTION}
      aria-labelledby="live-events-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-2xl">
          <p className={mergeMpClasses(MP_TICKER_TEXT, "text-zinc-500")}>
            {t("home.events.eyebrow")}
          </p>
          <h2
            id="live-events-heading"
            className="mt-1.5 text-lg font-bold tracking-tight text-zinc-100 sm:mt-2 sm:text-2xl"
          >
            {t("home.events.heading")}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:mt-2 sm:text-sm">
            {t("home.events.subtitle")}
          </p>
        </header>

        <article
          className={`mt-5 overflow-hidden sm:mt-6 ${MP_TERMINAL_PANEL}`}
          aria-labelledby="upcoming-fireside-heading"
        >
          <div className="grid gap-0 md:grid-cols-2 md:gap-0">
            <div className="relative aspect-[16/10] min-h-[12rem] w-full sm:aspect-[4/5] sm:min-h-[280px] md:aspect-auto md:min-h-[420px]">
              <Image
                src={
                  upcomingEvent.kind === "event"
                    ? upcomingEvent.posterSrc
                    : upcomingEvent.speakerHeadshotSrc
                }
                alt={
                  upcomingEvent.kind === "event"
                    ? upcomingEvent.eventTitle
                    : upcomingEvent.speakerName
                }
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-zinc-950/20"
                aria-hidden="true"
              />
            </div>

            <div className="flex flex-col justify-center p-4 sm:p-8 md:p-10 lg:p-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90 sm:text-xs sm:tracking-[0.18em]">
                {sectionLabel}
              </p>
              <h3
                id="upcoming-fireside-heading"
                className="mt-2 text-xl font-bold text-white sm:mt-3 sm:text-3xl"
              >
                {upcomingEvent.kind === "event"
                  ? upcomingEvent.eventTitle
                  : upcomingEvent.speakerName}
              </h3>
              {upcomingEvent.kind === "speaker" ? (
                <p className="mt-0.5 text-xs font-medium text-amber-300/90 sm:mt-1 sm:text-base">
                  {upcomingEvent.speakerRole}
                </p>
              ) : null}
              <p className="mt-2 line-clamp-3 text-pretty text-xs leading-relaxed text-zinc-300 sm:mt-4 sm:text-base">
                {upcomingEvent.topic}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-zinc-200 sm:mt-4 sm:text-base">
                <Calendar
                  className="h-3.5 w-3.5 shrink-0 text-amber-300 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                {upcomingEvent.date}
              </p>
              {upcomingEvent.kind === "event" ? (
                <p className="mt-1.5 inline-flex items-center gap-2 text-xs font-medium text-zinc-300 sm:text-base">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-amber-300 sm:h-4 sm:w-4"
                    aria-hidden="true"
                  />
                  {upcomingEvent.location}
                </p>
              ) : null}
              <Link
                href={upcomingEvent.registerHref}
                className={mergeMpClasses(
                  MP_PRIMARY_BTN,
                  "mt-4 min-h-11 w-full px-5 py-2.5 text-sm sm:mt-6 sm:w-auto sm:px-8",
                  focusRing,
                )}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-7 sm:mt-10">
          <h3 className="text-base font-semibold text-white sm:text-xl">
            {t("home.events.pastHeading")}
          </h3>
          <ul className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4 lg:gap-5">
            {pastEvents.map((event, index) => (
              <PastEventCard
                key={event.title}
                event={event}
                index={index}
                archiveCta={t("home.events.pastArchiveCta")}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
