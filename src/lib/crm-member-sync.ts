import "server-only";

const DEFAULT_SOURCE = "Profit Pulse Ally Member Signup";

export type SyncMemberSignupToCrmInput = {
  userId: string;
  email: string;
  name: string | null;
  contactNumber: string | null;
  provider: string;
  role: string;
  signedUpAt: string | Date;
  source?: string;
};

export async function syncMemberSignupToCrm(
  input: SyncMemberSignupToCrmInput,
): Promise<void> {
  const webhookUrl = process.env.CRM_MEMBER_SIGNUP_WEBHOOK_URL;
  const webhookSecret = process.env.CRM_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.warn(
      "[crm-member-sync] Skipping CRM sync: CRM_MEMBER_SIGNUP_WEBHOOK_URL or CRM_WEBHOOK_SECRET is not set.",
    );
    return;
  }

  const contactNumber = input.contactNumber?.trim() || null;
  const signedUpAt =
    input.signedUpAt instanceof Date
      ? input.signedUpAt.toISOString()
      : input.signedUpAt;

  const body = {
    email: input.email,
    name: input.name,
    contactNumber,
    ...(contactNumber ? { phone: contactNumber } : {}),
    memberId: input.userId,
    provider: input.provider,
    role: input.role,
    source: input.source?.trim() || DEFAULT_SOURCE,
    signedUpAt,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crm-webhook-secret": webhookSecret,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      console.error(
        `[crm-member-sync] CRM webhook failed with status ${response.status}: ${responseText}`,
      );
    }
  } catch (error) {
    console.error("[crm-member-sync] CRM webhook request failed:", error);
  }
}
