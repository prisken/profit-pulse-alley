"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { saveMarketPulseScore } from "@/lib/market-pulse/actions";
import { DEFAULT_MARKET_PULSE_SETTINGS } from "@/lib/market-pulse/settings";
import type { MarketPulseSettings } from "@/lib/market-pulse/types";

const STARTUP_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS9mkTwOKXPq79Zs2BEQHUBZaYH_vO381H7aK1VVNp0MXUmcTo0syJRSoDkBwHMo8N5oVcnBYV8MlqI/pub?gid=0&single=true&output=csv";

const NEWS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS9mkTwOKXPq79Zs2BEQHUBZaYH_vO381H7aK1VVNp0MXUmcTo0syJRSoDkBwHMo8N5oVcnBYV8MlqI/pub?gid=1253735167&single=true&output=csv";

const INITIAL_CASH = 100_000_000;
const VALUATION_MULTIPLIER = 2_000_000;
const OWNERSHIP_FRACTION = 0.1;
const MARKET_CRASH_FACTOR = 0.7;

type GameState = "loading" | "playing" | "yearEnd" | "gameOver";

type StartupDeal = {
  company_name: string;
  one_liner_pitch: string;
  team_rating: number;
  hype_rating: number;
  idea_rating: number;
  theme_week: string;
};

type PortfolioCompany = StartupDeal & {
  initialValuation: number;
  currentValuation: number;
  ask: number;
  investedYear: number;
};

type NewsEvent = {
  event_name: string;
  event_description: string;
  theme_target: string;
  multiplier: number;
};

