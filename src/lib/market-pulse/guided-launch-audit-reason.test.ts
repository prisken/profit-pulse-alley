import { describe, expect, it } from "vitest";

import {
  formatGuidedLaunchAuditReason,
  guidedLaunchAuditReasonExcludesSensitiveFields,
} from "@/lib/market-pulse/guided-launch-audit-reason";

describe("formatGuidedLaunchAuditReason", () => {
  it("includes operational fields and excludes PPA markers", () => {
    const reason = formatGuidedLaunchAuditReason({
      cycleId: "cycle-1",
      publishedCount: 2,
      runtimeStatus: "OPEN",
      activeCycleId: "cycle-1",
    });

    expect(reason).toContain("Guided launch");
    expect(reason).toContain("cycleId=cycle-1");
    expect(reason).toContain("publishedCount=2");
    expect(reason).toContain("runtimeStatus=OPEN");
    expect(reason).toContain("activeCycleId=cycle-1");
    expect(guidedLaunchAuditReasonExcludesSensitiveFields(reason)).toBe(true);
    expect(reason).not.toContain("ppaSignal");
    expect(reason).not.toContain("ppaInsight");
    expect(reason).not.toContain("ppaSignalLockedAt");
    expect(reason).not.toContain("newsBody");
  });

  it("omits optional runtime and active cycle fields when absent", () => {
    const reason = formatGuidedLaunchAuditReason({
      cycleId: "cycle-2",
      publishedCount: 0,
    });

    expect(reason).toContain("cycleId=cycle-2");
    expect(reason).toContain("publishedCount=0");
    expect(reason).not.toContain("runtimeStatus=");
    expect(reason).not.toContain("activeCycleId=");
  });
});
