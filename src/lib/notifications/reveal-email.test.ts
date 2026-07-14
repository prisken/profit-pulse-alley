import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasEmailAlreadyBeenSent: vi.fn(),
  logEmailAttempt: vi.fn(),
  markEmailSent: vi.fn(),
  markEmailFailed: vi.fn(),
  canSendEmailType: vi.fn(),
  sendProductEmail: vi.fn(),
  buildMarketingEmailFooter: vi.fn(),
  resolvePublicSiteOrigin: vi.fn(() => "https://profitpulseally.com"),
  decisionFindMany: vi.fn(),
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

vi.mock("@/lib/email/email-footer", () => ({
  buildMarketingEmailFooter: mocks.buildMarketingEmailFooter,
  resolvePublicSiteOrigin: mocks.resolvePublicSiteOrigin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseDecision: {
      findMany: mocks.decisionFindMany,
    },
  },
}));

import {
  buildRevealReadyEmailBodies,
  sendRevealReadyEmailsForCycle,
  sendRevealReadyEmailToUser,
} from "@/lib/notifications/reveal-email";

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
  expect(payload.subject).not.toMatch(/rank|leaderboard|score/i);
  expect(payload.text).not.toMatch(/\b(rank|leaderboard|#\d+)\b/i);
  expect(payload.html).not.toMatch(/\b(rank|leaderboard|#\d+)\b/i);
}

describe("buildRevealReadyEmailBodies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildMarketingEmailFooter.mockReturnValue({
      text: "\n\n---\nunsub",
      html: "<p>unsub</p>",
      unsubscribeUrl: "https://profitpulseally.com/unsubscribe?token=x",
    });
  });

  it("links to cycle review without PPA or score fields", () => {
    const bodies = buildRevealReadyEmailBodies({
      userId: "user-1",
      email: "player@example.com",
    });

    expect(bodies.subject).toBe("Your Market Pulse results are ready");
    expect(bodies.text).toContain(
      "PPA Insight is now revealed for the latest Market Pulse cycle.",
    );
    expect(bodies.text).toContain("/market-pulse/reveal");
    expect(bodies.html).toContain("View your review");
    assertNoPpaPayloadFields(bodies);
  });
});

