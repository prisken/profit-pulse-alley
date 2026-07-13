"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  NEXT_STEP_PREFERENCE_OPTIONS,
  type NextStepPreferenceOption,
} from "@/lib/acquisition/constants";
import {
  dismissNextStepPreferencePromptAction,
  saveNextStepPreferenceAction,
} from "@/lib/acquisition/actions";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function nextStepOptionMessageKey(option: NextStepPreferenceOption): MessageKey {
  return `acquisition.nextStep.option.${option}` as MessageKey;
}

function nextStepSavedMessageKey(option: NextStepPreferenceOption): MessageKey {
  return `acquisition.nextStep.saved.${option}` as MessageKey;
}

function resolveNextStepCta(
  option: NextStepPreferenceOption,
  playNextAvailable: boolean,
): { href: string; labelKey: MessageKey } | null {
  switch (option) {
    case "next_challenge":
      return playNextAvailable
        ? {
            href: "/market-pulse/play",
            labelKey: "acquisition.nextStep.cta.playNext",
          }
        : {
            href: "/market-pulse",
            labelKey: "acquisition.nextStep.cta.nextChallenge",
          };
    case "attend_event":
      return {
        href: "/events",
        labelKey: "acquisition.nextStep.cta.events",
      };
    case "clarity_call":
      return {
        href: "/contact?intent=clarity-call",
        labelKey: "acquisition.nextStep.cta.clarityCall",
      };
    default:
      return null;
  }
}

export default function NextStepPreferencePrompt({
  playNextAvailable,
}: Readonly<{ playNextAvailable: boolean }>) {
  const { t } = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<NextStepPreferenceOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<{
    message: string;
    cta: { href: string; labelKey: MessageKey } | null;
  } | null>(null);

  const finish = useCallback(
    async (
      action: () => Promise<{ success: boolean; error?: string }>,
      message: string,
      cta: { href: string; labelKey: MessageKey } | null = null,
    ) => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await action();

        if (!result.success) {
          setError(result.error ?? t("acquisition.nextStep.error"));
          return;
        }

        setCompletion({ message, cta });
        router.refresh();
      } catch {
        setError(t("acquisition.nextStep.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [router, t],
  );

  const handleSave = useCallback(
    async (option: NextStepPreferenceOption) => {
      setSelected(option);
      await finish(
        () => saveNextStepPreferenceAction(option),
        t(nextStepSavedMessageKey(option)),
        resolveNextStepCta(option, playNextAvailable),
      );
    },
    [finish, playNextAvailable, t],
  );

  const handleSkip = useCallback(async () => {
    await finish(
      dismissNextStepPreferencePromptAction,
      t("acquisition.nextStep.skipped"),
    );
  }, [finish, t]);

  if (completion) {
    return (
      <section
        aria-live="polite"
        className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-4 sm:px-5"
      >
        <p className="text-sm text-zinc-300">{completion.message}</p>
        {completion.cta ? (
          <div className="mt-3">
            <Link
              href={completion.cta.href}
              className={`inline-flex min-h-10 items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 text-sm font-semibold text-sky-200 transition-colors hover:bg-sky-500/20 ${focusRing}`}
            >
              {t(completion.cta.labelKey)}
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="next-step-heading"
      className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-4 sm:px-5"
    >
      <h2
        id="next-step-heading"
        className="text-sm font-semibold text-zinc-100 sm:text-base"
      >
        {t("acquisition.nextStep.title")}
      </h2>
      <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
        {t("acquisition.nextStep.subtitle")}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {t("acquisition.nextStep.optional")}
      </p>

      <div
        role="radiogroup"
        aria-labelledby="next-step-heading"
        className="mt-3 flex flex-col gap-2"
      >
        {NEXT_STEP_PREFERENCE_OPTIONS.map((option) => {
          const isSelected = selected === option;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isLoading}
              onClick={() => void handleSave(option)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
                isSelected
                  ? "border-sky-400/60 bg-sky-500/10 text-sky-100"
                  : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900"
              }`}
            >
              {t(nextStepOptionMessageKey(option))}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleSkip()}
          className={`min-h-10 rounded-lg px-3 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {t("acquisition.nextStep.skip")}
        </button>
      </div>
    </section>
  );
}
