import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasEmailAlreadyBeenSent: vi.fn(),
  logEmailAttempt: vi.fn(),
  markEmailSent: vi.fn(),
  markEmailFailed: vi.fn(),
  canSendEmailType: vi.fn(),
  sendProductEmail: vi.fn(),
  getMarketPulseLeaderboard: vi.fn(),
  userFindUnique: vi.fn(),
  cycleFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/notifications/email-log", () => ({
  hasEmailAlreadyBeenSent: mocks.hasEmailAlreadyBeenSent,
  logEmailAttempt: mocks.logEmailAttempt,
  markEmailSent: mocks.markEmailSent,
  markEmailFailed: mocks.markEmailFailed,
}));

vi.mock("@/lib/notifications/notification-preferences", () => ({
  canSendEmailType: mocks.canSendEmailType,
}));

vi.mock("@/lib/email/email-sender", () => ({
  sendProductEmail: mocks.sendProductEmail,
}));

vi.mock("@/lib/market-pulse/server", () => ({
  getMarketPulseLeaderboard: mocks.getMarketPulseLeaderboard,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    marketPulseCycle: {
      findUnique: mocks.cycleFindUnique,
    },
  },
}));

import {
  buildWinnerEmailBodies,
  sendWinnerEmailForCycle,
  sendWinnerEmailToUser,
} from "@/lib/notifications/winner-email";

const CYCLE_ID = "cycle-1";

function assertNoPpaPayloadFields(payload: {
  subject: string;
  text: string;
  html: string;
}) {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toMatch(/ppaSignalLockedAt/);
  expect(serialized).not.toMatch(/"ppaInsight"/);
  expect(serialized).not.toMatch(/"ppaSignal"/);
  expect(payload.text).not.toMatch(/\bppaInsight\b|\bppaSignal\b/);
  expect(payload.html).not.toMatch(/\bppaInsight\b|\bppaSignal\b/);
}

describe("buildWinnerEmailBodies", () => {
  it("includes prize label without PPA or leaderboard score fields", () => {
    const bodies = buildWinnerEmailBodies({
      prizeLabel: "One Ocean Park ticket",
    });

    expect(bodies.subject).toBe(
      "Congratulations — you won this Market Pulse cycle",
    );
    expect(bodies.text).toContain(
      "Congratulations — you finished at the top of this Market Pulse cycle.",
    );
    expect(bodies.text).toContain("Prize:");
    expect(bodies.text).toContain("One Ocean Park ticket");
    expect(bodies.text).toContain(
      "We will contact you about prize fulfilment. You can also reply directly to this email.",
    );
    expect(bodies.html).toContain("One Ocean Park ticket");
    assertNoPpaPayloadFields(bodies);
  });
});

