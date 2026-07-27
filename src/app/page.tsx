import FinalCtaSection from "@/components/home/FinalCtaSection";
import HomePpaEcosystemSection from "@/components/home/HomePpaEcosystemSection";
import LiveEventsHubSection from "@/components/home/LiveEventsHubSection";
import HomePulseBoardWidget from "@/components/home/HomePulseBoardWidget";
import HomeRewardsShowcase from "@/components/home/HomeRewardsShowcase";
import MarketPulseHero from "@/components/home/MarketPulseHero";
import MarketPulsePipelineSection from "@/components/home/MarketPulsePipelineSection";
import PhilosophySection from "@/components/home/PhilosophySection";
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
    <main className="flex min-w-0 flex-col overflow-x-hidden bg-mp-obsidian text-white">
      <MarketPulseHero />
      <MarketPulsePipelineSection />
      <HomePulseBoardWidget />
      <HomeRewardsShowcase />
      <HomePpaEcosystemSection />
      <LiveEventsHubSection
        upcomingEvent={{
          kind: "event",
          eventTitle: upcomingTitle,
          topic: t("home.events.upcoming.salesMarketing.subtitle"),
          date: t("home.events.upcoming.salesMarketing.date"),
          location: t("home.events.upcoming.salesMarketing.location"),
          posterSrc: "/images/fortify-lunch-learn-july-2026-poster.png",
          registerHref: "/fortify-registration",
          comingSoon: false,
        }}
        pastEvents={pastEvents}
      />
      <PhilosophySection />
      <FinalCtaSection />
    </main>
  );
}
