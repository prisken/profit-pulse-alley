import type { Metadata } from "next";

import EventDetailTemplate from "@/components/events/EventDetailTemplate";
import { getFortifySalesMarketingEvent } from "@/lib/events/fortify-sales-marketing";
import { getServerSiteLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const event = getFortifySalesMarketingEvent(locale);
  return {
    title: event.pageTitle,
    description: event.subtitle,
  };
}

export default async function FortifySalesMarketingEventPage() {
  const locale = await getServerSiteLocale();
  const event = getFortifySalesMarketingEvent(locale);
  return <EventDetailTemplate {...event} />;
}
