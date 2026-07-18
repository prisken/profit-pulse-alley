import Link from "next/link";

import MatchingPulseStatusBadge from "@/components/matching-pulse/MatchingPulseStatusBadge";
import type { MatchingPulseMyRequestItem } from "@/lib/matching-pulse/data";
import { excerptMatchingPulseDescription } from "@/lib/matching-pulse/data";
import {
  formatMatchingPulseCategoryLabel,
  formatMatchingPulseRequestTypeLabel,
  formatMatchingPulseUrgencyLabel,
} from "@/lib/matching-pulse/labels";
import {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_PRIMARY_BTN,
  MP_TERMINAL_PANEL,
} from "@/lib/market-pulse/visual-primitives";

const secondaryCtaClass = mergeMpClasses(
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.04] sm:min-h-12 sm:px-6",
  MP_FOCUS_RING,
);

function formatCreatedDate(date: Date): string {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeZone: "Asia/Hong_Kong",
  }).format(date);
}

type MatchingPulseMyRequestsProps = Readonly<{
  requests: MatchingPulseMyRequestItem[];
}>;

export default function MatchingPulseMyRequests({
  requests,
}: MatchingPulseMyRequestsProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            My Matching Pulse requests
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-[15px]">
            Private to you — PPA reviews each request before any introduction.
          </p>
        </div>
        <Link
          href="/matching-pulse/request"
          className={mergeMpClasses(
            MP_PRIMARY_BTN,
            "min-h-11 shrink-0 px-5 py-2.5 text-sm sm:min-h-12 sm:px-6",
            MP_FOCUS_RING,
          )}
        >
          Post a new request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div
          className={mergeMpClasses(
            MP_TERMINAL_PANEL,
            "px-4 py-10 text-center sm:px-8 sm:py-12",
          )}
        >
          <p className="text-sm text-zinc-300 sm:text-base">
            You have not posted a Matching Pulse request yet.
          </p>
          <Link
            href="/matching-pulse/request"
            className={mergeMpClasses(
              MP_PRIMARY_BTN,
              "mt-6 inline-flex min-h-11 px-5 py-2.5 text-sm sm:min-h-12 sm:px-6",
              MP_FOCUS_RING,
            )}
          >
            Post a request
          </Link>
        </div>
      ) : (
        <ul className="space-y-3 sm:space-y-4" aria-label="Your Matching Pulse requests">
          {requests.map((request) => {
            const excerpt = excerptMatchingPulseDescription(request.description);
            const urgencyLabel = request.urgency
              ? formatMatchingPulseUrgencyLabel(request.urgency)
              : null;

            return (
              <li
                key={request.id}
                className={mergeMpClasses(MP_TERMINAL_PANEL, "p-4 sm:p-5")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight text-white sm:text-lg">
                    {request.title}
                  </h2>
                  <MatchingPulseStatusBadge status={request.status} />
                </div>

                <dl className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-zinc-400 sm:mt-3.5 sm:text-sm">
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Request type</dt>
                    <dd>{formatMatchingPulseRequestTypeLabel(request.requestType)}</dd>
                  </div>
                  <span className="text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Category</dt>
                    <dd>{formatMatchingPulseCategoryLabel(request.category)}</dd>
                  </div>
                  {urgencyLabel ? (
                    <>
                      <span className="text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <div className="flex gap-1.5">
                        <dt className="text-zinc-500">Urgency</dt>
                        <dd className="text-zinc-300">{urgencyLabel}</dd>
                      </div>
                    </>
                  ) : null}
                  <span className="text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                  <div className="flex gap-1.5">
                    <dt className="text-zinc-500">Posted</dt>
                    <dd className="font-mono tabular-nums text-zinc-300">
                      <time dateTime={request.createdAt.toISOString()}>
                        {formatCreatedDate(request.createdAt)}
                      </time>
                    </dd>
                  </div>
                </dl>

                {excerpt ? (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {excerpt}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center">
        <Link href="/matching-pulse" className={secondaryCtaClass}>
          Back to Matching Pulse
        </Link>
      </p>
    </div>
  );
}
