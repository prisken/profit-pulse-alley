/**
 * Deterministic Action Goal reasoning when DeepSeek fails validation.
 * Pure TypeScript — no AI, no randomness, tone-neutral.
 *
 * v5.3: templates are (leverType × category) aware, SHORT (≤ ~40 words EN),
 * grounded in the user's actual journey decisions, and surface the
 * late-goal / heavy-monthly-commitment stress signal. HK texture: VHIS, MPF,
 * first-home down payments.
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

export type GoalOutlookSeed = ActionGoalsDecisionsPayload["goalOutlooks"][number];

/**
 * Decisions payload for fallback templates. Mirrors the curated AI block but
 * allows nullish stress / post-journey fields so missing data falls through
 * gracefully without crashing.
 */
export type DecisionsPayload = {
  goalsApplied: ActionGoalsDecisionsPayload["goalsApplied"];
  goalsGivenUp: ActionGoalsDecisionsPayload["goalsGivenUp"];
  goalOutlooks?: ActionGoalsDecisionsPayload["goalOutlooks"];
  squeezesAccepted: ActionGoalsDecisionsPayload["squeezesAccepted"];
  squeezesRejected: ActionGoalsDecisionsPayload["squeezesRejected"];
  dataGaps?: ActionGoalsDecisionsPayload["dataGaps"];
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

/**
 * The first applied goal that is late or needs a heavy share of the monthly
 * surplus — the "retirement fund only lands at 69 and needs saving every
 * single month" signal. Returns a short bilingual callout or null.
 */
function goalStressCallout(decisions: DecisionsPayload): Bilingual | null {
  const stressed = (decisions.goalOutlooks ?? []).find(
    (row) => row.late || row.heavyMonthlyCommitment,
  );
  if (!stressed) {
    return null;
  }
  const name = stressed.name.trim();
  if (stressed.attainedAge == null) {
    // Never reached by 90 — the worst signal.
    return {
      en: `${name} is never reached by age 90 on this plan, needing ${formatCompactHkd(stressed.requiredExtraMonthlyHKD)}/mo extra to stand a chance. Make the target realistic.`,
      zhHant: `「${name}」在目前計劃下到 90 歲也無法達成，要如期達標每月需額外 ${formatCompactHkd(stressed.requiredExtraMonthlyHKD)}。請設定切實的目標。`,
    };
  }
  if (stressed.late && stressed.delayYears != null) {
    return {
      en: `${name} only lands at age ${stressed.attainedAge} — ${formatPts(stressed.delayYears)} ${stressed.delayYears === 1 ? "year" : "years"} late. Make the target realistic or free up ${formatCompactHkd(stressed.requiredExtraMonthlyHKD)}/mo.`,
      zhHant: `「${name}」要 ${stressed.attainedAge} 歲才達成，遲 ${formatPts(stressed.delayYears)} 年。請調整目標或每月多騰出 ${formatCompactHkd(stressed.requiredExtraMonthlyHKD)}。`,
    };
  }
  if (stressed.heavyMonthlyCommitment && stressed.requiredExtraMonthlyHKD > 0) {
    const share =
      stressed.effortRatio == null
        ? ""
        : ` — that is ${formatPts(Math.round(stressed.effortRatio * 100))}% of your monthly surplus`;
    return {
      en: `${name} needs ${formatCompactHkd(stressed.requiredExtraMonthlyHKD)}/mo extra to hit on time${share}. Set a realistic target before locking the plan.`,
      zhHant: `「${name}」要如期達成，每月需額外 ${formatCompactHkd(stressed.requiredExtraMonthlyHKD)}${stressed.effortRatio == null ? "" : `，佔每月盈餘約 ${formatPts(Math.round(stressed.effortRatio * 100))}%`}。請先設定切實的目標再鎖定計劃。`,
    };
  }
  return null;
}

/** Age label for the runway hero (null = sustained past 90). */
function runwayLabel(age: number | null): Bilingual {
  if (age == null) {
    return { en: "past 90", zhHant: "90 歲之後" };
  }
  return { en: `age ${age}`, zhHant: `${age} 歲` };
}

/**
 * v5.4: if a relevant input is missing/zero, append a short "tell us the real
 * value" sentence (deterministic fallback for the AI refine note).
 */
function refineNote(
  category: ActionGoal["category"],
  decisions: DecisionsPayload,
): Bilingual | null {
  const gaps = decisions.dataGaps ?? [];
  const keyByCategory: Record<ActionGoal["category"], string[]> = {
    protection: ["medicalCoverage", "criticalIllness"],
    savings: ["emergencyFund", "expenses"],
    investment: ["lumpSum", "riskQuiz"],
    goal: ["goals"],
  };
  const gap = gaps.find((row) =>
    keyByCategory[category].includes(row.key),
  );
  if (!gap) {
    return null;
  }
  const labelEn = gap.label.en.trim();
  const labelZh = gap.label.zhHant.trim();
  return {
    en: `Tell us your actual ${labelEn} for a precise figure.`,
    zhHant: `請告訴我們你實際的${labelZh}，才能給你準確數字。`,
  };
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
/* Content builders (category-specific, short)                         */
/* ------------------------------------------------------------------ */

function protectionContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "Set the policy up this week:", zhHant: "本週投保：" },
    structural: { en: "Set it up once:", zhHant: "一次過設定：" },
    behavioral: { en: "Keep your cover current:", zhHant: "定期檢視保障：" },
  };

  const gapInfo = stressGap(decisions);
  if (gapInfo) {
    const delayLine =
      gapInfo.affectedGoal && gapInfo.delayYears != null
        ? {
            en: ` This stops your ${gapInfo.affectedGoal} goal slipping ${formatPts(gapInfo.delayYears)} ${gapInfo.delayYears === 1 ? "year" : "years"}.`,
            zhHant: ` 這可避免「${gapInfo.affectedGoal}」目標延遲 ${formatPts(gapInfo.delayYears)} 年。`,
          }
        : { en: "", zhHant: "" };
    return {
      en: `${framingLine[framing].en} the stress test found a ${gapInfo.amount} ${gapInfo.scenario.en} gap. A VHIS plan (up to HK$8,000/yr tax deduction per person) closes most of it.${delayLine.en}`,
      zhHant: `${framingLine[framing].zhHant}壓力測試發現 ${gapInfo.amount} 的${gapInfo.scenario.zhHant}缺口。自願醫保（每人每年最多扣稅 HK$8,000）可補上大部分。${delayLine.zhHant}`,
    };
  }

  const gapAmount = isPresentNumber(goal.gap) ? goal.gap : null;
  if (gapAmount == null) {
    return null;
  }
  return {
    en: `${framingLine[framing].en} your protection gap is ${formatCompactHkd(gapAmount)}. CI cover of a few times annual income is the HK standard — review it once, then forget it.`,
    zhHant: `${framingLine[framing].zhHant}你的保障缺口約 ${formatCompactHkd(gapAmount)}。香港一般以年收入數倍的危疾保障為基準——檢視一次即可。`,
  };
}

function savingsContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const months = decisions.postJourneyState.emergencyFundMonthsRemaining;
  const cutMonthly = acceptedSqueezeMonthly(decisions);
  const surplus = decisions.postJourneyState.remainingMonthlySurplus;

  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "This week:", zhHant: "本週：" },
    structural: { en: "Set up an auto-transfer once:", zhHant: "一次過設定自動轉賬：" },
    behavioral: { en: "Make it a standing habit:", zhHant: "把它變成恆常習慣：" },
  };

  if (isPresentNumber(months) && months < 3) {
    const cutLine =
      cutMonthly > 0
        ? {
            en: ` You already freed ${formatCompactHkd(cutMonthly)}/mo from discretionary.`,
            zhHant: ` 你已從可選開支每月騰出 ${formatCompactHkd(cutMonthly)}。`,
          }
        : { en: "", zhHant: "" };
    return {
      en: `${framingLine[framing].en} your runway is ${formatMonths(months)} months — thin for HK.${cutLine.en} Move it into emergency cash; target 3–6 months.`,
      zhHant: `${framingLine[framing].zhHant}你的應急跑道只剩 ${formatMonths(months)} 個月——對香港生活來說偏薄。${cutLine.zhHant}把它撥入應急現金，目標 3–6 個月。`,
    };
  }

  if (isPresentNumber(months)) {
    return {
      en: `${framingLine[framing].en} take your runway from ${formatMonths(months)} months toward 3–6 months — it protects every other choice in your plan.`,
      zhHant: `${framingLine[framing].zhHant}把應急跑道由 ${formatMonths(months)} 個月推近 3–6 個月——這能保護計劃中的其他決定。`,
    };
  }

  if (isPresentNumber(surplus) && surplus > 0) {
    return {
      en: `${framingLine[framing].en} route ${formatCompactHkd(surplus)}/mo of surplus into emergency cash — a 3–6 month buffer is the cheapest income-gap insurance in HK.`,
      zhHant: `${framingLine[framing].zhHant}把每月盈餘中的 ${formatCompactHkd(surplus)} 撥入應急現金——3–6 個月的緩衝是應對收入空窗最便宜的保險。`,
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

  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "This week:", zhHant: "本週：" },
    structural: { en: "Set up a standing rule once:", zhHant: "一次過設定恆常規則：" },
    behavioral: { en: "Make it automatic monthly:", zhHant: "每月自動執行：" },
  };

  if (isPresentNumber(surplus) && surplus > 0) {
    return {
      en: `${framingLine[framing].en} you have ${formatCompactHkd(surplus)}/mo idle. A payday auto-transfer or voluntary MPF contribution, sized to your ${profile} profile, puts it to work.`,
      zhHant: `${framingLine[framing].zhHant}你每月有 ${formatCompactHkd(surplus)} 盈餘閒置。按你的「${profile}」取向設定出糧日自動轉賬或自願性強積金供款，讓它開始增值。`,
    };
  }

  return null;
}

