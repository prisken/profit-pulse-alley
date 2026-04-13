export type PhilosophyLabel =
  | "Index Follower"
  | "Blue-Chip Believer"
  | "Tech Futurist"
  | "Momentum Chaser";

export type PlayerPhilosophy = "growth" | "value" | "technical";

export type RiskMandateLabel =
  | "Full Defense"
  | "Cautious"
  | "Balanced"
  | "Aggressive"
  | "Leveraged Aggressive";

export type MarketDay = Record<PhilosophyLabel, number>;

export type MarketEventCategory =
  | "economy"
  | "monetary"
  | "industry"
  | "tech"
  | "geopolitics"
  | "market"
  | "regulation";

export type MarketEvent = {
  category: MarketEventCategory;
  headline: string;
  impact: number; // daily base impact (decimal return, e.g. 0.02 = +2%)
};

// 10-day narrative events aligned to `marketData`.
export const eventsData: MarketEvent[] = [
  // Day 1: Positive Start
  {
    category: "economy",
    headline: "经济数据强于预期",
    impact: 0.018,
  },
  // Day 2: Correction
  {
    category: "monetary",
    headline: "通胀担忧重燃",
    impact: -0.022,
  },
  // Day 3: Sector-Specific Good News
  {
    category: "industry",
    headline: "全球供应链压力缓解",
    impact: 0.012,
  },
  // Day 4: Tech Boom
  {
    category: "tech",
    headline: "AI 取得重大技术突破",
    impact: 0.03,
  },
  // Day 5: Black Swan Event
  {
    category: "geopolitics",
    headline: "地缘政治危机爆发",
    impact: -0.05,
  },
  // Day 6: Cautious Recovery
  {
    category: "monetary",
    headline: "各国央行承诺注入流动性",
    impact: 0.022,
  },
  // Day 7: Momentum Trap
  {
    category: "market",
    headline: "市场在不确定性中反弹",
    impact: -0.028,
  },
  // Day 8: Tech Hit Again
  {
    category: "regulation",
    headline: "主要经济体考虑加强科技监管",
    impact: 0.006,
  },
  // Day 9: Unexpected Strength
  {
    category: "industry",
    headline: "企业盈利季节开局强劲",
    impact: 0.02,
  },
  // Day 10: Final Volatility
  {
    category: "economy",
    headline: "关键通胀数据发布在即",
    impact: -0.024,
  },
];

export const philosophyModifiers: Record<
  PlayerPhilosophy,
  Partial<Record<MarketEventCategory, number>>
> = {
  growth: {
    tech: 1.5,
    economy: 1.1,
    industry: 1.2,
    monetary: 0.9,
    geopolitics: 0.7,
    regulation: 1.3,
    market: 1.0,
  },
  value: {
    tech: 0.6,
    economy: 1.4,
    industry: 1.3,
    monetary: 1.2,
    geopolitics: 1.1,
    regulation: 0.8,
    market: 1.0,
  },
  technical: {
    tech: 1.0,
    economy: 1.0,
    industry: 1.0,
    monetary: 1.0,
    geopolitics: 1.0,
    regulation: 1.0,
    market: 1.0,
  },
};

