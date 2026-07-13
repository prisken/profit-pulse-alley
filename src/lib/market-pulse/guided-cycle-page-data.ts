import "server-only";

import { requireAdminSession } from "@/lib/market-pulse/admin-auth";

export type GuidedCyclePageData = {
  adminEmail: string;
};

export async function getGuidedCyclePageData(): Promise<GuidedCyclePageData | null> {
  const admin = await requireAdminSession();
  if (!admin) {
    return null;
  }

  return { adminEmail: admin.email };
}
