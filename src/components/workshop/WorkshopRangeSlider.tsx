"use client";

import {
  useCallback,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Touch-friendly range input for Workshop Pyramid Lab.
 * - 44×44px thumb hit target (visual knob stays ~28px via CSS radial fill)
 * - touch-action: none so drag does not scroll the page
 * - Explicit tap-to-jump on the track (pointer down anywhere on the control)
 */

const THUMB_FILL: Record<string, string> = {
  emerald: "#34d399",
  sky: "#38bdf8",
  amber: "#fbbf24",
};

export type WorkshopRangeAccent = keyof typeof THUMB_FILL;

type WorkshopRangeSliderProps = Readonly<{
  id?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  disabled?: boolean;
  accent?: WorkshopRangeAccent;
  "aria-label"?: string;
  "aria-valuetext"?: string;
  onChange: (value: number) => void;
  className?: string;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  if (step <= 0) {
    return clamp(value, min, max);
  }
  const snapped = Math.round((value - min) / step) * step + min;
  return clamp(snapped, min, max);
}

function valueFromClientX(
  el: HTMLInputElement,
  clientX: number,
  min: number,
  max: number,
  step: number,
): number {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) {
    return min;
  }
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  return snapToStep(min + ratio * (max - min), min, max, step);
}

export default function WorkshopRangeSlider({
  id,
  min,
  max,
  step = 1,
  value,
  disabled = false,
  accent = "emerald",
  onChange,
  className,
  ...aria
}: WorkshopRangeSliderProps) {
  const [dragging, setDragging] = useState(false);

  const commitFromPointer = useCallback(
    (event: ReactPointerEvent<HTMLInputElement>) => {
      const el = event.currentTarget;
      const next = valueFromClientX(el, event.clientX, min, max, step);
      if (next !== value) {
        onChange(next);
      }
    },
    [max, min, onChange, step, value],
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }
    // Primary button / touch / pen only
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    // Tap-to-jump: set value immediately from track position (no drag required)
    commitFromPointer(event);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLInputElement>) {
    if (!dragging || disabled) {
      return;
    }
    commitFromPointer(event);
  }

  function endDrag(event: ReactPointerEvent<HTMLInputElement>) {
    if (!dragging) {
      return;
    }
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const thumbFill = THUMB_FILL[accent] ?? THUMB_FILL.emerald;

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={value}
      aria-label={aria["aria-label"]}
      aria-valuetext={aria["aria-valuetext"]}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      data-dragging={dragging ? "true" : undefined}
      onChange={(event) => onChange(Number(event.target.value))}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={[
        "workshop-range",
        dragging ? "workshop-range--dragging" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--workshop-range-thumb-fill": thumbFill,
        } as CSSProperties
      }
    />
  );
}
