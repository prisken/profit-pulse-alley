import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailDeliveryLog: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
  },
}));

import {
  hasEmailAlreadyBeenSent,
  hasRecentSentEmail,
  logEmailAttempt,
  markEmailFailed,
  markEmailSent,
} from "@/lib/notifications/email-log";

describe("email-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs an email attempt", async () => {
    mocks.create.mockResolvedValue({ id: "log-1", status: "attempted" });

    await logEmailAttempt({
      userId: "user-1",
      email: " player@example.com ",
      type: "market_pulse_reminder",
      cycleId: "cycle-1",
      cardId: "card-1",
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        email: "player@example.com",
        type: "market_pulse_reminder",
        cycleId: "cycle-1",
        cardId: "card-1",
        status: "attempted",
        providerMessageId: null,
        error: null,
        sentAt: null,
      },
    });
  });

  it("detects duplicate sent emails by type + user + cycle + card", async () => {
    mocks.findFirst.mockResolvedValue({ id: "log-sent" });

    await expect(
      hasEmailAlreadyBeenSent("market_pulse_reminder", {
        userId: "user-1",
        cycleId: "cycle-1",
        cardId: "card-1",
      }),
    ).resolves.toBe(true);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        type: "market_pulse_reminder",
        status: "sent",
        userId: "user-1",
        cycleId: "cycle-1",
        cardId: "card-1",
      },
      select: { id: true },
    });
  });

  it("returns false when no prior sent row matches", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(
      hasEmailAlreadyBeenSent("market_pulse_reveal", {
        userId: "user-1",
        cycleId: "cycle-1",
      }),
    ).resolves.toBe(false);
  });

  it("looks up by email when userId is omitted", async () => {
    mocks.findFirst.mockResolvedValue({ id: "log-sent" });

    await expect(
      hasEmailAlreadyBeenSent("welcome", {
        email: "player@example.com",
      }),
    ).resolves.toBe(true);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        type: "welcome",
        status: "sent",
        email: "player@example.com",
      },
      select: { id: true },
    });
  });

  it("returns false when neither userId nor email is provided", async () => {
    await expect(
      hasEmailAlreadyBeenSent("welcome", { cycleId: "cycle-1" }),
    ).resolves.toBe(false);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("marks an email sent", async () => {
    mocks.update.mockResolvedValue({ id: "log-1", status: "sent" });

    await markEmailSent("log-1", { providerMessageId: "<msg>" });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "log-1" },
      data: expect.objectContaining({
        status: "sent",
        error: null,
        providerMessageId: "<msg>",
      }),
    });
  });

  it("marks an email failed", async () => {
    mocks.update.mockResolvedValue({ id: "log-1", status: "failed" });

    await markEmailFailed("log-1", "SMTP connection timed out");

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "log-1" },
      data: {
        status: "failed",
        error: "SMTP connection timed out",
        sentAt: null,
      },
    });
  });

  it("detects a recent sent email for rate limiting", async () => {
    mocks.findFirst.mockResolvedValue({ id: "log-recent" });
    const since = new Date("2026-07-14T00:00:00.000Z");

    await expect(
      hasRecentSentEmail("market_pulse_reminder", "user-1", since),
    ).resolves.toBe(true);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        type: "market_pulse_reminder",
        status: "sent",
        userId: "user-1",
        OR: [{ sentAt: { gte: since } }, { createdAt: { gte: since } }],
      },
      select: { id: true },
    });
  });
});
