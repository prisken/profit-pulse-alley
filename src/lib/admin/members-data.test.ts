import { describe, expect, it } from "vitest";

import { buildAcquisitionMembersCsv } from "@/lib/admin/members-csv";
import type { AdminMemberRow } from "@/lib/admin/members-types";
import {
  formatLearningInterestLabel,
  formatNextStepPreferenceLabel,
} from "@/lib/acquisition/admin-labels";

const t = (key: string) => key;

const memberWithAcquisition: AdminMemberRow = {
  id: "user-1",
  name: "Alice Example",
  email: "alice@example.com",
  contactNumber: "+85211112222",
  role: "USER",
  emailVerified: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  gameScoreCount: 0,
  acquisition: {
    learningInterest: "market_outlook",
    learningInterestCapturedAt: "2026-07-02T00:00:00.000Z",
    learningInterestPromptDismissedAt: null,
    nextStepPreference: "attend_event",
    nextStepCapturedAt: "2026-07-10T00:00:00.000Z",
    nextStepPromptDismissedAt: null,
  },
};

const memberWithoutAcquisition: AdminMemberRow = {
  ...memberWithAcquisition,
  id: "user-2",
  email: "bob@example.com",
  name: "Bob Example",
  acquisition: null,
};

describe("buildAcquisitionMembersCsv", () => {
  it("includes acquisition fields without PPA or gameplay data", () => {
    const csv = buildAcquisitionMembersCsv([memberWithAcquisition]);
    const lines = csv.split("\n");

    expect(lines[0]).toBe(
      "name,email,contactNumber,role,learningInterest,learningInterestCapturedAt,learningInterestPromptDismissedAt,nextStepPreference,nextStepCapturedAt,nextStepPromptDismissedAt",
    );
    expect(lines[1]).toContain("alice@example.com");
    expect(lines[1]).toContain("market_outlook");
    expect(lines[1]).toContain("attend_event");
    expect(csv).not.toContain("ppaInsight");
    expect(csv).not.toContain("ppaSignal");
    expect(csv).not.toContain("totalPoints");
  });

  it("exports empty acquisition fields gracefully", () => {
    const csv = buildAcquisitionMembersCsv([memberWithoutAcquisition]);

    expect(csv).toContain("bob@example.com");
    expect(csv).toContain(",USER,,,,,");
  });
});

describe("acquisition admin labels", () => {
  it("formats known learning interest slugs", () => {
    expect(formatLearningInterestLabel("market_outlook", t)).toBe(
      "acquisition.learningInterest.option.market_outlook",
    );
    expect(formatLearningInterestLabel(null, t)).toBe("—");
  });

  it("formats known next-step preference slugs", () => {
    expect(formatNextStepPreferenceLabel("clarity_call", t)).toBe(
      "acquisition.nextStep.option.clarity_call",
    );
    expect(formatNextStepPreferenceLabel(null, t)).toBe("—");
  });
});
