/**
 * Deterministic Action Goal reasoning when DeepSeek fails validation.
 * Pure TypeScript — no AI, no randomness, tone-neutral.
 *
 * v5.2: templates are (leverType × category) aware — the seed category is
 * gap-driven, so any lever may land on any category. Content stays grounded in
 * the user's actual journey decisions and uses authentic Hong Kong texture
 * (VHIS, MPF, first-home down payments).
 */

import type { ActionGoalsDecisionsPayload } from "@/lib/workshop/action-goals-decisions";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import type { ActionGoal, Bilingual } from "@/lib/workshop/types";

export type RankedIntervention = {
  rank: number;
  category: ActionGoal["category"];
  leverType: ActionGoal["leverType"];
  icon: string;
  impactPoints: number;
  /** Rating gap (0–100) used when penetrationAmount is unavailable. */
  gap?: number;
  currentScore?: number;
};

/**
 * Decisions payload for fallback templates. Mirrors the curated AI block but
 * allows nullish stress / post-journey fields so missing data falls through
 * gracefully without crashing.
 */
export type DecisionsPayload = {
  goalsApplied: ActionGoalsDecisionsPayload["goalsApplied"];
  goalsGivenUp: ActionGoalsDecisionsPayload["goalsGivenUp"];
  squeezesAccepted: ActionGoalsDecisionsPayload["squeezesAccepted"];
  squeezesRejected: ActionGoalsDecisionsPayload["squeezesRejected"];
  postJourneyState: {
    remainingMonthlySurplus: number | null;
    emergencyFundMonthsRemaining: number | null;
    investmentBalanceRemaining: number | null;
  };
  crisisStressTest?: {
    scenario: string;
    verdict: string;
    penetrationAmount: number | null;
    affectedGoal: string | null;
    delayYears: number | null;
  } | null;
  riskQuizProfile: ActionGoalsDecisionsPayload["riskQuizProfile"] | null;
  profileBehaviorMismatch: boolean;
  runway?: {
    beforeAge: number | null;
    afterAge: number | null;
  } | null;
};

const SCENARIO_LABELS: Record<string, Bilingual> = {
  medical: { en: "medical crisis", zhHant: "醫療危機" },
  critical_illness: { en: "critical illness", zhHant: "危疾" },
  job_loss: { en: "income loss", zhHant: "收入中斷" },
  market_crash: { en: "market drawdown", zhHant: "市場急挫" },
  accident: { en: "accident", zhHant: "意外" },
};

