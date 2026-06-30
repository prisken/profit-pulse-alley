import type { MarketPulseHubPageData } from "@/lib/market-pulse/hub-data";

export type HubLobbyStatus =
  | "pre_launch"
  | "open"
  | "reveal_pending"
  | "revealed"
  | "closed";

export type HubPrimaryCtaKind =
  | "get_ready"
  | "play"
  | "sign_in"
  | "view_reveal"
  | "view_leaderboard"
  | "view_rules";

export type HubPrimaryCta = {
  kind: HubPrimaryCtaKind;
  href: string;
  disabled: boolean;
};

export function deriveHubLobbyStatus(
  data: Pick<
    MarketPulseHubPageData,
    | "leaderboardRevealed"
    | "runtimeOpen"
    | "hasDatabaseCycle"
    | "revealRemainingMs"
  >,
  playBlocked: boolean,
): HubLobbyStatus {
  if (playBlocked) {
    return "pre_launch";
  }
  if (!data.hasDatabaseCycle) {
    return "closed";
  }
  if (data.leaderboardRevealed) {
    return "revealed";
  }
  if (!data.runtimeOpen) {
    return "closed";
  }
  if (data.revealRemainingMs <= 0) {
    return "reveal_pending";
  }
  return "open";
}

export function deriveHubPrimaryCta(
  status: HubLobbyStatus,
  options: Readonly<{
    isAuthenticated: boolean;
    runtimeOpen: boolean;
  }>,
): HubPrimaryCta {
  const playHref = "/market-pulse/play";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(playHref)}`;

  switch (status) {
    case "pre_launch":
      return {
        kind: "get_ready",
        href: loginHref,
        disabled: true,
      };
    case "revealed":
      return {
        kind: "view_leaderboard",
        href: "/market-pulse/leaderboard",
        disabled: false,
      };
    case "open":
      if (options.isAuthenticated && options.runtimeOpen) {
        return { kind: "play", href: playHref, disabled: false };
      }
      if (!options.isAuthenticated) {
        return { kind: "sign_in", href: loginHref, disabled: false };
      }
      return {
        kind: "view_rules",
        href: "/market-pulse/rules",
        disabled: false,
      };
    case "reveal_pending":
      return {
        kind: "view_reveal",
        href: "/market-pulse/reveal",
        disabled: false,
      };
    case "closed":
    default:
      return {
        kind: "view_leaderboard",
        href: "/market-pulse/leaderboard",
        disabled: false,
      };
  }
}
