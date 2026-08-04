/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("WorkshopNumberField", () => {
  it("currency: formats with thousand separators on blur and emits a number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <WorkshopNumberField
        variant="currency"
        value={0}
        onChange={onChange}
        placeholder="0"
        aria-label="Amount"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Amount" });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "8000");

    const typedValue = onChange.mock.calls.at(-1)?.[0] as number;
    expect(typedValue).toBe(8000);
    expect(typeof typedValue).toBe("number");

    rerender(
      <WorkshopNumberField
        variant="currency"
        value={8000}
        onChange={onChange}
        placeholder="0"
        aria-label="Amount"
      />,
    );

    await user.tab();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(8000);
    expect(input).toHaveValue("8,000");
  });

  it("percent: clamps values to 0–100", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <WorkshopNumberField
        variant="percent"
        value={50}
        onChange={onChange}
        aria-label="Coverage"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Coverage" });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "150");

    expect(onChange.mock.calls.at(-1)?.[0]).toBe(100);

    rerender(
      <WorkshopNumberField
        variant="percent"
        value={100}
        onChange={onChange}
        aria-label="Coverage"
      />,
    );

    onChange.mockClear();
    await user.clear(input);
    await user.tab();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(0);
  });

  it("respects min/max clamping on change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <WorkshopNumberField
        variant="age"
        value={30}
        onChange={onChange}
        min={16}
        max={100}
        aria-label="Age"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Age" });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "12");
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(16);

    onChange.mockClear();
    await user.clear(input);
    await user.type(input, "140");
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(100);
  });
});
