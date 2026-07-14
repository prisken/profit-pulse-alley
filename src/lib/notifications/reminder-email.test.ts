import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasEmailAlreadyBeenSent: vi.fn(),
  hasRecentSentEmail: vi.fn(),
  logEmailAttempt: vi.fn(),
  markEmailSent: vi.fn(),
  markEmailFailed: vi.fn(),
  canSendEmailType: vi.fn(),
  sendProductEmail: vi.fn(),
  buildMarketingEmailFooter: vi.fn(),
  resolvePublicSiteOrigin: vi.fn(() => "https://profitpulseally.com"),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/notifications/email-log", () => ({
  hasEmailAlreadyBeenSent: mocks.hasEmailAlreadyBeenSent,
  hasRecentSentEmail: mocks.hasRecentSentEmail,
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

import {
  buildReminderEmailBodies,
  sendMarketPulseReminderEmail,
} from "@/lib/notifications/reminder-email";

function assertNoPpa(payload: { subject: string; text: string; html: string }) {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toMatch(/ppaSignalLockedAt/);
  expect(serialized).not.toMatch(/"ppaInsight"/);
  expect(serialized).not.toMatch(/"ppaSignal"/);
}

describe("buildReminderEmailBodies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildMarketingEmailFooter.mockReturnValue({
      text: "\n\n---\nunsub",
      html: "<p>unsub</p>",
      unsubscribeUrl: "https://profitpulseally.com/unsubscribe?token=x",
    });
  });

  it("builds playable-card copy with play CTA and no PPA fields", () => {
    const bodies = buildReminderEmailBodies({
      kind: "playable_card",
      userId: "user-1",
      email: "player@example.com",
    });

    expect(bodies.subject).toBe("Today's Market Pulse signal is ready");
    expect(bodies.text).toContain("Today's Market Pulse signal is live.");
    expect(bodies.text).toContain("You can turn reminders off anytime from your profile.");
    expect(bodies.text).toContain("/market-pulse/play");
    expect(bodies.html).toContain("Play now");
    assertNoPpa(bodies);
  });

  it("builds next-cycle copy with play CTA and no PPA fields", () => {
    const bodies = buildReminderEmailBodies({
      kind: "next_cycle",
      userId: "user-1",
      email: "player@example.com",
    });

    expect(bodies.subject).toBe("Next Market Pulse cycle starts soon");
    expect(bodies.text).toContain("The next Market Pulse cycle starts soon.");
    expect(bodies.text).toContain(
      "When it opens, you can read the signal, lock in your view, and compare with PPA Insight after reveal.",
    );
    expect(bodies.html).toContain("Go to Market Pulse");
    assertNoPpa(bodies);
  });
});

describe("sendMarketPulseReminderEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canSendEmailType.mockResolvedValue(true);
    mocks.hasEmailAlreadyBeenSent.mockResolvedValue(false);
    mocks.hasRecentSentEmail.mockResolvedValue(false);
    mocks.logEmailAttempt.mockResolvedValue({ id: "log-1" });
    mocks.markEmailSent.mockResolvedValue({ id: "log-1", status: "sent" });
    mocks.markEmailFailed.mockResolvedValue({ id: "log-1", status: "failed" });
    mocks.buildMarketingEmailFooter.mockReturnValue({
      text: "",
      html: "",
      unsubscribeUrl: "https://profitpulseally.com/unsubscribe?token=x",
    });
    mocks.sendProductEmail.mockResolvedValue({
      ok: true,
      providerMessageId: "<reminder@zoho>",
    });
  });

  it("sends reminder when opted in", async () => {
    const result = await sendMarketPulseReminderEmail({
      userId: "user-1",
      email: "Player@Example.com",
      kind: "playable_card",
      cycleId: "cycle-1",
      cardId: "card-1",
    });

    expect(result.ok).toBe(true);
    expect(mocks.canSendEmailType).toHaveBeenCalledWith(
      "user-1",
      "market_pulse_reminder",
    );
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "player@example.com",
        subject: "Today's Market Pulse signal is ready",
      }),
    );
    assertNoPpa(mocks.sendProductEmail.mock.calls[0][0]);
  });

  it("skips when preference check fails (opt-in required)", async () => {
    mocks.canSendEmailType.mockResolvedValueOnce(false);

    const result = await sendMarketPulseReminderEmail({
      userId: "user-1",
      email: "player@example.com",
      kind: "playable_card",
      cycleId: "cycle-1",
      cardId: "card-1",
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "preference_blocked",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("dedupes by user + card", async () => {
    mocks.hasEmailAlreadyBeenSent.mockResolvedValueOnce(true);

    const result = await sendMarketPulseReminderEmail({
      userId: "user-1",
      email: "player@example.com",
      kind: "playable_card",
      cycleId: "cycle-1",
      cardId: "card-1",
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "already_sent",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("rate-limits when a reminder was sent in the last 24 hours", async () => {
    mocks.hasRecentSentEmail.mockResolvedValueOnce(true);

    const result = await sendMarketPulseReminderEmail({
      userId: "user-1",
      email: "player@example.com",
      kind: "playable_card",
      cycleId: "cycle-1",
      cardId: "card-1",
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "rate_limited",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });
});
