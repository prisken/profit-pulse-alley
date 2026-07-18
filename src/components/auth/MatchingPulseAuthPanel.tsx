"use client";

import { Handshake } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";

export type MatchingPulseAuthPanelProps = Readonly<{
  className?: string;
}>;

export default function MatchingPulseAuthPanel({
  className = "",
}: MatchingPulseAuthPanelProps) {
  const { t } = useTranslations();

  return (
    <aside
      className={`rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-zinc-950 px-4 py-4 text-left shadow-lg shadow-emerald-950/10 sm:px-5 sm:py-5 ${className}`}
      aria-label={t("auth.matchingPulse.panelAria")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <Handshake className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold normal-case tracking-wide text-emerald-300/90 sm:text-xs">
            Matching Pulse
          </p>
          <h2 className="mt-1 text-base font-bold text-white sm:text-lg">
            {t("auth.matchingPulse.title")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            {t("auth.matchingPulse.body")}
          </p>
        </div>
      </div>
    </aside>
  );
}
