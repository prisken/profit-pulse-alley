import { describe, expect, it } from "vitest";

import { workshopEnMessages } from "@/lib/i18n/messages/workshop-messages";
import { workshopZhHantMessages } from "@/lib/i18n/messages/workshop-messages.zh-Hant";

describe("workshop message catalogs", () => {
  it("exports identical key sets in EN and zh-Hant", () => {
    const enKeys = Object.keys(workshopEnMessages).sort();
    const zhKeys = Object.keys(workshopZhHantMessages).sort();

    const missingInZh = enKeys.filter((k) => !(k in workshopZhHantMessages));
    const missingInEn = zhKeys.filter((k) => !(k in workshopEnMessages));

    expect(missingInZh, `Missing in zh-Hant: ${missingInZh.join(", ")}`).toEqual(
      [],
    );
    expect(missingInEn, `Missing in EN: ${missingInEn.join(", ")}`).toEqual([]);
    expect(zhKeys).toEqual(enKeys);
  });
});
