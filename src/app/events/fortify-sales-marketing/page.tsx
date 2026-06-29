import EventDetailTemplate from "@/components/events/EventDetailTemplate";
import { fortifySalesMarketingEvent } from "@/lib/events/fortify-sales-marketing";

export const metadata = {
  title: fortifySalesMarketingEvent.pageTitle,
  description: fortifySalesMarketingEvent.subtitle,
};

export default function FortifySalesMarketingEventPage() {
  return <EventDetailTemplate {...fortifySalesMarketingEvent} />;
}
