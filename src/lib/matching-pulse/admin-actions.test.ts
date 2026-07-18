import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/market-pulse/admin-auth", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    matchingPulseRequest: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import {
  updateMatchingPulseRequestAdminNotesAction,
  updateMatchingPulseRequestReviewAction,
  updateMatchingPulseRequestStatusAction,
  updateMatchingPulseRequestTagsAction,
} from "@/lib/matching-pulse/admin-actions";

describe("matching-pulse admin-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({
      userId: "admin-1",
      email: "admin@example.com",
    });
    mocks.findUnique.mockResolvedValue({ id: "req-1" });
    mocks.update.mockResolvedValue({ id: "req-1" });
  });

  it("rejects non-admin sessions", async () => {
    mocks.requireAdminSession.mockResolvedValue(null);

    await expect(
      updateMatchingPulseRequestStatusAction("req-1", "REVIEWING"),
    ).resolves.toEqual({ ok: false, error: "Unauthorized" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects invalid status values", async () => {
    const result = await updateMatchingPulseRequestStatusAction(
      "req-1",
      "NOT_A_STATUS",
    );
    expect(result.ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates status and revalidates list + detail paths", async () => {
    const result = await updateMatchingPulseRequestStatusAction(
      "req-1",
      "REVIEWING",
    );

    expect(result.ok).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "REVIEWING" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/matching-pulse");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/admin/matching-pulse/req-1",
    );
  });

  it("trims and clears empty admin notes", async () => {
    await updateMatchingPulseRequestAdminNotesAction("req-1", "  ");

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { adminNotes: null },
    });
  });

  it("allows admin to update notes", async () => {
    const result = await updateMatchingPulseRequestAdminNotesAction(
      "req-1",
      "  Warm intro candidate  ",
    );

    expect(result.ok).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { adminNotes: "Warm intro candidate" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/matching-pulse");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/admin/matching-pulse/req-1",
    );
  });

  it("rejects notes update for non-admin", async () => {
    mocks.requireAdminSession.mockResolvedValue(null);

    await expect(
      updateMatchingPulseRequestAdminNotesAction("req-1", "secret"),
    ).resolves.toEqual({ ok: false, error: "Unauthorized" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("saves tags via review action", async () => {
    const result = await updateMatchingPulseRequestReviewAction({
      requestId: "req-1",
      status: "POTENTIAL_MATCH_FOUND",
      adminNotes: " Possible fit ",
      tags: " wework, marketing ",
    });

    expect(result.ok).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: {
        status: "POTENTIAL_MATCH_FOUND",
        adminNotes: "Possible fit",
        tags: "wework, marketing",
      },
    });
  });

  it("rejects missing requests for tags update", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const result = await updateMatchingPulseRequestTagsAction("missing", "x");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toMatch(/not found/i);
  });
});
