import type { Metadata } from "next";
import Link from "next/link";

import FaqAccordion from "@/components/faq/FaqAccordion";
import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { getServerSiteLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const isEn = locale === "en";
  return {
    title: isEn ? "FAQ | Profit Pulse Ally" : "常見問題 | Profit Pulse Ally",
    description: isEn
      ? "Answers about Profit Pulse Ally, the free Market Pulse game, founder events, the Zero-Cost Life philosophy, and AIA compliance."
      : "關於 Profit Pulse Ally、免費 Market Pulse 遊戲、創辦人活動、Zero-Cost Life 理念及 AIA 合規的解答。",
  };
}

function DisclaimerBox({ locale }: { locale: string }) {
  const isEn = locale === "en";
  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-xs leading-relaxed text-amber-100/90 sm:px-5 sm:text-sm">
      {isEn ? (
        <p>
          <strong>Educational only.</strong> Profit Pulse Ally is not a licensed
          insurance intermediary or financial advisor. We do not sell, recommend,
          or offer any specific insurance or investment products. Returns are not
          guaranteed and involve risk, including possible loss of capital. Always
          consult a licensed professional and read official documents. See the{" "}
          <Link
            href="/investment-disclaimer"
            className="font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            full Investment Disclaimer
          </Link>
          .
        </p>
      ) : (
        <p>
          <strong>僅供教育用途。</strong>Profit Pulse Ally 並非持牌保險中介人或
          財務顧問。我們不銷售、推薦或提供任何特定保險或投資產品。回報不保證，
          涉及風險，包括可能損失本金。請務必諮詢持牌專業人士並閱讀官方文件。
          請參閱{" "}
          <Link
            href="/investment-disclaimer"
            className="font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            完整投資免責聲明
          </Link>
          。
        </p>
      )}
    </div>
  );
}

export default async function FaqPage() {
  const locale = await getServerSiteLocale();
  const isEn = locale === "en";

  return (
    <ContentPageLayout title={isEn ? "Frequently Asked Questions" : "常見問題"}>
      <DisclaimerBox locale={locale} />

      <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
        {isEn
          ? "Answers about our educational platform, the free Market Pulse game, founder events, the Zero-Cost Life philosophy, and how everything fits together for Hong Kong business owners and investment learners."
          : "關於我們的教育平台、免費 Market Pulse 遊戲、創辦人活動、Zero-Cost Life 理念，以及這些如何為香港企業主和投資學習者串連起來的解答。"}
      </p>

      <FaqAccordion locale={locale === "en" ? "en" : "zh-Hant"} />

      <DisclaimerBox locale={locale} />
    </ContentPageLayout>
  );
}
