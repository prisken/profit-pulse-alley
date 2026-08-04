"use client";

import { Component, type ReactNode } from "react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const primaryBtnClass =
  "inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:w-auto";

const secondaryBtnClass =
  "inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:w-auto";

export const workshopPrimaryBtnClass = primaryBtnClass;
export const workshopSecondaryBtnClass = secondaryBtnClass;
export const workshopActionRowClass =
  "flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:gap-3";

type WorkshopRetryPanelProps = Readonly<{
  title?: string;
  message?: string | null;
  onRetry: () => void;
  onBack?: () => void;
}>;

function resolveWorkshopErrorMessage(
  message: string | null | undefined,
  t: (key: MessageKey) => string,
): string {
  const raw = message?.trim() ?? "";
  if (!raw) {
    return t("workshop.errors.aiFailedRetry");
  }
  if (
    raw.includes("DEEPSEEK_API_KEY") ||
    raw === t("workshop.errors.missingApiKey")
  ) {
    return t("workshop.errors.missingApiKey");
  }
  if (
    raw.includes("out of date") ||
    raw.includes("outdated") ||
    raw.includes("WorkshopSession") ||
    raw.includes("prisma generate")
  ) {
    return t("workshop.errors.staleSchemaRestart");
  }
  if (
    raw.includes("Server Components render") ||
    raw.includes("omitted in production") ||
    /\bdigest\b/i.test(raw)
  ) {
    return t("workshop.errors.aiFailedRetry");
  }
  // Server sometimes returns a MessageKey for phone/capture errors.
  if (raw.startsWith("workshop.")) {
    return t(raw as MessageKey);
  }
  return raw;
}

/**
 * Friendly recovery UI when a DeepSeek / workshop step fails.
 */
export function WorkshopRetryPanel({
  title,
  message,
  onRetry,
  onBack,
}: WorkshopRetryPanelProps) {
  const { t } = useTranslations();
  const resolvedTitle = title?.trim() || t("workshop.errors.somethingWrong");
  const resolvedMessage = resolveWorkshopErrorMessage(message, t);

  return (
    <div
      className="space-y-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-6 text-center sm:px-5 sm:py-8"
      role="alert"
    >
      <p className="text-base font-semibold text-amber-50 sm:text-lg">
        {resolvedTitle}
      </p>
      <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-amber-100/80">
        {resolvedMessage}
      </p>
      <div className={`${workshopActionRowClass} justify-center`}>
        {onBack ? (
          <button type="button" className={secondaryBtnClass} onClick={onBack}>
            {t("workshop.errors.backButton")}
          </button>
        ) : null}
        <button type="button" className={primaryBtnClass} onClick={onRetry}>
          {t("workshop.errors.retryButton")}
        </button>
      </div>
    </div>
  );
}

type WorkshopErrorBoundaryProps = Readonly<{
  children: ReactNode;
  title?: string;
  description?: string;
  onBack?: () => void;
}>;

type WorkshopErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
  retryKey: number;
};

/**
 * Catches render crashes mid-workshop (e.g. unexpected DeepSeek payload shape)
 * and offers a Retry remount instead of a blank crash.
 */
export class WorkshopErrorBoundary extends Component<
  WorkshopErrorBoundaryProps,
  WorkshopErrorBoundaryState
> {
  constructor(props: WorkshopErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: null, retryKey: 0 };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<WorkshopErrorBoundaryState> {
    return {
      hasError: true,
      message: error.message || null,
    };
  }

  componentDidCatch(error: Error) {
    console.error("[workshop] step render error:", error);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      message: null,
      retryKey: prev.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <WorkshopErrorFallback
          title={this.props.title}
          description={this.props.description}
          caughtMessage={this.state.message}
          onRetry={this.handleRetry}
          onBack={this.props.onBack}
        />
      );
    }

    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

function WorkshopErrorFallback({
  title,
  description,
  caughtMessage,
  onRetry,
  onBack,
}: Readonly<{
  title?: string;
  description?: string;
  caughtMessage: string | null;
  onRetry: () => void;
  onBack?: () => void;
}>) {
  const { t } = useTranslations();
  return (
    <WorkshopRetryPanel
      title={title?.trim() || t("workshop.errors.stepSnag")}
      message={
        description?.trim() ||
        caughtMessage ||
        t("workshop.errors.aiStepFailed")
      }
      onRetry={onRetry}
      onBack={onBack}
    />
  );
}
