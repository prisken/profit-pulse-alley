import { describe, expect, it } from "vitest";

import { assertStrictBilingual } from "@/lib/workshop/bilingual";

describe("assertStrictBilingual", () => {
  it("accepts non-empty { en, zhHant }", () => {
    expect(
      assertStrictBilingual(
        { en: "Hello", zhHant: "你好" },
        "rationale",
      ),
    ).toEqual({ en: "Hello", zhHant: "你好" });
  });

  it("throws naming .zhHant when Traditional Chinese is missing", () => {
    expect(() =>
      assertStrictBilingual({ en: "Hello only" }, "rationale"),
    ).toThrow(/rationale\.zhHant/);
  });

  it("throws naming .zhHant when Traditional Chinese is empty", () => {
    expect(() =>
      assertStrictBilingual({ en: "Hello", zhHant: "   " }, "notes[0].note"),
    ).toThrow(/notes\[0\]\.note\.zhHant/);
  });

  it("throws naming .en when English is missing", () => {
    expect(() =>
      assertStrictBilingual({ zhHant: "只有中文" }, "title"),
    ).toThrow(/title\.en/);
  });

  it("rejects a plain string with a clear shape error", () => {
    expect(() => assertStrictBilingual("plain English", "label")).toThrow(
      /plain string/,
    );
  });
});
