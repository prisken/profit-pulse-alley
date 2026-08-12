/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminNav from "@/components/admin/AdminNav";

const pathnameMock = vi.hoisted(() => ({ value: "/admin/pitch" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const ALL_LINKS = [
  "Dashboard",
  "Market Pulse",
  "Matching Pulse",
  "Pitch Meeting leads",
  "Workshop leads",
];

describe("AdminNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders every admin section link", () => {
    render(<AdminNav />);
    for (const label of ALL_LINKS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the exact active section on a deep page", () => {
    pathnameMock.value = "/admin/market-pulse/approvals";
    const { container } = render(<AdminNav />);
    const active = container.querySelector('[aria-current="page"]');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain("Market Pulse");
  });

  it("marks dashboard active on /admin", () => {
    pathnameMock.value = "/admin";
    const { container } = render(<AdminNav />);
    const active = container.querySelector('[aria-current="page"]');
    expect(active?.textContent).toContain("Dashboard");
  });

  it("marks pitch active on /admin/pitch", () => {
    pathnameMock.value = "/admin/pitch";
    const { container } = render(<AdminNav />);
    const active = container.querySelector('[aria-current="page"]');
    expect(active?.textContent).toContain("Pitch Meeting leads");
  });
});
