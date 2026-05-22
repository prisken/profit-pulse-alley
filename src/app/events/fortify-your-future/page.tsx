import EventDetailTemplate from "@/components/events/EventDetailTemplate";
import { fortifyYourFutureEvent } from "@/lib/events/fortify-your-future";

export const metadata = {
  title: fortifyYourFutureEvent.pageTitle,
  description: fortifyYourFutureEvent.subtitle,
};

export default function FortifyYourFutureEventPage() {
  return <EventDetailTemplate {...fortifyYourFutureEvent} />;
}
