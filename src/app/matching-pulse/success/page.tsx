import type { Metadata } from "next";

import { auth } from "@/auth";
import MatchingPulseSuccessPage from "@/components/matching-pulse/MatchingPulseSuccessPage";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Matching Pulse request received | Profit Pulse Ally",
  description:
    "Your Matching Pulse collaboration request has been received. PPA will review it before making any introduction.",
};

type MatchingPulseSuccessRouteProps = Readonly<{
  searchParams: Promise<{ requestId?: string | string[] }>;
}>;

function readRequestId(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? "";
  return trimmed || null;
}

/**
 * Loads title only when the request belongs to the signed-in user.
 * Never returns admin notes or other users' requests.
 */
async function getOwnedRequestTitle(
  requestId: string,
  userId: string,
): Promise<string | null> {
  try {
    const request = await prisma.matchingPulseRequest.findFirst({
      where: {
        id: requestId,
        userId,
      },
      select: {
        title: true,
      },
    });

    return request?.title?.trim() || null;
  } catch (error) {
    console.error("[matching-pulse] success page ownership lookup failed:", error);
    return null;
  }
}

export default async function MatchingPulseSuccessRoute({
  searchParams,
}: MatchingPulseSuccessRouteProps) {
  const params = await searchParams;
  const session = await auth();
  const requestId = readRequestId(params.requestId);

  // Logged-out: safe generic success only (no request lookup / no leaks).
  if (!session?.user?.id) {
    return <MatchingPulseSuccessPage />;
  }

  let confirmedTitle: string | null = null;
  if (requestId) {
    confirmedTitle = await getOwnedRequestTitle(requestId, session.user.id);
  }

  return <MatchingPulseSuccessPage confirmedTitle={confirmedTitle} />;
}
