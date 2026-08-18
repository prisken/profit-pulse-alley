import type { Metadata } from "next";

import LinksHubPage from "@/components/links/LinksHubPage";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "links.meta.title"),
    description: translate(locale, "links.meta.description"),
  };
}

export default function LinksRoute() {
  return <LinksHubPage />;
}
