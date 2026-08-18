import { describe, expect, it } from "vitest";

import { bilingualBoth } from "@/lib/workshop/bilingual";
import {
  buildPyramidBenchmarks,
  computeLayerFlags,
  getCriticalIllnessBenchmarkHKD,
  getEmergencyFundTargetMonths,
  getMedicalCoverageBenchmarkPercent,
  getRiskAllocationBenchmark,
} from "@/lib/workshop/pyramid-benchmarks";
import type { PyramidState } from "@/lib/workshop/types";

describe("getMedicalCoverageBenchmarkPercent", () => {
  it("stays within 80–100 and rises with age", () => {
    const young = getMedicalCoverageBenchmarkPercent(25);
    const mid = getMedicalCoverageBenchmarkPercent(45);
    const older = getMedicalCoverageBenchmarkPercent(65);
    expect(young).toBeGreaterThanOrEqual(80);
    expect(older).toBeLessThanOrEqual(100);
    expect(mid).toBeGreaterThanOrEqual(young);
    expect(older).toBeGreaterThanOrEqual(mid);
  });
});

describe("getRiskAllocationBenchmark", () => {
  it("always sums to exactly 100 across ages 20–70", () => {
    for (let age = 20; age <= 70; age += 1) {
      const alloc = getRiskAllocationBenchmark(age);
      expect(alloc.low + alloc.mid + alloc.high).toBe(100);
      expect(alloc.high).toBeGreaterThanOrEqual(10);
      expect(alloc.high).toBeLessThanOrEqual(90);
      expect(alloc.low).toBeGreaterThanOrEqual(0);
      expect(alloc.mid).toBeGreaterThanOrEqual(0);
    }
  });

  it("reduces high-risk share as age increases", () => {
    expect(getRiskAllocationBenchmark(25).high).toBeGreaterThan(
      getRiskAllocationBenchmark(55).high,
    );
  });
});

describe("buildPyramidBenchmarks breakdowns", () => {
  it("exposes ciBreakdown matching criticalIllnessAmountHKD", () => {
    const snap = buildPyramidBenchmarks({
      age: 35,
      monthlyIncomeHKD: 40_000,
      industry: "Tech",
    });
    expect(snap.ciBreakdown.annualIncomeHKD).toBe(480_000);
    expect(snap.ciBreakdown.recommendedHKD).toBe(snap.criticalIllnessAmountHKD);
    expect(snap.ciBreakdown.recommendedHKD).toBe(
      Math.round(snap.ciBreakdown.annualIncomeHKD * snap.ciBreakdown.multiple),
    );
  });

  it("exposes efBreakdown matching emergencyFundTargetHKD (income-based)", () => {
    const snap = buildPyramidBenchmarks({
      age: 35,
      monthlyIncomeHKD: 40_000,
      industry: "Tech",
    });
    expect(snap.efBreakdown.targetMonths).toBe(snap.emergencyFundTargetMonths);
    expect(snap.efBreakdown.recommendedHKD).toBe(snap.emergencyFundTargetHKD);
    expect(snap.efBreakdown.monthlyIncomeHKD).toBe(40_000);
    expect(snap.efBreakdown.industryKey).toBe("Tech");
  });
});

describe("getEmergencyFundTargetMonths", () => {
  it("is higher for self-employed than civil service", () => {
    const selfEmployed = getEmergencyFundTargetMonths("Self-Employed");
    const civil = getEmergencyFundTargetMonths("Civil Service");
    expect(selfEmployed).toBeGreaterThan(civil);
    expect(selfEmployed).toBeGreaterThanOrEqual(9);
    expect(civil).toBeLessThanOrEqual(4);
  });

  it("defaults to 6 months for typical private-sector industries", () => {
    expect(getEmergencyFundTargetMonths("Tech")).toBe(6);
    expect(getEmergencyFundTargetMonths("Finance")).toBe(6);
  });
});

describe("getCriticalIllnessBenchmarkHKD", () => {
  it("scales with income", () => {
    const low = getCriticalIllnessBenchmarkHKD(35, 300_000);
    const high = getCriticalIllnessBenchmarkHKD(35, 600_000);
    expect(high).toBeCloseTo(low * 2, 0);
    expect(high).toBeGreaterThan(low);
  });

  it("recommends a higher multiple for younger ages", () => {
    const young = getCriticalIllnessBenchmarkHKD(28, 500_000);
    const older = getCriticalIllnessBenchmarkHKD(60, 500_000);
    expect(young).toBeGreaterThan(older);
  });
});

describe("computeLayerFlags", () => {
  const basePyramid = (): PyramidState => ({
    protection: {
      medicalCoveragePercent: 90,
      criticalIllnessAmountHKD: 2_000_000,
    },
    emergencyFund: { savedAmountHKD: 200_000 },
    goals: {
      goals: [
        {
          id: "wedding",
          icon: "Heart",
          label: bilingualBoth("Wedding"),
          targetAmountHKD: 200_000,
          targetAge: 40,
          targetYear: 2028,
        },
        {
          id: "retire",
          icon: "PiggyBank",
          label: bilingualBoth("Retirement seed"),
          targetAmountHKD: 1_000_000,
          targetAge: 40,
          targetYear: 2055,
        },
      ],
    },
    investment: {
      riskAllocation: { low: 20, mid: 30, high: 50 },
      lumpSumHKD: 5_000,
    },
  });

  it("marks underfunded layers red and strong layers green", () => {
    const benchmarks = buildPyramidBenchmarks({
      age: 32,
      monthlyIncomeHKD: 40_000,
      industry: "Tech",
    });
    const strong = computeLayerFlags(basePyramid(), benchmarks);
    expect(strong.goals).toBe("green");

    const weak = computeLayerFlags(
      {
        ...basePyramid(),
        protection: {
          medicalCoveragePercent: 20,
          criticalIllnessAmountHKD: 0,
        },
        emergencyFund: { savedAmountHKD: 1_000 },
        goals: { goals: [] },
        investment: {
          riskAllocation: { low: 100, mid: 0, high: 0 },
          lumpSumHKD: 0,
        },
      },
      benchmarks,
    );
    expect(weak.protection).toBe("red");
    expect(weak.emergencyFund).toBe("red");
    expect(weak.goals).toBe("red");
    expect(weak.investment).toBe("red");
  });

  it("flags investment on risk-glide deviation and zero invested capital (v4)", () => {
    const benchmarks = buildPyramidBenchmarks({
      age: 32,
      monthlyIncomeHKD: 40_000,
      industry: "Tech",
    });
    // Far from the age glide path (benchmark at 32 ≈ L38/M17/H45):
    const farOff = computeLayerFlags(
      {
        ...basePyramid(),
        investment: {
          riskAllocation: { low: 20, mid: 30, high: 50 },
          lumpSumHKD: 50_000,
        },
      },
      benchmarks,
    );
    expect(farOff.investment).toBe("amber");

    const noCapital = computeLayerFlags(
      {
        ...basePyramid(),
        investment: {
          riskAllocation: { ...benchmarks.riskAllocation },
          lumpSumHKD: 0,
        },
      },
      benchmarks,
    );
    expect(noCapital.investment).toBe("amber");
  });
});
