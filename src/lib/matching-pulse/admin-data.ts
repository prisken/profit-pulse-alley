import "server-only";

import type { MatchingPulseAdminRequestRow } from "@/lib/matching-pulse/admin-filters";
import type { MatchingPulseAdminOverviewCounts } from "@/lib/matching-pulse/admin-filters";
import { requireAdminSession } from "@/lib/market-pulse/admin-auth";
import { prisma } from "@/lib/prisma";

export type { MatchingPulseAdminRequestRow } from "@/lib/matching-pulse/admin-filters";
export type { MatchingPulseAdminOverviewCounts } from "@/lib/matching-pulse/admin-filters";
export {
  filterMatchingPulseAdminRequests,
  parseMatchingPulseAdminCategoryFilter,
  parseMatchingPulseAdminStatusFilter,
  type MatchingPulseAdminCategoryFilter,
  type MatchingPulseAdminFilterState,
  type MatchingPulseAdminStatusFilter,
} from "@/lib/matching-pulse/admin-filters";

export type MatchingPulseAdminListData = {
  adminEmail: string;
  requests: MatchingPulseAdminRequestRow[];
};

export type MatchingPulseAdminRequestDetail = {
  id: string;
  title: string;
  company: string | null;
  roleTitle: string | null;
  contactPhone: string | null;
  contactMethod: string | null;
  requestType: string;
  category: string;
  urgency: string | null;
  source: string | null;
  description: string;
  idealMatch: string | null;
  status: string;
  consentToContact: boolean;
  consentToShare: boolean;
  adminNotes: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    contactNumber: string | null;
  };
};

export type MatchingPulseAdminDetailData = {
  adminEmail: string;
  request: MatchingPulseAdminRequestDetail;
};

/**
 * ADMIN-only list of all Matching Pulse requests, newest first.
 * Includes requester identity for ops review.
 */
export async function getMatchingPulseAdminListData(): Promise<MatchingPulseAdminListData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const rows = await prisma.matchingPulseRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      contactPhone: true,
      contactMethod: true,
      requestType: true,
      category: true,
      urgency: true,
      source: true,
      description: true,
      idealMatch: true,
      status: true,
      consentToContact: true,
      consentToShare: true,
      tags: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
        },
      },
    },
  });

  return {
    adminEmail: admin.email,
    requests: rows.map((row) => ({
      id: row.id,
      title: row.title,
      company: row.company,
      contactPhone: row.contactPhone,
      contactMethod: row.contactMethod,
      requestType: row.requestType,
      category: row.category,
      urgency: row.urgency,
      source: row.source,
      description: row.description,
      idealMatch: row.idealMatch,
      status: row.status,
      consentToContact: row.consentToContact,
      consentToShare: row.consentToShare,
      tags: row.tags,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        contactNumber: row.user.contactNumber,
      },
    })),
  };
}

/**
 * ADMIN-only summary counts for the /admin command center.
 */
export async function getMatchingPulseAdminOverviewCounts(): Promise<MatchingPulseAdminOverviewCounts | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  try {
    const [total, newCount, needsReviewCount] = await Promise.all([
      prisma.matchingPulseRequest.count(),
      prisma.matchingPulseRequest.count({ where: { status: "NEW" } }),
      prisma.matchingPulseRequest.count({
        where: { status: { in: ["NEW", "NEED_MORE_INFO"] } },
      }),
    ]);

    return { total, newCount, needsReviewCount };
  } catch (error) {
    console.error("[matching-pulse] Failed to load admin overview counts:", error);
    return {
      total: 0,
      newCount: 0,
      needsReviewCount: 0,
    };
  }
}

/**
 * ADMIN-only detail for a single Matching Pulse request.
 * Includes adminNotes/tags for ops — never reuse on public routes.
 */
export async function getMatchingPulseAdminRequestDetail(
  requestId: string,
): Promise<MatchingPulseAdminDetailData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  const trimmedId = requestId.trim();
  if (!trimmedId) {
    return null;
  }

  const row = await prisma.matchingPulseRequest.findUnique({
    where: { id: trimmedId },
    select: {
      id: true,
      title: true,
      company: true,
      roleTitle: true,
      contactPhone: true,
      contactMethod: true,
      requestType: true,
      category: true,
      urgency: true,
      source: true,
      description: true,
      idealMatch: true,
      status: true,
      consentToContact: true,
      consentToShare: true,
      adminNotes: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    adminEmail: admin.email,
    request: {
      id: row.id,
      title: row.title,
      company: row.company,
      roleTitle: row.roleTitle,
      contactPhone: row.contactPhone,
      contactMethod: row.contactMethod,
      requestType: row.requestType,
      category: row.category,
      urgency: row.urgency,
      source: row.source,
      description: row.description,
      idealMatch: row.idealMatch,
      status: row.status,
      consentToContact: row.consentToContact,
      consentToShare: row.consentToShare,
      adminNotes: row.adminNotes,
      tags: row.tags,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        contactNumber: row.user.contactNumber,
      },
    },
  };
}
