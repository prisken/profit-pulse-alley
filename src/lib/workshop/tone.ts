import type { WorkshopTone } from "./types";

/**
 * Tone option ids + icons only. Display labels/descriptions come from
 * workshop.tone.options.*.{label,description} in the i18n catalog.
 */
export const WORKSHOP_TONES: Array<{
  id: WorkshopTone;
  icon: string;
}> = [
  { id: "fun", icon: "Smile" },
  { id: "professional", icon: "Briefcase" },
  { id: "simple", icon: "GraduationCap" },
  { id: "direct", icon: "Zap" },
  { id: "warm", icon: "HeartHandshake" },
];

/** English instructions for DeepSeek system prompts — not user-facing UI copy. */
const TONE_INSTRUCTIONS: Record<WorkshopTone, string> = {
  fun: "Write in a fun, metaphorical tone using playful analogies (games, sports, adventures) while staying accurate and never trivializing real financial risk.",
  professional:
    "Write in a professional, formal advisor tone: precise vocabulary, measured cadence, and institutional clarity — no slang, no jokes, no casual asides.",
  simple:
    "Write in a simple educational tone: short sentences, everyday words, and brief explanations of any necessary term — never assume finance literacy and never use jargon without a plain-language gloss.",
  direct:
    "Write in a direct, no-nonsense tone: blunt, urgent, and tough-love — lead with the hard truth, skip soft padding, and do not sugarcoat gaps or risks.",
  warm: "Write in a warm, encouraging coach tone: empathetic, supportive, and hopeful — acknowledge feelings, celebrate progress, and frame next steps as doable without minimizing real constraints.",
};

/**
 * One strongly worded sentence that forces clearly distinct LLM output per tone.
 */
export function getToneInstruction(tone: WorkshopTone): string {
  return TONE_INSTRUCTIONS[tone];
}
