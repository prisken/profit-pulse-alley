import type {
  MatchingPulseCategoryValue,
  MatchingPulseRequestTypeValue,
  MatchingPulseStatusValue,
  MatchingPulseUrgencyValue,
} from "@/lib/matching-pulse/constants";
import { prisma } from "@/lib/prisma";

/** Public-safe fields for the signed-in member's request list. */
export type MatchingPulseMyRequestItem = {
  id: string;
  userId: string;
  title: string;
  status: MatchingPulseStatusValue;
  requestType: MatchingPulseRequestTypeValue;
  category: MatchingPulseCategoryValue;
  urgency: MatchingPulseUrgencyValue | null;
  description: string;
  createdAt: Date;
};

const MY_REQUEST_SELECT = {
  id: true,
  userId: true,
  title: true,
  status: true,
  requestType: true,
  category: true,
  urgency: true,
  description: true,
  createdAt: true,
} as const;

/**
 * Returns Matching Pulse requests for a single user, newest first.
 * Never selects adminNotes or tags.
 */
export async function getMatchingPulseRequestsForUser(
  userId: string,
): Promise<MatchingPulseMyRequestItem[]> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return [];
  }

  const rows = await prisma.matchingPulseRequest.findMany({
    where: { userId: trimmedUserId },
    orderBy: { createdAt: "desc" },
    select: MY_REQUEST_SELECT,
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    status: row.status,
    requestType: row.requestType,
    category: row.category,
    urgency: row.urgency,
    description: row.description,
    createdAt: row.createdAt,
  }));
}

/** Short plain-text excerpt for list cards. */
export function excerptMatchingPulseDescription(
  description: string,
  maxLength = 140,
): string {
  const normalized = description.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Public-safe profile summary — never includes adminNotes or other users. */
export type MatchingPulseProfileSummary = {
  totalCount: number;
  latest: {
    title: string;
    status: MatchingPulseStatusValue;
  } | null;
};

/**
 * Profile summary for the signed-in member only.
 * Selects title + status for the newest request; never adminNotes/tags.
 */
export async function getMatchingPulseProfileSummary(
  userId: string,
): Promise<MatchingPulseProfileSummary> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return { totalCount: 0, latest: null };
  }

  const [totalCount, latest] = await Promise.all([
    prisma.matchingPulseRequest.count({
      where: { userId: trimmedUserId },
    }),
    prisma.matchingPulseRequest.findFirst({
      where: { userId: trimmedUserId },
      orderBy: { createdAt: "desc" },
      select: {
        title: true,
        status: true,
      },
    }),
  ]);

  return {
    totalCount,
    latest: latest
      ? {
          title: latest.title,
          status: latest.status,
        }
      : null,
  };
}