function formatPts(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value.toLocaleString("en-HK", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function formatMonths(value: number): string {
  return value.toLocaleString("en-HK", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function scenarioLabel(scenario: string): Bilingual {
  return (
    SCENARIO_LABELS[scenario] ?? {
      en: scenario.replace(/_/g, " "),
      zhHant: scenario.replace(/_/g, " "),
    }
  );
}

function isPresentNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPresentString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Total monthly discretionary cut across accepted squeezes (HKD). */
function acceptedSqueezeMonthly(decisions: DecisionsPayload): number {
  return decisions.squeezesAccepted.reduce((sum, row) => {
    if (row.category === "discretionary") {
      return sum + Math.max(0, row.monthlyAmount);
    }
    return sum;
  }, 0);
}

/** Age label for the runway hero (null = sustained past 90). */
function runwayLabel(age: number | null): Bilingual {
  if (age == null) {
    return { en: "past 90", zhHant: "90 歲之後" };
  }
  return { en: `age ${age}`, zhHant: `${age} 歲` };
}

function withPts(template: Bilingual, impactPoints: number): Bilingual {
  const pts = formatPts(impactPoints);
  return {
    en: template.en.replaceAll("{impactPoints}", pts),
    zhHant: template.zhHant.replaceAll("{impactPoints}", pts),
  };
}

function stressGap(
  decisions: DecisionsPayload,
): {
  scenario: Bilingual;
  amount: string;
  affectedGoal: string | null;
  delayYears: number | null;
} | null {
  const stress = decisions.crisisStressTest;
  if (
    stress?.verdict === "PENETRATED" &&
    isPresentNumber(stress.penetrationAmount)
  ) {
    return {
      scenario: scenarioLabel(stress.scenario),
      amount: formatCompactHkd(stress.penetrationAmount),
      affectedGoal: isPresentString(stress.affectedGoal)
        ? stress.affectedGoal.trim()
        : null,
      delayYears: isPresentNumber(stress.delayYears) ? stress.delayYears : null,
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Content builders (category-specific)                                */
/* ------------------------------------------------------------------ */

function protectionContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const pts = formatPts(goal.impactPoints);
  const gapInfo = stressGap(decisions);
  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "Set the policy up this week —", zhHant: "本週投保——" },
    structural: { en: "Set it up once —", zhHant: "一次過設定——" },
    behavioral: { en: "Review and keep your cover current —", zhHant: "定期檢視並維持保障——" },
  };

  if (gapInfo) {
    const delayLine =
      gapInfo.affectedGoal && gapInfo.delayYears != null
        ? {
            en: ` This is what stops your ${gapInfo.affectedGoal} goal from being delayed by ${formatPts(gapInfo.delayYears)} years.`,
            zhHant: ` 這正是避免你的「${gapInfo.affectedGoal}」目標延遲 ${formatPts(gapInfo.delayYears)} 年的關鍵。`,
          }
        : { en: "", zhHant: "" };
    return {
      en: `${framingLine[framing].en} our stress test simulated a ${gapInfo.scenario.en} and found a ${gapInfo.amount} gap. A VHIS-qualified plan (premiums can be tax-deductible up to HK$8,000 per person per year) closes the worst of it.${delayLine.en} Estimated rating impact: +${pts} pts.`,
      zhHant: `${framingLine[framing].zhHant}壓力測試模擬了${gapInfo.scenario.zhHant}，發現 ${gapInfo.amount} 的缺口。合資格自願醫保計劃（保費每年每人最多可扣稅 HK$8,000）可補上最大部分。${delayLine.zhHant}估計評分影響：+${pts} 分。`,
    };
  }

  const gapAmount = isPresentNumber(goal.gap) ? goal.gap : null;
  if (gapAmount == null) {
    return null;
  }
  const amount = formatCompactHkd(gapAmount);
  return {
    en: `${framingLine[framing].en} your protection layer has a measurable gap of ${amount}. In HK, critical-illness cover of a few times annual income is the standard layer to set once and keep. Estimated rating impact: +${pts} pts.`,
    zhHant: `${framingLine[framing].zhHant}你的保障層有可量度的缺口 ${amount}。在香港，危疾保障一般以年收入的數倍為基準，設定一次即可長期有效。估計評分影響：+${pts} 分。`,
  };
}

function savingsContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const months = decisions.postJourneyState.emergencyFundMonthsRemaining;
  const cutMonthly = acceptedSqueezeMonthly(decisions);
  const pts = formatPts(goal.impactPoints);
  const surplus = decisions.postJourneyState.remainingMonthlySurplus;

  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "Do this this week —", zhHant: "請本週完成——" },
    structural: { en: "Set it up once —", zhHant: "一次過設定——" },
    behavioral: { en: "Make it a monthly habit —", zhHant: "把它變成每月習慣——" },
  };

  if (isPresentNumber(months)) {
    const monthsLabel = formatMonths(months);
    if (months < 3) {
      const cutLine =
        cutMonthly > 0
          ? {
              en: ` You already freed ${formatCompactHkd(cutMonthly)}/mo by cutting discretionary — move that into emergency cash.`,
              zhHant: ` 你已透過削減可選開支每月騰出 ${formatCompactHkd(cutMonthly)}——把它撥入應急現金。`,
            }
          : { en: "", zhHant: "" };
      return {
        en: `${framingLine[framing].en} your emergency runway is about ${monthsLabel} months — thin for Hong Kong living costs.${cutLine.en} Target 3–6 months of expenses as your shock absorber. Estimated rating impact: +${pts} pts.`,
        zhHant: `${framingLine[framing].zhHant}你的應急跑道只剩約 ${monthsLabel} 個月——以香港的生活開支來說偏薄。${cutLine.zhHant}目標是儲備 3–6 個月開支作為緩衝。估計評分影響：+${pts} 分。`,
      };
    }
    return {
      en: `${framingLine[framing].en} extend your emergency runway from ${monthsLabel} months toward the 3–6 month HK benchmark — it protects every other decision in your plan. Estimated rating impact: +${pts} pts.`,
      zhHant: `${framingLine[framing].zhHant}把應急跑道由 ${monthsLabel} 個月延伸至香港常見的 3–6 個月基準——這能保護計劃中的每一項決定。估計評分影響：+${pts} 分。`,
    };
  }

  if (isPresentNumber(surplus) && surplus > 0) {
    return {
      en: `${framingLine[framing].en} route ${formatCompactHkd(surplus)} of your monthly surplus into emergency cash — a 3–6 month buffer is the cheapest insurance against an income gap in HK. Estimated rating impact: +${pts} pts.`,
      zhHant: `${framingLine[framing].zhHant}把每月盈餘中的 ${formatCompactHkd(surplus)} 撥入應急現金——3–6 個月的緩衝，是應對收入空窗最便宜的保險。估計評分影響：+${pts} 分。`,
    };
  }

  return null;
}

function investmentContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const surplus = decisions.postJourneyState.remainingMonthlySurplus;
  const profile = decisions.riskQuizProfile;
  const pts = formatPts(goal.impactPoints);

  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "Move it this week —", zhHant: "本週行動——" },
    structural: { en: "Set up a standing rule once —", zhHant: "一次過設定恆常規則——" },
    behavioral: { en: "Make it automatic every month —", zhHant: "每月自動執行——" },
  };

  if (isPresentNumber(surplus) && surplus > 0) {
    return {
      en: `${framingLine[framing].en} you have ${formatCompactHkd(surplus)} of monthly surplus not yet working for you. A standing rule — for example a voluntary MPF contribution or an auto-transfer on payday — sized to your ${profile} profile keeps long-term targets on track. Estimated rating impact: +${pts} pts.`,
      zhHant: `${framingLine[framing].zhHant}你每月尚有 ${formatCompactHkd(surplus)} 盈餘未投入運用。設立一條恆常規則——例如自願性強積金供款或出糧日的自動轉賬——按你的「${profile}」取向設定，有助長期目標保持進度。估計評分影響：+${pts} 分。`,
    };
  }

  return null;
}

function goalContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const applied = decisions.goalsApplied[0];
  const pts = formatPts(goal.impactPoints);

  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "Fund it this week —", zhHant: "本週注資——" },
    structural: { en: "Lock the plan in once —", zhHant: "一次過鎖定計劃——" },
    behavioral: { en: "Keep it on track every month —", zhHant: "每月保持進度——" },
  };

  const runway = decisions.runway;
  const runwayLine =
    runway &&
    isPresentNumber(runway.beforeAge) &&
    isPresentNumber(runway.afterAge) &&
    runway.afterAge !== runway.beforeAge
      ? {
          en: ` Your decisions stretched your money from ${runwayLabel(runway.beforeAge).en} to ${runwayLabel(runway.afterAge).en} — this habit keeps that.`,
          zhHant: ` 你的決定已把資金可維持年期由${runwayLabel(runway.beforeAge).zhHant}延長至${runwayLabel(runway.afterAge).zhHant}——這個習慣正是維持成果的關鍵。`,
        }
      : { en: "", zhHant: "" };

  if (isPresentString(applied?.name)) {
    const name = applied!.name.trim();
    return {
      en: `${framingLine[framing].en} after your goal journey, keeping ${name} on track is the lever that compounds every other choice you made.${runwayLine.en} Estimated rating impact: +${pts} pts.`,
      zhHant: `${framingLine[framing].zhHant}在目標旅程之後，讓「${name}」保持進度，是把其餘決定持續放大的槓桿。${runwayLine.zhHant}估計評分影響：+${pts} 分。`,
    };
  }

  const cutMonthly = acceptedSqueezeMonthly(decisions);
  if (cutMonthly > 0) {
    return {
      en: `${framingLine[framing].en} you accepted cutting discretionary by about ${formatCompactHkd(cutMonthly)}/mo to secure a goal — keep that room pointed at your next target.${runwayLine.en} Estimated rating impact: +${pts} pts.`,
      zhHant: `${framingLine[framing].zhHant}你為鎖定目標而接納每月約削減 ${formatCompactHkd(cutMonthly)} 的可選開支——把這空間繼續投向你的下一個目標。${runwayLine.zhHant}估計評分影響：+${pts} 分。`,
    };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Lever dispatch                                                      */
/* ------------------------------------------------------------------ */

/**
 * Try the lever's own category content first; if data is missing, fall back
 * to the most grounded builder available (goal → investment → savings →
 * protection) so the reasoning still cites real journey facts.
 */
function firstGrounded(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const builders = [
    () => goalContent(goal, decisions, framing),
    () => investmentContent(goal, decisions, framing),
    () => savingsContent(goal, decisions, framing),
    () => protectionContent(goal, decisions, framing),
  ];
  for (const build of builders) {
    const result = build();
    if (result) {
      return result;
    }
  }
  return null;
}

function instantReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const own = (() => {
    switch (goal.category) {
      case "protection":
        return protectionContent(goal, decisions, "instant");
      case "savings":
        return savingsContent(goal, decisions, "instant");
      case "investment":
        return investmentContent(goal, decisions, "instant");
      case "goal":
        return goalContent(goal, decisions, "instant");
      default: {
        const _exhaustive: never = goal.category;
        return _exhaustive;
      }
    }
  })();
  return own ?? firstGrounded(goal, decisions, "instant");
}

function structuralReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const own = (() => {
    switch (goal.category) {
      case "protection":
        return protectionContent(goal, decisions, "structural");
      case "savings":
        return savingsContent(goal, decisions, "structural");
      case "investment":
        return investmentContent(goal, decisions, "structural");
      case "goal":
        return goalContent(goal, decisions, "structural");
      default: {
        const _exhaustive: never = goal.category;
        return _exhaustive;
      }
    }
  })();
  return own ?? firstGrounded(goal, decisions, "structural");
}

function behavioralReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual | null {
  const own = (() => {
    switch (goal.category) {
      case "protection":
        return protectionContent(goal, decisions, "behavioral");
      case "savings":
        return savingsContent(goal, decisions, "behavioral");
      case "investment":
        return investmentContent(goal, decisions, "behavioral");
      case "goal":
        return goalContent(goal, decisions, "behavioral");
      default: {
        const _exhaustive: never = goal.category;
        return _exhaustive;
      }
    }
  })();
  return own ?? firstGrounded(goal, decisions, "behavioral");
}

/**
 * Build bilingual fallback reasoning for one ranked intervention.
 * Picks the lever-type template; falls back to a category generic.
 */
export function buildFallbackReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual {
  let primary: Bilingual | null = null;

  switch (goal.leverType) {
    case "instant":
      primary = instantReasoning(goal, decisions);
      break;
    case "structural":
      primary = structuralReasoning(goal, decisions);
      break;
    case "behavioral":
      primary = behavioralReasoning(goal, decisions);
      break;
    default: {
      const _exhaustive: never = goal.leverType;
      return _exhaustive;
    }
  }

  if (primary) {
    return primary;
  }

  const generic: Record<ActionGoal["category"], Bilingual> = {
    protection: {
      en: "Strengthening your protection layer is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
      zhHant:
        "加強保障層是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
    },
    savings: {
      en: "Rebuilding emergency cash is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
      zhHant:
        "重建應急現金是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
    },
    investment: {
      en: "Putting idle capacity into long-term growth is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
      zhHant:
        "把閒置空間投入長期增長，是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
    },
    goal: {
      en: "Keeping your priority goals on track is the clearest next improvement on this plan. Estimated rating impact: +{impactPoints} pts.",
      zhHant:
        "讓優先目標保持進度，是目前計劃最明確的下一步改善。估計評分影響：+{impactPoints} 分。",
    },
  };
  return withPts(generic[goal.category], goal.impactPoints);
}

export type ActionGoalsFallbackLogEvent = {
  event: "workshop.action_goals.fallback";
  sessionId: string;
  ranks: number[];
  categories: ActionGoal["category"][];
  reason: string;
};

/** Structured monitor log — never surfaced to the UI. */
export function logActionGoalsFallback(
  input: Omit<ActionGoalsFallbackLogEvent, "event">,
): void {
  const payload: ActionGoalsFallbackLogEvent = {
    event: "workshop.action_goals.fallback",
    sessionId: input.sessionId,
    ranks: input.ranks,
    categories: input.categories,
    reason: input.reason,
  };
  console.info(JSON.stringify(payload));
}
