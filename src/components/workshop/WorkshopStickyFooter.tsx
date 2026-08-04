"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bottom padding for scrollable step content so the last field/card clears
 * the sticky footer at rest (no keyboard). Covers a two-button stack + safe area.
 */
export const workshopStickyContentPadClass =
  "pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]";

const primaryBtnClass =
  "inline-flex min-h-14 w-full flex-1 touch-manipulation items-center justify-center rounded-xl bg-emerald-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm shadow-emerald-500/25 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[7.5rem]";

/** Ignore sub-pixel visualViewport noise when the keyboard is already open. */
const KEYBOARD_JITTER_PX = 24;
const KEYBOARD_CLOSED_THRESHOLD_PX = 8;

export type WorkshopStickyFooterProps = Readonly<{
  primaryLabel: string;
  onPrimaryClick?: () => void;
  /** Defaults to `"button"`. Use `"submit"` with `primaryForm` when outside a form. */
  primaryType?: "button" | "submit";
  /** Associates a submit button with a form by id (intake / capture). */
  primaryForm?: string;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
}>;

function readKeyboardOffset(): number {
  const viewport = window.visualViewport;
  if (!viewport) {
    return 0;
  }
  const inset = Math.max(
    0,
    window.innerHeight - viewport.height - viewport.offsetTop,
  );
  return inset < KEYBOARD_CLOSED_THRESHOLD_PX ? 0 : Math.round(inset);
}

/**
 * Keyboard-safe sticky bottom action bar for Workshop Pyramid Lab.
 *
 * iOS Safari shrinks the *visual* viewport when the keyboard opens but leaves
 * the layout viewport (and `position: fixed; bottom: 0`) behind the keyboard.
 * We listen to `visualViewport` resize/scroll and lift `bottom` by
 * `innerHeight - visualViewport.height - visualViewport.offsetTop`.
 *
 * Small height deltas while the keyboard stays open (e.g. name → email → phone
 * focus changes) are ignored so the footer does not jump/flicker.
 */
export default function WorkshopStickyFooter({
  primaryLabel,
  onPrimaryClick,
  primaryType = "button",
  primaryForm,
  primaryDisabled = false,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled = false,
}: WorkshopStickyFooterProps) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      return;
    }

    function commitOffset(next: number) {
      const prev = offsetRef.current;
      // Keyboard already open: ignore tiny height jitter between field focuses.
      if (
        prev > 0 &&
        next > 0 &&
        Math.abs(next - prev) < KEYBOARD_JITTER_PX
      ) {
        return;
      }
      if (next === prev) {
        return;
      }
      offsetRef.current = next;
      setKeyboardOffset(next);
    }

    function updateOffset() {
      commitOffset(readKeyboardOffset());
    }

    function scheduleUpdate() {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateOffset();
      });
    }

    updateOffset();
    vv.addEventListener("resize", scheduleUpdate);
    vv.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      vv.removeEventListener("resize", scheduleUpdate);
      vv.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50"
      style={{ bottom: keyboardOffset }}
      data-workshop-sticky-footer=""
      data-keyboard-offset={keyboardOffset}
    >
      <div
        className={[
          "pointer-events-auto border-t border-slate-200",
          "bg-white/90 backdrop-blur",
          "px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
          "pt-3",
          // Home indicator clearance when keyboard is closed; tighten when lifted.
          keyboardOffset > 0
            ? "pb-3"
            : "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "shadow-lg",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col-reverse gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          {secondaryLabel && onSecondaryClick ? (
            <button
              type="button"
              className={secondaryBtnClass}
              disabled={secondaryDisabled}
              onClick={onSecondaryClick}
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type={primaryType}
            form={primaryForm}
            className={primaryBtnClass}
            disabled={primaryDisabled}
            onClick={primaryType === "submit" ? undefined : onPrimaryClick}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
