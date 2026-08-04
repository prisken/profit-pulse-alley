import { describe, expect, it } from "vitest";

import { buildWorkshopLeadsCsv } from "@/lib/workshop/leads-csv";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";

const sampleLead: WorkshopAdminLeadRow = {
  id: "lead_1",
  name: "Alex Chan",
  email: "alex@example.com",
  phone: "+85212345678",
  selectedGoal: 'Rebuild foundation after "layoff"',
  createdAt: "2026-08-04T02:00:00.000Z",
  industry: "Tech",
  age: 34,
  weakestLayer: "foundation",
  riskProfile: "balanced",
  ratingScore: 62,
};

describe("buildWorkshopLeadsCsv", () => {
  it("includes header and escaped selected goal", () => {
    const csv = buildWorkshopLeadsCsv([sampleLead]);
    expect(
      csv.startsWith(
        "createdAt,name,email,phone,industry,age,weakestLayer,riskProfile,ratingScore,selectedGoal",
      ),
    ).toBe(true);
    expect(csv).toContain("Alex Chan");
    expect(csv).toContain("foundation");
    expect(csv).toContain("balanced");
    expect(csv).toContain(",62,");
    expect(csv).toContain('"Rebuild foundation after ""layoff"""');
  });

  it("exports empty risk profile and rating when missing", () => {
    const csv = buildWorkshopLeadsCsv([
      {
        ...sampleLead,
        riskProfile: null,
        ratingScore: null,
        selectedGoal: "Top up CI",
      },
    ]);
    expect(csv).toContain(",foundation,,,Top up CI");
  });
});
