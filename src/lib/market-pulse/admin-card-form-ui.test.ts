import { afterEach, describe, expect, it, vi } from "vitest";

import {
  focusFirstInvalidCardField,
  shouldTriggerDraftSaveShortcut,
} from "@/lib/market-pulse/admin-card-form-ui";

function keyboardEvent(
  target: { tagName: string; isContentEditable?: boolean },
  init: { key?: string; metaKey?: boolean; ctrlKey?: boolean } = {},
): KeyboardEvent {
  return {
    key: init.key ?? "s",
    metaKey: init.metaKey ?? false,
    ctrlKey: init.ctrlKey ?? false,
    target,
  } as unknown as KeyboardEvent;
}

describe("shouldTriggerDraftSaveShortcut", () => {
  it("allows Cmd/Ctrl+S outside textareas", () => {
    const event = keyboardEvent({ tagName: "INPUT" }, { metaKey: true });
    expect(shouldTriggerDraftSaveShortcut(event)).toBe(true);
  });

  it("ignores Cmd/Ctrl+S while typing in a textarea", () => {
    const event = keyboardEvent({ tagName: "TEXTAREA" }, { ctrlKey: true });
    expect(shouldTriggerDraftSaveShortcut(event)).toBe(false);
  });

  it("ignores Cmd/Ctrl+S in contenteditable regions", () => {
    const event = keyboardEvent(
      { tagName: "DIV", isContentEditable: true },
      { metaKey: true },
    );
    expect(shouldTriggerDraftSaveShortcut(event)).toBe(false);
  });
});

describe("focusFirstInvalidCardField", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("focuses the first invalid field in tab order", () => {
    const focus = vi.fn();
    const scrollIntoView = vi.fn();
    const headline = { focus, scrollIntoView };

    vi.stubGlobal("document", {
      getElementById: (id: string) => (id === "mp-card-headline" ? headline : null),
    });

    const focused = focusFirstInvalidCardField({
      companyName: "Required",
      headline: "Required",
    });

    expect(focused).toBe("headline");
    expect(focus).toHaveBeenCalledWith({ preventScroll: false });
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
  });
});