function goalContent(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const framingLine: Record<typeof framing, Bilingual> = {
    instant: { en: "This week:", zhHant: "本週：" },
    structural: { en: "Lock the plan in once:", zhHant: "一次過鎖定計劃：" },
    behavioral: { en: "Keep it on track monthly:", zhHant: "每月保持進度：" },
  };

  const stressed = goalStressCallout(decisions);
  if (stressed) {
    return {
      en: `${framingLine[framing].en} ${stressed.en} Your target ages are the plan's weakest link — fix them first.`,
      zhHant: `${framingLine[framing].zhHant} ${stressed.zhHant} 目標年齡是計劃最弱的一環——先處理它。`,
    };
  }

  const applied = decisions.goalsApplied[0];
  if (isPresentString(applied?.name)) {
    const name = applied!.name.trim();
    return {
      en: `${framingLine[framing].en} keeping ${name} on track compounds every other choice you made.`,
      zhHant: `${framingLine[framing].zhHant}讓「${name}」保持進度，能把其餘決定持續放大。`,
    };
  }

  const cutMonthly = acceptedSqueezeMonthly(decisions);
  if (cutMonthly > 0) {
    return {
      en: `${framingLine[framing].en} you cut discretionary by ~${formatCompactHkd(cutMonthly)}/mo to secure a goal — keep that room aimed at your next target.`,
      zhHant: `${framingLine[framing].zhHant}你為鎖定目標每月約削減 ${formatCompactHkd(cutMonthly)} 可選開支——把這空間繼續投向下一個目標。`,
    };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Lever dispatch                                                      */
/* ------------------------------------------------------------------ */

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

function leverReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
  framing: "instant" | "structural" | "behavioral",
): Bilingual | null {
  const own = (() => {
    switch (goal.category) {
      case "protection":
        return protectionContent(goal, decisions, framing);
      case "savings":
        return savingsContent(goal, decisions, framing);
      case "investment":
        return investmentContent(goal, decisions, framing);
      case "goal":
        return goalContent(goal, decisions, framing);
      default: {
        const _exhaustive: never = goal.category;
        return _exhaustive;
      }
    }
  })();
  if (own) {
    return own;
  }
  // Only the behavioral lever borrows another category's grounded content
  // ("the habit that moves the plan" fits any real journey fact).
  if (framing === "behavioral") {
    return firstGrounded(goal, decisions, framing);
  }
  return null;
}

/**
 * Build bilingual fallback reasoning for one ranked intervention.
 * Picks the lever-type template; appends a refine note when a relevant input
 * is missing; falls back to a category generic.
 */
export function buildFallbackReasoning(
  goal: RankedIntervention,
  decisions: DecisionsPayload,
): Bilingual {
  const primary = leverReasoning(goal, decisions, goal.leverType);
  const base =
    primary ?? withPts(genericReasoning(goal.category), goal.impactPoints);
  const refine = refineNote(goal.category, decisions);
  if (!refine) {
    return base;
  }
  return {
    en: `${base.en} ${refine.en}`,
    zhHant: `${base.zhHant} ${refine.zhHant}`,
  };
}

function genericReasoning(
  category: ActionGoal["category"],
): Bilingual {
  const generic: Record<ActionGoal["category"], Bilingual> = {
    protection: {
      en: "Strengthening your protection layer is the clearest next improvement on this plan.",
      zhHant: "加強保障層是目前計劃最明確的下一步改善。",
    },
    savings: {
      en: "Rebuilding emergency cash is the clearest next improvement on this plan.",
      zhHant: "重建應急現金是目前計劃最明確的下一步改善。",
    },
    investment: {
      en: "Putting idle capacity into long-term growth is the clearest next improvement on this plan.",
      zhHant: "把閒置空間投入長期增長，是目前計劃最明確的下一步改善。",
    },
    goal: {
      en: "Keeping your priority goals on track is the clearest next improvement on this plan.",
      zhHant: "讓優先目標保持進度，是目前計劃最明確的下一步改善。",
    },
  };
  return generic[category];
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
