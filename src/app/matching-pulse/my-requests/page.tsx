import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import MatchingPulseMyRequests from "@/components/matching-pulse/MatchingPulseMyRequests";
import { getMatchingPulseRequestsForUser } from "@/lib/matching-pulse/data";
import {
  mergeMpClasses,
  MP_FOCUS_RING,
  MP_OBSIDIAN_BG,
} from "@/lib/market-pulse/visual-primitives";

export const metadata: Metadata = {
  title: "My Matching Pulse requests | Profit Pulse Ally",
  description:
    "View your Matching Pulse collaboration requests. Requests are private and reviewed by PPA before any introduction.",
};

export default async function MatchingPulseMyRequestsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/matching-pulse/my-requests");
  }

  let requests: Awaited<ReturnType<typeof getMatchingPulseRequestsForUser>> = [];

  try {
    requests = await getMatchingPulseRequestsForUser(session.user.id);
  } catch (error) {
    console.error("[matching-pulse] Failed to load my requests:", error);
  }

  return (
    <main
      className={mergeMpClasses(
        MP_OBSIDIAN_BG,
        "relative isolate overflow-x-hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-8%,rgba(0,230,118,0.06),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
        <p className="mb-4 text-sm text-zinc-400 sm:mb-5">
          <Link
            href="/matching-pulse"
            className={mergeMpClasses(
              "text-zinc-300 underline-offset-2 hover:text-white hover:underline",
              MP_FOCUS_RING,
              "rounded-sm",
            )}
          >
            Matching Pulse
          </Link>
          <span className="mx-2 text-zinc-600" aria-hidden="true">
            /
          </span>
          <span className="text-zinc-200">My requests</span>
        </p>

        <MatchingPulseMyRequests requests={requests} />
      </div>
    </main>
  );
}
