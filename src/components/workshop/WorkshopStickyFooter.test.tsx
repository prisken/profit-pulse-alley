/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WorkshopStickyFooter from "@/components/workshop/WorkshopStickyFooter";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

describe("WorkshopStickyFooter", () => {
  it("renders primary CTA with large touch target and safe-area padding class", () => {
    render(
      <WorkshopStickyFooter
        primaryLabel="Confirm My Pyramid"
        onPrimaryClick={() => {}}
      />,
    );
    const btn = screen.getByRole("button", { name: "Confirm My Pyramid" });
    expect(btn).toHaveClass("min-h-14");
    expect(document.querySelector("[data-workshop-sticky-footer]")).toBeTruthy();
  });

  it("lifts bottom offset when visualViewport shrinks (keyboard open)", () => {
    const listeners = new Map<string, Set<() => void>>();

    const visualViewport = {
      height: 400,
      offsetTop: 0,
      addEventListener: (type: string, fn: () => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(fn);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, fn: () => void) => {
        listeners.get(type)?.delete(fn);
      },
    };

    vi.stubGlobal("visualViewport", visualViewport);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 812,
    });

    render(
      <WorkshopStickyFooter
        primaryLabel="Analyze"
        onPrimaryClick={() => {}}
      />,
    );

    act(() => {
      listeners.get("resize")?.forEach((fn) => fn());
    });

    const root = document.querySelector(
      "[data-workshop-sticky-footer]",
    ) as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.style.bottom).toBe("412px"); // 812 - 400 - 0
    expect(root.getAttribute("data-keyboard-offset")).toBe("412");
  });

  it("resets bottom when visualViewport returns to full height", () => {
    const listeners = new Map<string, Set<() => void>>();
    let height = 400;

    const visualViewport = {
      get height() {
        return height;
      },
      offsetTop: 0,
      addEventListener: (type: string, fn: () => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(fn);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, fn: () => void) => {
        listeners.get(type)?.delete(fn);
      },
    };

    vi.stubGlobal("visualViewport", visualViewport);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 812,
    });

    render(
      <WorkshopStickyFooter
        primaryLabel="Confirm"
        onPrimaryClick={() => {}}
      />,
    );

    act(() => {
      listeners.get("resize")?.forEach((fn) => fn());
    });
    const root = document.querySelector(
      "[data-workshop-sticky-footer]",
    ) as HTMLElement;
    expect(root.style.bottom).toBe("412px");

    height = 812;
    act(() => {
      listeners.get("resize")?.forEach((fn) => fn());
    });
    expect(root.style.bottom).toBe("0px");
    expect(root.getAttribute("data-keyboard-offset")).toBe("0");
  });

  it("ignores small visualViewport jitter while the keyboard stays open", () => {
    const listeners = new Map<string, Set<() => void>>();
    let height = 400;

    const visualViewport = {
      get height() {
        return height;
      },
      offsetTop: 0,
      addEventListener: (type: string, fn: () => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(fn);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, fn: () => void) => {
        listeners.get(type)?.delete(fn);
      },
    };

    vi.stubGlobal("visualViewport", visualViewport);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 812,
    });

    render(
      <WorkshopStickyFooter
        primaryLabel="Confirm"
        onPrimaryClick={() => {}}
      />,
    );

    act(() => {
      listeners.get("resize")?.forEach((fn) => fn());
    });
    const root = document.querySelector(
      "[data-workshop-sticky-footer]",
    ) as HTMLElement;
    expect(root.style.bottom).toBe("412px");

    // Simulate name → email focus: keyboard still open, height wobbles by 12px
    height = 412;
    act(() => {
      listeners.get("resize")?.forEach((fn) => fn());
    });
    expect(root.style.bottom).toBe("412px");
    expect(root.getAttribute("data-keyboard-offset")).toBe("412");
  });
});
