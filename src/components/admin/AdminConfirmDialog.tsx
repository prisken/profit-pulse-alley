"use client";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  isPending?: boolean;
  pendingLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isPending = false,
  pendingLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: Readonly<AdminConfirmDialogProps>) {
  if (!open) {
    return null;
  }

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-emerald-600 text-white hover:bg-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label={cancelLabel}
        onClick={isPending ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl sm:p-6"
      >
        <h2
          id="admin-confirm-title"
          className="text-lg font-semibold text-zinc-50"
        >
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-zinc-400">
          {description}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50 ${focusRing}`}
            disabled={isPending}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${confirmClass} ${focusRing}`}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
