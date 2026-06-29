import EventDetailTemplate from "@/components/events/EventDetailTemplate";
import { fortifyYourFutureEvent } from "@/lib/events/fortify-your-future";

function PastEventBanner() {
  return (
    <div
      className="border-b border-red-300/40 bg-red-100 px-3 py-2.5 text-center text-xs font-medium text-red-900 sm:px-4 sm:py-3 sm:text-sm dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-200"
      role="status"
    >
      <strong>This is a past event.</strong> Registration is now closed. /
      本活動已結束，報名已截止。
    </div>
  );
}

export const metadata = {
  title: fortifyYourFutureEvent.pageTitle,
  description: fortifyYourFutureEvent.subtitle,
};

export default function FortifyYourFutureEventPage() {
  return (
    <EventDetailTemplate
      {...fortifyYourFutureEvent}
      pastEventBanner={<PastEventBanner />}
    />
  );
}
