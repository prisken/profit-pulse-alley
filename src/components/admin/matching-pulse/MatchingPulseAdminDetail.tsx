import Link from "next/link";

import MatchingPulseAdminStatusForm from "@/components/admin/matching-pulse/MatchingPulseAdminStatusForm";
import MatchingPulseStatusBadge from "@/components/matching-pulse/MatchingPulseStatusBadge";
import type { MatchingPulseAdminRequestDetail } from "@/lib/matching-pulse/admin-data";
import {
  formatMatchingPulseCategoryLabel,
  formatMatchingPulseRequestTypeLabel,
  formatMatchingPulseUrgencyLabel,
} from "@/lib/matching-pulse/labels";

const WORKFLOW_STEPS = [
  "NEW",
  "REVIEWING",
  "NEED_MORE_INFO or POTENTIAL_MATCH_FOUND",
  "INTRO_MADE",
  "CLOSED",
] as const;

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(iso));
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

function requesterName(detail: MatchingPulseAdminRequestDetail): string {
  return detail.user.name?.trim() || detail.user.email;
}

type MatchingPulseAdminDetailProps = Readonly<{
  request: MatchingPulseAdminRequestDetail;
}>;

export default function MatchingPulseAdminDetail({
  request,
}: MatchingPulseAdminDetailProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-500">
            <Link
              href="/admin/matching-pulse"
              className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline"
            >
              Matching Pulse Admin
            </Link>
            <span className="mx-2 text-zinc-700" aria-hidden="true">
              /
            </span>
            <span className="text-zinc-400">Review</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              {request.title}
            </h1>
            <MatchingPulseStatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)] lg:items-start">
        <div className="space-y-4 sm:space-y-5">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-100">Requester</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Name</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {requesterName(request)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Email</dt>
                <dd className="mt-0.5 break-all text-sm text-zinc-200">
                  {request.user.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Account phone</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {displayValue(request.user.contactNumber)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Request contact phone</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {displayValue(request.contactPhone)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Preferred contact method</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {displayValue(request.contactMethod)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Company</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {displayValue(request.company)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Role</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {displayValue(request.roleTitle)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-100">Request details</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Type</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {formatMatchingPulseRequestTypeLabel(request.requestType)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Category</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {formatMatchingPulseCategoryLabel(request.category)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Urgency</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {request.urgency
                    ? formatMatchingPulseUrgencyLabel(request.urgency)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Source</dt>
                <dd className="mt-0.5 text-sm text-zinc-200">
                  {displayValue(request.source)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Created</dt>
                <dd className="mt-0.5 font-mono text-sm tabular-nums text-zinc-300">
                  {formatDateTime(request.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Updated</dt>
                <dd className="mt-0.5 font-mono text-sm tabular-nums text-zinc-300">
                  {formatDateTime(request.updatedAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Description
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {request.description}
              </p>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Ideal match
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {displayValue(request.idealMatch)}
              </p>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Consents
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                <li>
                  Contact:{" "}
                  <span className="font-medium text-zinc-100">
                    {request.consentToContact ? "Yes" : "No"}
                  </span>
                </li>
                <li>
                  Share after review:{" "}
                  <span className="font-medium text-zinc-100">
                    {request.consentToShare ? "Yes" : "No"}
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-4 sm:space-y-5">
          <MatchingPulseAdminStatusForm
            requestId={request.id}
            initialStatus={request.status}
            initialAdminNotes={request.adminNotes}
            initialTags={request.tags}
          />

          <section className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-100">
              Suggested workflow
            </h2>
            <ol className="mt-3 space-y-2 text-xs text-zinc-400 sm:text-sm">
              {WORKFLOW_STEPS.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span
                    className="font-mono tabular-nums text-zinc-600"
                    aria-hidden="true"
                  >
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
