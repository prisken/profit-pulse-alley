"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";

import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  confirmExpensesAction,
  predictExpensesAction,
} from "@/lib/workshop/pyramid-actions";
import type {
  ExpenseCategoryKey,
  ExpensesState,
  PyramidState,
  WorkshopTone,
} from "@/lib/workshop/types";

const EXPENSE_CATEGORY_LABEL_KEYS: Record<ExpenseCategoryKey, MessageKey> = {
  housing: "workshop.expenses.categories.housing",
  food_living: "workshop.expenses.categories.foodLiving",
  transport: "workshop.expenses.categories.transport",
  insurance: "workshop.expenses.categories.insurance",
  discretionary: "workshop.expenses.categories.discretionary",
};

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function withLiveTotal(categories: ExpensesState["categories"]): ExpensesState {
  const next = categories.map((cat) => ({
    ...cat,
    amountHKD: Math.max(0, Math.round(cat.amountHKD)),
  }));
  return {
    categories: next,
    totalHKD: next.reduce((sum, cat) => sum + cat.amountHKD, 0),
  };
}

type WorkshopExpensesStepProps = Readonly<{
  sessionId: string;
  age: number;
  monthlyIncome: number;
  industry: string;
  householdStatus?: string;
  pyramid: PyramidState;
  tone: WorkshopTone;
  expenses: ExpensesState | null;
  onChange: (next: ExpensesState | null) => void;
  onBack: () => void;
  onContinue: () => void;
}>;

export default function WorkshopExpensesStep({
  sessionId,
  age,
  monthlyIncome,
  industry,
  householdStatus,
  pyramid,
  tone,
  expenses,
  onChange,
  onBack,
  onContinue,
}: WorkshopExpensesStepProps) {
  const { t } = useTranslations();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!expenses);
  const [isConfirming, startConfirmTransition] = useTransition();
  const [loadNonce, setLoadNonce] = useState(0);

  useEffect(() => {
    if (expenses) {
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    async function runPredict() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await predictExpensesAction(sessionId, {
          age,
          monthlyIncome,
          industry,
          householdStatus,
          pyramid,
          tone,
        });
        if (!cancelled) {
          onChange(result);
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : t("workshop.expenses.predictErrorFallback"),
          );
          setIsLoading(false);
        }
      }
    }

    void runPredict();

    return () => {
      cancelled = true;
    };
    // Predict once per entry / explicit retry (loadNonce), not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [expenses, loadNonce, sessionId]);

  function updateCategoryAmount(key: string, amountHKD: number) {
    if (!expenses) {
      return;
    }
    onChange(
      withLiveTotal(
        expenses.categories.map((cat) =>
          cat.key === key ? { ...cat, amountHKD } : cat,
        ),
      ),
    );
  }

  function handleConfirm() {
    if (!expenses) {
      return;
    }
    setConfirmError(null);
    startConfirmTransition(async () => {
      try {
        const normalized = withLiveTotal(expenses.categories);
        onChange(normalized);
        await confirmExpensesAction({
          sessionId,
          expenses: normalized,
        });
        onContinue();
      } catch (error) {
        setConfirmError(
          error instanceof Error
            ? error.message
            : t("workshop.expenses.confirmErrorFallback"),
        );
      }
    });
  }

  function handleRetryPredict() {
    onChange(null);
    setLoadError(null);
    setIsLoading(true);
    setLoadNonce((n) => n + 1);
  }

  let body: ReactNode;

  if (isLoading) {
    body = (
      <div className="space-y-4 py-6 text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-200">
          {t("workshop.expenses.estimating")}
        </p>
        <p className="text-xs text-zinc-500">
          {t("workshop.expenses.estimatingSubtext")}
        </p>
      </div>
    );
  } else if (loadError) {
    body = (
      <WorkshopRetryPanel
        title={t("workshop.expenses.predictErrorTitle")}
        message={loadError}
        onRetry={handleRetryPredict}
        onBack={onBack}
      />
    );
  } else if (expenses) {
    body = (
      <>
        <p className="text-sm leading-relaxed text-zinc-400">
          {t("workshop.expenses.intro")}
        </p>

        <div className="space-y-3">
          {expenses.categories.map((cat, index) => {
            const label = t(EXPENSE_CATEGORY_LABEL_KEYS[cat.key]);
            const isLast = index === expenses.categories.length - 1;
            return (
              <WorkshopStatCard
                key={cat.key}
                icon={cat.icon}
                label={label}
                valueContent={
                  <WorkshopNumberField
                    variant="currency"
                    min={0}
                    value={cat.amountHKD}
                    disabled={isConfirming}
                    enterKeyHint={isLast ? "done" : "next"}
                    aria-label={t("workshop.expenses.amountAria").replace(
                      "{label}",
                      label,
                    )}
                    onChange={(amountHKD) =>
                      updateCategoryAmount(cat.key, amountHKD)
                    }
                  />
                }
              />
            );
          })}
        </div>

        <div className="rounded-2xl border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-white/[0.04] to-transparent px-4 py-5 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
            {t("workshop.expenses.totalLabel")}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {formatHkd(expenses.totalHKD)}
          </p>
        </div>

        {confirmError ? (
          <WorkshopRetryPanel
            title={t("workshop.expenses.confirmErrorFallback")}
            message={confirmError}
            onRetry={handleConfirm}
            onBack={onBack}
          />
        ) : (
          <WorkshopStickyFooter
            primaryLabel={
              isConfirming
                ? t("workshop.expenses.confirming")
                : t("workshop.expenses.confirmButton")
            }
            primaryDisabled={isConfirming}
            onPrimaryClick={handleConfirm}
            secondaryLabel={t("workshop.errors.backButton")}
            secondaryDisabled={isConfirming}
            onSecondaryClick={onBack}
          />
        )}
      </>
    );
  } else {
    body = (
      <WorkshopRetryPanel
        title={t("workshop.expenses.predictErrorTitle")}
        message={t("workshop.expenses.predictErrorFallback")}
        onRetry={handleRetryPredict}
        onBack={onBack}
      />
    );
  }

  return <div className="min-w-0 overflow-x-hidden space-y-5 sm:space-y-6">{body}</div>;
}
