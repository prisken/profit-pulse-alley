"use client";

import { Lock, Trophy } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";

export type MarketPulseAuthPanelProps = Readonly<{
  variant: "sign-in" | "create-account" | "onboarding";
  className?: string;
}>;

const benefitKeys = [
  "auth.marketPulse.benefit.saveCalls",
  "auth.marketPulse.benefit.participation",
  "auth.marketPulse.benefit.leaderboard",
  "auth.marketPulse.benefit.prize",
] as const;

export default function MarketPulseAuthPanel({
  variant,
  className = "",
}: MarketPulseAuthPanelProps) {
  const { t } = useTranslations();

  const title =
    variant === "onboarding"
      ? t("auth.marketPulse.onboarding.title")
      : variant === "create-account"
        ? t("auth.marketPulse.create.title")
        : t("auth.marketPulse.signIn.title");

  const body =
    variant === "onboarding"
      ? t("auth.marketPulse.onboarding.body")
      : variant === "create-account"
        ? t("auth.marketPulse.create.body")
        : t("auth.marketPulse.signIn.body");

  const showTitle = variant === "onboarding";

  return (
    <aside
      className={`rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-zinc-950 px-4 py-4 text-left shadow-lg shadow-emerald-950/10 sm:px-5 sm:py-5 ${className}`}
      aria-label={t("auth.marketPulse.panelAria")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          {variant === "onboarding" ? (
            <Trophy className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Lock className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold normal-case tracking-wide text-emerald-300/90 sm:text-xs">
            Market Pulse
          </p>
          {showTitle ? (
            <h2 className="mt-1 text-base font-bold text-white sm:text-lg">{title}</h2>
          ) : null}
          <p
            className={`text-sm leading-relaxed text-zinc-400 ${showTitle ? "mt-1.5" : "mt-1"}`}
          >
            {body}
          </p>
        </div>
      </div>

      {variant === "create-account" ? (
        <ul className="mt-4 space-y-2 border-t border-emerald-500/15 pt-4">
          {benefitKeys.map((key) => (
            <li
              key={key}
              className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-zinc-300 sm:text-sm"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">{t(key)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
