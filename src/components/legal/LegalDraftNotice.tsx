import { LEGAL_DRAFT_NOTICE } from "@/lib/market-pulse/legal-copy";

export default function LegalDraftNotice() {
  return (
    <div className="not-prose mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 sm:mb-8 sm:px-5 sm:py-4">
      <p className="text-xs font-semibold leading-relaxed text-amber-200 sm:text-sm">
        {LEGAL_DRAFT_NOTICE}
      </p>
    </div>
  );
}
