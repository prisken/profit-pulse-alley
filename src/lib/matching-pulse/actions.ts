"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MATCHING_PULSE_DEFAULT_CREATE_SOURCE } from "@/lib/matching-pulse/create-source";
import type {
  MatchingPulseRequestFormInput,
  MatchingPulseRequestFormValues,
  MatchingPulseValidationFailure,
} from "@/lib/matching-pulse/types";
import { validateMatchingPulseRequestCreate } from "@/lib/matching-pulse/validation";
import { prisma } from "@/lib/prisma";

const LOGIN_CALLBACK = "/matching-pulse/request";
const SUCCESS_PATH = "/matching-pulse/success";

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isConsentChecked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "true" ||
    normalized === "on" ||
    normalized === "1" ||
    normalized === "yes"
  );
}

/** Captures submitted fields so the client can restore them after validation errors. */
function formDataToFormValues(
  formData: FormData,
): MatchingPulseRequestFormValues {
  return {
    title: readFormString(formData, "title"),
    company: readFormString(formData, "company"),
    roleTitle: readFormString(formData, "roleTitle"),
    contactPhone: readFormString(formData, "contactPhone"),
    contactMethod: readFormString(formData, "contactMethod"),
    requestType: readFormString(formData, "requestType"),
    category: readFormString(formData, "category"),
    urgency: readFormString(formData, "urgency"),
    description: readFormString(formData, "description"),
    idealMatch: readFormString(formData, "idealMatch"),
    source: readFormString(formData, "source"),
    consentToContact: isConsentChecked(formData, "consentToContact"),
    consentToShare: isConsentChecked(formData, "consentToShare"),
  };
}

function formDataToCreateInput(formData: FormData): MatchingPulseRequestFormInput {
  // Intentionally ignore userId / email — identity comes only from the session.
  return {
    title: formData.get("title"),
    company: formData.get("company"),
    roleTitle: formData.get("roleTitle"),
    contactPhone: formData.get("contactPhone"),
    contactMethod: formData.get("contactMethod"),
    requestType: formData.get("requestType"),
    category: formData.get("category"),
    urgency: formData.get("urgency"),
    description: formData.get("description"),
    idealMatch: formData.get("idealMatch"),
    source: formData.get("source"),
    consentToContact: formData.get("consentToContact"),
    consentToShare: formData.get("consentToShare"),
  };
}

function withPreservedValues(
  failure: MatchingPulseValidationFailure,
  formData: FormData,
  prev: MatchingPulseValidationFailure | null,
): MatchingPulseValidationFailure {
  return {
    ...failure,
    values: formDataToFormValues(formData),
    revision: (prev?.revision ?? 0) + 1,
  };
}

/**
 * Creates a Matching Pulse request for the signed-in user.
 * Guests are redirected to login. Success redirects to the success page.
 * Validation failures return field errors + submitted values for form redisplay.
 */
export async function createMatchingPulseRequestAction(
  prev: MatchingPulseValidationFailure | null,
  formData: FormData,
): Promise<MatchingPulseValidationFailure> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(LOGIN_CALLBACK)}`);
  }

  const validated = validateMatchingPulseRequestCreate(
    formDataToCreateInput(formData),
  );

  if (!validated.ok) {
    return withPreservedValues(validated, formData, prev);
  }

  const { data } = validated;
  const source = data.source ?? MATCHING_PULSE_DEFAULT_CREATE_SOURCE;

  try {
    const created = await prisma.matchingPulseRequest.create({
      data: {
        userId,
        title: data.title,
        company: data.company,
        roleTitle: data.roleTitle,
        contactPhone: data.contactPhone,
        contactMethod: data.contactMethod,
        requestType: data.requestType,
        category: data.category,
        urgency: data.urgency,
        description: data.description,
        idealMatch: data.idealMatch,
        source,
        status: "NEW",
        consentToContact: data.consentToContact,
        consentToShare: data.consentToShare,
      },
      select: { id: true },
    });

    revalidatePath("/matching-pulse/my-requests");
    revalidatePath("/admin/matching-pulse");

    redirect(`${SUCCESS_PATH}?requestId=${encodeURIComponent(created.id)}`);
  } catch (error) {
    // Next.js redirect() throws a special error — rethrow so navigation works.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("[matching-pulse] createMatchingPulseRequestAction failed:", error);
    return withPreservedValues(
      {
        ok: false,
        fieldErrors: {},
        formError: "Could not submit your request. Please try again.",
      },
      formData,
      prev,
    );
  }
}
