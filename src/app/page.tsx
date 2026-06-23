import FinalCtaSection from "@/components/home/FinalCtaSection";
import LiveEventsHubSection from "@/components/home/LiveEventsHubSection";
import MarketPulseHero from "@/components/home/MarketPulseHero";
import PhilosophySection from "@/components/home/PhilosophySection";
import PlayLearnWinSection from "@/components/home/PlayLearnWinSection";
import { fortifyYourFutureEvent } from "@/lib/events/fortify-your-future";
import { PAST_EVENTS_SHOWCASE } from "@/lib/events/home-events-hub";

export default function Home() {
  const primarySpeaker = fortifyYourFutureEvent.speakers[0];

  return (
    <main className="flex min-w-0 flex-col overflow-x-hidden bg-zinc-950 text-zinc-50">
      <MarketPulseHero />
      <PlayLearnWinSection />
      <LiveEventsHubSection
        upcomingEvent={{
          speakerName:
            fortifyYourFutureEvent.speakers.map((s) => s.name).join(" & ") ||
            "Guest Speaker TBA",
          speakerRole: primarySpeaker?.title ?? "",
          speakerHeadshotSrc: "/vicky-headshot.png",
          topic: fortifyYourFutureEvent.subtitle,
          date: fortifyYourFutureEvent.eventDateTime,
          registerHref: "/events/fortify-your-future",
        }}
        pastEvents={PAST_EVENTS_SHOWCASE}
      />
      <PhilosophySection />
      <FinalCtaSection />
    </main>
  );
}
