import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerSiteLocale, getServerTranslations } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { applyUnsubscribeFromToken } from "@/lib/notifications/unsubscribe";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title: translate(locale, "meta.unsubscribe.title"),
    description: translate(locale, "meta.unsubscribe.description"),
  };
}

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { t } = await getServerTranslations();
  const params = await searchParams;
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  const result = await applyUnsubscribeFromToken(token);
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);

  let bodyKey:
    | "unsubscribe.success"
    | "unsubscribe.already"
    | "unsubscribe.expired"
    | "unsubscribe.failed" = "unsubscribe.failed";

  if (result.ok) {
    bodyKey = result.alreadyUnsubscribed
      ? "unsubscribe.already"
      : "unsubscribe.success";
  } else if (result.reason === "expired") {
    bodyKey = "unsubscribe.expired";
  }

  return (
    <ContentPageLayout title={t("unsubscribe.title")}>
      <p>{t(bodyKey)}</p>
      <p>{t("unsubscribe.transactionalNote")}</p>
      <p className="not-prose flex flex-wrap gap-3 text-sm">
        {isLoggedIn ? (
          <Link
            href="/profile"
            className="font-medium text-amber-300 underline-offset-4 hover:underline"
          >
            {t("unsubscribe.manageProfile")}
          </Link>
        ) : null}
        <Link
          href="/"
          className="font-medium text-zinc-300 underline-offset-4 hover:underline"
        >
          {t("unsubscribe.backHome")}
        </Link>
      </p>
    </ContentPageLayout>
  );
}