// Preset 10-day market simulation data.
// Numbers are daily performance percentages expressed as decimals (e.g. 0.04 = +4%).
//
// Philosophy characteristics:
// - Tech Futurist: highest volatility (big booms & crashes).
// - Blue-Chip Believer: most stable (small moves), underperforms on tech-boom days, safer on tech-crash days.
// - Index Follower: baseline market (moderate).
// - Momentum Chaser: explicit trend-chasing behavior:
//   - After a strong market-wide gain day, it tends to be the BEST performer.
//   - After a market-wide loss day, it tends to be the WORST performer.
export const marketData: MarketDay[] = [
  // Day 1: Strong opening for all, especially tech
  {
    "Index Follower": 0.02,
    "Blue-Chip Believer": 0.015,
    "Tech Futurist": 0.04,
    "Momentum Chaser": 0.035,
  },
  // Day 2: Market correction, tech and momentum hit hard
  {
    "Index Follower": -0.025,
    "Blue-Chip Believer": -0.01,
    "Tech Futurist": -0.06,
    "Momentum Chaser": -0.05,
  },
  // Day 3: Blue-chip recovery, tech remains flat; momentum struggles after a down day
  {
    "Index Follower": 0.01,
    "Blue-Chip Believer": 0.025,
    "Tech Futurist": 0.005,
    "Momentum Chaser": -0.01,
  },
  // Day 4: Tech bubble inflates, massive gains; momentum shines after prior up day
  {
    "Index Follower": 0.04,
    "Blue-Chip Believer": 0.02,
    "Tech Futurist": 0.12,
    "Momentum Chaser": 0.10,
  },
  // Day 5: Black swan - sharp market-wide drop; momentum becomes worst after exuberance
  {
    "Index Follower": -0.06,
    "Blue-Chip Believer": -0.04,
    "Tech Futurist": -0.15,
    "Momentum Chaser": -0.18,
  },
  // Day 6: Relief rally; blue-chips stabilize, tech rebounds; momentum still cautious after crash
  {
    "Index Follower": 0.03,
    "Blue-Chip Believer": 0.018,
    "Tech Futurist": 0.09,
    "Momentum Chaser": 0.015,
  },
  // Day 7: Another shock-down; blue-chips act as safer harbor; momentum punished following up day
  {
    "Index Follower": -0.035,
    "Blue-Chip Believer": -0.015,
    "Tech Futurist": -0.10,
    "Momentum Chaser": -0.08,
  },
  // Day 8: Sideways grind; low volatility day; momentum lags after down day
  {
    "Index Follower": 0.008,
    "Blue-Chip Believer": 0.012,
    "Tech Futurist": -0.02,
    "Momentum Chaser": -0.03,
  },
  // Day 9: Tech surprise breakout; momentum becomes best after prior up-ish day
  {
    "Index Follower": 0.025,
    "Blue-Chip Believer": 0.01,
    "Tech Futurist": 0.12,
    "Momentum Chaser": 0.14,
  },
  // Day 10: Hangover selloff; tech and momentum whipsaw hard
  {
    "Index Follower": -0.03,
    "Blue-Chip Believer": -0.012,
    "Tech Futurist": -0.11,
    "Momentum Chaser": -0.14,
  },
];

// Benchmark: simulated S&P 500 daily performance over the same 10 days.
// Length matches `marketData` (10 days).
export const sp500Benchmark: number[] = [
  0.018, // Day 1
  -0.022, // Day 2
  0.012, // Day 3
  0.03, // Day 4
  -0.05, // Day 5
  0.022, // Day 6
  -0.028, // Day 7
  0.006, // Day 8
  0.02, // Day 9
  -0.024, // Day 10
];

export function getInvestedWeight(mandate: RiskMandateLabel): number {
  switch (mandate) {
    case "Full Defense":
      return 0;
    case "Cautious":
      return 0.3;
    case "Balanced":
      return 0.6;
    case "Aggressive":
      return 1.0;
    case "Leveraged Aggressive":
      return 1.5;
    default: {
      // Exhaustiveness guard for future changes
      const _exhaustive: never = mandate;
      return _exhaustive;
    }
  }
}

export type DailyPerformanceResult = {
  previousValue: number;
  newValue: number;
  investedWeight: number; // e.g. 0.6 or 1.5
  cashWeight: number; // e.g. 0.4 or -0.5 when leveraged (borrowed)
  strategyReturn: number; // the day's effective impact (decimal return)
};

/**
 * Calculates the next portfolio value for a single day.
 *
 * Rules:
 * - Invested portion grows/shrinks by the impact return for that day.
 * - Cash portion remains unchanged.
 * - Leveraged Aggressive uses 150% invested weight; assume borrowing cost = 0.
 */
export function calculateDailyPerformance({
  currentValue,
  riskMandate,
  impact,
}: {
  currentValue: number;
  riskMandate: RiskMandateLabel;
  impact: number;
}): DailyPerformanceResult {
  const investedWeight = getInvestedWeight(riskMandate);
  const cashWeight = 1 - investedWeight;
  const strategyReturn = impact;

  const investedPortion = currentValue * investedWeight;
  const cashPortion = currentValue * cashWeight;

  const newValue = investedPortion * (1 + strategyReturn) + cashPortion;

  return {
    previousValue: currentValue,
    newValue,
    investedWeight,
    cashWeight,
    strategyReturn,
  };
}

