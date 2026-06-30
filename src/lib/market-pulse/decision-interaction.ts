import type { MarketPulseDecision } from "@/lib/market-pulse/constants";

export const SWIPE_THRESHOLD = 110;
export const SWIPE_VELOCITY_THRESHOLD = 520;
export const DRAG_BIAS_THRESHOLD = 36;

export type DragBias = "neutral" | "bullish" | "cautious";

export function resolveSwipeDecision(
  offsetX: number,
  velocityX: number,
): MarketPulseDecision | null {
  if (offsetX > SWIPE_THRESHOLD || velocityX > SWIPE_VELOCITY_THRESHOLD) {
    return "BULLISH";
  }
  if (offsetX < -SWIPE_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD) {
    return "CAUTIOUS";
  }
  return null;
}

export function resolveDragBias(offsetX: number): DragBias {
  if (offsetX > DRAG_BIAS_THRESHOLD) {
    return "bullish";
  }
  if (offsetX < -DRAG_BIAS_THRESHOLD) {
    return "cautious";
  }
  return "neutral";
}

export function decisionToDragBias(
  decision: MarketPulseDecision,
): Exclude<DragBias, "neutral"> {
  return decision === "BULLISH" ? "bullish" : "cautious";
}
