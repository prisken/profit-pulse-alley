import Link from "next/link";
import { ArrowRight, Lock, Trophy } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";
import {
  buildSamplePulseBoardPreview,
  getHomePulseBoardPreview,
  type HomePulseBoardPreview,
  type HomePulseBoardPreviewRow,
} from "@/lib/market-pulse/homepage-pulse-preview";
import {
  MP_FOCUS_RING,
  MP_HOME_SECTION,
  MP_METRIC_TEXT,
  MP_PULSE_LIVE_CHIP,
  MP_TERMINAL_PANEL,
  MP_TICKER_TEXT,
  mergeMpClasses,
} from "@/lib/market-pulse/visual-primitives";

const SAMPLE_PLAYER_KEYS = [
  "home.pulseBoard.sample.player1",
  "home.pulseBoard.sample.player2",
  "home.pulseBoard.sample.player3",
] as const;

function resolvePreviewData(
  preview: HomePulseBoardPreview,
  samplePlayerNames: readonly string[],
): HomePulseBoardPreview {
  if (preview.state === "sample" && preview.rows.length === 0) {
    return buildSamplePulseBoardPreview(samplePlayerNames);
  }

  if (preview.state === "sample") {
    return {
      ...preview,
      rows: preview.rows.map((row, index) => ({
        ...row,
        playerName: samplePlayerNames[index] ?? row.playerName,
      })),
    };
  }

  return preview;
}

function titleKeyForState(
  state: HomePulseBoardPreview["state"],
):
  | "home.pulseBoard.revealed.title"
  | "home.pulseBoard.locked.title"
  | "home.pulseBoard.sample.title" {
  switch (state) {
    case "revealed":
      return "home.pulseBoard.revealed.title";
    case "locked":
      return "home.pulseBoard.locked.title";
    default:
      return "home.pulseBoard.sample.title";
  }
}

function RankBadge({
  rank,
  revealed,
}: Readonly<{ rank: number | null; revealed: boolean }>) {
  if (rank == null) {
    return (
      <span
        className={mergeMpClasses(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-mp-obsidian-elevated text-amber-300/90 sm:h-9 sm:w-9",
        )}
        aria-hidden="true"
      >
        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
    );
  }

  const rankClass =
    rank === 1 && revealed
      ? "bg-mp-pulse/15 text-mp-pulse ring-1 ring-mp-pulse/30"
      : "bg-mp-obsidian-elevated text-zinc-200 ring-1 ring-white/10";

  return (
    <span
      className={mergeMpClasses(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm",
        MP_METRIC_TEXT,
        rankClass,
      )}
      aria-hidden="true"
    >
      {rank}
    </span>
  );
}

function PulseBoardRow({
  row,
  state,
  lockedSlotLabel,
  sampleScoreLabel,
}: Readonly<{
  row: HomePulseBoardPreviewRow;
  state: HomePulseBoardPreview["state"];
  lockedSlotLabel: string;
  sampleScoreLabel: string;
}>) {
  const showScore = state === "revealed" && row.score !== undefined;
  const playerLabel =
    state === "locked"
      ? lockedSlotLabel
      : state === "sample"
        ? row.playerName
        : row.playerName;

  return (
    <li className="flex items-center gap-3 px-3 py-3 sm:px-4">
      <RankBadge rank={row.rank} revealed={state === "revealed"} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100 sm:text-base">
        {playerLabel}
      </span>
      {showScore ? (
        <span
          className={mergeMpClasses(
            "shrink-0 font-semibold text-mp-pulse",
            MP_METRIC_TEXT,
            "text-sm sm:text-base",
          )}
        >
          {row.score}
        </span>
      ) : state === "locked" ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-300/90 sm:text-sm">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          <span className={MP_METRIC_TEXT}>—</span>
        </span>
      ) : (
        <span
          className={mergeMpClasses(
            "shrink-0 text-sm text-zinc-500",
            MP_METRIC_TEXT,
          )}
          aria-hidden="true"
        >
          {sampleScoreLabel}
        </span>
      )}
    </li>
  );
}

export default async function HomePulseBoardWidget() {
  const { t } = await getServerTranslations();
  const samplePlayerNames = SAMPLE_PLAYER_KEYS.map((key) => t(key));
  const rawPreview = await getHomePulseBoardPreview();
  const preview = resolvePreviewData(rawPreview, samplePlayerNames);
  const titleKey = titleKeyForState(preview.state);

  return (
    <section
      className={MP_HOME_SECTION}
      aria-labelledby="home-pulse-board-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div
          className={mergeMpClasses(
            MP_TERMINAL_PANEL,
            "border-mp-pulse/10 p-4 shadow-[0_0_32px_rgba(0,230,118,0.04)] sm:p-6",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-mp-pulse/90">
                  <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <h2
                    id="home-pulse-board-heading"
                    className="text-lg font-bold text-white sm:text-xl"
                  >
                    {t(titleKey)}
                  </h2>
                </div>
                {preview.state === "sample" ? (
                  <span
                    className={mergeMpClasses(
                      MP_TICKER_TEXT,
                      "rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-zinc-400",
                    )}
                  >
                    {t("home.pulseBoard.sample.badge")}
                  </span>
                ) : null}
                {preview.state === "revealed" ? (
                  <span
                    className={mergeMpClasses(
                      MP_PULSE_LIVE_CHIP,
                      MP_TICKER_TEXT,
                      "rounded-full px-2 py-0.5",
                    )}
                  >
                    {t("home.pulseBoard.revealed.badge")}
                  </span>
                ) : null}
              </div>
              {preview.cycleName ? (
                <p className="mt-1.5 text-sm text-mp-muted">
                  {t("home.pulseBoard.cycleLabel").replace(
                    "{cycleName}",
                    preview.cycleName,
                  )}
                </p>
              ) : null}
              {preview.state === "locked" ? (
                <p className="mt-2 text-sm text-amber-100/90">
                  {t("home.pulseBoard.locked.message")}
                </p>
              ) : null}
              {preview.state === "sample" ? (
                <p className="mt-2 text-sm text-zinc-500">
                  {t("home.pulseBoard.sample.note")}
                </p>
              ) : null}
            </div>
            <Link
              href="/market-pulse/leaderboard"
              aria-label={t("home.pulseBoard.ctaAria")}
              className={mergeMpClasses(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-mp-pulse/25 bg-mp-pulse/10 px-4 py-2 text-sm font-semibold text-mp-pulse transition-colors hover:bg-mp-pulse/15",
                MP_FOCUS_RING,
              )}
            >
              {t("home.pulseBoard.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ol
            className={mergeMpClasses(
              "mt-4 divide-y divide-white/[0.06] overflow-hidden sm:mt-5",
              MP_TERMINAL_PANEL,
              preview.state === "locked" &&
                "border-amber-500/15 bg-amber-500/[0.03]",
            )}
            aria-label={t("home.pulseBoard.listAria")}
          >
            {preview.rows.map((row, index) => (
              <PulseBoardRow
                key={`${preview.state}-${row.rank ?? "locked"}-${index}`}
                row={row}
                state={preview.state}
                lockedSlotLabel={t("home.pulseBoard.locked.slot")}
                sampleScoreLabel={t("home.pulseBoard.sample.scoreHidden")}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
