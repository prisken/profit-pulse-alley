import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
    throw error;
  }),
  matchingPulseRequestCreate: vi.fn(),
  userCreate: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    matchingPulseRequest: {
      create: mocks.matchingPulseRequestCreate,
    },
    user: {
      create: mocks.userCreate,
    },
  },
}));

import { createMatchingPulseRequestAction } from "@/lib/matching-pulse/actions";
import {
  buildMatchingPulseRequestPath,
  getMatchingPulseRequestCreateInitialSource,
  isMatchingPulseWorkshopSource,
  sanitizeMatchingPulseSource,
} from "@/lib/matching-pulse/create-source";

function buildValidFormData(
  overrides: Record<string, string> = {},
): FormData {
  const formData = new FormData();
  formData.set("title", "Need a marketing intro");
  formData.set("requestType", "NEED_HELP");
  formData.set("category", "BUSINESS");
  formData.set("description", "Looking for a warm intro to a HK marketer.");
  formData.set("consentToContact", "on");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("sanitizeMatchingPulseSource", () => {
  it("accepts letters, numbers, underscore, and hyphen up to 120 chars", () => {
    expect(sanitizeMatchingPulseSource("wework_lunch_learn_july_2026")).toBe(
      "wework_lunch_learn_july_2026",
    );
    expect(sanitizeMatchingPulseSource("Event-2026")).toBe("Event-2026");
  });

  it("falls back to direct when empty, overlong, or invalid", () => {
    expect(sanitizeMatchingPulseSource("")).toBe("direct");
    expect(sanitizeMatchingPulseSource("  ")).toBe("direct");
    expect(sanitizeMatchingPulseSource("bad source")).toBe("direct");
    expect(sanitizeMatchingPulseSource("foo/bar")).toBe("direct");
    expect(sanitizeMatchingPulseSource("a".repeat(121))).toBe("direct");
  });
});

describe("getMatchingPulseRequestCreateInitialSource", () => {
  it("defaults to direct when source is missing", () => {
    expect(getMatchingPulseRequestCreateInitialSource(undefined)).toBe("direct");
    expect(getMatchingPulseRequestCreateInitialSource({})).toBe("direct");
    expect(
      getMatchingPulseRequestCreateInitialSource(new URLSearchParams()),
    ).toBe("direct");
  });

  it("reads and trims source from search params", () => {
    expect(
      getMatchingPulseRequestCreateInitialSource({ source: "  homepage  " }),
    ).toBe("homepage");
    expect(
      getMatchingPulseRequestCreateInitialSource(
        new URLSearchParams("source=events"),
      ),
    ).toBe("events");
  });

  it("falls back to direct for invalid query values", () => {
    expect(
      getMatchingPulseRequestCreateInitialSource({ source: "we work" }),
    ).toBe("direct");
  });
});

describe("buildMatchingPulseRequestPath", () => {
  it("omits query when source is absent or invalid", () => {
    expect(buildMatchingPulseRequestPath(undefined)).toBe(
      "/matching-pulse/request",
    );
    expect(buildMatchingPulseRequestPath({})).toBe("/matching-pulse/request");
    expect(buildMatchingPulseRequestPath({ source: "bad/value" })).toBe(
      "/matching-pulse/request",
    );
  });

  it("preserves source on the request path", () => {
    expect(
      buildMatchingPulseRequestPath({
        source: "wework_lunch_learn_july_2026",
      }),
    ).toBe(
      "/matching-pulse/request?source=wework_lunch_learn_july_2026",
    );
  });
});

describe("isMatchingPulseWorkshopSource", () => {
  it("detects wework-prefixed sources", () => {
    expect(
      isMatchingPulseWorkshopSource("wework_lunch_learn_july_2026"),
    ).toBe(true);
    expect(isMatchingPulseWorkshopSource("WeWork_x")).toBe(true);
    expect(isMatchingPulseWorkshopSource("homepage")).toBe(false);
    expect(isMatchingPulseWorkshopSource("direct")).toBe(false);
  });
});

describe("createMatchingPulseRequestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects logged-out users to login with callbackUrl", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(
      createMatchingPulseRequestAction(null, buildValidFormData()),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fmatching-pulse%2Frequest",
    );
    expect(mocks.matchingPulseRequestCreate).not.toHaveBeenCalled();
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("creates a request with the session userId only", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "session-user-1" } });
    mocks.matchingPulseRequestCreate.mockResolvedValue({ id: "req-1" });

    await expect(
      createMatchingPulseRequestAction(null, buildValidFormData()),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mocks.matchingPulseRequestCreate).toHaveBeenCalledTimes(1);
    const createArg = mocks.matchingPulseRequestCreate.mock.calls[0]?.[0];
    expect(createArg.data.userId).toBe("session-user-1");
    expect(createArg.data.status).toBe("NEW");
    expect(createArg.data.source).toBe("direct");
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/matching-pulse/my-requests");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/matching-pulse");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/matching-pulse/success?requestId=req-1",
    );
  });

  it("ignores spoofed userId and email form fields", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "session-user-2" } });
    mocks.matchingPulseRequestCreate.mockResolvedValue({ id: "req-2" });

    const formData = buildValidFormData({
      userId: "spoofed-user",
      email: "attacker@example.com",
      source: "landing",
    });

    await expect(
      createMatchingPulseRequestAction(null, formData),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const createArg = mocks.matchingPulseRequestCreate.mock.calls[0]?.[0];
    expect(createArg.data.userId).toBe("session-user-2");
    expect(createArg.data.source).toBe("landing");
    expect(createArg.data).not.toHaveProperty("email");
    expect(Object.keys(createArg.data)).not.toContain("email");
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.userCreate).toHaveBeenCalledTimes(0);
  });

  it("does not create a User row on successful request create", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "session-user-4" } });
    mocks.matchingPulseRequestCreate.mockResolvedValue({ id: "req-4" });

    await expect(
      createMatchingPulseRequestAction(null, buildValidFormData()),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mocks.matchingPulseRequestCreate).toHaveBeenCalledTimes(1);
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("returns field errors and preserves submitted values for redisplay", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "session-user-3" } });

    const formData = new FormData();
    formData.set("title", "Keep this title");
    formData.set("requestType", "NEED_HELP");
    formData.set("category", "BUSINESS");
    formData.set("description", "Keep this description");
    formData.set("company", "Acme");
    formData.set("consentToContact", "false");
    formData.set("consentToShare", "on");
    formData.set("source", "direct");

    const result = await createMatchingPulseRequestAction(null, formData);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.fieldErrors.consentToContact).toBeTruthy();
    expect(result.values).toEqual({
      title: "Keep this title",
      company: "Acme",
      roleTitle: "",
      contactPhone: "",
      contactMethod: "",
      requestType: "NEED_HELP",
      category: "BUSINESS",
      urgency: "",
      description: "Keep this description",
      idealMatch: "",
      source: "direct",
      consentToContact: false,
      consentToShare: true,
    });
    expect(result.revision).toBe(1);
    expect(mocks.matchingPulseRequestCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
