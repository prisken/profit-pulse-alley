/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import WorkshopSessionDetail from "@/components/admin/workshop/WorkshopSessionDetail";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";

const FIXTURE_LEAD: WorkshopAdminLeadRow = {
  id: "ws_1",
  name: "Alex Chan",
  email: "alex@example.com",
  phone: "+85212345678",
  selectedGoal: "Rebuild foundation",
  stressTestVerdict: "PARTIAL",
  profileBehaviorMismatch: true,
  createdAt: "2026-08-04T02:00:00.000Z",
  industry: "Tech",
  age: 34,
  retirementAge: 65,
  monthlyIncomeHKD: 80000,
  assetsDepletedAtAge: 82,
  weakestLayer: "emergencyFund",
  riskProfile: "balanced",
  ratingScore: 62,
  sessionJson: {
    finalPyramid: {
      protection: { medicalCoveragePercent: 80, criticalIllnessAmountHKD: 1_000_000 },
      emergencyFund: { savedAmountHKD: 120_000 },
      goals: {
        goals: [
          {
            id: "g1",
            icon: "🎓",
            label: { en: "Kids education", zhHant: "子女教育" },
            targetAmountHKD: 500_000,
            targetAge: 45,
            targetYear: 2037,
            goalType: "spend",
          },
        ],
      },
      investment: {
        riskAllocation: { low: 40, mid: 40, high: 20 },
        lumpSumHKD: 50_000,
        monthlyInvestmentHKD: 8_000,
        monthlyFunHKD: 3_000,
      },
    },
    aiPyramid: {
      protection: { medicalCoveragePercent: 60, criticalIllnessAmountHKD: 800_000 },
      emergencyFund: { savedAmountHKD: 90_000 },
      goals: { goals: [] },
      investment: {
        riskAllocation: { low: 30, mid: 50, high: 20 },
        lumpSumHKD: 0,
        monthlyInvestmentHKD: 6_000,
        monthlyFunHKD: 3_000,
      },
    },
    expenses: {
      categories: [
        { key: "housing", icon: "🏠", amountHKD: 25_000 },
        { key: "food_living", icon: "🍜", amountHKD: 8_000 },
      ],
      totalHKD: 33_000,
    },
    riskQuiz: { answers: [{ questionId: "q1", choice: "b" }], score: 7, profile: "balanced" },
    goals: {
      rating: { score: 62 },
      crisisStressTest: {
        verdict: "PARTIAL",
        resilienceScore: 55,
        delayYears: 2,
      },
    },
    crisis: {
      impactResult: { scenario: "job_loss", verdict: "PARTIAL", delayYears: 2 },
    },
    macroResult: null,
    goalJourney: {
      decisions: [
        { goalId: "g1", status: "applied", allowLiquidation: false, acceptedSqueeze: false },
      ],
    },
  },
};

describe("WorkshopSessionDetail", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the pyramid diagram bands like the workshop", () => {
    render(<WorkshopSessionDetail lead={FIXTURE_LEAD} />);
    for (const label of ["Invest", "Goals", "Emergency", "Protection"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("Watch")).toBeInTheDocument();
  });

  it("shows layer values, expenses and goals without raw JSON", () => {
    render(<WorkshopSessionDetail lead={FIXTURE_LEAD} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("HK$1M")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Kids education")).toBeInTheDocument();
    expect(screen.getByText("applied")).toBeInTheDocument();
    expect(screen.getByText("balanced")).toBeInTheDocument();
    expect(screen.queryByText("finalPyramid")).not.toBeInTheDocument();
    expect(screen.queryByText(/"protection"/)).not.toBeInTheDocument();
  });

  it("can switch to the AI-predicted pyramid", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<WorkshopSessionDetail lead={FIXTURE_LEAD} />);
    await user.click(screen.getByRole("button", { name: "AI-predicted" }));
    expect(screen.getByText("showing AI-predicted pyramid")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});
