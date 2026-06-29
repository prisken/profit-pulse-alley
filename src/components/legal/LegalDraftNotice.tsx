import { getServerTranslations } from "@/lib/i18n/server";

export default async function LegalDraftNotice() {
  const { t } = await getServerTranslations();

  return (
    <div className="not-prose mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 sm:mb-8 sm:px-5 sm:py-4">
      <p className="text-xs font-semibold leading-relaxed text-amber-200 sm:text-sm">
        {t("legal.draftNotice")}
      </p>
    </div>
  );
}
