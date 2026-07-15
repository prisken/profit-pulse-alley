import Link from "next/link";
import { ArrowRight, Crown, Lock, Medal, Trophy } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/server";
import {
  buildSamplePulseBoardPreview,
  getHomePulseBoardPreview,
  type HomePulseBoardPreview,
  type HomePulseBoardPreviewRow,
} from "@/lib/market-pulse/homepage-pulse-preview";
import {
  MP_FOCUS_RING_AMBER,
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
  highlightWinner,
}: Readonly<{ rank: number | null; highlightWinner: boolean }>) {
  if (rank == null) {
    return (
      <span
        className={mergeMpClasses(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-mp-obsidian-elevated text-amber-300/90 sm:h-10 sm:w-10",
        )}
        aria-hidden="true"
      >
        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
    );
  }

  if (rank === 1 && highlightWinner) {
    return (
      <span
        className={mergeMpClasses(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 shadow-[0_0_24px_rgba(251,191,36,0.45)] ring-2 ring-amber-300/60 sm:h-11 sm:w-11",
        )}
        aria-hidden="true"
      >
        <Trophy className="h-5 w-5" />
      </span>
    );
  }

  if (rank === 2 && highlightWinner) {
    return (
      <span
        className={mergeMpClasses(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-400/20 text-zinc-100 ring-1 ring-zinc-300/35 sm:h-10 sm:w-10",
        )}
        aria-hidden="true"
      >
        <Medal className="h-4 w-4" />
      </span>
    );
  }

  if (rank === 3 && highlightWinner) {
    return (
      <span
        className={mergeMpClasses(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/35 sm:h-10 sm:w-10",
        )}
        aria-hidden="true"
      >
        <Medal className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span
      className={mergeMpClasses(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mp-obsidian-elevated text-xs font-bold text-zinc-200 ring-1 ring-white/10 sm:h-10 sm:w-10 sm:text-sm",
        MP_METRIC_TEXT,
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
  winnerBadge,
}: Readonly<{
  row: HomePulseBoardPreviewRow;
  state: HomePulseBoardPreview["state"];
  lockedSlotLabel: string;
  sampleScoreLabel: string;
  winnerBadge: string;
}>) {
  const showScore = state === "revealed" && row.score !== undefined;
  const highlightRanks = state === "revealed" || state === "sample";
  const isWinner = highlightRanks && row.rank === 1;
  const isPodium = highlightRanks && row.rank != null && row.rank <= 3;
  const playerLabel =
    state === "locked"
      ? lockedSlotLabel
      : state === "sample"
        ? row.playerName
        : row.playerName;

  return (
    <li
      className={mergeMpClasses(
        "relative overflow-hidden rounded-xl border px-3 py-3 transition-[border-color,box-shadow,transform] sm:rounded-2xl sm:px-4 sm:py-3.5",
        isWinner
          ? "border-amber-400/45 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-mp-obsidian-panel shadow-[0_12px_40px_rgba(251,191,36,0.18)] sm:scale-[1.01]"
          : isPodium
            ? "border-white/[0.1] bg-gradient-to-r from-white/[0.05] to-transparent"
            : "border-white/[0.06] bg-black/25",
        state === "locked" && "border-amber-500/15 bg-amber-500/[0.03]",
      )}
    >
      {isWinner ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-300 via-amber-400/80 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl"
            aria-hidden="true"
          />
        </>
      ) : null}

      <div className="relative flex items-center gap-3">
        <RankBadge rank={row.rank} highlightWinner={highlightRanks} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={mergeMpClasses(
                "truncate text-sm font-semibold sm:text-base",
                isWinner ? "text-amber-50" : "text-zinc-100",
              )}
            >
              {playerLabel}
            </span>
            {isWinner ? (
              <span
                className={mergeMpClasses(
                  MP_TICKER_TEXT,
                  "inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-amber-200",
                )}
              >
                <Crown className="h-3 w-3" aria-hidden="true" />
                {winnerBadge}
              </span>
            ) : null}
          </div>
        </div>
        {showScore ? (
          <span
            className={mergeMpClasses(
              "shrink-0 font-bold sm:text-lg",
              MP_METRIC_TEXT,
              isWinner ? "text-amber-300" : "text-mp-pulse",
              "text-sm",
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
      </div>
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
            "group relative overflow-hidden",
            MP_TERMINAL_PANEL,
            "border-amber-400/20 bg-gradient-to-b from-amber-400/[0.07] via-mp-obsidian-panel to-mp-obsidian-panel p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:p-5",
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-400 via-amber-400/70 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-400/20 opacity-80 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-mp-pulse/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/12 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.2)] sm:h-11 sm:w-11">
                    <Trophy className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2
                    id="home-pulse-board-heading"
                    className="text-xl font-bold tracking-tight text-white sm:text-2xl"
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
                <p className="mt-2 text-sm text-mp-muted">
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
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-amber-400/15",
                MP_FOCUS_RING_AMBER,
              )}
            >
              {t("home.pulseBoard.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ol
            className="relative mt-4 flex flex-col gap-2.5 sm:mt-5 sm:gap-3"
            aria-label={t("home.pulseBoard.listAria")}
          >
            {preview.rows.map((row, index) => (
              <PulseBoardRow
                key={`${preview.state}-${row.rank ?? "locked"}-${index}`}
                row={row}
                state={preview.state}
                lockedSlotLabel={t("home.pulseBoard.locked.slot")}
                sampleScoreLabel={t("home.pulseBoard.sample.scoreHidden")}
                winnerBadge={t("home.pulseBoard.winnerBadge")}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
