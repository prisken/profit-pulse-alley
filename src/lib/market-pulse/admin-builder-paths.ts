export function marketPulseCycleBuilderPath(cycleId: string): string {
  return `/admin/market-pulse/cycles/${cycleId}/builder`;
}

export function marketPulseGuidedCardsPath(cycleId: string): string {
  return `/admin/market-pulse/cycles/${cycleId}/guided-cards`;
}

export function marketPulseGuidedLaunchPath(cycleId: string): string {
  return `/admin/market-pulse/cycles/${cycleId}/guided-launch`;
}
