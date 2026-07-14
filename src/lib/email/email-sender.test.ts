import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const sendMail = vi.fn();
  const createTransport = vi.fn(() => ({ sendMail }));
  return { sendMail, createTransport };
});

vi.mock("server-only", () => ({}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mocks.createTransport,
  },
}));

import { sendProductEmail } from "@/lib/email/email-sender";

describe("sendProductEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.EMAIL_SERVER;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_REPLY_TO;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns skipped when EMAIL_SERVER or EMAIL_FROM is missing", async () => {
    const result = await sendProductEmail({
      to: "player@example.com",
      subject: "Hello",
      text: "Body that must never appear in logs",
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      error: "Email delivery is not configured (EMAIL_SERVER / EMAIL_FROM).",
    });
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("applies EMAIL_REPLY_TO when replyTo is not provided", async () => {
    process.env.EMAIL_SERVER = "smtp://user:pass@smtp.zoho.com:587";
    process.env.EMAIL_FROM =
      "Profit Pulse Ally <priskenlo@profitpulseally.com>";
    process.env.EMAIL_REPLY_TO = "priskenlo@profitpulseally.com";
    mocks.sendMail.mockResolvedValue({ messageId: "<msg-1@zoho>" });

    const result = await sendProductEmail({
      to: "player@example.com",
      subject: "Reveal is live",
      text: "Your scores are ready.",
      html: "<p>Your scores are ready.</p>",
    });

    expect(result).toEqual({ ok: true, providerMessageId: "<msg-1@zoho>" });
    expect(mocks.createTransport).toHaveBeenCalledWith(
      "smtp://user:pass@smtp.zoho.com:587",
    );
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Profit Pulse Ally <priskenlo@profitpulseally.com>",
        to: "player@example.com",
        subject: "Reveal is live",
        replyTo: "priskenlo@profitpulseally.com",
      }),
    );
  });

  it("prefers explicit replyTo over EMAIL_REPLY_TO", async () => {
    process.env.EMAIL_SERVER = "smtp://user:pass@smtp.zoho.com:587";
    process.env.EMAIL_FROM = "priskenlo@profitpulseally.com";
    process.env.EMAIL_REPLY_TO = "priskenlo@profitpulseally.com";
    mocks.sendMail.mockResolvedValue({ messageId: "<msg-2@zoho>" });

    await sendProductEmail({
      to: "player@example.com",
      subject: "Override",
      text: "text",
      replyTo: "ops@profitpulseally.com",
    });

    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: "ops@profitpulseally.com",
      }),
    );
  });

  it("returns a safe error result when transport fails", async () => {
    process.env.EMAIL_SERVER = "smtp://user:pass@smtp.zoho.com:587";
    process.env.EMAIL_FROM = "priskenlo@profitpulseally.com";
    mocks.sendMail.mockRejectedValue(new Error("SMTP connection timed out"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendProductEmail({
      to: "player@example.com",
      subject: "Fail path",
      text: "SECRET BODY CONTENT that must not be logged",
    });

    expect(result).toEqual({
      ok: false,
      error: "SMTP connection timed out",
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "[email] sendProductEmail failed:",
      "SMTP connection timed out",
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      "SECRET BODY CONTENT",
    );

    errorSpy.mockRestore();
  });
});
