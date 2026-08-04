import type { WorkshopTone } from "./types";

/**
 * Tone option ids + icons only. Display labels/descriptions come from
 * workshop.tone.options.*.{label,description} in the i18n catalog.
 */
export const WORKSHOP_TONES: Array<{
  id: WorkshopTone;
  icon: string;
}> = [
  { id: "fun", icon: "Gamepad2" },
  { id: "professional", icon: "BriefcaseBusiness" },
  { id: "simple", icon: "Lightbulb" },
  { id: "direct", icon: "Zap" },
  { id: "warm", icon: "HeartHandshake" },
];

/**
 * Strict textual directives injected into DeepSeek system prompts.
 * English only — not user-facing UI copy.
 */
const TONE_INSTRUCTIONS: Record<WorkshopTone, string> = {
  fun: "Inject high energy and playful gaming/adventure metaphors. Use 3 to 5 relevant emojis throughout the text.",
  professional:
    "Use advisor-grade financial terminology. Strictly ZERO emojis. Clean, structured prose.",
  simple:
    "Use 5th-grade plain language and simple real-world analogies. Maximum 1 emoji.",
  direct:
    "Be blunt and urgent. Use UPPERCASE for critical risks and numbers (e.g., 'CRITICAL GAP', 'IMMEDIATE ACTION'). Zero fluff.",
  warm: "Be empathetic and encouraging. Include 2 to 3 warm/supportive emojis (e.g., ❤️, ✨, 🤗, 🌱).",
};

export type WorkshopToneUiTheme = {
  badgeClass: string;
  cardAccentClass: string;
  headingStyle: string;
  iconEmoji: string;
};

/**
 * ProjectionLab-inspired Tailwind tokens for tone-tinted workshop chrome.
 * Consumed by client UI — keep classes static strings for Tailwind scanning.
 */
const TONE_UI_THEMES: Record<WorkshopTone, WorkshopToneUiTheme> = {
  fun: {
    badgeClass:
      "rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-violet-500/30",
    cardAccentClass:
      "border-violet-300/70 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]",
    headingStyle:
      "bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text font-semibold tracking-tight text-transparent",
    iconEmoji: "🎮",
  },
  professional: {
    badgeClass:
      "rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium tracking-wide text-slate-800",
    cardAccentClass:
      "border-slate-300 bg-white shadow-[inset_0_0_0_1px_rgba(30,41,59,0.06)]",
    headingStyle:
      "font-semibold tracking-tight text-slate-900 [font-feature-settings:'tnum']",
    iconEmoji: "📊",
  },
  simple: {
    badgeClass:
      "rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800",
    cardAccentClass: "border-sky-200 bg-sky-50/80",
    headingStyle: "rounded-sm font-medium tracking-normal text-sky-950",
    iconEmoji: "✏️",
  },
  direct: {
    badgeClass:
      "rounded-sm border-2 border-rose-500 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700",
    cardAccentClass:
      "border-2 border-rose-400 bg-amber-50/90 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]",
    headingStyle:
      "font-bold uppercase tracking-wider text-rose-800",
    iconEmoji: "⚡",
  },
  warm: {
    badgeClass:
      "rounded-full bg-gradient-to-r from-rose-100 to-orange-100 px-3 py-1 text-xs font-medium text-rose-800 shadow-sm shadow-rose-200/60",
    cardAccentClass:
      "border-rose-200/80 bg-gradient-to-br from-rose-50 via-orange-50/70 to-amber-50 shadow-[0_8px_24px_-12px_rgba(251,113,133,0.35)]",
    headingStyle: "font-semibold tracking-tight text-rose-900",
    iconEmoji: "🤗",
  },
};

/**
 * One strongly worded directive that forces clearly distinct LLM output per tone.
 */
export function getToneInstruction(tone: WorkshopTone): string {
  return TONE_INSTRUCTIONS[tone];
}

/** Visual theme tokens for tone-aware workshop UI surfaces. */
export function getToneUiTheme(tone: WorkshopTone): WorkshopToneUiTheme {
  return TONE_UI_THEMES[tone];
}
