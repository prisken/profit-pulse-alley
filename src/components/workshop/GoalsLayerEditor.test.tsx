/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import GoalsLayerEditor from "@/components/workshop/GoalsLayerEditor";
import { workshopEnMessages } from "@/lib/i18n/messages/workshop-messages";
import { deriveGoalYear } from "@/lib/workshop/goal-year";
import type { GoalsLayer } from "@/lib/workshop/types";

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({
    t: (key: string) =>
      (workshopEnMessages as Record<string, string>)[key] ?? key,
    locale: "en" as const,
  }),
}));

afterEach(() => {
  cleanup();
});

describe("GoalsLayerEditor icon defaults", () => {
  it("swaps an untouched label when the icon changes, but never a user-edited label", async () => {
    const user = userEvent.setup();
    const userAge = 32;
    let layer: GoalsLayer = {
      goals: [
        {
          id: "g1",
          icon: "House",
          label: {
            en: workshopEnMessages["workshop.goals.defaults.home"],
            zhHant: "置業",
          },
          targetAmountHKD: 100_000,
          targetAge: userAge + 5,
          targetYear: deriveGoalYear(userAge + 5, userAge),
        },
      ],
    };

    const renderEditor = () => (
      <GoalsLayerEditor
        value={layer}
        userAge={userAge}
        onChange={(next) => {
          layer = next;
          rerender(renderEditor());
        }}
      />
    );

    const { rerender } = render(renderEditor());

    const carButtons = screen.getAllByRole("radio", { name: /^Car$/i });
    await user.click(carButtons[0]!);
    expect(layer.goals[0]!.icon).toBe("Car");
    expect(layer.goals[0]!.label.en).toBe(
      workshopEnMessages["workshop.goals.defaults.car"],
    );

    const labelInput = screen.getByLabelText(
      workshopEnMessages["workshop.pyramid.goals.labelField"],
    );
    fireEvent.change(labelInput, { target: { value: "My custom goal" } });
    expect(layer.goals[0]!.label.en).toBe("My custom goal");

    const travelButtons = screen.getAllByRole("radio", { name: /^Travel$/i });
    await user.click(travelButtons[0]!);
    expect(layer.goals[0]!.icon).toBe("Plane");
    expect(layer.goals[0]!.label.en).toBe("My custom goal");
  });

  it("shows goals age-ordered with nest-egg last even when input is unsorted", () => {
    const userAge = 35;
    const layer: GoalsLayer = {
      goals: [
        {
          id: "nest",
          icon: "PiggyBank",
          label: { en: "Nest", zhHant: "儲備" },
          targetAmountHKD: 5_000_000,
          targetAge: 70,
          targetYear: deriveGoalYear(70, userAge),
        },
        {
          id: "home",
          icon: "House",
          label: { en: "Home", zhHant: "置業" },
          targetAmountHKD: 800_000,
          targetAge: 42,
          targetYear: deriveGoalYear(42, userAge),
        },
        {
          id: "trip",
          icon: "Plane",
          label: { en: "Trip", zhHant: "旅行" },
          targetAmountHKD: 40_000,
          targetAge: 37,
          targetYear: deriveGoalYear(37, userAge),
        },
      ],
    };

    render(
      <GoalsLayerEditor
        value={layer}
        userAge={userAge}
        onChange={() => {}}
      />,
    );

    const labels = screen.getAllByLabelText(
      workshopEnMessages["workshop.pyramid.goals.labelField"],
    );
    expect(labels.map((el) => (el as HTMLInputElement).value)).toEqual([
      "Trip",
      "Home",
      "Nest",
    ]);
  });
});
