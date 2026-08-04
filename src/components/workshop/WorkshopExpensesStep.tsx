"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import {
  WorkshopRetryPanel,
} from "@/components/workshop/WorkshopErrorBoundary";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
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

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
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

function expenseRatioPercent(totalHKD: number, monthlyIncome: number): number {
  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
    return 0;
  }
  return Math.round((Math.max(0, totalHKD) / monthlyIncome) * 100);
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

function ExpensesTotalBanner({
  totalHKD,
  monthlyIncome,
  sticky = false,
}: Readonly<{
  totalHKD: number;
  monthlyIncome: number;
  sticky?: boolean;
}>) {
  const { t } = useTranslations();
  const ratio = expenseRatioPercent(totalHKD, monthlyIncome);

  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5",
        sticky
          ? "sticky top-0 z-20 -mx-0.5 border-emerald-200/80 bg-white/95 backdrop-blur-md"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {t("workshop.expenses.totalLabel")}
      </p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {formatHkd(totalHKD)}
      </p>
      <p className="mt-2.5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
        {t("workshop.expenses.expenseRatio").replace(
          "{percent}",
          String(ratio),
        )}
      </p>
    </div>
  );
}

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
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-800">
          {t("workshop.expenses.estimating")}
        </p>
        <p className="text-xs text-slate-500">
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
        <p className="text-sm leading-relaxed text-slate-600">
          {t("workshop.expenses.intro")}
        </p>

        <ExpensesTotalBanner
          totalHKD={expenses.totalHKD}
          monthlyIncome={monthlyIncome}
          sticky
        />

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          {expenses.categories.map((cat, index) => {
            const label = t(EXPENSE_CATEGORY_LABEL_KEYS[cat.key]);
            const isLast = index === expenses.categories.length - 1;
            const Icon = resolveIcon(cat.icon);
            return (
              <CollapsibleWidget
                key={cat.key}
                className="shadow-none"
                defaultExpanded={index === 0}
                icon={
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                }
                title={label}
                subtitle={
                  <span className="font-mono tabular-nums text-slate-900">
                    {formatHkd(cat.amountHKD)}
                  </span>
                }
              >
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
              </CollapsibleWidget>
            );
          })}
        </div>

        <ExpensesTotalBanner
          totalHKD={expenses.totalHKD}
          monthlyIncome={monthlyIncome}
        />

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

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden sm:space-y-6">{body}</div>
  );
}
