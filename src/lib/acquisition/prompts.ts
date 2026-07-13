import "server-only";

import {
  shouldShowLearningInterestPrompt,
  shouldShowNextStepPreferencePrompt,
} from "@/lib/acquisition/profile";

export type PlayPageAcquisitionState = {
  showLearningInterestPrompt: boolean;
};

export const EMPTY_PLAY_PAGE_ACQUISITION: PlayPageAcquisitionState = {
  showLearningInterestPrompt: false,
};

export async function resolvePlayPageAcquisition(
  userId: string | undefined,
): Promise<PlayPageAcquisitionState> {
  if (!userId) {
    return EMPTY_PLAY_PAGE_ACQUISITION;
  }

  try {
    const showLearningInterestPrompt = await shouldShowLearningInterestPrompt(userId);
    return { showLearningInterestPrompt };
  } catch (error) {
    console.error("[acquisition/prompts] Failed to resolve play page acquisition:", error);
    return EMPTY_PLAY_PAGE_ACQUISITION;
  }
}

export type RevealPageAcquisitionState = {
  showNextStepPreferencePrompt: boolean;
};

export const EMPTY_REVEAL_PAGE_ACQUISITION: RevealPageAcquisitionState = {
  showNextStepPreferencePrompt: false,
};

export async function resolveRevealPageAcquisition(
  userId: string | undefined,
): Promise<RevealPageAcquisitionState> {
  if (!userId) {
    return EMPTY_REVEAL_PAGE_ACQUISITION;
  }

  try {
    const showNextStepPreferencePrompt =
      await shouldShowNextStepPreferencePrompt(userId);
    return { showNextStepPreferencePrompt };
  } catch (error) {
    console.error(
      "[acquisition/prompts] Failed to resolve reveal page acquisition:",
      error,
    );
    return EMPTY_REVEAL_PAGE_ACQUISITION;
  }
}
