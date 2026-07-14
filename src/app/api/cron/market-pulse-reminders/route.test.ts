import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  runMarketPulseReminderCron: vi.fn(),
}));

vi.mock("@/lib/cron/cron-auth", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/notifications/reminder-cron", () => ({
  runMarketPulseReminderCron: mocks.runMarketPulseReminderCron,
}));

import { POST } from "@/app/api/cron/market-pulse-reminders/route";

describe("POST /api/cron/market-pulse-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid CRON_SECRET", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/cron/market-pulse-reminders", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Unauthorized",
    });
    expect(mocks.runMarketPulseReminderCron).not.toHaveBeenCalled();
  });

  it("returns summary counts only when authorized", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.runMarketPulseReminderCron.mockResolvedValue({
      opportunity: "playable_card",
      candidates: 3,
      attempted: 3,
      sent: 1,
      skipped: 2,
      failed: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/cron/market-pulse-reminders", {
        method: "POST",
        headers: { CRON_SECRET: "secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      opportunity: "playable_card",
      candidates: 3,
      attempted: 3,
      sent: 1,
      skipped: 2,
      failed: 0,
    });
  });
});
