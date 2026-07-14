"use client";

import { useState, useTransition } from "react";

import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { invokeAdminAction } from "@/lib/admin/action-result";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import { removeMarketPulseCycleAction } from "@/lib/market-pulse/admin-actions";
import {
  canRemoveMarketPulseCycle,
  cycleRemovalBlockMessage,
  getCycleRemovalBlockReason,
  type CycleRemovalEligibilityInput,
} from "@/lib/market-pulse/cycle-removal";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const dangerButtonClass = `inline-flex min-h-9 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:px-3 sm:py-2 sm:text-sm ${focusRing}`;

type RemoveMarketPulseCycleButtonProps = {
  cycleId: string;
  eligibility: CycleRemovalEligibilityInput;
  disabled?: boolean;
  onSuccess?: () => void;
};

export default function RemoveMarketPulseCycleButton({
  cycleId,
  eligibility,
  disabled = false,
  onSuccess,
}: RemoveMarketPulseCycleButtonProps) {
  const { t, locale } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const blockReason = getCycleRemovalBlockReason(eligibility);
  const blockMessage = blockReason
    ? cycleRemovalBlockMessage(blockReason)
    : null;
  const removable = canRemoveMarketPulseCycle(eligibility);
  const busy = disabled || isPending || !removable;

  function runRemove() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      await invokeAdminAction(() => removeMarketPulseCycleAction(cycleId), {
        onSuccess: (successMessage) => {
          setMessage(successMessage);
          setConfirmOpen(false);
          onSuccess?.();
        },
        onError: (actionError) => {
          setError(actionError);
        },
        onThrow: () => {
          setConfirmOpen(false);
          onSuccess?.();
        },
      });
    });
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        className={dangerButtonClass}
        disabled={busy}
        title={blockMessage ? translateAuthMessage(locale, blockMessage) : undefined}
        onClick={() => {
          if (!removable) return;
          setError(null);
          setMessage(null);
          setConfirmOpen(true);
        }}
      >
        {t("auth.admin.mp.removeCycle.button")}
      </button>

      {blockMessage && !removable ? (
        <p className="mt-2 max-w-md text-xs text-zinc-500" role="note">
          {translateAuthMessage(locale, blockMessage)}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 max-w-md text-sm font-medium text-red-400" role="alert">
          {translateAuthMessage(locale, error)}
        </p>
      ) : null}

      {message ? (
        <p
          className="mt-2 max-w-md text-sm font-medium text-emerald-300"
          role="status"
        >
          {translateAuthMessage(locale, message)}
        </p>
      ) : null}

      <AdminConfirmDialog
        open={confirmOpen}
        title={t("auth.admin.mp.removeCycle.confirmTitle")}
        description={t("auth.admin.mp.removeCycle.confirmBody")}
        confirmLabel={t("auth.admin.mp.removeCycle.confirmButton")}
        cancelLabel={t("auth.admin.users.cancel")}
        pendingLabel={t("auth.admin.mp.removeCycle.pending")}
        isPending={isPending}
        variant="danger"
        onConfirm={runRemove}
        onCancel={() => {
          if (!isPending) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
}
