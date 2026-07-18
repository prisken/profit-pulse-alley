"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { invokeAdminAction } from "@/lib/admin/action-result";
import { updateMatchingPulseRequestReviewAction } from "@/lib/matching-pulse/admin-actions";
import {
  MATCHING_PULSE_FIELD_MAX,
  MATCHING_PULSE_STATUSES,
} from "@/lib/matching-pulse/constants";
import { MATCHING_PULSE_STATUS_LABELS } from "@/lib/matching-pulse/labels";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fieldClass = `mt-1.5 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60 ${focusRing}`;

const primaryButtonClass = `inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

type MatchingPulseAdminStatusFormProps = Readonly<{
  requestId: string;
  initialStatus: string;
  initialAdminNotes: string | null;
  initialTags: string | null;
}>;

export default function MatchingPulseAdminStatusForm({
  requestId,
  initialStatus,
  initialAdminNotes,
  initialTags,
}: MatchingPulseAdminStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes ?? "");
  const [tags, setTags] = useState(initialTags ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setWarning(null);

    startTransition(async () => {
      await invokeAdminAction(
        () =>
          updateMatchingPulseRequestReviewAction({
            requestId,
            status,
            adminNotes,
            tags,
          }),
        {
          onSuccess: (successMessage, successWarning) => {
            setIsError(false);
            setMessage(successMessage);
            setWarning(successWarning ?? null);
            router.refresh();
          },
          onError: (error) => {
            setIsError(true);
            setWarning(null);
            setMessage(error);
          },
        },
      );
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">Review controls</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Status, notes, and tags are visible to admins only.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-zinc-300">Status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={isPending}
          className={fieldClass}
          required
        >
          {MATCHING_PULSE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {MATCHING_PULSE_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-300">Admin notes</span>
        <textarea
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
          disabled={isPending}
          rows={5}
          maxLength={MATCHING_PULSE_FIELD_MAX.adminNotes}
          className={`${fieldClass} min-h-28 resize-y`}
          placeholder="Internal notes for the Matching Pulse review team…"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-300">Tags</span>
        <input
          type="text"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          disabled={isPending}
          maxLength={MATCHING_PULSE_FIELD_MAX.tags}
          className={fieldClass}
          placeholder="e.g. wework, marketing, follow-up"
          autoComplete="off"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Free-text tags for internal filtering. Not shown to members.
        </span>
      </label>

      {message ? (
        <p
          role="alert"
          className={
            isError
              ? "rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              : "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          }
        >
          {message}
          {warning ? ` ${warning}` : null}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Saving…" : "Save review"}
      </button>
    </form>
  );
}
