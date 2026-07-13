export type AdminMemberAcquisition = {
  learningInterest: string | null;
  learningInterestCapturedAt: string | null;
  learningInterestPromptDismissedAt: string | null;
  nextStepPreference: string | null;
  nextStepCapturedAt: string | null;
  nextStepPromptDismissedAt: string | null;
};

export type AdminMemberRow = {
  id: string;
  name: string | null;
  email: string;
  contactNumber: string | null;
  role: "USER" | "ADMIN";
  emailVerified: string | null;
  createdAt: string;
  gameScoreCount: number;
  acquisition: AdminMemberAcquisition | null;
};