describe("sendRevealReadyEmailToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canSendEmailType.mockResolvedValue(true);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValue(false);
    mocks.logEmailAttempt.mockResolvedValue({ id: "log-1" });
    mocks.markEmailSent.mockResolvedValue({ id: "log-1", status: "sent" });
    mocks.markEmailFailed.mockResolvedValue({ id: "log-1", status: "failed" });
    mocks.buildMarketingEmailFooter.mockReturnValue({
      text: "\n\n---\nunsub",
      html: "<p>unsub</p>",
      unsubscribeUrl: "https://profitpulseally.com/unsubscribe?token=x",
    });
    mocks.sendProductEmail.mockResolvedValue({
      ok: true,
      providerMessageId: "<reveal@zoho>",
    });
  });

  it("sends reveal-ready email and marks the log sent", async () => {
    const result = await sendRevealReadyEmailToUser({
      userId: "user-1",
      email: "Player@Example.com",
      cycleId: CYCLE_ID,
    });

    expect(result).toEqual({
      ok: true,
      providerMessageId: "<reveal@zoho>",
    });
    expect(mocks.hasEmailAlreadyBeenSent).toHaveBeenCalledWith(
      "market_pulse_reveal",
      { userId: "user-1", cycleId: CYCLE_ID },
    );
    expect(mocks.canSendEmailType).toHaveBeenCalledWith(
      "user-1",
      "market_pulse_reveal",
    );
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "player@example.com",
        subject: "Your Market Pulse results are ready",
        text: expect.stringContaining("/market-pulse/reveal"),
        html: expect.stringContaining("View your review"),
      }),
    );
    assertNoPpaPayloadFields(mocks.sendProductEmail.mock.calls[0][0]);
    expect(mocks.markEmailSent).toHaveBeenCalledWith("log-1", {
      providerMessageId: "<reveal@zoho>",
    });
  });

  it("skips when already sent for user + cycle", async () => {
    mocks.hasEmailAlreadyBeenSent.mockResolvedValueOnce(true);

    const result = await sendRevealReadyEmailToUser({
      userId: "user-1",
      email: "player@example.com",
      cycleId: CYCLE_ID,
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "already_sent",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("skips when revealNotificationsEnabled is false via canSendEmailType", async () => {
    mocks.canSendEmailType.mockResolvedValueOnce(false);

    const result = await sendRevealReadyEmailToUser({
      userId: "user-1",
      email: "player@example.com",
      cycleId: CYCLE_ID,
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "preference_blocked",
    });
    expect(mocks.logEmailAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "market_pulse_reveal",
        cycleId: CYCLE_ID,
        status: "skipped",
      }),
    );
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("skips when unsubscribedAt blocks via canSendEmailType", async () => {
    mocks.canSendEmailType.mockResolvedValueOnce(false);

    const result = await sendRevealReadyEmailToUser({
      userId: "user-1",
      email: "player@example.com",
      cycleId: CYCLE_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("preference_blocked");
    }
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("does not throw when sendProductEmail fails", async () => {
    mocks.sendProductEmail.mockRejectedValue(new Error("smtp down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendRevealReadyEmailToUser({
        userId: "user-1",
        email: "player@example.com",
        cycleId: CYCLE_ID,
      }),
    ).resolves.toMatchObject({
      ok: false,
      skipped: true,
      reason: "delivery_failed",
    });

    errorSpy.mockRestore();
  });
});

describe("sendRevealReadyEmailsForCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canSendEmailType.mockResolvedValue(true);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValue(false);
    mocks.logEmailAttempt.mockResolvedValue({ id: "log-1" });
    mocks.markEmailSent.mockResolvedValue({ id: "log-1", status: "sent" });
    mocks.markEmailFailed.mockResolvedValue({ id: "log-1", status: "failed" });
    mocks.buildMarketingEmailFooter.mockReturnValue({
      text: "",
      html: "",
      unsubscribeUrl: "https://profitpulseally.com/unsubscribe?token=x",
    });
    mocks.sendProductEmail.mockResolvedValue({ ok: true });
  });

  it("sends only to users with decisions in that cycle", async () => {
    mocks.decisionFindMany.mockResolvedValue([
      {
        userId: "participant-1",
        user: { email: "a@example.com", name: "A" },
      },
      {
        userId: "participant-2",
        user: { email: "b@example.com", name: "B" },
      },
    ]);

    const result = await sendRevealReadyEmailsForCycle(CYCLE_ID);

    expect(mocks.decisionFindMany).toHaveBeenCalledWith({
      where: { cycleId: CYCLE_ID },
      distinct: ["userId"],
      select: {
        userId: true,
        user: { select: { email: true, name: true } },
      },
    });
    expect(mocks.sendProductEmail).toHaveBeenCalledTimes(2);
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com" }),
    );
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "b@example.com" }),
    );
    expect(result).toEqual({
      cycleId: CYCLE_ID,
      attempted: 2,
      sent: 2,
      skipped: 0,
      failed: 0,
    });
  });

  it("dedupes by user + cycle across batch retries", async () => {
    mocks.decisionFindMany.mockResolvedValue([
      {
        userId: "participant-1",
        user: { email: "a@example.com", name: "A" },
      },
    ]);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValueOnce(false);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValueOnce(true);

    const first = await sendRevealReadyEmailsForCycle(CYCLE_ID);
    const second = await sendRevealReadyEmailsForCycle(CYCLE_ID);

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    expect(second.skipped).toBe(1);
    expect(mocks.sendProductEmail).toHaveBeenCalledTimes(1);
  });

  it("never throws when recipient lookup fails", async () => {
    mocks.decisionFindMany.mockRejectedValue(new Error("db down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendRevealReadyEmailsForCycle(CYCLE_ID)).resolves.toEqual({
      cycleId: CYCLE_ID,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    });

    errorSpy.mockRestore();
  });
});
