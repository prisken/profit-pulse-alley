/**
 * The Pitch Meeting — deterministic logic.
 *
 * All structure, severity and branching is computed here with pure
 * functions. AI never decides anything; it only narrates facts this
 * layer has already established (see actions.ts).
 */

import {
  type BandKey,
  type BandRule,
  type FieldSpec,
  type NumericInputs,
  type PitchModule,
  type PostureKey,
} from "@/lib/pitch-game/content";

/** Game locale — mirrors the site's SiteLocale values. */
export type GameLocale = "en" | "zhHant";

export function pick<T>(bi: { en: T; zhHant: T }, locale: GameLocale): T {
  return bi[locale];
}

/** Formats one value according to the field's kind. */
export function formatValue(value: number, kind: FieldSpec["kind"]): string {
  if (kind === "usd") {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  if (kind === "pct") {
    return `${trimNumber(value)}%`;
  }
  return trimNumber(value);
}

function trimNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(/\.0$/, "");
}

function fieldKind(module: PitchModule, key: string): FieldSpec["kind"] {
  return module.fields.find((f) => f.key === key)?.kind ?? "raw";
}

/**
 * Computed extras made available to templates ({ratio} placeholders).
 */
export type ComputedExtras = {
  ratio?: number;
};

export function computeExtras(
  module: PitchModule,
  inputs: NumericInputs,
): ComputedExtras {
  if (module.rule.kind === "ratio") {
    const den = inputs[module.rule.denominator] ?? 0;
    const num = inputs[module.rule.numerator] ?? 0;
    return { ratio: den > 0 ? num / den : 0 };
  }
  return {};
}

/**
 * Deterministic severity banding.
 *
 * threshold: compare field against green/amber cutoffs (invert = lower is
 * better). ratio: numerator/denominator against green/amber multiples.
 * Optional downgrade rule drops the band by one when a secondary field
 * misses (e.g. strong close rate but too few leads).
 */
export function computeBand(
  module: PitchModule,
  inputs: NumericInputs,
): BandKey {
  const rule: BandRule = module.rule;
  let band: BandKey;

  if (rule.kind === "threshold") {
    const value = inputs[rule.field] ?? 0;
    const { green, amber, invert } = rule;
    if (invert) {
      band = value <= green ? "green" : value <= amber ? "amber" : "red";
    } else {
      band = value >= green ? "green" : value >= amber ? "amber" : "red";
    }
  } else {
    const num = inputs[rule.numerator] ?? 0;
    const den = inputs[rule.denominator] ?? 0;
    const ratio = den > 0 ? num / den : 0;
    band =
      ratio >= rule.green ? "green" : ratio >= rule.amber ? "amber" : "red";
  }

  if (module.downgrade) {
    const value = inputs[module.downgrade.field] ?? 0;
    const { below, above } = module.downgrade;
    const misses =
      (below !== undefined && value < below) ||
      (above !== undefined && value > above);
    if (misses && band !== "red") {
      band = band === "green" ? "amber" : "red";
    }
  }

  return band;
}

/** Formats a threshold value using the field's kind (for {green:x} tokens). */
function formatThreshold(
  module: PitchModule,
  value: number,
  fieldKey: string,
): string {
  const kind = fieldKind(module, fieldKey);
  if (kind === "pct") {
    return `${trimNumber(value)}%`;
  }
  if (kind === "usd") {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  return trimNumber(value);
}

/**
 * Fills a template string. Supported tokens:
 *   {fieldKey}       → the user's entered value
 *   {green:fieldKey} → the green threshold for that field
 *   {amber:fieldKey} → the amber threshold for that field
 *   {ratio}          → computed ratio (1 decimal)
 *   {green:ratio}    → the green multiple for ratio rules
 */
export function fillTemplate(
  template: string,
  module: PitchModule,
  inputs: NumericInputs,
  extras: ComputedExtras = {},
): string {
  let out = template;
  for (const field of module.fields) {
    const value = inputs[field.key] ?? 0;
    out = out.replaceAll(`{${field.key}}`, formatValue(value, field.kind));
  }
  if (module.rule.kind === "threshold") {
    const { green, amber, field } = module.rule;
    out = out.replaceAll(`{green:${field}}`, formatThreshold(module, green, field));
    out = out.replaceAll(`{amber:${field}}`, formatThreshold(module, amber, field));
  } else {
    const { green, amber } = module.rule;
    out = out.replaceAll(
      "{green:ratio}",
      trimNumber(green),
    );
    out = out.replaceAll(
      "{amber:ratio}",
      trimNumber(amber),
    );
  }
  if (extras.ratio !== undefined) {
    out = out.replaceAll("{ratio}", trimNumber(extras.ratio));
  }
  return out;
}

/**
 * Deterministic reaction — the safety net under the AI sentence. Always
 * echoes the exact numbers the player entered.
 */
export function buildFallbackReaction(
  module: PitchModule,
  band: BandKey,
  inputs: NumericInputs,
  locale: GameLocale = "en",
): string {
  const template = module.fallbacks[band][locale];
  return fillTemplate(template, module, inputs, computeExtras(module, inputs));
}

/**
 * Term-sheet condition lookup: first variant matching (band × posture)
 * wins; otherwise fall back to the first variant.
 */
export function resolveCondition(
  module: PitchModule,
  band: BandKey,
  posture: PostureKey,
  inputs: NumericInputs,
  locale: GameLocale = "en",
): string {
  const matched =
    module.conditions.find(
      (c) =>
        (!c.bands || c.bands.includes(band)) &&
        (!c.postures || c.postures.includes(posture)),
    ) ?? module.conditions[0];
  return fillTemplate(matched.text[locale], module, inputs, computeExtras(module, inputs));
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Loose email sanity check used before persisting leads. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function parseNumericInput(raw: string): number | null {
  const cleaned = raw.replace(/[,，\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
