/**
 * Compact HKD display for charts, scrubber stats, and headline cards.
 * Full precision stays in PDF key-figure lines.
 */

/**
 * Format HKD with up to 3 significant figures and K/M suffixes.
 * Examples: HK$999K, HK$1.05M, HK$20.7M, HK$780K.
 */
export function formatCompactHkd(value: number): string {
  if (!Number.isFinite(value)) {
    return "HK$0";
  }
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs < 1_000) {
    return `${sign}HK$${Math.round(abs)}`;
  }

  if (abs < 1_000_000) {
    return `${sign}HK$${formatSig3(abs / 1_000)}K`;
  }

  return `${sign}HK$${formatSig3(abs / 1_000_000)}M`;
}

/** ≤3 significant figures; trim useless trailing zeros. */
function formatSig3(n: number): string {
  if (!Number.isFinite(n) || n === 0) {
    return "0";
  }
  if (n >= 100) {
    return String(Math.round(n));
  }
  if (n >= 10) {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  }
  // 1 ≤ n < 10 — up to 2 decimal places (3 sig figs: 1.05)
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) {
    return String(r);
  }
  const one = Math.round(r * 10) / 10;
  if (Math.abs(r - one) < 1e-9) {
    return one.toFixed(1);
  }
  return r.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}

/**
 * Truncate a label for chart chips without splitting a CJK character mid-glyph.
 */
export function truncateLabelCjkSafe(label: string, maxChars: number): string {
  const trimmed = label.trim();
  if (maxChars <= 0 || trimmed.length <= maxChars) {
    return trimmed;
  }
  if (maxChars === 1) {
    return "…";
  }
  return `${[...trimmed].slice(0, maxChars - 1).join("")}…`;
}
