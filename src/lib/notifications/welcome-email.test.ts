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

import { sendWelcomeEmailForNewUser } from "@/lib/notifications/welcome-email";

describe("sendWelcomeEmailForNewUser", () => {
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
      providerMessageId: "<welcome@zoho>",
    });
  });

  it("sends a welcome email and marks the delivery log sent", async () => {
    const result = await sendWelcomeEmailForNewUser({
      userId: "user-1",
      email: "Player@Example.com",
      name: "Alex",
    });

    expect(result).toEqual({
      ok: true,
      providerMessageId: "<welcome@zoho>",
    });
    expect(mocks.sendProductEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "player@example.com",
        subject: "Welcome to Profit Pulse Ally",
        text: expect.stringContaining("You can start with one signal"),
        html: expect.stringContaining("Play Market Pulse"),
      }),
    );
    expect(mocks.markEmailSent).toHaveBeenCalledWith("log-1", {
      providerMessageId: "<welcome@zoho>",
    });
  });

  it("skips when a welcome email was already sent for the user", async () => {
    mocks.hasEmailAlreadyBeenSent.mockResolvedValueOnce(true);

    const result = await sendWelcomeEmailForNewUser({
      userId: "user-1",
      email: "player@example.com",
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "already_sent",
    });
    expect(mocks.sendProductEmail).not.toHaveBeenCalled();
  });

  it("does not throw when SMTP is skipped and returns a skipped result", async () => {
    mocks.sendProductEmail.mockResolvedValue({
      ok: false,
      skipped: true,
      error: "Email delivery is not configured (EMAIL_SERVER / EMAIL_FROM).",
    });

    const result = await sendWelcomeEmailForNewUser({
      userId: "user-1",
      email: "player@example.com",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("delivery_skipped");
    }
    expect(mocks.markEmailFailed).toHaveBeenCalled();
  });

  it("does not throw when sendProductEmail throws", async () => {
    mocks.sendProductEmail.mockRejectedValue(new Error("boom"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendWelcomeEmailForNewUser({
        userId: "user-1",
        email: "player@example.com",
      }),
    ).resolves.toMatchObject({
      ok: false,
      skipped: true,
      reason: "delivery_failed",
    });

    errorSpy.mockRestore();
  });
});
