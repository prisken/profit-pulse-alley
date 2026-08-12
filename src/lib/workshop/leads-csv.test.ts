import { describe, expect, it } from "vitest";

import { buildWorkshopLeadsCsv } from "@/lib/workshop/leads-csv";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";

const sampleLead: WorkshopAdminLeadRow = {
  id: "lead_1",
  name: "Alex Chan",
  email: "alex@example.com",
  phone: "+85212345678",
  selectedGoal: 'Rebuild foundation after "layoff"',
  stressTestVerdict: "PENETRATED",
  profileBehaviorMismatch: true,
  createdAt: "2026-08-04T02:00:00.000Z",
  industry: "Tech",
  age: 34,
  retirementAge: 65,
  assetsDepletedAtAge: 82,
  runwayBeforeAge: 63,
  runwayAfterAge: 81,
  actionGoalLevers: "instant,structural,behavioral",
  weakestLayer: "foundation",
  riskProfile: "balanced",
  ratingScore: 62,
};

describe("buildWorkshopLeadsCsv", () => {
  it("includes header and escaped selected goal", () => {
    const csv = buildWorkshopLeadsCsv([sampleLead]);
    expect(
      csv.startsWith(
        "createdAt,name,email,phone,industry,age,retirementAge,assetsDepletedAtAge,runwayBeforeAge,runwayAfterAge,actionGoalLevers,weakestLayer,riskProfile,ratingScore,selectedGoal,stressTestVerdict,profileBehaviorMismatch",
      ),
    ).toBe(true);
    expect(csv).toContain("Alex Chan");
    expect(csv).toContain(",65,82,");
    expect(csv).toContain("foundation");
    expect(csv).toContain("balanced");
    expect(csv).toContain(",62,");
    expect(csv).toContain('"Rebuild foundation after ""layoff"""');
    expect(csv).toContain("PENETRATED");
    expect(csv).toContain(",true");
  });

  it("exports empty retirement/depletion/risk/rating when missing", () => {
    const csv = buildWorkshopLeadsCsv([
      {
        ...sampleLead,
        retirementAge: null,
        assetsDepletedAtAge: null,
        runwayBeforeAge: null,
        runwayAfterAge: null,
        actionGoalLevers: null,
        riskProfile: null,
        ratingScore: null,
        selectedGoal: "Top up CI",
        stressTestVerdict: null,
        profileBehaviorMismatch: null,
      },
    ]);
    expect(csv).toContain(",34,,,,,,foundation,,,Top up CI,,");
  });
});
