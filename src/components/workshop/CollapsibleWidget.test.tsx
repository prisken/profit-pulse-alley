/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) => {
      const map: Record<string, string> = {
        "workshop.ui.expand": "Expand",
        "workshop.ui.collapse": "Collapse",
        "workshop.ui.showDetails": "Show details",
        "workshop.ui.hideDetails": "Hide details",
        "workshop.layerFlags.green": "Strong",
        "workshop.layerFlags.amber": "Watch",
        "workshop.layerFlags.red": "Needs Attention",
        "workshop.stat.edit": "Edit",
        "workshop.stat.editAria": "Edit {label}",
      };
      return map[key] ?? key;
    },
  }),
}));

afterEach(() => {
  cleanup();
});

describe("CollapsibleWidget", () => {
  it("toggles body visibility from the header control", async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleWidget title="Layer" defaultExpanded={false}>
        <p>Hidden detail</p>
      </CollapsibleWidget>,
    );

    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /expand/i }));
    expect(screen.getByText("Hidden detail")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /collapse/i }));
    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();
  });
});

describe("WorkshopStatCard", () => {
  it("starts collapsed for green status with expandable text", () => {
    render(
      <WorkshopStatCard
        icon="Shield"
        status="green"
        label="Protection"
        value="80%"
        expandableText="Why this matters copy"
      />,
    );

    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(
      screen.queryByText("Why this matters copy"),
    ).not.toBeInTheDocument();
  });

  it("starts expanded for red status with expandable text", () => {
    render(
      <WorkshopStatCard
        icon="Shield"
        status="red"
        label="Protection"
        value="20%"
        expandableText="Critical gap explanation"
      />,
    );

    expect(screen.getByText("Critical gap explanation")).toBeInTheDocument();
  });

  it("uses light ProjectionLab surface classes when not collapsible", () => {
    const { container } = render(
      <WorkshopStatCard icon="Home" label="Housing" value="$12,000" />,
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("bg-white");
    expect(article?.className).toMatch(/border-slate|border-emerald|border-/);
  });
});
