/**
 * Workshop Pyramid Lab wizard step order (7 steps).
 * Crisis is no longer a standalone screen — shock math lives in
 * `crisis-stress-test.ts` for Summary to consume in a follow-up.
 * Display labels come from workshop.steps.labels.* in the i18n catalog.
 */

import type { MessageKey } from "@/lib/i18n/messages";

export type WizardStep =
  | "intake"
  | "pyramid"
  | "expenses"
  | "stresstest"
  | "riskquiz"
  | "summary"
  | "capture";

export const WIZARD_STEPS: readonly WizardStep[] = [
  "intake",
  "pyramid",
  "expenses",
  "stresstest",
  "riskquiz",
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
  summary: "workshop.steps.labels.summary",
  capture: "workshop.steps.labels.capture",
};
