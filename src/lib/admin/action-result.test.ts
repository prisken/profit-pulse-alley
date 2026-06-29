import { describe, expect, it, vi } from "vitest";

import {
  adminFail,
  adminOk,
  applyAdminActionResult,
  finishAdminMutation,
  runAdminSideEffects,
} from "@/lib/admin/action-result";

describe("admin action result helpers", () => {
  it("returns success with optional warning", async () => {
    const result = await finishAdminMutation("User added.", [
      { label: "cache refresh", run: () => undefined },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("User added.");
      expect(result.warning).toBeUndefined();
    }
  });

  it("returns success when a side effect fails", async () => {
    const result = await finishAdminMutation(
      "Card published.",
      [
        { label: "audit log", run: async () => Promise.resolve() },
        {
          label: "cache refresh",
          run: () => {
            throw new Error("revalidate failed");
          },
        },
      ],
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBe("Card published.");
      expect(result.warning).toContain("cache refresh");
    }
  });

  it("runAdminSideEffects collects failed labels", async () => {
    const warning = await runAdminSideEffects([
      {
        label: "audit log",
        run: () => {
          throw new Error("db");
        },
      },
    ]);

    expect(warning).toContain("audit log");
  });

  it("applyAdminActionResult routes success and failure", () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    applyAdminActionResult(adminOk("Saved."), { onSuccess, onError });
    applyAdminActionResult(adminFail("Blocked."), { onSuccess, onError });

    expect(onSuccess).toHaveBeenCalledWith("Saved.", undefined);
    expect(onError).toHaveBeenCalledWith("Blocked.", undefined);
  });

  it("invokeAdminAction returns false on thrown errors", async () => {
    const { invokeAdminAction } = await import("@/lib/admin/action-result");
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const ok = await invokeAdminAction(
      async () => {
        throw new Error("network");
      },
      { onSuccess, onError },
    );

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});
