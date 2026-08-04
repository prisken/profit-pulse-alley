/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import WorkshopAllocationDonut from "@/components/workshop/WorkshopAllocationDonut";
import type { AllocationSlice } from "@/lib/workshop/types";

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) => {
      const map: Record<string, string> = {
        "workshop.allocation.changed": "Changed",
      };
      return map[key] ?? key;
    },
  }),
}));

beforeAll(() => {
  // Recharts ResponsiveContainer needs non-zero layout in jsdom.
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 320,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 220,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 320,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 220,
  });
});

afterEach(() => {
  cleanup();
});

const slices: AllocationSlice[] = [
  {
    key: "housing",
    label: { en: "Housing", zhHant: "住屋" },
    amountHKD: 12_000,
    changed: false,
  },
  {
    key: "fun",
    label: { en: "Fun", zhHant: "娛樂" },
    amountHKD: 5_000,
    changed: true,
  },
  {
    key: "discretionary",
    label: { en: "Discretionary", zhHant: "可選開支" },
    amountHKD: 3_000,
    changed: true,
  },
  {
    key: "surplus",
    label: { en: "Remaining surplus", zhHant: "剩餘盈餘" },
    amountHKD: 8_000,
    changed: false,
  },
];

describe("WorkshopAllocationDonut", () => {
  it("renders bilingual slice labels and center value for the large variant", () => {
    const { container } = render(
      <WorkshopAllocationDonut
        slices={slices}
        size="large"
        centerLabel="Monthly"
        centerValue="HK$28K"
      />,
    );

    const root = screen.getByTestId("workshop-allocation-donut");
    expect(root).toHaveAttribute("data-size", "large");
    expect(root.className).toMatch(/overflow-x-hidden/);
    expect(root.className).toMatch(/min-w-0/);

    const legend = screen.getByTestId("workshop-allocation-donut-legend");
    expect(within(legend).getByText("Housing")).toBeInTheDocument();
    expect(within(legend).getByText("Fun")).toBeInTheDocument();
    expect(within(legend).getByText("Discretionary")).toBeInTheDocument();

    const center = screen.getByTestId("workshop-allocation-donut-center");
    expect(within(center).getByText("Monthly")).toBeInTheDocument();
    expect(within(center).getByText("HK$28K")).toBeInTheDocument();

    // Recharts may omit class names in jsdom; SVG paths are enough to prove the pie mounted.
    const chartRoot =
      container.querySelector(".recharts-responsive-container") ??
      container.querySelector(".recharts-wrapper") ??
      container.querySelector("svg");
    expect(chartRoot).toBeTruthy();
  });

  it("marks changed slices when highlightChanged is true", () => {
    render(
      <WorkshopAllocationDonut
        slices={slices}
        size="compact"
        highlightChanged
      />,
    );

    const funRow = screen
      .getByTestId("workshop-allocation-donut-legend")
      .querySelector('[data-slice-key="fun"]');
    const housingRow = screen
      .getByTestId("workshop-allocation-donut-legend")
      .querySelector('[data-slice-key="housing"]');

    expect(funRow).toHaveAttribute("data-changed", "true");
    expect(housingRow).toHaveAttribute("data-changed", "false");
    expect(screen.getAllByTestId("workshop-allocation-changed-chip")).toHaveLength(
      2,
    );
    expect(screen.getAllByText("Changed")).toHaveLength(2);
  });

  it("mounts compact and large variants without overflow-prone roots", () => {
    const { rerender } = render(
      <WorkshopAllocationDonut slices={slices} size="compact" />,
    );
    let root = screen.getByTestId("workshop-allocation-donut");
    expect(root).toHaveAttribute("data-size", "compact");
    expect(root.className).toMatch(/overflow-x-hidden/);
    expect(root.className).toMatch(/min-w-0/);
    expect(root.className).toMatch(/max-w-\[168px\]/);

    rerender(<WorkshopAllocationDonut slices={slices} size="large" />);
    root = screen.getByTestId("workshop-allocation-donut");
    expect(root).toHaveAttribute("data-size", "large");
    expect(root.className).toMatch(/overflow-x-hidden/);
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);
  });
});
