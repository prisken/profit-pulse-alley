import type {
  MatchingPulseCategoryValue,
  MatchingPulseStatusValue,
} from "@/lib/matching-pulse/constants";
import {
  isMatchingPulseCategory,
  isMatchingPulseStatus,
} from "@/lib/matching-pulse/constants";

/** Serialized admin list row (safe for client components + CSV export). */
export type MatchingPulseAdminRequestRow = {
  id: string;
  title: string;
  company: string | null;
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
  /** Admin-only ops tags — included in CSV; adminNotes are never on list/CSV. */
  tags: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    contactNumber: string | null;
  };
};

export type MatchingPulseAdminStatusFilter = "ALL" | MatchingPulseStatusValue;
export type MatchingPulseAdminCategoryFilter = "ALL" | MatchingPulseCategoryValue;

export type MatchingPulseAdminFilterState = {
  status: MatchingPulseAdminStatusFilter;
  category: MatchingPulseAdminCategoryFilter;
  query: string;
};

/** Client-safe filter for the admin request board (MVP). */
export function filterMatchingPulseAdminRequests(
  requests: MatchingPulseAdminRequestRow[],
  filters: MatchingPulseAdminFilterState,
): MatchingPulseAdminRequestRow[] {
  const query = filters.query.trim().toLowerCase();

  return requests.filter((request) => {
    if (filters.status !== "ALL" && request.status !== filters.status) {
      return false;
    }
    if (filters.category !== "ALL" && request.category !== filters.category) {
      return false;
    }
    if (!query) {
      return true;
    }

    const haystack = [
      request.title,
      request.company ?? "",
      request.user.name ?? "",
      request.user.email,
      request.source ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export type MatchingPulseAdminOverviewCounts = {
  total: number;
  newCount: number;
  /** Status NEW or NEED_MORE_INFO — awaiting ops attention. */
  needsReviewCount: number;
};

export function parseMatchingPulseAdminStatusFilter(
  value: string,
): MatchingPulseAdminStatusFilter {
  if (value === "ALL") {
    return "ALL";
  }
  return isMatchingPulseStatus(value) ? value : "ALL";
}

export function parseMatchingPulseAdminCategoryFilter(
  value: string,
): MatchingPulseAdminCategoryFilter {
  if (value === "ALL") {
    return "ALL";
  }
  return isMatchingPulseCategory(value) ? value : "ALL";
}
