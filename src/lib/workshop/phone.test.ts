import { describe, expect, it } from "vitest";

import {
  normalizeWorkshopPhone,
  validateWorkshopPhone,
} from "@/lib/workshop/phone";

describe("normalizeWorkshopPhone", () => {
  it("strips spaces and dashes", () => {
    expect(normalizeWorkshopPhone(" +852 1234-5678 ")).toBe("+85212345678");
  });
});

describe("validateWorkshopPhone", () => {
  it("requires a non-empty value", () => {
    const result = validateWorkshopPhone("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKey).toBe("workshop.capture.phoneRequired");
    }
  });

  it("accepts +852 followed by 8 digits", () => {
    const result = validateWorkshopPhone("+852 1234 5678");
    expect(result).toEqual({ ok: true, phone: "+85212345678" });
  });

  it("accepts general international numbers with optional +", () => {
    expect(validateWorkshopPhone("+14155552671").ok).toBe(true);
    expect(validateWorkshopPhone("14155552671").ok).toBe(true);
  });

  it("normalizes bare 8-digit HK numbers to +852 E.164", () => {
    expect(validateWorkshopPhone("60713746")).toEqual({
      ok: true,
      phone: "+85260713746",
    });
    expect(validateWorkshopPhone("9123 4567")).toEqual({
      ok: true,
      phone: "+85291234567",
    });
  });

  it("rejects too-short or malformed numbers", () => {
    expect(validateWorkshopPhone("+852123").ok).toBe(false);
    expect(validateWorkshopPhone("abc").ok).toBe(false);
    expect(validateWorkshopPhone("+852123456789").ok).toBe(false);
  });
});
