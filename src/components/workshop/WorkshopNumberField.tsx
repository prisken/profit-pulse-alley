"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";

export type WorkshopNumberFieldVariant =
  | "currency"
  | "percent"
  | "age"
  | "year"
  | "plain";

export type WorkshopNumberFieldProps = Readonly<{
  value: number;
  onChange: (value: number) => void;
  variant: WorkshopNumberFieldVariant;
  label?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** Mobile keyboard action label. Defaults to `"next"`. */
  enterKeyHint?: "next" | "done";
  "aria-label"?: string;
  className?: string;
}>;

const INPUT_CLASS =
  "w-full min-h-12 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-base text-white outline-none placeholder:text-zinc-500 focus-visible:border-emerald-400/40 focus-visible:ring-2 focus-visible:ring-emerald-400/40 font-mono tabular-nums";

const CURRENCY_INPUT_CLASS = `${INPUT_CLASS} pl-8`;
const PERCENT_INPUT_CLASS = `${INPUT_CLASS} pr-10`;

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-zinc-200";

/** Digits with optional one decimal point (no thousand separators). */
const EDIT_PATTERN = /^\d*\.?\d*$/;
/** Integer digits only. */
const INTEGER_EDIT_PATTERN = /^\d*$/;

const SCROLL_INTO_VIEW_DELAY_MS = 350;

function formatCurrencyDisplay(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function stripSeparators(raw: string): string {
  return raw.replace(/,/g, "").replace(/\$/g, "").trim();
}

function parseRawNumber(raw: string): number | null {
  const cleaned = stripSeparators(raw);
  if (cleaned === "" || cleaned === ".") {
    return null;
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function clampValue(
  value: number,
  variant: WorkshopNumberFieldVariant,
  min?: number,
  max?: number,
): number {
  let next = value;
  if (variant === "percent") {
    next = Math.min(100, Math.max(0, next));
  }
  if (min !== undefined) {
    next = Math.max(min, next);
  }
  if (max !== undefined) {
    next = Math.min(max, next);
  }
  if (
    variant === "age" ||
    variant === "year" ||
    variant === "plain" ||
    variant === "percent" ||
    variant === "currency"
  ) {
    next = Math.round(next);
  }
  return next;
}

function defaultEmptyCommit(
  variant: WorkshopNumberFieldVariant,
  min?: number,
): number {
  if (min !== undefined) {
    return min;
  }
  if (variant === "percent") {
    return 0;
  }
  return 0;
}

function displayFromValue(
  value: number,
  variant: WorkshopNumberFieldVariant,
  placeholder?: string,
): string {
  // Keep placeholders visible for unset-looking zeros on intake-style fields.
  if (
    value === 0 &&
    placeholder &&
    (variant === "age" || variant === "currency" || variant === "plain")
  ) {
    return "";
  }
  if (variant === "currency") {
    return formatCurrencyDisplay(value);
  }
  return String(Math.round(value));
}

function inputModeFor(
  variant: WorkshopNumberFieldVariant,
): "decimal" | "numeric" {
  return variant === "currency" ? "decimal" : "numeric";
}

export default function WorkshopNumberField({
  value,
  onChange,
  variant,
  label,
  min,
  max,
  placeholder,
  id: idProp,
  disabled = false,
  required = false,
  enterKeyHint = "next",
  "aria-label": ariaLabel,
  className,
}: WorkshopNumberFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() =>
    displayFromValue(value, variant, placeholder),
  );

  // Draft is only shown while focused (handleFocus seeds it from `value`).
  // When blurred, the controlled display comes from `value` directly — no
  // effect sync needed (avoids setState-in-effect cascading renders).

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  function commit(raw: string) {
    const parsed = parseRawNumber(raw);
    if (parsed === null) {
      const fallback = clampValue(
        defaultEmptyCommit(variant, min),
        variant,
        min,
        max,
      );
      onChange(fallback);
      return fallback;
    }
    const next = clampValue(parsed, variant, min, max);
    onChange(next);
    return next;
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    const unset = value === 0 && Boolean(placeholder);
    if (unset) {
      setDraft("");
    } else {
      setDraft(String(Math.round(value)));
    }

    if (scrollTimeoutRef.current !== null) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      event.target.scrollIntoView({ block: "center", behavior: "smooth" });
    }, SCROLL_INTO_VIEW_DELAY_MS);
  }

  function handleBlur() {
    setFocused(false);
    const committed = commit(draft);
    setDraft(displayFromValue(committed, variant, placeholder));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextRaw = event.target.value;
    const pattern =
      variant === "currency" ? EDIT_PATTERN : INTEGER_EDIT_PATTERN;
    const candidate = stripSeparators(nextRaw);

    if (candidate !== "" && !pattern.test(candidate)) {
      return;
    }

    setDraft(candidate);

    const parsed = parseRawNumber(candidate);
    if (parsed === null) {
      return;
    }
    onChange(clampValue(parsed, variant, min, max));
  }

  const showCurrencyAdornment = variant === "currency";
  const showPercentAdornment = variant === "percent";

  const inputClass = showCurrencyAdornment
    ? CURRENCY_INPUT_CLASS
    : showPercentAdornment
      ? PERCENT_INPUT_CLASS
      : INPUT_CLASS;

  return (
    <div className={className ? `min-w-0 ${className}` : "min-w-0"}>
      {label ? (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        {showCurrencyAdornment ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-base text-zinc-500"
          >
            $
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode={inputModeFor(variant)}
          enterKeyHint={enterKeyHint}
          autoComplete="off"
          disabled={disabled}
          required={required}
          aria-label={ariaLabel ?? label}
          placeholder={placeholder}
          value={focused ? draft : displayFromValue(value, variant, placeholder)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={inputClass}
        />
        {showPercentAdornment ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-base text-zinc-500"
          >
            %
          </span>
        ) : null}
      </div>
    </div>
  );
}
