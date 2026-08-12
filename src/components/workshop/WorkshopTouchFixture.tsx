"use client";

import { useState } from "react";

import WorkshopPyramidStep from "@/components/workshop/WorkshopPyramidStep";
import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import type {
  ExpensesState,
  GoalsLayer,
  InvestmentLayer,
  ProtectionLayer,
  PyramidState,
} from "@/lib/workshop/types";
import { buildPyramidBenchmarks } from "@/lib/workshop/pyramid-benchmarks";

/**
 * Dev-only fixture for touch / responsive / CJK QA without DeepSeek.
 * Mounted at /workshop/pyramid/touch-fixture (blocked in production).
 */
export default function WorkshopTouchFixture() {
  const nowYear = new Date().getFullYear();
  const [protection, setProtection] = useState<ProtectionLayer>({
    medicalCoveragePercent: 40,
    criticalIllnessAmountHKD: 500_000,
  });
  const [goals, setGoals] = useState<GoalsLayer>({
    goals: [
      {
        id: "g1",
        label: { en: "Emergency top-up", zhHant: "應急金補足目標" },
        icon: "PiggyBank",
        targetAmountHKD: 120_000,
        targetAge: 40,
        targetYear: nowYear + 3,
      },
      {
        id: "g2",
        label: { en: "Home down payment", zhHant: "置業首期儲蓄" },
        icon: "House",
        targetAmountHKD: 800_000,
        targetAge: 40,
        targetYear: nowYear + 8,
      },
    ],
  });
  const [investment, setInvestment] = useState<InvestmentLayer>({
    lumpSumHKD: 5000,
    riskAllocation: { low: 40, mid: 40, high: 20 },
  });
  const [scrubYear, setScrubYear] = useState(nowYear);

  const pyramid: PyramidState = {
    protection,
    emergencyFund: { savedAmountHKD: 80_000 },
    goals,
    investment,
  };

  const benchmarks = buildPyramidBenchmarks({
    age: 32,
    monthlyIncomeHKD: 65_000,
    industry: "Tech",
  });

  const fixtureExplanation = {
    en: "Fixture explanation for overflow checks on the calculation panel.",
    zhHant:
      "這是用來檢查繁體中文在計算說明面板上是否會溢出容器的說明文字，請確認不會被裁切。",
  };

  const expenses: ExpensesState = {
    totalHKD: 28_500,
    categories: [
      { key: "housing", icon: "House", amountHKD: 12_000 },
      { key: "food_living", icon: "Utensils", amountHKD: 6_000 },
      { key: "transport", icon: "Bus", amountHKD: 2_500 },
      { key: "insurance", icon: "Shield", amountHKD: 3_000 },
      { key: "discretionary", icon: "ShoppingBag", amountHKD: 5_000 },
    ],
  };

  return (
    <div className="workshop-lab min-h-dvh overflow-x-hidden touch-pan-y bg-zinc-950 px-3 py-6 text-white sm:px-6">
      <h1 className="text-lg font-semibold">Workshop touch fixture</h1>
      <p className="mt-1 text-xs text-zinc-500">
        Dev-only · no AI · responsive / CJK QA surface
      </p>

      <section className="mt-6 min-w-0 space-y-3" data-qa="pyramid-step">
        <WorkshopPyramidStep
          sessionId="fixture"
          pyramid={pyramid}
          onChange={(next) => {
            setProtection(next.protection);
            setGoals(next.goals);
            setInvestment(next.investment);
          }}
          benchmarks={benchmarks}
          rationale={{
            en: "Fixture rationale for overflow checks.",
            zhHant:
              "這是用來檢查繁體中文在窄螢幕上是否會溢出容器的說明文字，請確認不會被裁切。",
          }}
          protectionExplanation={fixtureExplanation}
          emergencyFundExplanation={fixtureExplanation}
          age={32}
          monthlyIncomeHKD={65_000}
          industry="Tech"
          onBack={() => {}}
          onContinue={() => {}}
        />
      </section>

      <section className="mt-10 min-w-0 space-y-3" data-qa="expenses">
        <p className="text-sm text-zinc-400">Expense category rows</p>
        <div className="space-y-3">
          {expenses.categories.map((cat) => (
            <WorkshopStatCard
              key={cat.key}
              icon={cat.icon}
              label={cat.key}
              value={`HK$${cat.amountHKD.toLocaleString("en-US")}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-10 min-w-0 space-y-3" data-qa="scrubber">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 px-3.5 py-4 touch-pan-y">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Year scrubber
          </p>
          <p
            data-testid="scrub-year"
            className="mt-1 font-mono text-2xl font-semibold text-white"
          >
            {scrubYear}
          </p>
          <div className="mt-3 touch-none">
            <WorkshopRangeSlider
              min={nowYear}
              max={nowYear + 30}
              step={1}
              value={scrubYear}
              aria-label="Year scrubber"
              onChange={setScrubYear}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
