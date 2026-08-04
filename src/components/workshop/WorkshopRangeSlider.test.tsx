/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";

afterEach(() => {
  cleanup();
});

describe("WorkshopRangeSlider", () => {
  it("applies workshop-range class (44px hit + touch-action: none via CSS)", () => {
    render(
      <WorkshopRangeSlider
        min={0}
        max={100}
        value={40}
        onChange={() => {}}
        aria-label="Coverage"
      />,
    );
    const input = screen.getByRole("slider", { name: "Coverage" });
    expect(input).toHaveClass("workshop-range");
    expect(input).toHaveAttribute("type", "range");
  });

  it("tap-to-jump: pointerdown on the track commits a value without a drag", () => {
    const onChange = vi.fn();
    render(
      <WorkshopRangeSlider
        min={2000}
        max={2030}
        step={1}
        value={2000}
        onChange={onChange}
        aria-label="Year"
      />,
    );
    const input = screen.getByRole("slider", { name: "Year" });

    // Stub geometry: left edge → min, right edge → max
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 44,
      right: 300,
      width: 300,
      height: 44,
      toJSON: () => ({}),
    });

    Object.defineProperty(input, "setPointerCapture", {
      value: vi.fn(),
      configurable: true,
    });
    Object.defineProperty(input, "releasePointerCapture", {
      value: vi.fn(),
      configurable: true,
    });
    Object.defineProperty(input, "hasPointerCapture", {
      value: () => true,
      configurable: true,
    });

    // Tap near the right end → ~2030
    fireEvent.pointerDown(input, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 290,
      button: 0,
      bubbles: true,
    });

    expect(onChange).toHaveBeenCalled();
    const jumped = onChange.mock.calls.at(-1)?.[0] as number;
    expect(jumped).toBeGreaterThanOrEqual(2028);
    expect(jumped).toBeLessThanOrEqual(2030);
    expect(input).toHaveAttribute("data-dragging", "true");

    fireEvent.pointerUp(input, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 290,
      button: 0,
      bubbles: true,
    });
    expect(input).not.toHaveAttribute("data-dragging");
  });
});
