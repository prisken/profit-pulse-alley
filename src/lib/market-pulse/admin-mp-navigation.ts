export const ADMIN_ROOT_PATH = "/admin";
export const ADMIN_MARKET_PULSE_PATH = "/admin/market-pulse";

export { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-builder-paths";

export const MARKET_PULSE_PUBLIC_PATHS = {
  hub: "/market-pulse",
  play: "/market-pulse/play",
  leaderboard: "/market-pulse/leaderboard",
  reveal: "/market-pulse/reveal",
} as const;

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
