import { describe, expect, it } from "vitest";

import { translateMatchingPulseError } from "@/lib/i18n/matching-pulse-ui";
import { MATCHING_PULSE_FIELD_MAX } from "@/lib/matching-pulse/constants";

describe("translateMatchingPulseError", () => {
  it("translates known English validation messages", () => {
    expect(translateMatchingPulseError("zh-Hant", "Title is required.")).toBe(
      "請填寫標題。",
    );
    expect(
      translateMatchingPulseError(
        "zh-Hant",
        "Please fix the highlighted fields and try again.",
      ),
    ).toBe("請修正標示的欄位後再試。");
  });

  it("interpolates max-length messages", () => {
    expect(
      translateMatchingPulseError(
        "zh-Hant",
        `Title must be ${MATCHING_PULSE_FIELD_MAX.title} characters or fewer.`,
      ),
    ).toBe(`標題不可超過 ${MATCHING_PULSE_FIELD_MAX.title} 字。`);

    expect(
      translateMatchingPulseError("en", "Must be 80 characters or fewer."),
    ).toBe("Must be 80 characters or fewer.");
  });

  it("passes through unknown messages", () => {
    expect(translateMatchingPulseError("zh-Hant", "Custom server error")).toBe(
      "Custom server error",
    );
  });
});
