import FinalCtaSection from "@/components/home/FinalCtaSection";
import LiveEventsHubSection from "@/components/home/LiveEventsHubSection";
import MarketPulseHero from "@/components/home/MarketPulseHero";
import PhilosophySection from "@/components/home/PhilosophySection";
import PlayLearnWinSection from "@/components/home/PlayLearnWinSection";
import { getPastEventsShowcase } from "@/lib/events/home-events-hub";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function Home() {
  const { t, locale } = await getServerTranslations();
  const pastEvents = getPastEventsShowcase(locale);
  const upcomingTitle =
    locale === "zh-Hant"
      ? t("home.events.upcoming.salesMarketing.titleZh")
      : t("home.events.upcoming.salesMarketing.title");

  return (
    <main className="flex min-w-0 flex-col overflow-x-hidden bg-zinc-950 text-zinc-50">
      <MarketPulseHero />
      <PlayLearnWinSection />
      <LiveEventsHubSection
        upcomingEvent={{
          kind: "event",
          eventTitle: upcomingTitle,
          topic: t("home.events.upcoming.salesMarketing.subtitle"),
          date: t("home.events.upcoming.salesMarketing.date"),
          location: t("home.events.upcoming.salesMarketing.location"),
          posterSrc: "/images/fortify-hero-chess-king.png",
          registerHref: "/events/fortify-sales-marketing",
          comingSoon: true,
        }}
        pastEvents={pastEvents}
      />
      <PhilosophySection />
      <FinalCtaSection />
    </main>
  );
}
