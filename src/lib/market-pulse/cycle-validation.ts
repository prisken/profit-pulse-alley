import type { MarketPulseCycleStatus } from "@prisma/client";

import {
  parseHktDatetimeLocal,
  toHktDatetimeLocalValue,
} from "@/lib/market-pulse/hkt-time";

export const MARKET_PULSE_CYCLE_STATUS_OPTIONS: MarketPulseCycleStatus[] = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "REVEALED",
  "ARCHIVED",
];

export type MarketPulseCycleFormValues = {
  name: string;
  startsAt: string;
  endsAt: string;
  revealAt: string;
  status: MarketPulseCycleStatus;
  prizeLabel: string;
  setActive: boolean;
};

export type CycleFormFieldErrors = Partial<
  Record<"name" | "startsAt" | "endsAt" | "revealAt", string>
>;

/** Parse admin cycle datetime-local input as HKT wall-clock time. */
export function parseCycleDate(value: string): Date | null {
  return parseHktDatetimeLocal(value);
}

/** Format a stored UTC instant for admin cycle datetime-local inputs (HKT). */
export function toDatetimeLocalValue(iso: string): string {
  return toHktDatetimeLocalValue(iso);
}

export function validateMarketPulseCycleForm(values: {
  name: string;
  startsAt: string;
  endsAt: string;
  revealAt: string;
}): { valid: boolean; errors: CycleFormFieldErrors } {
  const errors: CycleFormFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  const startsAt = parseCycleDate(values.startsAt);
  const endsAt = parseCycleDate(values.endsAt);
  const revealAt = parseCycleDate(values.revealAt);

  if (!values.startsAt.trim() || !startsAt) {
    errors.startsAt = "Start date is required.";
  }
  if (!values.endsAt.trim() || !endsAt) {
    errors.endsAt = "End date is required.";
  }
  if (!values.revealAt.trim() || !revealAt) {
    errors.revealAt = "Reveal date is required.";
  }

  if (startsAt && endsAt && startsAt.getTime() >= endsAt.getTime()) {
    errors.endsAt = "End must be after start.";
  }
  if (endsAt && revealAt && endsAt.getTime() > revealAt.getTime()) {
    errors.revealAt = "Reveal must be on or after end.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** First server-side validation error message, or null when valid. */
export function validateMarketPulseCycleDates(input: {
  name: string;
  startsAt: Date | null;
  endsAt: Date | null;
  revealAt: Date | null;
}): string | null {
  if (!input.name.trim()) {
    return "Name is required.";
  }
  if (!input.startsAt) {
    return "Start date is required.";
  }
  if (!input.endsAt) {
    return "End date is required.";
  }
  if (!input.revealAt) {
    return "Reveal date is required.";
  }
  if (input.startsAt.getTime() >= input.endsAt.getTime()) {
    return "End must be after start.";
  }
  if (input.endsAt.getTime() > input.revealAt.getTime()) {
    return "Reveal must be on or after end.";
  }
  return null;
}

export const DEFAULT_CYCLE_FORM_VALUES: MarketPulseCycleFormValues = {
  name: "",
  startsAt: "",
  endsAt: "",
  revealAt: "",
  status: "DRAFT",
  prizeLabel: "",
  setActive: true,
};
