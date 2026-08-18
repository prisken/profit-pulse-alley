/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import WorkshopGoalJourneyRail from "@/components/workshop/WorkshopGoalJourneyRail";
import type { GoalItem, PyramidState } from "@/lib/workshop/types";

const computeGoalOutlookAction = vi.fn();
const computeSqueezeRecommendationAction = vi.fn();
const narrateGoalSqueezeAction = vi.fn();
const applyGoalJourneyDecisionAction = vi.fn();

vi.mock("@/components/workshop/WorkshopRetirementFinaleCharts", () => ({
  default: () => (
    <div data-testid="workshop-retirement-finale-charts">charts</div>
  ),
}));

vi.mock("@/lib/workshop/pyramid-actions", () => ({
  computeGoalOutlookAction: (...args: unknown[]) =>
    computeGoalOutlookAction(...args),
  computeSqueezeRecommendationAction: (...args: unknown[]) =>
    computeSqueezeRecommendationAction(...args),
  narrateGoalSqueezeAction: (...args: unknown[]) =>
    narrateGoalSqueezeAction(...args),
  applyGoalJourneyDecisionAction: (...args: unknown[]) =>
    applyGoalJourneyDecisionAction(...args),
}));

vi.mock("@/components/providers/LocaleProvider", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string) => {
      const map: Record<string, string> = {
        "workshop.ui.expand": "Expand",
        "workshop.ui.collapse": "Collapse",
        "workshop.ui.showDetails": "Show details",
        "workshop.journey.railTitle": "Goal journey",
        "workshop.journey.ageMarker": "Age {age}",
        "workshop.journey.retirementLabel": "Retirement",
        "workshop.journey.retirementSubtitle": "Nest-egg check at age {age}",
        "workshop.journey.statusOnTrack": "✓ On track",
        "workshop.journey.statusDelayed": "⏱ Delayed",
        "workshop.journey.statusGivenUp": "✕ Given up",
        "workshop.journey.revisitBadge": "May need to revisit",
        "workshop.journey.lockedHint": "Locked",
        "workshop.journey.stubPlaceholder": "Stub",
        "workshop.journey.outlookHeadline":
          "On your current plan, you reach {target} at age {age}",
        "workshop.journey.outlookNever": "Never reach {target}",
        "workshop.journey.yearsLate": "{n} years late",
        "workshop.journey.outlookWithSqueeze": "With squeeze at age {age}",
        "workshop.journey.liquidationToggle":
          "Allow using emergency fund / investments for this goal",
        "workshop.journey.liquidationConsequence":
          "→ age {age}, EF {months} months",
        "workshop.journey.squeezeHeading": "Spending squeeze",
        "workshop.journey.donutCurrent": "Current",
        "workshop.journey.donutRecommended": "AI Recommended",
        "workshop.journey.donutOutflow": "Outflow",
        "workshop.journey.acceptSqueeze": "Accept AI recommendation",
        "workshop.journey.squeezeAccepted": "Recommendation accepted",
        "workshop.journey.applyGoal": "Apply goal",
        "workshop.journey.giveUpGoal": "Give up goal",
        "workshop.journey.loadingOutlook": "Loading",
        "workshop.journey.loadErrorTitle": "Load error",
        "workshop.journey.loadError": "Load failed",
        "workshop.journey.reasoningErrorTitle": "Reasoning error",
        "workshop.journey.reasoningError": "Reasoning failed",
        "workshop.journey.reasoningLoading": "Writing…",
        "workshop.journey.decisionError": "Decision failed",
        "workshop.journey.retirementReadOnly": "Retirement finale",
        "workshop.journey.finaleRecapHeading": "Decision recap",
        "workshop.journey.finaleRecapSummary":
          "{onTime} goals achieved on time, {delayed} delayed, {givenUp} given up",
        "workshop.journey.finaleMonthlyPlan":
          "Monthly plan after squeezes: {before}/mo → {after}/mo",
        "workshop.journey.finaleTimelineMissing": "Timeline missing",
        "workshop.stressTest.goalTargetAmount": "Target: {amount}",
        "workshop.stressTest.goalInflatedTarget": "Target: {amount}",
      };
      return map[key] ?? key;
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function goal(
  partial: Partial<GoalItem> & Pick<GoalItem, "id" | "targetAge" | "targetAmountHKD">,
): GoalItem {
  return {
    icon: "Target",
    label: { en: partial.id, zhHant: partial.id },
    targetYear: 2026 + (partial.targetAge - 35),
    ...partial,
  };
}

const pyramid: PyramidState = {
  protection: {
    medicalCoveragePercent: 80,
    criticalIllnessAmountHKD: 500_000,
  },
  emergencyFund: { savedAmountHKD: 100_000 },
  goals: {
    goals: [
      goal({ id: "trip", targetAge: 36, targetAmountHKD: 40_000 }),
      goal({ id: "home", targetAge: 40, targetAmountHKD: 800_000 }),
    ],
  },
  investment: {
    riskAllocation: { low: 40, mid: 40, high: 20 },
    lumpSumHKD: 100_000,
  },
};

const sampleSlices = [
  {
    key: "housing",
    label: { en: "Housing", zhHant: "住屋" },
    amountHKD: 10_000,
    changed: false,
  },
  {
    key: "fun",
    label: { en: "Fun", zhHant: "娛樂" },
    amountHKD: 2_000,
    changed: false,
  },
  {
    key: "surplus",
    label: { en: "Surplus", zhHant: "盈餘" },
    amountHKD: 5_000,
    changed: false,
  },
];

const recommendedSlices = [
  {
    key: "housing",
    label: { en: "Housing", zhHant: "住屋" },
    amountHKD: 10_000,
    changed: false,
  },
  {
    key: "fun",
    label: { en: "Fun", zhHant: "娛樂" },
    amountHKD: 0,
    changed: true,
  },
  {
    key: "surplus",
    label: { en: "Surplus", zhHant: "盈餘" },
    amountHKD: 7_000,
    changed: false,
  },
];

const baseExpenses = {
  totalHKD: 14_000,
  categories: [
    { key: "housing" as const, icon: "Home", amountHKD: 10_000 },
    { key: "food_living" as const, icon: "UtensilsCrossed", amountHKD: 1_000 },
    { key: "transport" as const, icon: "Bus", amountHKD: 1_000 },
    { key: "insurance" as const, icon: "Shield", amountHKD: 0 },
    { key: "discretionary" as const, icon: "Sparkles", amountHKD: 2_000 },
  ],
};

function mockMathActions(attainedAtAge: number | null = 38) {
  const outlook = {
    goalId: "trip",
    targetAge: 36,
    attainedAtAge,
    status: attainedAtAge != null && attainedAtAge <= 36 ? "on_track" : "late",
    monthsLate: attainedAtAge == null ? 24 : Math.max(0, (attainedAtAge - 36) * 12),
    requiredExtraMonthlyHKD: 2_000,
  };
  computeGoalOutlookAction.mockResolvedValue({
    outlook,
    timeline: { goals: [], rows: [], retirementTargets: [], emergencyFund: {}, retirement: {}, blendedRate: 0.03, engineRevision: 3 },
    emergencyFundMonths: 4.5,
  });
  computeSqueezeRecommendationAction.mockResolvedValue({
    outlook,
    timeline: { goals: [], rows: [], retirementTargets: [], emergencyFund: {}, retirement: {}, blendedRate: 0.03, engineRevision: 3 },
    journey: { decisions: [], updatedAt: new Date().toISOString() },
    recommendation: {
      requiredExtraMonthlyHKD: 2_000,
      currentAllocation: sampleSlices,
      recommendedAllocation: recommendedSlices,
      achievableAtAge: 37,
      reasoning: { en: "", zhHant: "" },
    },
  });
  narrateGoalSqueezeAction.mockResolvedValue({
    en: "Trim fun by HK$2,000/mo to close most of the gap.",
    zhHant: "每月削減娛樂 2,000 以縮短差距。",
  });
}

describe("WorkshopGoalJourneyRail", () => {
  it("locks later goals and loads the active card interior with squeeze donuts", async () => {
    mockMathActions(38);
    render(
      <WorkshopGoalJourneyRail
        sessionId="sess_1"
        tone="professional"
        pyramid={pyramid}
        expenses={baseExpenses}
      />,
    );

    const rail = screen.getByTestId("workshop-goal-journey-rail");
    const trip = rail.querySelector('[data-goal-id="trip"]') as HTMLElement;
    const home = rail.querySelector('[data-goal-id="home"]') as HTMLElement;

    expect(trip).toHaveAttribute("data-locked", "false");
    expect(home).toHaveAttribute("data-locked", "true");

    await waitFor(() => {
      expect(
        within(trip).getByTestId("workshop-journey-card-body"),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(within(trip).getByText("Current")).toBeInTheDocument();
      expect(within(trip).getByText("AI Recommended")).toBeInTheDocument();
    });
    expect(within(trip).getByText(/2 years late/i)).toBeInTheDocument();
  });

  it("applies a goal via the server action and unlocks the next card", async () => {
    const user = userEvent.setup();
    mockMathActions(38);
    applyGoalJourneyDecisionAction.mockResolvedValue({
      timeline: {
        goals: [
          {
            goalId: "trip",
            targetAge: 36,
            inflatedTargetHKD: 40_000,
            attainedAtAge: 38,
            status: "amber",
          },
        ],
        rows: [],
        emergencyFund: {
          status: "green",
          targetHKD: 1,
          targetMonths: 6,
        },
        retirement: {
          passiveIncomeAtRetirement: 0,
          assetsAtRetirement: 0,
          assetsDepletedAtAge: null,
        },
        blendedRate: 0.03,
        engineRevision: 3,
      },
      legacyStressTest: {
        monthlySurplusByYear: [],
        emergencyFundProjection: {
          targetMonths: 6,
          projectedMonths: 6,
          status: "green",
        },
        goalProjections: [],
      },
      journey: {
        decisions: [
          {
            goalId: "trip",
            status: "applied",
            allowLiquidation: false,
            acceptedSqueeze: false,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      pyramid,
      expenses: {
        totalHKD: 20_000,
        categories: [
          { key: "housing", icon: "Home", amountHKD: 20_000 },
        ],
      },
      allocation: sampleSlices,
    });

    render(
      <WorkshopGoalJourneyRail
        sessionId="sess_1"
        tone="professional"
        pyramid={pyramid}
        expenses={baseExpenses}
      />,
    );

    const rail = screen.getByTestId("workshop-goal-journey-rail");
    const trip = rail.querySelector('[data-goal-id="trip"]') as HTMLElement;

    await waitFor(() => {
      expect(
        within(trip).getByRole("button", { name: /apply goal/i }),
      ).toBeInTheDocument();
    });

    await user.click(within(trip).getByRole("button", { name: /apply goal/i }));

    await waitFor(() => {
      expect(applyGoalJourneyDecisionAction).toHaveBeenCalledWith(
        "sess_1",
        expect.objectContaining({
          goalId: "trip",
          status: "applied",
        }),
      );
    });

    await waitFor(() => {
      const home = rail.querySelector('[data-goal-id="home"]') as HTMLElement;
      expect(home).toHaveAttribute("data-locked", "false");
    });
  });

  it("puts every goal on the rail sorted by target age (no nest-egg type in v4)", () => {
    const withNest: PyramidState = {
      ...pyramid,
      goals: {
        goals: [
          ...pyramid.goals.goals,
          {
            id: "nest",
            icon: "PiggyBank",
            label: { en: "Nest egg", zhHant: "儲備" },
            targetAmountHKD: 5_000_000,
            targetAge: 65,
            targetYear: 2056,
          },
        ],
      },
    };

    render(
      <WorkshopGoalJourneyRail
        sessionId="sess_1"
        tone="professional"
        pyramid={withNest}
        expenses={baseExpenses}
      />,
    );

    const rail = screen.getByTestId("workshop-goal-journey-rail");
    expect(rail.querySelector('[data-goal-id="trip"]')).toBeTruthy();
    expect(rail.querySelector('[data-goal-id="home"]')).toBeTruthy();
    expect(rail.querySelector('[data-goal-id="nest"]')).toBeTruthy();
    expect(
      rail.querySelector('[data-goal-id="__retirement_rail__"]'),
    ).toBeNull();
    expect(
      within(rail).queryByTestId("workshop-journey-finale-card"),
    ).not.toBeInTheDocument();
  });

  it("signals finale reached without embedding retirement charts in the rail", async () => {
    const onGoalsResolvedChange = vi.fn();
    render(
      <WorkshopGoalJourneyRail
        sessionId="sess_1"
        tone="professional"
        pyramid={pyramid}
        expenses={baseExpenses}
        journey={{
          decisions: [
            {
              goalId: "trip",
              status: "applied",
              allowLiquidation: false,
              acceptedSqueeze: true,
              squeezeCutsHKD: { fun: 12_000, discretionary: 0 },
            },
            {
              goalId: "home",
              status: "given_up",
              allowLiquidation: false,
              acceptedSqueeze: false,
            },
          ],
          updatedAt: new Date().toISOString(),
        }}
        timeline={{
          goals: [
            {
              goalId: "trip",
              targetAge: 36,
              inflatedTargetHKD: 40_000,
              attainedAtAge: 36,
              status: "green",
            },
          ],
          rows: [
            {
              age: 35,
              year: 2026,
              salaryIncome: 50_000,
              passiveIncome: 0,
              totalIncome: 50_000,
              expenses: 14_000,
              surplus: 34_000,
              investedLiquidatedHKD: 0,
              liquidPool: 100_000,
              investedPool: 100_000,
            },
            {
              age: 65,
              year: 2056,
              salaryIncome: 0,
              passiveIncome: 8_000,
              totalIncome: 8_000,
              expenses: 14_000,
              surplus: 0,
              investedLiquidatedHKD: 0,
              liquidPool: 200_000,
              investedPool: 800_000,
            },
          ],
          emergencyFund: {
            status: "green",
            targetHKD: 84_000,
            targetMonths: 6,
          },
          retirement: {
            retirementAge: 65,
            passiveIncomeAtRetirement: 8_000,
            assetsAtRetirement: 1_000_000,
            assetsDepletedAtAge: null,
          },
          blendedRate: 0.03,
          engineRevision: 4,
        }}
        onGoalsResolvedChange={onGoalsResolvedChange}
      />,
    );

    const rail = screen.getByTestId("workshop-goal-journey-rail");
    expect(
      rail.querySelector('[data-goal-id="__retirement_rail__"]'),
    ).toBeNull();
    expect(
      within(rail).queryByTestId("workshop-journey-finale-card"),
    ).not.toBeInTheDocument();
    expect(onGoalsResolvedChange).toHaveBeenCalledWith(true);
  });
});
