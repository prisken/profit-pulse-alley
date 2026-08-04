/**
 * Shared instruction for DeepSeek narrative JSON: dual-language user-facing fields.
 * Append to system prompts that return rationale / notes / titles / etc.
 * Do NOT use for structural guesses with no end-user prose (e.g. expense amounts).
 */

export const BILINGUAL_JSON_INSTRUCTION = `
For every text field that is meant for the end user (rationale, notes, titles, descriptions, reasoning, headlines, goal labels), return BOTH an English and a Traditional Chinese (繁體中文) version as an object: { "en": "...", "zhHant": "..." }.

Hard rules:
- NEVER return a plain string for those fields — always the object shape.
- NEVER omit "zhHant" or "en"; both must be non-empty.
- NEVER copy the English string into zhHant unchanged — write natural Hong Kong Traditional Chinese.
- Both versions must describe the exact same facts, numbers, and scenario — only language and natural phrasing differ.
- Apply the requested tone consistently in BOTH languages.
`.trim();

/** Append bilingual JSON field rules to a DeepSeek system prompt. */
export function withBilingualJsonInstruction(systemPrompt: string): string {
  return `${systemPrompt.trim()}\n\n${BILINGUAL_JSON_INSTRUCTION}`;
}