describe("sendWinnerEmailToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canSendEmailType.mockResolvedValue(true);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValue(false);
    mocks.logEmailAttempt.mockResolvedValue({ id: "log-1" });
    mocks.markEmailSent.mockResolvedValue({ id: "log-1", status: "sent" });
    mocks.markEmailFailed.mockResolvedValue({ id: "log-1", status: "failed" });
    mocks.sendProductEmail.mockResolvedValue({
      ok: true,
      providerMessageId: "<winner@zoho>",
    });
  });

  it("sends winner email and marks the log sent", async () => {
    const result = await sendWinnerEmailToUser({
      userId: "user-1",
      email: "Winner@Example.com",
      cycleId: CYCLE_ID,
      prizeLabel: "One Ocean Park ticket",
    });

    expect(result).toEqual({
      ok: true,
      providerMessageId: "<winner@zoho>",
    });
    expect(mocks.hasEmailAlreadyBeenSent).toHaveBeenCalledWith(
      "market_pulse_winner",
      { userId: "user-1", cycleId: CYCLE_ID },
    );
    expect(mocks.canSendEmailType).toHaveBeenCalledWith(
      "user-1",
      "market_pulse_winner",
    );
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "winner@example.com",
        subject: "Congratulations — you won this Market Pulse cycle",
        text: expect.stringContaining("Prize:"),
        html: expect.stringContaining("One Ocean Park ticket"),
      }),
    );
    assertNoPpaPayloadFields(mocks.sendProductEmail.mock.calls[0][0]);
    expect(mocks.markEmailSent).toHaveBeenCalledWith("log-1", {
      providerMessageId: "<winner@zoho>",
    });
  });

  it("dedupes when already sent for user + cycle", async () => {
    mocks.hasEmailAlreadyBeenSent.mockResolvedValueOnce(true);

    const result = await sendWinnerEmailToUser({
      userId: "user-1",
      email: "winner@example.com",
      cycleId: CYCLE_ID,
      prizeLabel: "Prize",
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "already_sent",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("still sends when marketing opt-out would block non-transactional mail", async () => {
    // canSendEmailType already ignores unsubscribedAt for market_pulse_winner.
    mocks.canSendEmailType.mockResolvedValueOnce(true);

    const result = await sendWinnerEmailToUser({
      userId: "user-1",
      email: "winner@example.com",
      cycleId: CYCLE_ID,
      prizeLabel: "Prize",
    });

    expect(result.ok).toBe(true);
    expect(mocks.canSendEmailType).toHaveBeenCalledWith(
      "user-1",
      "market_pulse_winner",
    );
    expect(mocks.sendProductEmail).toHaveBeenCalled();
  });

  it("does not throw when sendProductEmail fails", async () => {
    mocks.sendProductEmail.mockRejectedValue(new Error("smtp down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendWinnerEmailToUser({
        userId: "user-1",
        email: "winner@example.com",
        cycleId: CYCLE_ID,
        prizeLabel: "Prize",
      }),
    ).resolves.toMatchObject({
      ok: false,
      skipped: true,
      reason: "delivery_failed",
    });

    errorSpy.mockRestore();
  });
});

describe("sendWinnerEmailForCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canSendEmailType.mockResolvedValue(true);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValue(false);
    mocks.logEmailAttempt.mockResolvedValue({ id: "log-1" });
    mocks.markEmailSent.mockResolvedValue({ id: "log-1", status: "sent" });
    mocks.sendProductEmail.mockResolvedValue({ ok: true });
  });

  it("sends only to the top leaderboard user", async () => {
    mocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "winner-1",
        playerName: "Winner",
        image: null,
        score: 200,
        participationPoints: 50,
        bonusPoints: 150,
        isRevealed: true,
        cardsPlayed: 5,
      },
    ]);
    mocks.userFindUnique.mockResolvedValue({
      email: "winner@example.com",
    });
    mocks.cycleFindUnique.mockResolvedValue({
      prizeLabel: "One Ocean Park ticket",
    });

    const result = await sendWinnerEmailForCycle(CYCLE_ID);

    expect(mocks.getMarketPulseLeaderboard).toHaveBeenCalledWith({
      mode: "CURRENT_CYCLE",
      cycleId: CYCLE_ID,
      limit: 1,
    });
    expect(mocks.sendProductEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "winner@example.com" }),
    );
    expect(result.ok).toBe(true);
  });

  it("skips when there is no score / winner", async () => {
    mocks.getMarketPulseLeaderboard.mockResolvedValue([]);

    const result = await sendWinnerEmailForCycle(CYCLE_ID);

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "no_winner",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("dedupes on repeated cycle send", async () => {
    mocks.getMarketPulseLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: "winner-1",
        playerName: "Winner",
        image: null,
        score: 100,
        participationPoints: 40,
        bonusPoints: 60,
        isRevealed: true,
        cardsPlayed: 4,
      },
    ]);
    mocks.userFindUnique.mockResolvedValue({ email: "winner@example.com" });
    mocks.cycleFindUnique.mockResolvedValue({ prizeLabel: "Prize" });
    mocks.hasEmailAlreadyBeenSent
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const first = await sendWinnerEmailForCycle(CYCLE_ID);
    const second = await sendWinnerEmailForCycle(CYCLE_ID);

    expect(first.ok).toBe(true);
    expect(second).toEqual({
      ok: false,
      skipped: true,
      reason: "already_sent",
    });
    expect(mocks.sendProductEmail).toHaveBeenCalledTimes(1);
  });

  it("never throws when leaderboard lookup fails", async () => {
    mocks.getMarketPulseLeaderboard.mockRejectedValue(new Error("db down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendWinnerEmailForCycle(CYCLE_ID)).resolves.toMatchObject({
      ok: false,
      skipped: true,
      reason: "delivery_failed",
    });

    errorSpy.mockRestore();
  });
});
