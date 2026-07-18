import { describe, expect, it } from "vitest";

import { MATCHING_PULSE_FIELD_MAX } from "@/lib/matching-pulse/constants";
import { validateMatchingPulseRequestCreate } from "@/lib/matching-pulse/validation";

const validInput = {
  title: "Looking for a product mentor",
  requestType: "NEED_HELP",
  category: "CAREER",
  description: "I want guidance on launching a B2B product in HK.",
  consentToContact: true,
};

describe("validateMatchingPulseRequestCreate", () => {
  it("accepts valid required fields and normalizes optionals", () => {
    const result = validateMatchingPulseRequestCreate({
      ...validInput,
      company: "  Acme Ltd  ",
      roleTitle: " Founder ",
      contactPhone: " +85212345678 ",
      contactMethod: " WhatsApp ",
      urgency: "HIGH",
      idealMatch: " Experienced PM ",
      source: " homepage ",
      consentToShare: "on",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data).toEqual({
      title: "Looking for a product mentor",
      company: "Acme Ltd",
      roleTitle: "Founder",
      contactPhone: "+85212345678",
      contactMethod: "WhatsApp",
      requestType: "NEED_HELP",
      category: "CAREER",
      urgency: "HIGH",
      description: "I want guidance on launching a B2B product in HK.",
      idealMatch: "Experienced PM",
      source: "homepage",
      consentToContact: true,
      consentToShare: true,
    });
  });

  it("sanitizes invalid source to direct", () => {
    const result = validateMatchingPulseRequestCreate({
      ...validInput,
      source: "not a valid source!",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.source).toBe("direct");
  });

  it("rejects missing required fields", () => {
    const result = validateMatchingPulseRequestCreate({
      title: "   ",
      requestType: "",
      category: undefined,
      description: null,
      consentToContact: true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.fieldErrors.title).toBeTruthy();
    expect(result.fieldErrors.requestType).toBeTruthy();
    expect(result.fieldErrors.category).toBeTruthy();
    expect(result.fieldErrors.description).toBeTruthy();
    expect(result.formError).toMatch(/fix/i);
  });

  it("rejects invalid enum values", () => {
    const result = validateMatchingPulseRequestCreate({
      ...validInput,
      requestType: "SEEKING",
      category: "TALENT",
      urgency: "URGENT",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.fieldErrors.requestType).toMatch(/valid request type/i);
    expect(result.fieldErrors.category).toMatch(/valid category/i);
    expect(result.fieldErrors.urgency).toMatch(/valid urgency/i);
  });

  it("rejects strings that exceed max length", () => {
    const result = validateMatchingPulseRequestCreate({
      ...validInput,
      title: "x".repeat(MATCHING_PULSE_FIELD_MAX.title + 1),
      company: "y".repeat(MATCHING_PULSE_FIELD_MAX.company + 1),
      description: "z".repeat(MATCHING_PULSE_FIELD_MAX.description + 1),
      idealMatch: "a".repeat(MATCHING_PULSE_FIELD_MAX.idealMatch + 1),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.fieldErrors.title).toMatch(/120/);
    expect(result.fieldErrors.company).toMatch(/120/);
    expect(result.fieldErrors.description).toMatch(/2000/);
    expect(result.fieldErrors.idealMatch).toMatch(/1000/);
  });

  it("requires consentToContact to be true", () => {
    const result = validateMatchingPulseRequestCreate({
      ...validInput,
      consentToContact: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.fieldErrors.consentToContact).toMatch(/contacted/i);
  });

  it("treats empty optional urgency as null", () => {
    const result = validateMatchingPulseRequestCreate({
      ...validInput,
      urgency: "  ",
      consentToShare: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.urgency).toBeNull();
    expect(result.data.consentToShare).toBe(false);
  });
});
