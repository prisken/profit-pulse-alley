import { LEGAL_DRAFT_NOTICE } from "@/lib/market-pulse/legal-copy";

export default function LegalDraftNotice() {
  return (
    <div className="not-prose mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold leading-relaxed text-amber-200">
        {LEGAL_DRAFT_NOTICE}
      </p>
    </div>
  );
}
