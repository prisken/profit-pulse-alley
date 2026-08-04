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
          goalType: "spend",
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

  it("shows live derived calendar year from target age", () => {
    const userAge = 40;
    const targetAge = 50;
    const layer: GoalsLayer = {
      goals: [
        {
          id: "g1",
          icon: "PiggyBank",
          label: { en: "Retire", zhHant: "退休" },
          targetAmountHKD: 1_000_000,
          targetAge,
          targetYear: deriveGoalYear(targetAge, userAge),
          goalType: "spend",
        },
      ],
    };

    render(
      <GoalsLayerEditor value={layer} userAge={userAge} onChange={() => {}} />,
    );

    const year = deriveGoalYear(targetAge, userAge);
    expect(
      screen.getByText(
        workshopEnMessages["workshop.pyramid.goals.derivedYearHint"].replace(
          "{year}",
          String(year),
        ),
      ),
    ).toBeInTheDocument();
  });
});