type YearEndSummary = {
  event: NewsEvent;
  effectiveMultiplier: number;
  impacts: Array<{ company_name: string; before: number; after: number }>;
};

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(/[\t,]+/)
    .map((h) => h.trim().replace(/^,+|,+$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(/[\t,]+/).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapStartupRow(row: Record<string, string>): StartupDeal | null {
  const company_name = row.company_name?.trim();
  if (!company_name) return null;

  return {
    company_name,
    one_liner_pitch: row.one_liner_pitch?.trim() ?? "",
    team_rating: toNumber(row.team_rating ?? "0"),
    hype_rating: toNumber(row.hype_rating ?? "0"),
    idea_rating: toNumber(row.idea_rating ?? "0"),
    theme_week: row.theme_week?.trim() ?? "Wildcard",
  };
}

function mapNewsRow(row: Record<string, string>): NewsEvent | null {
  const event_name = row.event_name?.trim();
  if (!event_name) return null;

  return {
    event_name,
    event_description: row.event_description?.trim() ?? "",
    theme_target: row.theme_target?.trim() ?? "Wildcard",
    multiplier: toNumber(row.multiplier ?? "1"),
  };
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateValuation(
  deal: StartupDeal,
  marketCrash: boolean,
): { valuation: number; ask: number } {
  const base =
    (deal.team_rating + deal.hype_rating + deal.idea_rating) *
    VALUATION_MULTIPLIER;
  const valuation = marketCrash ? base * MARKET_CRASH_FACTOR : base;
  const ask = valuation * OWNERSHIP_FRACTION;
  return { valuation, ask };
}

function holdingValue(company: PortfolioCompany): number {
  return company.currentValuation * OWNERSHIP_FRACTION;
}

function effectiveNewsMultiplier(
  multiplier: number,
  unicornDay: boolean,
): number {
  if (!unicornDay) return multiplier;
  return 1 + (multiplier - 1) * 2;
}

export default function MarketPulseGame() {
  const [gameSettings, setGameSettings] = useState<MarketPulseSettings>(
    DEFAULT_MARKET_PULSE_SETTINGS,
  );
  const [cash, setCash] = useState(INITIAL_CASH);
  const [portfolio, setPortfolio] = useState<PortfolioCompany[]>([]);
  const [currentYear, setCurrentYear] = useState(2026);
  const [shuffledDeals, setShuffledDeals] = useState<StartupDeal[]>([]);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [yearEndSummary, setYearEndSummary] = useState<YearEndSummary | null>(
    null,
  );
  const [initError, setInitError] = useState<string | null>(null);
  const [pendingDealIndex, setPendingDealIndex] = useState<number | null>(null);
  const scoreSavedRef = useRef(false);

  const appendLog = useCallback((message: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const marketCrashActive = gameSettings.event === "Market Crash";
  const unicornDayActive = gameSettings.event === "Unicorn Day";

  const currentDeal = shuffledDeals[currentDealIndex] ?? null;

  const currentDealPricing = useMemo(() => {
    if (!currentDeal) return null;
    return calculateValuation(currentDeal, marketCrashActive);
  }, [currentDeal, marketCrashActive]);

  const portfolioValue = useMemo(
    () => portfolio.reduce((sum, company) => sum + holdingValue(company), 0),
    [portfolio],
  );

  const totalNetWorth = cash + portfolioValue;

  const initializeGame = useCallback(async () => {
    setGameState("loading");
    setInitError(null);
    scoreSavedRef.current = false;
    setCash(INITIAL_CASH);
    setPortfolio([]);
    setCurrentYear(2026);
    setCurrentDealIndex(0);
    setLog([]);
    setYearEndSummary(null);
    setPendingDealIndex(null);

    try {
      const [settingsRes, startupsRes, newsRes] = await Promise.all([
        fetch("/api/game-settings"),
        fetch(STARTUP_CSV_URL),
        fetch(NEWS_CSV_URL),
      ]);

      if (!settingsRes.ok || !startupsRes.ok || !newsRes.ok) {
        throw new Error("Failed to load game data");
      }

      const settings = (await settingsRes.json()) as MarketPulseSettings;
      const startupsCsv = await startupsRes.text();
      const newsCsv = await newsRes.text();

      const allStartups = parseCsv(startupsCsv)
        .map(mapStartupRow)
        .filter((deal): deal is StartupDeal => deal !== null);

      const filtered =
        settings.theme === "Wildcard"
          ? allStartups
          : allStartups.filter((deal) => deal.theme_week === settings.theme);

      const allNews = parseCsv(newsCsv)
        .map(mapNewsRow)
        .filter((event): event is NewsEvent => event !== null);

      if (filtered.length === 0) {
        throw new Error("No startup deals available for the selected theme.");
      }

      setGameSettings(settings);
      setShuffledDeals(shuffle(filtered));
      setNewsEvents(allNews.length > 0 ? allNews : []);
      appendLog(
        `Game started — Theme: ${settings.theme}, Event: ${settings.event}, ${filtered.length} deals loaded.`,
      );
      setGameState("playing");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initialize game.";
      setInitError(message);
      setGameState("gameOver");
    }
  }, [appendLog]);

  useEffect(() => {
    void initializeGame();
  }, [initializeGame]);

  const runYearEnd = useCallback(
    (nextDealIndex: number) => {
      if (newsEvents.length === 0) {
        setCurrentYear((y) => y + 1);
        setCurrentDealIndex(nextDealIndex);
        setGameState("playing");
        appendLog("Year-end: no news events loaded, advancing.");
        return;
      }

      const event =
        newsEvents[Math.floor(Math.random() * newsEvents.length)]!;
      const effectiveMultiplier = effectiveNewsMultiplier(
        event.multiplier,
        unicornDayActive,
      );

      const impacts: YearEndSummary["impacts"] = [];

      setPortfolio((prev) =>
        prev.map((company) => {
          const matches =
            event.theme_target === "Wildcard" ||
            event.theme_target === company.theme_week;

          if (!matches) {
            return company;
          }

          const before = holdingValue(company);
          const afterValuation = company.currentValuation * effectiveMultiplier;
          const after = afterValuation * OWNERSHIP_FRACTION;

          impacts.push({
            company_name: company.company_name,
            before,
            after,
          });

          return { ...company, currentValuation: afterValuation };
        }),
      );

      setCurrentYear((y) => y + 1);
      setYearEndSummary({ event, effectiveMultiplier, impacts });
      setPendingDealIndex(nextDealIndex);
      setGameState("yearEnd");

      appendLog(
        `Year ${currentYear + 1}: ${event.event_name} (×${effectiveMultiplier.toFixed(2)}) — ${impacts.length} holding(s) affected.`,
      );
    },
    [appendLog, currentYear, newsEvents, unicornDayActive],
  );

  const handleGameOver = useCallback(
    (
      finalCash: number,
      finalPortfolio: PortfolioCompany[],
      logMessage: string,
    ) => {
      setGameState("gameOver");
      appendLog(logMessage);

      if (scoreSavedRef.current) {
        return;
      }
      scoreSavedRef.current = true;

      const finalPortfolioValue = finalPortfolio.reduce(
        (sum, company) => sum + holdingValue(company),
        0,
      );
      const finalScore = Math.round(finalCash + finalPortfolioValue);

      void saveMarketPulseScore(finalScore).then((result) => {
        if (result.saved) {
          appendLog(
            `Score saved to your profile (${formatMoney(finalScore)}).`,
          );
          return;
        }

        appendLog(result.error);
      });
    },
    [appendLog],
  );

  const checkGameOver = useCallback(
    (
      nextCash: number,
      nextDealIndex: number,
      nextPortfolio: PortfolioCompany[],
    ) => {
      if (nextCash < 0) {
        handleGameOver(
          nextCash,
          nextPortfolio,
          "Game over — cash balance fell below zero.",
        );
        return true;
      }
      if (nextDealIndex >= shuffledDeals.length) {
        handleGameOver(
          nextCash,
          nextPortfolio,
          "Game over — all deals reviewed.",
        );
        return true;
      }
      return false;
    },
    [handleGameOver, shuffledDeals.length],
  );

  const advanceAfterDecision = useCallback(
    (nextCash: number, nextPortfolio: PortfolioCompany[]) => {
      const nextIndex = currentDealIndex + 1;

      if (checkGameOver(nextCash, nextIndex, nextPortfolio)) {
        setCash(nextCash);
        setPortfolio(nextPortfolio);
        return;
      }

      if (nextIndex > 0 && nextIndex % 3 === 0) {
        setCash(nextCash);
        setPortfolio(nextPortfolio);
        runYearEnd(nextIndex);
        return;
      }

      setCash(nextCash);
      setPortfolio(nextPortfolio);
      setCurrentDealIndex(nextIndex);
    },
    [checkGameOver, currentDealIndex, runYearEnd],
  );

  function handleInvest() {
    if (!currentDeal || !currentDealPricing || gameState !== "playing") return;

    const { ask, valuation } = currentDealPricing;

    if (cash < ask) {
      appendLog(`Cannot invest in ${currentDeal.company_name} — insufficient cash.`);
      return;
    }

    const nextCash = cash - ask;
    const holding: PortfolioCompany = {
      ...currentDeal,
      initialValuation: valuation,
      currentValuation: valuation,
      ask,
      investedYear: currentYear,
    };

    const nextPortfolio = [...portfolio, holding];
    appendLog(
      `Invested ${formatMoney(ask)} in ${currentDeal.company_name} (${formatMoney(valuation)} valuation).`,
    );

    advanceAfterDecision(nextCash, nextPortfolio);
  }

  function handlePass() {
    if (!currentDeal || gameState !== "playing") return;
    appendLog(`Passed on ${currentDeal.company_name}.`);
    advanceAfterDecision(cash, portfolio);
  }

  function handleYearEndContinue() {
    if (pendingDealIndex !== null) {
      setCurrentDealIndex(pendingDealIndex);
      setPendingDealIndex(null);
    }
    setYearEndSummary(null);
    setGameState("playing");
  }

  if (gameState === "loading") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="mt-4 text-sm text-zinc-400">Loading VC Challenge…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Market Pulse
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Weekly theme:{" "}
            <span className="font-medium text-amber-400">{gameSettings.theme}</span>
            {" · "}
            Active event:{" "}
            <span className="font-medium text-amber-400">{gameSettings.event}</span>
          </p>
        </header>

        {(marketCrashActive || unicornDayActive) && gameState === "playing" ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-2 text-sm font-medium ${
              marketCrashActive
                ? "border-red-500/40 bg-red-950/50 text-red-200"
                : "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
            }`}
          >
            {marketCrashActive
              ? "Market Crash active — all valuations and asks reduced by 30%."
              : "Unicorn Day active — year-end news multipliers are doubled."}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Left — game area */}
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard label="Cash" value={formatMoney(cash)} />
              <StatCard label="Year" value={String(currentYear)} />
              <StatCard
                label="Portfolio Value"
                value={formatMoney(portfolioValue)}
                className="col-span-2 sm:col-span-1"
              />
            </div>

            {gameState === "playing" && currentDeal && currentDealPricing ? (
              <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Deal {currentDealIndex + 1} of {shuffledDeals.length}
                </p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  {currentDeal.company_name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {currentDeal.one_liner_pitch}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Theme: {currentDeal.theme_week}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <RatingBadge label="Team" value={currentDeal.team_rating} />
                  <RatingBadge label="Hype" value={currentDeal.hype_rating} />
                  <RatingBadge label="Idea" value={currentDeal.idea_rating} />
                </dl>

                <div className="mt-5 grid gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/60 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-zinc-500">Valuation</p>
                    <p className="text-lg font-semibold text-white">
                      {formatMoney(currentDealPricing.valuation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Ask (10% stake)</p>
                    <p className="text-lg font-semibold text-amber-400">
                      {formatMoney(currentDealPricing.ask)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleInvest}
                    disabled={cash < currentDealPricing.ask}
                    className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Invest
                  </button>
                  <button
                    type="button"
                    onClick={handlePass}
                    className="flex-1 rounded-full border border-zinc-600 bg-zinc-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                  >
                    Pass
                  </button>
                </div>
              </article>
            ) : gameState === "playing" ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
                No deals remaining.
              </p>
            ) : null}
          </section>

          {/* Right — portfolio & log */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Portfolio
              </h3>
              {portfolio.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">No investments yet.</p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {portfolio.map((company) => (
                    <li
                      key={`${company.company_name}-${company.investedYear}`}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
                    >
                      <p className="font-medium text-white">{company.company_name}</p>
                      <p className="text-xs text-zinc-500">{company.theme_week}</p>
                      <p className="mt-1 text-sm text-emerald-400">
                        {formatMoney(holdingValue(company))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Game Log
              </h3>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-xs leading-relaxed text-zinc-400">
                {log.length === 0 ? (
                  <li>No actions yet.</li>
                ) : (
                  log.map((entry, index) => (
                    <li key={`${entry}-${index}`} className="border-b border-zinc-800/80 pb-2">
                      {entry}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </aside>
        </div>
      </div>

      {/* Year End modal */}
      {gameState === "yearEnd" && yearEndSummary ? (
        <Modal title={`Year ${currentYear} — Market Update`}>
          <p className="text-lg font-semibold text-amber-400">
            {yearEndSummary.event.event_name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {yearEndSummary.event.event_description}
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            Target:{" "}
            <span className="text-white">{yearEndSummary.event.theme_target}</span>
            {" · "}
            Multiplier:{" "}
            <span className="text-white">
              ×{yearEndSummary.effectiveMultiplier.toFixed(2)}
            </span>
            {unicornDayActive ? " (Unicorn Day doubled)" : ""}
          </p>

          {yearEndSummary.impacts.length > 0 ? (
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm">
              {yearEndSummary.impacts.map((impact) => (
                <li
                  key={impact.company_name}
                  className="flex justify-between gap-2 rounded-lg bg-zinc-800/80 px-3 py-2"
                >
                  <span>{impact.company_name}</span>
                  <span className="text-zinc-400">
                    {formatMoney(impact.before)} →{" "}
                    <span
                      className={
                        impact.after >= impact.before
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {formatMoney(impact.after)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              No portfolio holdings matched this event&apos;s theme.
            </p>
          )}

          <button
            type="button"
            onClick={handleYearEndContinue}
            className="mt-6 w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Continue
          </button>
        </Modal>
      ) : null}

      {/* Game Over modal */}
      {gameState === "gameOver" ? (
        <Modal title="Game Over">
          {initError ? (
            <p className="text-sm text-red-400">{initError}</p>
          ) : (
            <>
              <p className="text-sm text-zinc-300">
                {cash < 0
                  ? "You ran out of cash."
                  : "You have reviewed every deal in the pipeline."}
              </p>
              <dl className="mt-6 space-y-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Final cash</dt>
                  <dd className="font-semibold">{formatMoney(cash)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">Portfolio value</dt>
                  <dd className="font-semibold text-emerald-400">
                    {formatMoney(portfolioValue)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-700 pt-3">
                  <dt className="font-medium text-white">Total net worth</dt>
                  <dd className="text-lg font-bold text-amber-400">
                    {formatMoney(totalNetWorth)}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-zinc-500">Holdings</dt>
                  <dd>{portfolio.length}</dd>
                </div>
              </dl>
            </>
          )}
          <button
            type="button"
            onClick={() => void initializeGame()}
            className="mt-6 w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Play Again
          </button>
        </Modal>
      ) : null}
    </main>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 sm:px-4 ${className}`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white sm:text-base">{value}</p>
    </div>
  );
}

function RatingBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-zinc-800/80 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}

function Modal({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
