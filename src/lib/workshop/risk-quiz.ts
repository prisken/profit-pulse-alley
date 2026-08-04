/**
 * Pure 5-question risk quiz for Workshop Pyramid Lab.
 * No AI — deterministic scoring only.
 * Display copy lives in the workshop i18n catalog (promptKey / labelKey).
 */

import type { MessageKey } from "@/lib/i18n/messages";
import type { RiskProfile, RiskQuizAnswer } from "@/lib/workshop/types";

export type RiskQuizChoiceId = "a" | "b" | "c";

export type RiskQuizChoice = {
  id: RiskQuizChoiceId;
  labelKey: MessageKey;
  /** Lucide icon name for the tappable card. */
  icon: string;
  /** Weighted points toward aggressive (higher = more aggressive). */
  points: number;
};

export type RiskQuizQuestion = {
  id: string;
  promptKey: MessageKey;
  /** Lucide icon name for the question header. */
  icon: string;
  choices: [RiskQuizChoice, RiskQuizChoice, RiskQuizChoice];
};

/**
 * Five workshop risk questions. Choice points are tuned so:
 * - a ≈ conservative, b ≈ balanced, c ≈ aggressive
 * - max raw sum = 10 → normalize to 0–100
 */
export const RISK_QUIZ_QUESTIONS: readonly RiskQuizQuestion[] = [
  {
    id: "windfall",
    promptKey: "workshop.riskQuiz.questions.q1.text",
    icon: "Banknote",
    choices: [
      {
        id: "a",
        labelKey: "workshop.riskQuiz.questions.q1.choiceA",
        icon: "PiggyBank",
        points: 0,
      },
      {
        id: "b",
        labelKey: "workshop.riskQuiz.questions.q1.choiceB",
        icon: "Scale",
        points: 1,
      },
      {
        id: "c",
        labelKey: "workshop.riskQuiz.questions.q1.choiceC",
        icon: "TrendingUp",
        points: 2,
      },
    ],
  },
  {
    id: "market_drop",
    promptKey: "workshop.riskQuiz.questions.q2.text",
    icon: "ChartCandlestick",
    choices: [
      {
        id: "a",
        labelKey: "workshop.riskQuiz.questions.q2.choiceA",
        icon: "ShieldOff",
        points: 0,
      },
      {
        id: "b",
        labelKey: "workshop.riskQuiz.questions.q2.choiceB",
        icon: "Pause",
        points: 1,
      },
      {
        id: "c",
        labelKey: "workshop.riskQuiz.questions.q2.choiceC",
        icon: "Rocket",
        points: 2,
      },
    ],
  },
  {
    id: "job_type",
    promptKey: "workshop.riskQuiz.questions.q3.text",
    icon: "Briefcase",
    choices: [
      {
        id: "a",
        labelKey: "workshop.riskQuiz.questions.q3.choiceA",
        icon: "Building2",
        points: 0,
      },
      {
        id: "b",
        labelKey: "workshop.riskQuiz.questions.q3.choiceB",
        icon: "BadgePercent",
        points: 1,
      },
      {
        id: "c",
        labelKey: "workshop.riskQuiz.questions.q3.choiceC",
        icon: "Zap",
        points: 2,
      },
    ],
  },
  {
    id: "dependents",
    promptKey: "workshop.riskQuiz.questions.q4.text",
    icon: "Users",
    choices: [
      {
        id: "a",
        labelKey: "workshop.riskQuiz.questions.q4.choiceA",
        icon: "HeartHandshake",
        points: 0,
      },
      {
        id: "b",
        labelKey: "workshop.riskQuiz.questions.q4.choiceB",
        icon: "UsersRound",
        points: 1,
      },
      {
        id: "c",
        labelKey: "workshop.riskQuiz.questions.q4.choiceC",
        icon: "User",
        points: 2,
      },
    ],
  },
  {
    id: "emergency_feel",
    promptKey: "workshop.riskQuiz.questions.q5.text",
    icon: "LifeBuoy",
    choices: [
      {
        id: "a",
        labelKey: "workshop.riskQuiz.questions.q5.choiceA",
        icon: "CloudLightning",
        points: 0,
      },
      {
        id: "b",
        labelKey: "workshop.riskQuiz.questions.q5.choiceB",
        icon: "CloudSun",
        points: 1,
      },
      {
        id: "c",
        labelKey: "workshop.riskQuiz.questions.q5.choiceC",
        icon: "Sun",
        points: 2,
      },
    ],
  },
] as const;

const MAX_RAW_POINTS = RISK_QUIZ_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.choices.map((c) => c.points)),
  0,
);

function bandProfile(score: number): RiskProfile {
  if (score <= 40) {
    return "conservative";
  }
  if (score <= 70) {
    return "balanced";
  }
  return "aggressive";
}

/**
 * Sums weighted choice points, normalizes to 0–100, bands into RiskProfile.
 * Profile is an enum key — display labels come from workshop.riskProfile.labels.*.
 */
export function computeRiskProfile(
  answers: RiskQuizAnswer[],
): { score: number; profile: RiskProfile } {
  if (!Array.isArray(answers) || answers.length !== RISK_QUIZ_QUESTIONS.length) {
    throw new Error(
      `Risk quiz requires exactly ${RISK_QUIZ_QUESTIONS.length} answers.`,
    );
  }

  let raw = 0;

  for (const question of RISK_QUIZ_QUESTIONS) {
    const answer = answers.find((a) => a.questionId === question.id);
    if (!answer) {
      throw new Error(`Missing answer for question "${question.id}".`);
    }
    const choice = question.choices.find((c) => c.id === answer.choice);
    if (!choice) {
      throw new Error(
        `Invalid choice "${answer.choice}" for question "${question.id}".`,
      );
    }
    raw += choice.points;
  }

  const score = Math.round((raw / MAX_RAW_POINTS) * 100);
  return {
    score,
    profile: bandProfile(score),
  };
}
