import type { Metadata } from "next";

import LoginPage from "@/components/auth/LoginPage";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "auth.meta.login.title"),
    description: translate(locale, "auth.meta.login.description"),
  };
}

export default function LoginRoute() {
  return <LoginPage />;
}
