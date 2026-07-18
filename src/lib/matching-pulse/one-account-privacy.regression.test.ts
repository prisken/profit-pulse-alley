/**
 * Matching Pulse one-account + privacy regression audit.
 * Complements unit tests in validation/actions/data/admin-actions.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { MATCHING_PULSE_FIELD_MAX } from "@/lib/matching-pulse/constants";
import { validateMatchingPulseRequestCreate } from "@/lib/matching-pulse/validation";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const VALID_CREATE_INPUT = {
  title: "Looking for a marketing partner",
  requestType: "NEED_HELP",
  category: "BUSINESS",
  description: "Need support launching a HK campaign.",
  consentToContact: true,
} as const;

describe("Matching Pulse regression — validation", () => {
  it("requires title, requestType, category, description, and consent", () => {
    const result = validateMatchingPulseRequestCreate({
      title: "",
      requestType: "",
      category: "",
      description: "",
      consentToContact: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.fieldErrors.title).toBeTruthy();
    expect(result.fieldErrors.requestType).toBeTruthy();
    expect(result.fieldErrors.category).toBeTruthy();
    expect(result.fieldErrors.description).toBeTruthy();
    expect(result.fieldErrors.consentToContact).toBeTruthy();
  });

  it("rejects missing consent even when other fields are valid", () => {
    const result = validateMatchingPulseRequestCreate({
      ...VALID_CREATE_INPUT,
      consentToContact: undefined,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.fieldErrors.consentToContact).toMatch(/contacted/i);
  });

  it("rejects invalid enums", () => {
    const result = validateMatchingPulseRequestCreate({
      ...VALID_CREATE_INPUT,
      requestType: "OFFER",
      category: "TALENT",
      urgency: "CRITICAL",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.fieldErrors.requestType).toBeTruthy();
    expect(result.fieldErrors.category).toBeTruthy();
    expect(result.fieldErrors.urgency).toBeTruthy();
  });

  it("rejects overlong required strings", () => {
    const result = validateMatchingPulseRequestCreate({
      ...VALID_CREATE_INPUT,
      title: "t".repeat(MATCHING_PULSE_FIELD_MAX.title + 1),
      description: "d".repeat(MATCHING_PULSE_FIELD_MAX.description + 1),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.fieldErrors.title).toBeTruthy();
    expect(result.fieldErrors.description).toBeTruthy();
  });
});

describe("Matching Pulse regression — request creation one-account", () => {
  it("create action uses session userId and never creates a User", () => {
    const actions = readSource("src/lib/matching-pulse/actions.ts");

    expect(actions).toContain("const userId = session?.user?.id");
    expect(actions).toContain("userId,");
    expect(actions).toContain("prisma.matchingPulseRequest.create");
    expect(actions).not.toContain("prisma.user.create");
    expect(actions).not.toContain("user.create");
  });

  it("form mapper intentionally ignores userId and email FormData fields", () => {
    const actions = readSource("src/lib/matching-pulse/actions.ts");
    const helperStart = actions.indexOf("function formDataToCreateInput");
    const helperEnd = actions.indexOf(
      "export async function createMatchingPulseRequestAction",
    );
    const helper = actions.slice(helperStart, helperEnd);

    expect(helper).toContain("Intentionally ignore userId / email");
    expect(helper).not.toMatch(/formData\.get\(["']userId["']\)/);
    expect(helper).not.toMatch(/formData\.get\(["']email["']\)/);
  });

  it("logged-out create redirects to Matching Pulse login callback", () => {
    const actions = readSource("src/lib/matching-pulse/actions.ts");
    expect(actions).toContain(
      'const LOGIN_CALLBACK = "/matching-pulse/request"',
    );
    expect(actions).toContain(
      "redirect(`/login?callbackUrl=${encodeURIComponent(LOGIN_CALLBACK)}`)",
    );
  });
});

describe("Matching Pulse regression — user data loader privacy", () => {
  it("my-requests loader always filters by userId and never selects adminNotes/tags", () => {
    const data = readSource("src/lib/matching-pulse/data.ts");
    const selectStart = data.indexOf("const MY_REQUEST_SELECT");
    const selectEnd = data.indexOf(
      "export async function getMatchingPulseRequestsForUser",
    );
    const selectBlock = data.slice(selectStart, selectEnd);
    const fnStart = data.indexOf(
      "export async function getMatchingPulseRequestsForUser",
    );
    const fnEnd = data.indexOf("export function excerptMatchingPulseDescription");
    const body = data.slice(fnStart, fnEnd);

    expect(body).toContain("where: { userId: trimmedUserId }");
    expect(body).toContain("orderBy: { createdAt: \"desc\" }");
    expect(selectBlock).not.toMatch(/adminNotes:\s*true/);
    expect(selectBlock).not.toMatch(/tags:\s*true/);
  });

  it("profile summary scopes to userId and never selects adminNotes", () => {
    const data = readSource("src/lib/matching-pulse/data.ts");
    const fnStart = data.indexOf(
      "export async function getMatchingPulseProfileSummary",
    );
    const body = data.slice(fnStart);

    expect(body).toContain("where: { userId: trimmedUserId }");
    expect(body).toMatch(/select:\s*\{\s*title:\s*true,\s*status:\s*true/);
    expect(body).not.toMatch(/adminNotes:\s*true/);
  });
});

describe("Matching Pulse regression — admin actions", () => {
  it("admin mutations require requireAdminSession", () => {
    const actions = readSource("src/lib/matching-pulse/admin-actions.ts");

    expect(actions).toContain("requireAdminSession()");
    expect(actions).toContain('adminFail("Unauthorized")');
    expect(actions).toContain("updateMatchingPulseRequestStatusAction");
    expect(actions).toContain("updateMatchingPulseRequestAdminNotesAction");
    expect(actions).toContain("isMatchingPulseStatus(status)");
  });

  it("status and notes updates revalidate admin list + detail", () => {
    const actions = readSource("src/lib/matching-pulse/admin-actions.ts");

    expect(actions).toContain("revalidatePath(ADMIN_LIST_PATH)");
    expect(actions).toContain("revalidatePath(detailPath(requestId))");
    expect(actions).toContain("data: { status:");
    expect(actions).toContain("data: { adminNotes: normalized.value }");
  });
});

describe("Matching Pulse regression — public / user page privacy", () => {
  it("public landing page does not query or list submitted requests", () => {
    const page = readSource("src/app/matching-pulse/page.tsx");
    const landing = readSource(
      "src/components/matching-pulse/MatchingPulseLandingPage.tsx",
    );

    expect(page).not.toContain("prisma");
    expect(page).not.toContain("getMatchingPulseRequestsForUser");
    expect(page).not.toMatch(/adminNotes:\s*true/);
    expect(landing).not.toContain("prisma");
    expect(landing).not.toContain("getMatchingPulseRequestsForUser");
    expect(landing).not.toMatch(/findMany|findFirst|findUnique/);
  });

  it("my-requests page only loads session.user.id requests", () => {
    const page = readSource("src/app/matching-pulse/my-requests/page.tsx");

    expect(page).toContain(
      'redirect("/login?callbackUrl=/matching-pulse/my-requests")',
    );
    expect(page).toContain("getMatchingPulseRequestsForUser(session.user.id)");
    expect(page).not.toMatch(/adminNotes:\s*true/);
  });

  it("success page ownership lookup requires matching userId and never selects adminNotes", () => {
    const page = readSource("src/app/matching-pulse/success/page.tsx");

    expect(page).toContain("id: requestId");
    expect(page).toContain("userId");
    expect(page).toMatch(/select:\s*\{\s*title:\s*true/);
    expect(page).not.toMatch(/adminNotes:\s*true/);
  });

  it("profile Matching Pulse card uses scoped summary helper only", () => {
    const profile = readSource("src/app/profile/page.tsx");
    const card = readSource("src/components/auth/ProfileMatchingPulseCard.tsx");

    expect(profile).toContain("getMatchingPulseProfileSummary(user.id)");
    expect(profile).not.toMatch(/adminNotes:\s*true/);
    expect(card).not.toMatch(/adminNotes:\s*true/);
    expect(card).not.toContain("prisma");
  });

  it("user-facing Matching Pulse UI never renders adminNotes", () => {
    const userFacingPaths = [
      "src/components/matching-pulse/MatchingPulseLandingPage.tsx",
      "src/components/matching-pulse/MatchingPulseMyRequests.tsx",
      "src/components/matching-pulse/MatchingPulseRequestForm.tsx",
      "src/components/matching-pulse/MatchingPulseSuccessPage.tsx",
      "src/components/auth/ProfileMatchingPulseCard.tsx",
      "src/app/matching-pulse/page.tsx",
      "src/app/matching-pulse/request/page.tsx",
      "src/app/matching-pulse/my-requests/page.tsx",
      "src/app/matching-pulse/success/page.tsx",
    ];

    for (const relativePath of userFacingPaths) {
      const source = readSource(relativePath);
      expect(source, relativePath).not.toContain("adminNotes");
    }
  });
});
