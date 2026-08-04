/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import WorkshopCaptureStep from "@/components/workshop/WorkshopCaptureStep";

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "workshop.capture.intro": "Intro",
        "workshop.capture.selectedGoal": "Selected goal:",
        "workshop.capture.nameLabel": "Name",
        "workshop.capture.emailLabel": "Email",
        "workshop.capture.phoneLabel": "Phone",
        "workshop.capture.requiredMark": "*",
        "workshop.capture.namePlaceholder": "Your name",
        "workshop.capture.emailPlaceholder": "you@example.com",
        "workshop.capture.phonePlaceholder": "+852…",
        "workshop.capture.phoneRequired": "Phone number is required.",
        "workshop.capture.phoneInvalid": "Invalid phone.",
        "workshop.capture.phoneInvalidHk": "Invalid HK phone.",
        "workshop.capture.downloadButton": "Save & download blueprint",
        "workshop.capture.submitting": "Saving…",
        "workshop.capture.downloadAgainButton": "Download again",
        "workshop.capture.thankYouMessage": "Thank you",
        "workshop.capture.thankYouBody": "Ready for",
        "workshop.capture.backToSummary": "Back to summary",
        "workshop.errors.backButton": "Back",
      };
      return map[key] ?? key;
    },
    locale: "en" as const,
  }),
}));

vi.mock("@/lib/workshop/lead-actions", () => ({
  captureWorkshopLeadAction: vi.fn(async () => ({ ok: true as const })),
}));

afterEach(() => {
  cleanup();
});

describe("WorkshopCaptureStep mobile field attrs", () => {
  it("applies tel/email attrs, 16px text, enterKeyHints, and no autofocus", () => {
    render(
      <WorkshopCaptureStep
        sessionId="sess_1"
        selectedGoalTitle="Emergency fund"
        onBack={() => {}}
      />,
    );

    const name = screen.getByLabelText(/Name/);
    const email = screen.getByLabelText(/Email/);
    const phone = screen.getByLabelText(/Phone/);

    expect(name).toHaveAttribute("autocomplete", "name");
    expect(name).toHaveAttribute("enterkeyhint", "next");
    expect(name).not.toHaveAttribute("autofocus");
    expect(name).toHaveClass("text-base");

    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("inputmode", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("enterkeyhint", "next");
    expect(email).toHaveClass("text-base");

    expect(phone).toHaveAttribute("type", "tel");
    expect(phone).toHaveAttribute("inputmode", "tel");
    expect(phone).toHaveAttribute("autocomplete", "tel");
    expect(phone).toHaveAttribute("enterkeyhint", "done");
    expect(phone).toHaveClass("text-base");

    expect(document.activeElement).toBe(document.body);
  });

  it("shows phone validation inline while typing", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopCaptureStep
        sessionId="sess_1"
        selectedGoalTitle="Emergency fund"
        onBack={() => {}}
      />,
    );

    const phone = screen.getByLabelText(/Phone/);
    await user.type(phone, "12");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
