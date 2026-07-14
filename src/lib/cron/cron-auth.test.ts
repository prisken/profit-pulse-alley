import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "@/lib/cron/cron-auth";

describe("isAuthorizedCronRequest", () => {
  it("rejects when CRON_SECRET env is unset", () => {
    const request = new Request("https://example.com/api/cron", {
      method: "POST",
      headers: { CRON_SECRET: "anything" },
    });

    expect(isAuthorizedCronRequest(request, {})).toBe(false);
  });

  it("rejects invalid CRON_SECRET header", () => {
    const request = new Request("https://example.com/api/cron", {
      method: "POST",
      headers: { CRON_SECRET: "wrong" },
    });

    expect(
      isAuthorizedCronRequest(request, { CRON_SECRET: "expected-secret" }),
    ).toBe(false);
  });

  it("accepts matching CRON_SECRET header", () => {
    const request = new Request("https://example.com/api/cron", {
      method: "POST",
      headers: { CRON_SECRET: "expected-secret" },
    });

    expect(
      isAuthorizedCronRequest(request, { CRON_SECRET: "expected-secret" }),
    ).toBe(true);
  });

  it("accepts Authorization Bearer token matching CRON_SECRET", () => {
    const request = new Request("https://example.com/api/cron", {
      method: "POST",
      headers: { Authorization: "Bearer expected-secret" },
    });

    expect(
      isAuthorizedCronRequest(request, { CRON_SECRET: "expected-secret" }),
    ).toBe(true);
  });

  it("rejects wrong Bearer token", () => {
    const request = new Request("https://example.com/api/cron", {
      method: "POST",
      headers: { Authorization: "Bearer nope" },
    });

    expect(
      isAuthorizedCronRequest(request, { CRON_SECRET: "expected-secret" }),
    ).toBe(false);
  });
});
