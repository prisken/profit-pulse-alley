import { shouldShowMarketPulseLaunchSetupUi } from "@/lib/market-pulse/launch-config";

export const ADMIN_ROOT_PATH = "/admin";
export const ADMIN_MARKET_PULSE_PATH = "/admin/market-pulse";

export { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-builder-paths";

export const MARKET_PULSE_PUBLIC_PATHS = {
  hub: "/market-pulse",
  play: "/market-pulse/play",
  leaderboard: "/market-pulse/leaderboard",
  reveal: "/market-pulse/reveal",
} as const;

export type MarketPulseAdminNavSection = {
  id: string;
  labelKey: string;
};

export const MARKET_PULSE_ADMIN_NAV_SECTIONS: MarketPulseAdminNavSection[] = [
  { id: "cycles-hub", labelKey: "auth.admin.mp.nav.cyclesHub" },
  { id: "overview", labelKey: "auth.admin.mp.overview" },
  { id: "setup", labelKey: "auth.admin.mp.shell.setup" },
  { id: "runtime", labelKey: "auth.admin.mp.runtime" },
  { id: "cycles", labelKey: "auth.admin.mp.nav.advancedCycles" },
  { id: "cards", labelKey: "auth.admin.mp.nav.legacyCards" },
  { id: "reveal-scoring", labelKey: "auth.admin.mp.reveal.nav" },
  { id: "prize-claims", labelKey: "auth.admin.mp.shell.prizeNav" },
  { id: "audit", labelKey: "auth.admin.mp.shell.auditNav" },
];

export function getMarketPulseAdminNavSections(
  at: Date = new Date(),
): MarketPulseAdminNavSection[] {
  return MARKET_PULSE_ADMIN_NAV_SECTIONS.filter(
    (section) =>
      section.id !== "setup" || shouldShowMarketPulseLaunchSetupUi(at),
  );
}

export type AdminMpBreadcrumb = {
  labelKey?: string;
  label?: string;
  href?: string;
};

export function buildAdminMpDashboardBreadcrumbs(): AdminMpBreadcrumb[] {
  return [
    { labelKey: "auth.admin.breadcrumb.admin", href: ADMIN_ROOT_PATH },
    { labelKey: "auth.admin.breadcrumb.marketPulse" },
  ];
}

export function buildAdminMpBuilderBreadcrumbs(cycleName: string): AdminMpBreadcrumb[] {
  return [
    { labelKey: "auth.admin.breadcrumb.admin", href: ADMIN_ROOT_PATH },
    {
      labelKey: "auth.admin.breadcrumb.marketPulse",
      href: ADMIN_MARKET_PULSE_PATH,
    },
    { label: cycleName },
  ];
}
