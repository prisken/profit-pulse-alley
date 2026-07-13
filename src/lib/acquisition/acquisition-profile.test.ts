import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LEARNING_INTEREST_OPTIONS,
  NEXT_STEP_PREFERENCE_OPTIONS,
  isValidLearningInterest,
  isValidNextStepPreference,
} from "@/lib/acquisition/constants";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  marketPulseDecisionCount: vi.fn(),
  userAcquisitionProfileFindUnique: vi.fn(),
  userAcquisitionProfileUpsert: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketPulseDecision: {
      count: mocks.marketPulseDecisionCount,
    },
    userAcquisitionProfile: {
      findUnique: mocks.userAcquisitionProfileFindUnique,
      upsert: mocks.userAcquisitionProfileUpsert,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { shouldShowLearningInterestPrompt, shouldShowNextStepPreferencePrompt } from "@/lib/acquisition/profile";
import {
  dismissLearningInterestPromptAction,
  dismissNextStepPreferencePromptAction,
  saveLearningInterestAction,
  saveNextStepPreferenceAction,
} from "@/lib/acquisition/actions";

describe("acquisition — learning interest options", () => {
  it("validates all supported learning interest slugs", () => {
    for (const option of LEARNING_INTEREST_OPTIONS) {
      expect(isValidLearningInterest(option)).toBe(true);
    }

    expect(isValidLearningInterest("phone")).toBe(false);
    expect(isValidLearningInterest("contactNumber")).toBe(false);
    expect(isValidLearningInterest("")).toBe(false);
  });
});

describe("acquisition — shouldShowLearningInterestPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.marketPulseDecisionCount.mockResolvedValue(0);
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not show before any Market Pulse decision", async () => {
    mocks.marketPulseDecisionCount.mockResolvedValue(0);

    await expect(shouldShowLearningInterestPrompt("user-1")).resolves.toBe(false);
  });

  it("shows after the first decision when not captured or dismissed", async () => {
    mocks.marketPulseDecisionCount.mockResolvedValue(1);
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue(null);

    await expect(shouldShowLearningInterestPrompt("user-1")).resolves.toBe(true);
  });

  it("does not show after learning interest is saved", async () => {
    mocks.marketPulseDecisionCount.mockResolvedValue(2);
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue({
      learningInterestCapturedAt: new Date("2026-07-01T00:00:00.000Z"),
      learningInterestPromptDismissedAt: null,
    });

    await expect(shouldShowLearningInterestPrompt("user-1")).resolves.toBe(false);
  });

  it("does not show after the prompt is skipped", async () => {
    mocks.marketPulseDecisionCount.mockResolvedValue(1);
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue({
      learningInterestCapturedAt: null,
      learningInterestPromptDismissedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    await expect(shouldShowLearningInterestPrompt("user-1")).resolves.toBe(false);
  });
});

describe("acquisition — learning interest actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userAcquisitionProfileUpsert.mockResolvedValue({});
  });

  it("saves a valid learning interest without phone fields", async () => {
    const result = await saveLearningInterestAction("market_outlook");

    expect(result).toEqual({ success: true });
    expect(mocks.userAcquisitionProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({
          userId: "user-1",
          learningInterest: "market_outlook",
          learningInterestCapturedAt: expect.any(Date),
        }),
      }),
    );

    const upsertPayload = mocks.userAcquisitionProfileUpsert.mock.calls[0]?.[0];
    expect(upsertPayload?.create).not.toHaveProperty("contactNumber");
    expect(upsertPayload?.update).not.toHaveProperty("contactNumber");
  });

  it("rejects invalid learning interest values", async () => {
    const result = await saveLearningInterestAction("not-a-real-option");

    expect(result).toEqual({
      success: false,
      error: "Invalid learning interest.",
    });
    expect(mocks.userAcquisitionProfileUpsert).not.toHaveBeenCalled();
  });

  it("dismisses the prompt so it never shows again", async () => {
    const result = await dismissLearningInterestPromptAction();

    expect(result).toEqual({ success: true });
    expect(mocks.userAcquisitionProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({
          learningInterestPromptDismissedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          learningInterestPromptDismissedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(saveLearningInterestAction("market_outlook")).resolves.toEqual({
      success: false,
      error: "Sign in required.",
    });
    await expect(dismissLearningInterestPromptAction()).resolves.toEqual({
      success: false,
      error: "Sign in required.",
    });
  });
});

describe("acquisition — next-step preference options", () => {
  it("validates all supported next-step preference slugs", () => {
    for (const option of NEXT_STEP_PREFERENCE_OPTIONS) {
      expect(isValidNextStepPreference(option)).toBe(true);
    }

    expect(isValidNextStepPreference("phone")).toBe(false);
    expect(isValidNextStepPreference("contactNumber")).toBe(false);
    expect(isValidNextStepPreference("")).toBe(false);
  });
});

describe("acquisition — shouldShowNextStepPreferencePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue(null);
  });

  it("shows when not captured or dismissed", async () => {
    await expect(shouldShowNextStepPreferencePrompt("user-1")).resolves.toBe(true);
  });

  it("does not show after next-step preference is saved", async () => {
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue({
      nextStepCapturedAt: new Date("2026-07-01T00:00:00.000Z"),
      nextStepPromptDismissedAt: null,
    });

    await expect(shouldShowNextStepPreferencePrompt("user-1")).resolves.toBe(false);
  });

  it("does not show after the prompt is skipped", async () => {
    mocks.userAcquisitionProfileFindUnique.mockResolvedValue({
      nextStepCapturedAt: null,
      nextStepPromptDismissedAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    await expect(shouldShowNextStepPreferencePrompt("user-1")).resolves.toBe(false);
  });
});

describe("acquisition — next-step preference actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userAcquisitionProfileUpsert.mockResolvedValue({});
  });

  it("saves a valid next-step preference without phone fields", async () => {
    const result = await saveNextStepPreferenceAction("market_recap");

    expect(result).toEqual({ success: true });
    expect(mocks.userAcquisitionProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({
          userId: "user-1",
          nextStepPreference: "market_recap",
          nextStepCapturedAt: expect.any(Date),
        }),
      }),
    );

    const upsertPayload = mocks.userAcquisitionProfileUpsert.mock.calls[0]?.[0];
    expect(upsertPayload?.create).not.toHaveProperty("contactNumber");
    expect(upsertPayload?.update).not.toHaveProperty("contactNumber");
  });

  it("rejects invalid next-step preference values", async () => {
    const result = await saveNextStepPreferenceAction("not-a-real-option");

    expect(result).toEqual({
      success: false,
      error: "Invalid next-step preference.",
    });
    expect(mocks.userAcquisitionProfileUpsert).not.toHaveBeenCalled();
  });

  it("dismisses the reveal prompt so it never shows again", async () => {
    const result = await dismissNextStepPreferencePromptAction();

    expect(result).toEqual({ success: true });
    expect(mocks.userAcquisitionProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({
          nextStepPromptDismissedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          nextStepPromptDismissedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(saveNextStepPreferenceAction("just_browsing")).resolves.toEqual({
      success: false,
      error: "Sign in required.",
    });
    await expect(dismissNextStepPreferencePromptAction()).resolves.toEqual({
      success: false,
      error: "Sign in required.",
    });
  });
});
