/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import InvestmentLayerEditor from "@/components/workshop/InvestmentLayerEditor";
import type { InvestmentLayer } from "@/lib/workshop/types";

const STRINGS: Record<string, string> = {
  "workshop.ui.expand": "Expand",
  "workshop.ui.collapse": "Collapse",
  "workshop.pyramid.layers.investment.title": "Investment & Fun",
  "workshop.layerFlags.green": "Strong",
  "workshop.layerFlags.amber": "Watch",
  "workshop.layerFlags.red": "Needs Attention",
  "workshop.pyramid.investment.cardLabel": "Investment",
  "workshop.pyramid.investment.perMonth": "{amount}/mo",
  "workshop.pyramid.investment.funBudgetLine":
    "Fun {fun} · {low}/{mid}/{high}",
  "workshop.pyramid.investment.riskHeading": "Risk mix",
  "workshop.pyramid.investment.riskHint":
    "±{step}% · rec {low}/{mid}/{high}",
  "workshop.pyramid.investment.lowLabel": "Low risk",
  "workshop.pyramid.investment.midLabel": "Mid risk",
  "workshop.pyramid.investment.highLabel": "High risk",
  "workshop.pyramid.investment.recShort": "rec {n}",
  "workshop.pyramid.investment.decreaseAria": "Decrease {label} by {step}%",
  "workshop.pyramid.investment.increaseAria": "Increase {label} by {step}%",
  "workshop.pyramid.investment.total": "Total {n}%",
  "workshop.pyramid.investment.investCardLabel": "Invest",
  "workshop.pyramid.investment.investSubtext": "sub",
  "workshop.pyramid.investment.lumpSumLabel": "Lump sum",
  "workshop.pyramid.investment.lumpSumSummary": "{amount} invested",
  "workshop.pyramid.investment.monthlyInvestmentLabel": "Monthly invest",
  "workshop.pyramid.investment.monthlyInvesting.label": "Monthly investing",
  "workshop.pyramid.investment.monthlyInvesting.helper":
    "Surplus available ≈ {amount}",
  "workshop.pyramid.investment.monthlyInvesting.amberWarning":
    "Investing exceeds surplus.",
  "workshop.pyramid.investment.funCardLabel": "Fun",
  "workshop.pyramid.investment.funSubtext": "sub",
  "workshop.pyramid.investment.monthlyFunLabel": "Monthly fun",
  "workshop.pyramid.investment.funCrisisHint": "Fun is cut first in a crisis.",
  "workshop.pyramid.investment.lowBandHint": "1–3% /yr",
  "workshop.pyramid.investment.midBandHint": "8–12% /yr",
  "workshop.pyramid.investment.highBandHint": "20–40% /yr",
  "workshop.pyramid.investment.returnBandsDisclaimer":
    "Tool uses 2/6/10 blended assumptions.",
};

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({
    t: (key: string) => STRINGS[key] ?? key,
    locale: "en" as const,
  }),
}));

const baseValue: InvestmentLayer = {
  lumpSumHKD: 5000,
  riskAllocation: { low: 40, mid: 40, high: 20 },
};

afterEach(() => {
  cleanup();
});

describe("InvestmentLayerEditor risk controls", () => {
  it("exposes percent fields for <400px and sliders for ≥400px via responsive classes", () => {
    render(
      <InvestmentLayerEditor
        value={baseValue}
        onChange={() => {}}
        age={32}
      />,
    );

    expect(document.getElementById("workshop-risk-low")).toBeTruthy();
    expect(document.getElementById("workshop-risk-low-slider")).toBeTruthy();

    const sliderWrap = document
      .getElementById("workshop-risk-low-slider")
      ?.closest("div");
    expect(sliderWrap?.className).toMatch(/hidden/);
    expect(sliderWrap?.className).toMatch(/min-\[400px\]:block/);

    const fieldEl = document.getElementById("workshop-risk-low");
    let node: HTMLElement | null = fieldEl;
    while (node && !node.className.includes("min-[400px]:hidden")) {
      node = node.parentElement;
    }
    expect(node?.className).toMatch(/min-\[400px\]:hidden/);
  });

  it("±5% nudge redistributes allocation to sum 100", () => {
    const onChange = vi.fn();
    render(
      <InvestmentLayerEditor
        value={baseValue}
        onChange={onChange}
        age={32}
      />,
    );

    screen.getByRole("button", { name: "Increase Low risk by 5%" }).click();

    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)?.[0] as InvestmentLayer;
    expect(
      next.riskAllocation.low +
        next.riskAllocation.mid +
        next.riskAllocation.high,
    ).toBe(100);
    expect(next.riskAllocation.low).toBe(45);
  });
});
