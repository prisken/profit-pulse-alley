/**
 * Workshop Pyramid Lab wizard step order.
 * riskquiz and crisis stay separate so the step-dot indicator stays accurate.
 * Display labels come from workshop.steps.labels.* in the i18n catalog.
 */

import type { MessageKey } from "@/lib/i18n/messages";

export type WizardStep =
  | "intake"
  | "pyramid"
  | "expenses"
  | "stresstest"
  | "riskquiz"
  | "crisis"
  | "summary"
  | "capture";

export const WIZARD_STEPS: readonly WizardStep[] = [
  "intake",
  "pyramid",
  "expenses",
  "stresstest",
  "riskquiz",
  "crisis",
  "summary",
  "capture",
] as const;

export const TOTAL_STEPS = WIZARD_STEPS.length;

export const WIZARD_STEP_LABEL_KEYS: Record<WizardStep, MessageKey> = {
  intake: "workshop.steps.labels.intake",
  pyramid: "workshop.steps.labels.pyramid",
  expenses: "workshop.steps.labels.expenses",
  stresstest: "workshop.steps.labels.stresstest",
  riskquiz: "workshop.steps.labels.riskquiz",
  crisis: "workshop.steps.labels.crisis",
  summary: "workshop.steps.labels.summary",
  capture: "workshop.steps.labels.capture",
};
