/**
 * Pure risk-allocation helpers for InvestmentLayerEditor.
 * Linked sliders must always sum to exactly 100 with no negatives.
 */

export type RiskAllocation = {
  low: number;
  mid: number;
  high: number;
};

export type RiskAllocationKey = keyof RiskAllocation;

const KEYS: RiskAllocationKey[] = ["low", "mid", "high"];

/**
 * When one bucket changes, redistribute the other two proportionally
 * so the total remains exactly 100.
 */
export function redistributeRiskAllocation(
  current: RiskAllocation,
  changed: RiskAllocationKey,
  nextValue: number,
): RiskAllocation {
  const clamped = Math.min(100, Math.max(0, Math.round(nextValue)));
  const others = KEYS.filter((key) => key !== changed) as [
    RiskAllocationKey,
    RiskAllocationKey,
  ];
  const remainder = 100 - clamped;

  const aCurrent = Math.max(0, current[others[0]]);
  const bCurrent = Math.max(0, current[others[1]]);
  const otherSum = aCurrent + bCurrent;

  let nextA: number;
  let nextB: number;

  if (otherSum <= 0) {
    nextA = Math.floor(remainder / 2);
    nextB = remainder - nextA;
  } else {
    nextA = Math.round((aCurrent / otherSum) * remainder);
    nextB = remainder - nextA;
  }

  if (nextA < 0) {
    nextA = 0;
    nextB = remainder;
  }
  if (nextB < 0) {
    nextB = 0;
    nextA = remainder;
  }

  return {
    low: changed === "low" ? clamped : others[0] === "low" ? nextA : nextB,
    mid: changed === "mid" ? clamped : others[0] === "mid" ? nextA : nextB,
    high: changed === "high" ? clamped : others[0] === "high" ? nextA : nextB,
  };
}

export function riskAllocationSum(allocation: RiskAllocation): number {
  return allocation.low + allocation.mid + allocation.high;
}
