"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LEARNING_INTEREST_OPTIONS,
  type LearningInterestOption,
} from "@/lib/acquisition/constants";
import {
  dismissLearningInterestPromptAction,
  saveLearningInterestAction,
} from "@/lib/acquisition/actions";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function learningInterestMessageKey(
  option: LearningInterestOption,
): MessageKey {
  return `acquisition.learningInterest.option.${option}` as MessageKey;
}

export default function LearningInterestPrompt() {
  const { t } = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<LearningInterestOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const finish = useCallback(
    async (action: () => Promise<{ success: boolean; error?: string }>, message: string) => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await action();

        if (!result.success) {
          setError(result.error ?? t("acquisition.learningInterest.error"));
          return;
        }

        setCompletionMessage(message);
        router.refresh();
      } catch {
        setError(t("acquisition.learningInterest.error"));
      } finally {
        setIsLoading(false);
      }
    },
    [router, t],
  );

  const handleSave = useCallback(
    async (option: LearningInterestOption) => {
      setSelected(option);
      await finish(
        () => saveLearningInterestAction(option),
        t("acquisition.learningInterest.saved"),
      );
    },
    [finish, t],
  );

  const handleSkip = useCallback(async () => {
    await finish(
      dismissLearningInterestPromptAction,
      t("acquisition.learningInterest.skipped"),
    );
  }, [finish, t]);

  if (completionMessage) {
    return (
      <section
        aria-live="polite"
        className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300"
      >
        <p>{completionMessage}</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="learning-interest-heading"
      className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-4 sm:px-5"
    >
      <h2
        id="learning-interest-heading"
        className="text-sm font-semibold text-zinc-100 sm:text-base"
      >
        {t("acquisition.learningInterest.title")}
      </h2>
      <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
        {t("acquisition.learningInterest.optional")}
      </p>

      <div
        role="radiogroup"
        aria-labelledby="learning-interest-heading"
        className="mt-3 flex flex-col gap-2"
      >
        {LEARNING_INTEREST_OPTIONS.map((option) => {
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
                  ? "border-amber-400/60 bg-amber-500/10 text-amber-100"
                  : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900"
              }`}
            >
              {t(learningInterestMessageKey(option))}
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
          {t("acquisition.learningInterest.skip")}
        </button>
      </div>
    </section>
  );
}
