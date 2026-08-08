/**
 * The Pitch Meeting — server actions.
 *
 * Exactly two narrow touchpoints:
 *  1. predictPitchReaction — ONE AI sentence, grounded in the exact numbers
 *     the player entered, with a full deterministic fallback. The AI may
 *     reference the module's benchmark thresholds, never invent data.
 *  2. savePitchLead — persists the lead + full deterministic journey.
 */

"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { callDeepSeek } from "@/lib/workshop/deepseek-client";
import {
  BAND_META,
  INVESTOR,
  ROUNDS,
  getModule,
  type BandKey,
  type NumericInputs,
  type RoundKey,
} from "@/lib/pitch-game/content";
import {
  buildFallbackReaction,
  computeBand,
  computeExtras,
  isValidEmail,
  parseNumericInput,
  type GameLocale,
} from "@/lib/pitch-game/logic";

const MAX_REACTION_CHARS = 220;
const MIN_REACTION_CHARS = 12;

export type ReactionRequest = {
  moduleId: string;
  inputs: NumericInputs;
  roundKey: RoundKey;
  locale?: GameLocale;
};

export type ReactionResult = {
  text: string;
  /** true when the AI produced it; false when the deterministic fallback ran. */
  fromAi: boolean;
};

function buildReactionSystemPrompt(roundKey: RoundKey, locale: GameLocale): string {
  const languageInstruction =
    locale === "zhHant"
      ? "Respond in Traditional Chinese (zh-Hant), Hong Kong business tone. Use 「」 or curly quotes sparingly; keep numbers in Arabic numerals."
      : "Respond in English, warm and direct.";
  return [
    `You are ${INVESTOR.name}, a ${INVESTOR.title.en} at ${INVESTOR.firm}. You are mid-pitch-meeting with a founder.`,
    `The meeting's mood: ${ROUNDS[roundKey].leadIn.en}`,
    languageInstruction,
    "",
    "Write EXACTLY ONE sentence (10-45 words) reacting to the founder's numbers.",
    "HARD RULES:",
    "- Use only the numbers provided in the facts block. Echo at least one of them.",
    "- You may reference benchmark thresholds given in the facts block, but never invent figures about the founder's business.",
    "- No emoji, no markdown, no quotes around the whole sentence, no preamble.",
    "- Plain, warm, direct investor voice.",
  ].join("\n");
}

function buildReactionUserPrompt(args: {
  moduleId: string;
  inputs: NumericInputs;
  band: BandKey;
  roundKey: RoundKey;
}): string {
  const module = getModule(args.moduleId);
  const facts: Record<string, string> = {};
  for (const field of module?.fields ?? []) {
    const value = args.inputs[field.key];
    facts[field.label.en] =
      value !== undefined ? String(value) : "(not provided)";
  }
  let thresholdFact: Record<string, string> = {};
  if (module && module.rule.kind === "threshold") {
    const rule = module.rule;
    thresholdFact = Object.fromEntries(
      module.fields
        .filter((f) => f.key === rule.field)
        .map((f) => [f.label, `green=${rule.green} amber=${rule.amber}`]),
    );
  }
  return [
    "FACTS BLOCK (JSON):",
    JSON.stringify(
      {
        archetype: module?.archetype,
        question: module?.question.en,
        numbers: facts,
        computedSeverity: BAND_META[args.band].label.en,
        benchmarkThresholds: thresholdFact,
      },
      null,
      2,
    ),
    "",
    "Now: your one-sentence reaction.",
  ].join("\n");
}

/** Grounding check: the AI must echo at least one digit string the user entered. */
function echoesUserNumber(text: string, inputs: NumericInputs): boolean {
  const values = Object.values(inputs)
    .filter((v) => Number.isFinite(v))
    .map((v) => String(v));
  if (values.length === 0) return true;
  return values.some((v) => text.includes(v));
}

/** zh-Hant responses must actually contain Chinese characters. */
function hasCjk(text: string): boolean {
  return /[\u3400-\u9fff]/.test(text);
}

export async function predictPitchReaction(
  args: ReactionRequest,
): Promise<ReactionResult> {
  const locale: GameLocale = args.locale ?? "en";
  const module = getModule(args.moduleId);
  const fallbackText = module
    ? buildFallbackReaction(module, computeBand(module, args.inputs), args.inputs, locale)
    : locale === "zhHant"
      ? "有趣的數字。在進一步之前，我想先深入了解當中的假設。"
      : "Interesting numbers. I'd want to dig into the assumptions before I go further.";

  if (!module) {
    return { text: fallbackText, fromAi: false };
  }

  const band = computeBand(module, args.inputs);
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return { text: fallbackText, fromAi: false };
    }
    const raw = await callDeepSeek({
      systemPrompt: buildReactionSystemPrompt(args.roundKey, locale),
      userPrompt: buildReactionUserPrompt({ ...args, band }),
    });
    const text = raw
      .trim()
      .replace(/^["'“”「」]+|["'“”「」]+$/g, "")
      .trim();
    const valid =
      text.length >= MIN_REACTION_CHARS &&
      text.length <= MAX_REACTION_CHARS &&
      echoesUserNumber(text, args.inputs) &&
      (locale === "zhHant" ? hasCjk(text) : true);
    return { text: valid ? text : fallbackText, fromAi: valid };
  } catch (error) {
    console.warn(
      `[pitch-game] reaction AI failed (${error instanceof Error ? error.message : "unknown"}); using deterministic fallback`,
    );
    return { text: fallbackText, fromAi: false };
  }
}

export type JourneySnapshot = {
  moduleId: string;
  archetype: string;
  metric: string;
  roundKey: RoundKey;
  inputs: NumericInputs;
  band: BandKey;
  posture: string;
  reaction: string;
  condition: string;
  automationFix: string;
};

export type LeadPayload = {
  name: string;
  email: string;
  phone: string;
  company: string;
  concern?: string;
  journey: JourneySnapshot;
};

export type LeadResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function savePitchLead(payload: LeadPayload): Promise<LeadResult> {
  const name = payload.name.trim();
  const email = payload.email.trim();
  const phone = payload.phone.trim();
  const company = payload.company.trim();
  const concern = payload.concern?.trim() || null;

  if (name.length < 2) {
    return { ok: false, error: "Please tell us your name." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "That work email doesn't look right." };
  }
  if (phone.length < 6) {
    return { ok: false, error: "We need a phone number to reach you." };
  }
  if (company.length < 2) {
    return { ok: false, error: "What's your company called?" };
  }

  try {
    const created = await prisma.pitchMeetingLead.create({
      data: {
        name,
        email,
        phone,
        company,
        concern,
        journeyJson: payload.journey as unknown as Prisma.InputJsonValue,
      },
    });
    return { ok: true, id: created.id };
  } catch (error) {
    console.error(
      `[pitch-game] lead save failed (${error instanceof Error ? error.message : "unknown"})`,
    );
    return { ok: false, error: "Couldn't save your details — please try again." };
  }
}

// Re-export so the client can use the same parsing the game uses.
export { parseNumericInput };
