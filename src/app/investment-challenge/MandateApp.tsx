"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  BarChart2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Cpu,
  Crown,
  Diamond,
  Flame,
  Landmark,
  Minus,
  Newspaper,
  Home,
  RotateCcw,
  ShieldAlert,
  Swords,
  Ticket,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import {
  calculateDailyPerformance,
  eventsData,
  sp500Benchmark,
  philosophyModifiers,
  type MarketEvent,
  type MarketEventCategory,
  type PlayerPhilosophy,
  type RiskMandateLabel,
  getInvestedWeight,
} from "./gameLogic";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Screen = "welcome" | "modeSelection" | "planning" | "live" | "review" | "voucher";

type GameMode = "standard" | "sprint";
type GameConfig = {
  mode: GameMode;
  days: 10 | 5;
};

type CorePhilosophy = PlayerPhilosophy;
type PlanningStep = "philosophy" | "timeline";

type RiskMandate =
  | "fullDefense"
  | "cautious"
  | "balanced"
  | "aggressive"
  | "leveragedAggressive";

type LiveLogEntry = {
  day: number; // 1-indexed
  mandateLabel: string;
  philosophyReturn: number;
  dailyPL: number;
  endValue: number;
  intervention?: {
    originalMandateLabel: string;
    newMandateLabel: string;
    feeCost: number;
  };
};

type MarketCondition = "neutral" | "bull" | "bear" | "volatile";

const philosophyDetails: Record<
  PlayerPhilosophy,
  {
    name: string;
    description: string;
    advantages: string[];
    disadvantages: string[];
    ability: { name: string; effect: string };
  }
> = {
  growth: {
    name: "成長型投資",
    description:
      "我追求全壘打，不是安打。我相信未來，並願意為高成長潛力冒險。目標：指數級增長！",
    advantages: ["科技/產業新聞收益 x1.5"],
    disadvantages: ["對監管/地緣政治更敏感"],
    ability: { name: "激進交易", effect: "將當日的市場波動放大 50%！" },
  },
  value: {
    name: "價值型投資",
    description:
      "別人恐懼我貪婪。我專注於在沙礫中尋找被低估的黃金，然後耐心等待市場發現它的價值。",
    advantages: ["經濟/基本面新聞收益 x1.4"],
    disadvantages: ["對科技炒作反應較慢"],
    ability: { name: "穩健化重組", effect: "將當日的市場波動削減 50%。" },
  },
  technical: {
    // Copy shift: present this role as "Balanced" to reduce jargon.
    name: "穩健平衡",
    description:
      "穩健是我的代名詞。我尋求在風險與回報之間取得完美的平衡，追求長期、穩定的複利增長。",
    advantages: ["精準出手可獲得額外獎勵"],
    disadvantages: ["可能錯過基本面驅動的大行情"],
    ability: { name: "精準擇時", effect: "在關鍵時機干預以獲取額外收益。" },
  },
};

function applyMarketDNA(baseImpact: number, condition: MarketCondition) {
  if (condition === "bull") return baseImpact >= 0 ? baseImpact * 1.1 : baseImpact * 0.9;
  if (condition === "bear") return baseImpact >= 0 ? baseImpact * 0.9 : baseImpact * 1.1;
  if (condition === "volatile") return baseImpact * 1.25;
  return baseImpact;
}

function ScrollEdgeArrows({
  targetRef,
  scrollByPx = 260,
  className = "",
}: {
  targetRef: RefObject<HTMLElement | null>;
  scrollByPx?: number;
  className?: string;
}) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxLeft = scrollWidth - clientWidth;
      const hasOverflow = scrollWidth > clientWidth + 2;
      setCanScrollLeft(hasOverflow && scrollLeft > 2);
      setCanScrollRight(hasOverflow && scrollLeft < maxLeft - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [targetRef]);

  return (
    <div className={`pointer-events-none absolute inset-y-0 left-0 right-0 ${className}`}>
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => targetRef.current?.scrollBy({ left: -scrollByPx, behavior: "smooth" })}
          className="pointer-events-auto absolute left-1 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2 text-white/90 shadow-lg shadow-black/30 backdrop-blur hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label="向左捲動"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => targetRef.current?.scrollBy({ left: scrollByPx, behavior: "smooth" })}
          className="pointer-events-auto absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 p-2 text-white/90 shadow-lg shadow-black/30 backdrop-blur hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label="向右捲動"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function calculateFinalScore(
  portfolioValues: number[],
  initialValue: number,
  interventionsCount: number,
) {
  if (!portfolioValues || portfolioValues.length < 2) return 0;

  const dailyReturns: number[] = [];
  for (let i = 1; i < portfolioValues.length; i += 1) {
    const prev = portfolioValues[i - 1];
    const curr = portfolioValues[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) continue;
    dailyReturns.push((curr - prev) / prev);
  }

  const mean =
    dailyReturns.length > 0
      ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
      : 0;
  const variance =
    dailyReturns.length > 0
      ? dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / dailyReturns.length
      : 0;
  const volatility = Math.sqrt(variance);

  const finalValue = portfolioValues[portfolioValues.length - 1] ?? initialValue;
  const totalReturn = (finalValue - initialValue) / initialValue;

  const riskAdjustedMetric = totalReturn / (volatility + 0.01);

  let interventionMultiplier = 1.0;
  if (interventionsCount === 0) interventionMultiplier = 1.2;
  else if (interventionsCount >= 3) interventionMultiplier = 0.8;

  return Math.floor(riskAdjustedMetric * 1000 * interventionMultiplier);
}

function scoreToPercentile(score: number) {
  const normalizedScore = score / 1000;
  const percentile = (Math.atan(normalizedScore) / Math.PI + 0.5) * 100;
  const clamped = Math.min(99.9, Math.max(5.0, percentile));
  return Number(clamped.toFixed(1));
}

function GradeBadge({ score, displayScore }: { score: number; displayScore?: number }) {
  const grade = (() => {
    if (score > 1500) return { letter: "S", title: "投資之神", ring: "ring-amber-300/30", bg: "bg-amber-300/15", text: "text-amber-200" };
    if (score > 800) return { letter: "A", title: "華爾街巨星", ring: "ring-sky-300/30", bg: "bg-sky-300/15", text: "text-sky-200" };
    if (score > 300) return { letter: "B", title: "市場菁英", ring: "ring-emerald-300/30", bg: "bg-emerald-300/15", text: "text-emerald-200" };
    if (score > 0) return { letter: "C", title: "合格操盤手", ring: "ring-zinc-200/20", bg: "bg-white/10", text: "text-zinc-100" };
    return { letter: "D", title: "待磨練的新手", ring: "ring-rose-300/30", bg: "bg-rose-300/15", text: "text-rose-200" };
  })();

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold text-zinc-200/70">最終評級</p>
      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className={`grid h-28 w-28 place-items-center rounded-full ${grade.bg} ring-1 ${grade.ring}`}
        >
          <span className={`text-5xl font-extrabold tracking-tight ${grade.text}`}>
            {grade.letter}
          </span>
        </motion.div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">{grade.title}</p>
          <p className="mt-1 font-mono text-xs font-semibold text-zinc-200/70">
            分數：{(displayScore ?? score).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function PeerComparison({ score }: { score: number }) {
  const percentile = scoreToPercentile(score);
  const left = `${percentile}%`;
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold text-zinc-200/70">市場同儕比較</p>

      <div className="mt-4">
        <div className="relative h-10 w-full overflow-hidden rounded-full border border-white/10 bg-black/20">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-500/30 via-sky-400/30 to-amber-300/40" />

          <motion.div
            className="absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.3),0_0_18px_rgba(255,255,255,0.35)]"
            initial={{ left: "0%" }}
            animate={{ left }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            style={{ transform: "translate(-50%, -50%)" }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-zinc-200/60">
          <span>新手</span>
          <span>傳奇</span>
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-200/70">
          你的表現超過了市場上{" "}
          <span className="font-mono font-semibold text-white">{percentile}%</span>{" "}
          的投資者
        </p>
      </div>
    </div>
  );
}

function NarrativeSummary({
  philosophy,
  prototypeTitle,
  interventionsCount,
  liveLog,
}: {
  philosophy: CorePhilosophy;
  prototypeTitle: string;
  interventionsCount: number;
  liveLog: LiveLogEntry[];
}) {
  const label =
    philosophy === "growth"
      ? "成長型投資者"
      : philosophy === "value"
        ? "價值型投資者"
        : "穩健平衡投資者";

  const keyMoments = (() => {
    if (liveLog.length === 0) return null;
    let best = liveLog[0];
    let worst = liveLog[0];
    for (const row of liveLog) {
      if (row.dailyPL > best.dailyPL) best = row;
      if (row.dailyPL < worst.dailyPL) worst = row;
    }
    return { best, worst };
  })();

  const styleLine =
    interventionsCount === 0
      ? "你幾乎沒有出手，堅持計畫，像「鑽石手」一樣忍住了噪音。"
      : interventionsCount >= 3
        ? "你頻繁出手，主動交易來對抗波動——這很強勢，但也更容易被情緒牽引。"
        : "你在關鍵時刻出手一次或兩次，既保留框架，也願意為確定性付出代價。";

  const momentLine = (() => {
    if (!keyMoments) return "";
    const bestEv = eventsData[keyMoments.best.day - 1];
    const worstEv = eventsData[keyMoments.worst.day - 1];
    return `你的轉折點出現在第 ${keyMoments.best.day} 天（${bestEv?.headline ?? "重大事件"}），你拿到了本輪最大單日上漲；但第 ${keyMoments.worst.day} 天（${worstEv?.headline ?? "衝擊事件"}）也給了你最沉重的一擊。`;
  })();

  const philosophyLine =
    philosophy === "growth"
      ? "成長型策略會放大創新/科技與監管敘事的影響：贏的時候贏很大，輸的時候也更痛。"
      : philosophy === "value"
        ? "價值型策略更偏好基本面與確定性：在宏觀/產業利好裡更穩健，在風險日更能「壓波動」。"
        : "穩健平衡更偏中性：你不會被某類新聞天然放大，但出手時機會決定你能否把波動變成優勢。";

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold text-zinc-200/70">
        投資者敘事
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-200/70">
        作為一個 <span className="font-semibold text-white">{label}</span>，
        {philosophyLine} {styleLine} {momentLine} 最终，这种路径把你带向了{" "}
        <span className="font-semibold text-white">{prototypeTitle}</span>。
      </p>
    </div>
  );
}

function DailyReviewTable({
  days,
  events,
  dailyResults,
  formatSignedCurrency,
}: {
  days: number;
  events: Array<{ headline: string; category: MarketEventCategory }>;
  dailyResults: Array<{ dailyPL: number }>;
  formatSignedCurrency: (v: number) => string;
}) {
  const maxAbs = Math.max(
    1,
    ...Array.from({ length: days }, (_, i) => Math.abs(dailyResults[i]?.dailyPL ?? 0)),
  );

  const eventIcons: Record<MarketEventCategory, React.ReactNode> = {
    economy: <BarChart2 className="h-6 w-6 text-blue-300" aria-hidden="true" />,
    monetary: <Landmark className="h-6 w-6 text-emerald-300" aria-hidden="true" />,
    industry: <Briefcase className="h-6 w-6 text-yellow-300" aria-hidden="true" />,
    tech: <Cpu className="h-6 w-6 text-purple-300" aria-hidden="true" />,
    geopolitics: <Flame className="h-6 w-6 text-rose-300" aria-hidden="true" />,
    regulation: <ShieldAlert className="h-6 w-6 text-orange-300" aria-hidden="true" />,
    market: <TrendingUp className="h-6 w-6 text-zinc-200/70" aria-hidden="true" />,
  };

  function SparkBar({ value }: { value: number }) {
    const widthPercentage = Math.min(100, (Math.abs(value) / maxAbs) * 100);
    const isPositive = value >= 0;
    return (
      <div className="h-3 w-full rounded-sm bg-white/10">
        <div
          style={{ width: `${widthPercentage}%` }}
          className={`h-full rounded-sm ${isPositive ? "bg-emerald-300/80" : "bg-rose-300/80"}`}
        />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold text-zinc-200/70">
        {days}日交易復盤
      </p>

      <div className="mt-4 grid gap-2">
        {Array.from({ length: days }, (_, idx) => {
          const pnl = dailyResults[idx]?.dailyPL ?? 0;
          const isPositive = pnl >= 0;
          const category = events[idx]?.category ?? "market";
          return (
            <div
              key={idx}
              className="grid grid-cols-[72px_40px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
            >
                  <div className="text-xs font-semibold text-zinc-200/70">
                    {`第${idx + 1}天`}
                  </div>
              <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
                {eventIcons[category]}
              </div>
              <SparkBar value={pnl} />
              <div
                className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                  isPositive ? "text-emerald-200" : "text-rose-200"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {formatSignedCurrency(pnl)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RISK_MANDATES: Array<{
  value: RiskMandate;
  label: string;
  detail: string;
  ratioTag: string;
}> = [
  { value: "fullDefense", label: "全面防禦", detail: "100% 現金", ratioTag: "0/100" },
  {
    value: "cautious",
    label: "謹慎",
    detail: "30% 投資、70% 現金",
    ratioTag: "30/70",
  },
  {
    value: "balanced",
    label: "平衡",
    detail: "60% 投資、40% 現金",
    ratioTag: "60/40",
  },
  { value: "aggressive", label: "進取", detail: "100% 投資", ratioTag: "100/0" },
  {
    value: "leveragedAggressive",
    label: "槓桿進取",
    detail: "150% 投資（使用槓桿）",
    ratioTag: "150/0",
  },
];

export default function MandateApp() {
  const INTERVENTION_COST = 1;
  const LIVE_PROCESSING_MS = 1500;
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [planningStep, setPlanningStep] = useState<PlanningStep>("philosophy");
  const [corePhilosophy, setCorePhilosophy] = useState<CorePhilosophy | null>(
    null,
  ); // locked in after confirmation
  const [corePhilosophyDraft, setCorePhilosophyDraft] =
    useState<CorePhilosophy | null>(null);
  const [warPlanDraft, setWarPlanDraft] = useState<Array<RiskMandate | null>>(
    [],
  );
  const [lockedWarPlan, setLockedWarPlan] = useState<RiskMandate[] | null>(null);
  const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [, setPreviousValue] = useState(100000);
  const [portfolioHistory, setPortfolioHistory] = useState<number[]>([100000]);
  const [benchmarkHistory, setBenchmarkHistory] = useState<number[]>([100000]);
  const [liveLog, setLiveLog] = useState<LiveLogEntry[]>([]);
  const [focus, setFocus] = useState<number>(3);
  const [interventionCooldownUntilDay, setInterventionCooldownUntilDay] =
    useState<number>(0); // legacy (kept for now)
  const [isDisciplinedEligible, setIsDisciplinedEligible] = useState(true);
  const [interventions, setInterventions] = useState<
    Array<{
      day: number;
      originalPlan: RiskMandate;
      newPlan: RiskMandate;
      feeCost: number;
      valueWithoutIntervention: number;
      valueWithIntervention: number;
    }>
  >([]);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [executedMandates, setExecutedMandates] = useState<RiskMandate[]>([]);
  const [rewardCopied, setRewardCopied] = useState(false);
  const [dayPhase, setDayPhase] = useState<
    "idle" | "news" | "marketOpen" | "pause" | "intervening"
  >("idle");
  const [displayedPortfolioValue, setDisplayedPortfolioValue] =
    useState<number>(100000);
  const [animatedPortfolioValue, setAnimatedPortfolioValue] =
    useState<number>(100000);
  const [dailyChangeFlash, setDailyChangeFlash] = useState<number | null>(null);
  const [marketMoveSign, setMarketMoveSign] = useState<"up" | "down" | null>(null);
  const [flashEffect, setFlashEffect] = useState<
    "value" | "growth" | "technical" | null
  >(null);
  const [scoreTicker, setScoreTicker] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionSecondsLeft, setDecisionSecondsLeft] = useState<number | null>(null);
  const [actionStamp, setActionStamp] = useState<string | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const decisionTimeoutRef = useRef<number | null>(null);
  const decisionTickRef = useRef<number | null>(null);
  const dailyChangeFlashTimeoutRef = useRef<number | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const warPlanTimelineScrollRef = useRef<HTMLDivElement | null>(null);
  const liveLogScrollRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [dotScope, dotAnimate] = useAnimate();

  const marketOpenTimeoutRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const newsTimeoutRef = useRef<number | null>(null);
  const marketOpenEndsAtRef = useRef<number | null>(null);
  const marketOpenRemainingMsRef = useRef<number | null>(null);
  const plannedMandateRef = useRef<RiskMandate | null>(null);
  const plannedOpenValueRef = useRef<number>(100000);
  const plannedTargetValueRef = useRef<number>(100000);
  const [currentNews, setCurrentNews] = useState<MarketEvent | null>(null);
  const [hoveredPhilosophy, setHoveredPhilosophy] =
    useState<PlayerPhilosophy | null>(null);
  const [marketCondition, setMarketCondition] =
    useState<MarketCondition>("neutral");
  const [criticalDays, setCriticalDays] = useState<number[]>([]);
  const [hoveredMode, setHoveredMode] = useState<GameMode | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const title = useMemo(() => "《決戰投報率》", []);

  function isTouchDevice() {
    if (typeof window === "undefined") return false;
    const nav = window.navigator as Navigator | undefined;
    return "ontouchstart" in window || (nav?.maxTouchPoints ?? 0) > 0;
  }

  function startGame(mode: GameMode) {
    setSelectedMode(null);
    if (mode === "sprint") {
      selectMode({ mode: "sprint", days: 5 });
      return;
    }
    selectMode({ mode: "standard", days: 10 });
  }

  function handleModeClick(mode: GameMode) {
    // Mobile/touch: first tap selects to preview; second tap confirms.
    if (isTouchDevice() && selectedMode !== mode) {
      setSelectedMode(mode);
      return;
    }
    // Desktop: single click starts immediately (hover already previews).
    startGame(mode);
  }

  function selectMode(next: GameConfig) {
    setGameConfig(next);
    setPlanningStep("philosophy");
    setCorePhilosophy(null);
    setCorePhilosophyDraft(null);
    setWarPlanDraft(Array.from({ length: next.days }, () => null));
    setLockedWarPlan(null);
    setIsLockConfirmOpen(false);
    setMarketCondition("neutral");
    setCriticalDays([]);
    setSelectedMode(null);
    setCurrentScreen("planning");
  }

  function updateMandateForDay(dayIndex: number, next: RiskMandate) {
    setWarPlanDraft((prev) => {
      const copy = prev.slice();
      copy[dayIndex] = next;
      return copy;
    });
  }

  const allDaysPlanned = warPlanDraft.length > 0 && warPlanDraft.every(Boolean);

  function philosophyToLabel(philosophy: CorePhilosophy): string {
    switch (philosophy) {
      case "growth":
        return "成長型";
      case "value":
        return "價值型";
      case "technical":
        return "穩健平衡";
      default: {
        const _exhaustive: never = philosophy;
        return _exhaustive;
      }
    }
  }

  function mandateToLabel(mandate: RiskMandate): RiskMandateLabel {
    switch (mandate) {
      case "fullDefense":
        return "Full Defense";
      case "cautious":
        return "Cautious";
      case "balanced":
        return "Balanced";
      case "aggressive":
        return "Aggressive";
      case "leveragedAggressive":
        return "Leveraged Aggressive";
      default: {
        const _exhaustive: never = mandate;
        return _exhaustive;
      }
    }
  }

  function mandateToDisplayLabel(mandate: RiskMandate): string {
    switch (mandate) {
      case "fullDefense":
        return "全面防禦";
      case "cautious":
        return "謹慎";
      case "balanced":
        return "平衡";
      case "aggressive":
        return "進取";
      case "leveragedAggressive":
        return "槓桿進取";
      default: {
        const _exhaustive: never = mandate;
        return _exhaustive;
      }
    }
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function formatSignedCurrency(value: number): string {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${formatCurrency(Math.abs(value))}`;
  }

  function marketConditionLabel(strategyReturn: number): string {
    if (strategyReturn <= -0.02) return "剧烈下跌";
    if (strategyReturn <= -0.01) return "明显回撤";
    if (strategyReturn < 0.005 && strategyReturn > -0.005) return "震荡整理";
    if (strategyReturn >= 0.02) return "强劲上涨";
    return "温和波动";
  }

  function computePrototypeLabel(): { title: string; description: string } {
    const finalPLPct = (portfolioValue - 100000) / 100000;
    const interventionsCount = interventions.length;

  const highRiskPhilosophy = corePhilosophy === "growth";
    const defensiveMandates = new Set<RiskMandate>(["fullDefense", "cautious"]);
    const aggressiveMandates = new Set<RiskMandate>(["aggressive", "leveragedAggressive"]);
    const defensiveCount = executedMandates.filter((m) => defensiveMandates.has(m)).length;
    const aggressiveCount = executedMandates.filter((m) => aggressiveMandates.has(m)).length;
    const totalDays = executedMandates.length || (lockedWarPlan?.length ?? 0);
    const defensiveShare = totalDays > 0 ? defensiveCount / totalDays : 0;
    const aggressiveShare = totalDays > 0 ? aggressiveCount / totalDays : 0;

    const mismatched =
      (highRiskPhilosophy && defensiveShare >= 0.6) ||
      (!highRiskPhilosophy && aggressiveShare >= 0.6);

    if (finalPLPct > 0.15) {
      return {
        title: "卓越的預測者",
        description:
          "你的結果顯著跑贏基準，說明你不僅有計畫，更能在關鍵時刻把風險押在正確的方向上。",
      };
    }

    if (interventionsCount === 0) {
      return {
        title: "紀律嚴明的規劃者",
        description:
          "你在波動中堅持計畫，不靠臨場反應取勝，而是靠結構化決策與長期一致性。",
      };
    }

    if (interventionsCount >= 3) {
      return {
        title: "情緒化的反應者",
        description:
          "你將干預令牌用盡，說明你更容易在噪音中改變計畫。下一階段的關鍵是建立更可執行的規則。",
      };
    }

    if (gameConfig?.mode === "standard" && interventionsCount === 1) {
      return {
        title: "猶豫的戰術家",
        description:
          "你大多數時間堅持原計畫，但在某個關鍵節點選擇調整。你已經具備框架，只需提升觸發條件的清晰度。",
      };
    }

    if (mismatched) {
      return {
        title: "錯配的策略師",
        description:
          "你的哲學與風險指令長期不一致：要麼高波動哲學配防禦，要麼低波動哲學配激進。統一你的「信念」與「執行」，收益會更穩定。",
      };
    }

    return {
      title: "穩健的執行者",
      description:
        "你在計畫與執行之間保持了基本一致性。下一步是優化觸發條件與倉位節奏，讓策略更具可重複性。",
    };
  }

  const advanceOneDay = useCallback(({
    dayIdx,
    mandate,
    valueAtStartOfDay,
    impactOverride,
    bonusOverride,
    interventionContext,
  }: {
    dayIdx: number;
    mandate: RiskMandate;
    valueAtStartOfDay: number;
    impactOverride?: number;
    bonusOverride?: number;
    interventionContext?: LiveLogEntry["intervention"];
  }) => {
    if (!corePhilosophy) return;
    if (!lockedWarPlan) return;

    const mandateCalcLabel = mandateToLabel(mandate);
    const mandateDisplayLabel = mandateToDisplayLabel(mandate);
    const event = eventsData[dayIdx];
    const baseImpact = event?.impact ?? (sp500Benchmark[dayIdx] ?? 0);
    const dnaImpact = applyMarketDNA(baseImpact, marketCondition);
    const multiplier =
      philosophyModifiers[corePhilosophy][event?.category ?? "market"] ?? 1.0;
    const afterPhilosophy = dnaImpact * multiplier;
    const finalImpact =
      criticalDays.includes(dayIdx) ? afterPhilosophy * 2.0 : afterPhilosophy;
    const impact = impactOverride ?? finalImpact;

    const result = calculateDailyPerformance({
      currentValue: valueAtStartOfDay,
      riskMandate: mandateCalcLabel,
      impact,
    });
    const bonus = bonusOverride ?? 0;
    const newValueWithBonus = result.newValue + bonus;

    const nextBenchmarkPrev =
      benchmarkHistory[benchmarkHistory.length - 1] ?? 100000;
    const benchReturn = sp500Benchmark[dayIdx] ?? 0;
    const nextBenchmark = nextBenchmarkPrev * (1 + benchReturn);

    setPreviousValue(valueAtStartOfDay);
    setPortfolioValue(newValueWithBonus);
    setAnimatedPortfolioValue((from) => {
      const start = performance.now();
      const duration = 800;
      const fromValue = from;
      const toValue = newValueWithBonus;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimatedPortfolioValue(fromValue + (toValue - fromValue) * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return fromValue;
    });

    setDailyChangeFlash(newValueWithBonus - valueAtStartOfDay);
    if (dailyChangeFlashTimeoutRef.current) {
      window.clearTimeout(dailyChangeFlashTimeoutRef.current);
    }
    dailyChangeFlashTimeoutRef.current = window.setTimeout(() => {
      dailyChangeFlashTimeoutRef.current = null;
      setDailyChangeFlash(null);
    }, 1800);
    setPortfolioHistory((prev) => [...prev, newValueWithBonus]);
    setBenchmarkHistory((prev) => [...prev, nextBenchmark]);
    setLiveLog((prev) => [
      ...prev,
      {
        day: dayIdx + 1,
        mandateLabel: mandateDisplayLabel,
        philosophyReturn: result.strategyReturn,
        dailyPL: newValueWithBonus - valueAtStartOfDay,
        endValue: newValueWithBonus,
        ...(interventionContext ? { intervention: interventionContext } : {}),
      },
    ]);
    setExecutedMandates((prev) => [...prev, mandate]);

    const nextDayIndex = dayIdx + 1;
    setCurrentDayIndex(nextDayIndex);
    if (nextDayIndex >= lockedWarPlan.length) {
      setCurrentScreen("review");
    }
  }, [benchmarkHistory, corePhilosophy, criticalDays, lockedWarPlan, marketCondition]);

  function canIntervene(): boolean {
    return (
      currentScreen === "live" &&
      (lockedWarPlan?.length ?? 0) > 0 &&
      currentDayIndex < (lockedWarPlan?.length ?? 0) &&
      focus > 0 &&
      decisionSecondsLeft != null
    );
  }

  const stopTimers = useCallback(() => {
    if (marketOpenTimeoutRef.current) {
      window.clearTimeout(marketOpenTimeoutRef.current);
      marketOpenTimeoutRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (tickIntervalRef.current) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (newsTimeoutRef.current) {
      window.clearTimeout(newsTimeoutRef.current);
      newsTimeoutRef.current = null;
    }
    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    if (decisionTimeoutRef.current) {
      window.clearTimeout(decisionTimeoutRef.current);
      decisionTimeoutRef.current = null;
    }
    if (decisionTickRef.current) {
      window.clearInterval(decisionTickRef.current);
      decisionTickRef.current = null;
    }
    if (dailyChangeFlashTimeoutRef.current) {
      window.clearTimeout(dailyChangeFlashTimeoutRef.current);
      dailyChangeFlashTimeoutRef.current = null;
    }
    if (dotScope.current) {
      dotAnimate(dotScope.current, { opacity: 0 }, { duration: 0 });
    }
  }, [dotAnimate, dotScope]);

  useEffect(() => {
    if (!chartWrapperRef.current) return;
    const el = chartWrapperRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setChartSize({ width: rect.width, height: rect.height });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setChartSize({ width: rect.width, height: rect.height });
    return () => ro.disconnect();
  }, []);

  function valueToY(
    value: number,
    domainMin: number,
    domainMax: number,
    height: number,
  ): number {
    const topPadding = 10;
    const bottomPadding = 16;
    const innerH = Math.max(1, height - topPadding - bottomPadding);
    const clamped = Math.min(domainMax, Math.max(domainMin, value));
    const t =
      domainMax === domainMin ? 0.5 : (clamped - domainMin) / (domainMax - domainMin);
    return topPadding + (1 - t) * innerH;
  }

  const computeChartDomain = useCallback((extraPoints: number[] = []) => {
    const values = [...portfolioHistory, ...benchmarkHistory, ...extraPoints].filter(
      (n) => Number.isFinite(n),
    ) as number[];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max(500, (max - min) * 0.08);
    return { min: min - pad, max: max + pad };
  }, [benchmarkHistory, portfolioHistory]);

  function resumeMarketOpen() {
    const remaining = marketOpenRemainingMsRef.current;
    if (!remaining || remaining <= 0) return;
    stopTimers();

    setDayPhase("marketOpen");
    // eslint-disable-next-line react-hooks/purity
    const start = Date.now();
    marketOpenEndsAtRef.current = start + remaining;

    tickIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const endsAt = marketOpenEndsAtRef.current ?? now;
      const total = remaining;
      const elapsed = Math.min(total, Math.max(0, total - (endsAt - now)));
      const t = total === 0 ? 1 : elapsed / total;

      const from = plannedOpenValueRef.current;
      const to = plannedTargetValueRef.current;
      const base = from + (to - from) * t;
      const noise = (Math.random() - 0.5) * Math.abs(to - from) * 0.06;
      const flicker = (Math.random() - 0.5) * 120;
      setDisplayedPortfolioValue(Math.max(0, base + noise + flicker));
    }, 100);

    marketOpenTimeoutRef.current = window.setTimeout(() => {
      marketOpenTimeoutRef.current = null;
      if (!lockedWarPlan) return;
      if (tickIntervalRef.current) {
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      setDisplayedPortfolioValue(plannedTargetValueRef.current);
      const dayIdx = currentDayIndex;
      advanceOneDay({
        dayIdx,
        mandate:
          plannedMandateRef.current ??
          lockedWarPlan[Math.min(dayIdx, lockedWarPlan.length - 1)],
        valueAtStartOfDay: plannedOpenValueRef.current,
      });
      schedulePauseThenNext();
    }, remaining);
  }

  const schedulePauseThenNext = useCallback(() => {
    setDayPhase("pause");
    pauseTimeoutRef.current = window.setTimeout(() => {
      pauseTimeoutRef.current = null;
      if (currentScreen !== "live") return;
      setDayPhase("idle");
    }, 2000);
  }, [currentScreen]);

  const beginMarketOpen = useCallback((durationMs = 5000) => {
    if (!lockedWarPlan || !corePhilosophy || !gameConfig) return;
    if (currentDayIndex >= lockedWarPlan.length) return;

    stopTimers();

    const dayIdx = currentDayIndex;
    const openValue = portfolioValue;
    const mandate = lockedWarPlan[dayIdx];

    plannedMandateRef.current = mandate;
    plannedOpenValueRef.current = openValue;

    const event = eventsData[dayIdx];
    const baseImpact = event?.impact ?? (sp500Benchmark[dayIdx] ?? 0);
    const dnaImpact = applyMarketDNA(baseImpact, marketCondition);
    const multiplier =
      philosophyModifiers[corePhilosophy][event?.category ?? "market"] ?? 1.0;
    const afterPhilosophy = dnaImpact * multiplier;
    const finalImpact =
      criticalDays.includes(dayIdx) ? afterPhilosophy * 2.0 : afterPhilosophy;
    const planned = calculateDailyPerformance({
      currentValue: openValue,
      riskMandate: mandateToLabel(mandate),
      impact: finalImpact,
    });

    setMarketMoveSign(planned.newValue >= openValue ? "up" : "down");
    plannedTargetValueRef.current = planned.newValue;
    setDisplayedPortfolioValue(openValue);
    setDayPhase("marketOpen");

    if (dotScope.current && chartSize.width > 0 && chartSize.height > 0) {
      const { min, max } = computeChartDomain([openValue, planned.newValue]);
      const startY = valueToY(openValue, min, max, chartSize.height);
      const endY = valueToY(planned.newValue, min, max, chartSize.height);

      const yAxisWidth = 70;
      const rightMargin = 10;
      const leftMargin = yAxisWidth + 6;
      const innerW = Math.max(1, chartSize.width - leftMargin - rightMargin);
      const totalDays = lockedWarPlan.length;
      const xT = totalDays <= 1 ? 1 : dayIdx / (totalDays - 1);
      const x = leftMargin + innerW * xT;

      void dotAnimate(dotScope.current, { x, y: startY, opacity: 1 }, { duration: 0 });
      void dotAnimate(dotScope.current, { y: endY }, { duration: durationMs / 1000, ease: "linear" });
      void dotAnimate(dotScope.current, { opacity: 0 }, { duration: 0.5, delay: durationMs / 1000 });
    }

    const start = Date.now();
    marketOpenEndsAtRef.current = start + durationMs;
    marketOpenRemainingMsRef.current = durationMs;

    tickIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const endsAt = marketOpenEndsAtRef.current ?? now;
      const total = durationMs;
      const elapsed = Math.min(total, Math.max(0, total - (endsAt - now)));
      const t = total === 0 ? 1 : elapsed / total;

      const from = plannedOpenValueRef.current;
      const to = plannedTargetValueRef.current;
      const base = from + (to - from) * t;
      const noise = (Math.random() - 0.5) * Math.abs(to - from) * 0.06;
      const flicker = (Math.random() - 0.5) * 120;
      setDisplayedPortfolioValue(Math.max(0, base + noise + flicker));
    }, 100);

    marketOpenTimeoutRef.current = window.setTimeout(() => {
      marketOpenTimeoutRef.current = null;
      if (!lockedWarPlan) return;
      if (tickIntervalRef.current) {
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      setDisplayedPortfolioValue(plannedTargetValueRef.current);
      advanceOneDay({
        dayIdx,
        mandate: plannedMandateRef.current ?? lockedWarPlan[dayIdx],
        valueAtStartOfDay: plannedOpenValueRef.current,
      });
      schedulePauseThenNext();
    }, durationMs);
  }, [
    advanceOneDay,
    chartSize.height,
    chartSize.width,
    computeChartDomain,
    corePhilosophy,
    criticalDays,
    currentDayIndex,
    dotAnimate,
    dotScope,
    gameConfig,
    lockedWarPlan,
    marketCondition,
    portfolioValue,
    schedulePauseThenNext,
    stopTimers,
  ]);

  const beginMorningNews = useCallback(() => {
    if (!lockedWarPlan || !corePhilosophy || !gameConfig) return;
    if (currentDayIndex >= lockedWarPlan.length) return;

    stopTimers();

    const dayIdx = currentDayIndex;
    setCurrentNews(eventsData[dayIdx] ?? null);
    setDayPhase("news");

    newsTimeoutRef.current = window.setTimeout(() => {
      newsTimeoutRef.current = null;
      setCurrentNews(null);
      setDayPhase("idle");
      beginMarketOpen(5000);
    }, 4000);
  }, [
    beginMarketOpen,
    corePhilosophy,
    currentDayIndex,
    gameConfig,
    lockedWarPlan,
    stopTimers,
  ]);

  useEffect(() => {
    if (currentScreen !== "live") return;
    if (!lockedWarPlan || !corePhilosophy || !gameConfig) return;
    if (currentDayIndex >= lockedWarPlan.length) return;
    // Manual progression: no auto-run loop on Live screen.
    if (dayPhase !== "idle") return;
    if (isInterventionModalOpen) return;
    return undefined;
  }, [
    corePhilosophy,
    currentDayIndex,
    currentScreen,
    dayPhase,
    gameConfig,
    isInterventionModalOpen,
    lockedWarPlan,
  ]);

  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  useEffect(() => {
    if (currentScreen !== "review") return;
    const finalScore = calculateFinalScore(portfolioHistory, 100000, interventions.length);
    setScoreTicker(0);
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setScoreTicker(Math.floor(finalScore * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [currentScreen, interventions.length, portfolioHistory]);

  function resetToWelcome() {
    stopTimers();
    setCurrentScreen("welcome");
    setGameConfig(null);
    setPlanningStep("philosophy");
    setCorePhilosophy(null);
    setCorePhilosophyDraft(null);
    setWarPlanDraft([]);
    setLockedWarPlan(null);
    setIsLockConfirmOpen(false);

    setCurrentDayIndex(0);
    setPreviousValue(100000);
    setPortfolioValue(100000);
    setPortfolioHistory([100000]);
    setBenchmarkHistory([100000]);
    setLiveLog([]);

    setFocus(3);
    setInterventionCooldownUntilDay(0);
    setIsDisciplinedEligible(true);
    setInterventions([]);
    setIsInterventionModalOpen(false);
    setExecutedMandates([]);
    setRewardCopied(false);
    setDayPhase("idle");
    setDisplayedPortfolioValue(100000);
    setAnimatedPortfolioValue(100000);
    setDailyChangeFlash(null);
    setCurrentNews(null);
    setMarketCondition("neutral");
    setCriticalDays([]);
  }

  function replaySameSettings() {
    stopTimers();
    if (!gameConfig || !corePhilosophy) return;

    setPlanningStep("timeline");
    setCorePhilosophyDraft(corePhilosophy);
    setWarPlanDraft(Array.from({ length: gameConfig.days }, () => null));
    setLockedWarPlan(null);
    setIsLockConfirmOpen(false);

    const initial = 100000;
    setCurrentDayIndex(0);
    setPreviousValue(initial);
    setPortfolioValue(initial);
    setPortfolioHistory([initial]);
    setBenchmarkHistory([initial]);
    setLiveLog([]);

    setFocus(3);
    setInterventionCooldownUntilDay(0);
    setIsDisciplinedEligible(true);
    setInterventions([]);
    setIsInterventionModalOpen(false);
    setExecutedMandates([]);
    setRewardCopied(false);
    setDayPhase("idle");
    setDisplayedPortfolioValue(initial);
    setAnimatedPortfolioValue(initial);
    setDailyChangeFlash(null);
    setCurrentNews(null);
    setMarketMoveSign(null);
    setFlashEffect(null);
    setScoreTicker(0);
    setIsProcessing(false);

    // re-roll replay randomness
    const dnaPool: MarketCondition[] = ["bull", "bear", "volatile", "neutral"];
    const dna = dnaPool[Math.floor(Math.random() * dnaPool.length)] ?? "neutral";
    setMarketCondition(dna);
    const totalDays = gameConfig.days;
    const criticalCount = totalDays >= 8 ? (Math.random() < 0.5 ? 1 : 2) : 1;
    const picked = new Set<number>();
    while (picked.size < Math.min(criticalCount, totalDays)) {
      picked.add(Math.floor(Math.random() * totalDays));
    }
    setCriticalDays(Array.from(picked.values()).sort((a, b) => a - b));

    setCurrentScreen("planning");
  }

  const getImpactForDay = useCallback((dayIdx: number) => {
    const ev = eventsData[dayIdx];
    const base = ev?.impact ?? (sp500Benchmark[dayIdx] ?? 0);
    const dnaImpact = applyMarketDNA(base, marketCondition);
    const mult = corePhilosophy
      ? philosophyModifiers[corePhilosophy][ev?.category ?? "market"] ?? 1.0
      : 1.0;
    const afterPhilosophy = dnaImpact * mult;
    return criticalDays.includes(dayIdx) ? afterPhilosophy * 2.0 : afterPhilosophy;
  }, [corePhilosophy, criticalDays, marketCondition]);

  const resolveDay = useCallback((dayIdx: number, useIntervention: boolean) => {
    if (!lockedWarPlan || !corePhilosophy || !gameConfig) return;
    const mandate = lockedWarPlan[dayIdx] ?? lockedWarPlan[lockedWarPlan.length - 1];
    const openValue = portfolioValue;

    const baseImpact = getImpactForDay(dayIdx);
    const interventionImpact = (() => {
      if (!useIntervention) return baseImpact;
      if (corePhilosophy === "growth") return baseImpact * 1.5;
      // value + balanced both reduce volatility in this ruleset
      return baseImpact * 0.5;
    })();

    advanceOneDay({
      dayIdx,
      mandate,
      valueAtStartOfDay: openValue,
      impactOverride: interventionImpact,
      bonusOverride: 0,
      interventionContext: useIntervention
        ? {
            originalMandateLabel:
              corePhilosophy === "growth"
                ? "激進加碼"
                : corePhilosophy === "value"
                  ? "危機入市"
                  : "資產再平衡",
            newMandateLabel: `影響×${corePhilosophy === "growth" ? "1.5" : "0.5"}`,
            feeCost: 0,
          }
        : undefined,
    });
  }, [advanceOneDay, corePhilosophy, gameConfig, getImpactForDay, lockedWarPlan, portfolioValue]);

  const beginProcessingThenResolve = useCallback((dayIdx: number, useIntervention: boolean) => {
    stopTimers();
    setDecisionSecondsLeft(null);
    setIsProcessing(true);
    processingTimeoutRef.current = window.setTimeout(() => {
      processingTimeoutRef.current = null;
      setIsProcessing(false);
      setCurrentNews(null);
      resolveDay(dayIdx, useIntervention);
    }, LIVE_PROCESSING_MS);
  }, [resolveDay, stopTimers]);

  const startDecisionWindow = useCallback((dayIdx: number) => {
    // 5-second decision window
    const total = 5;
    setDecisionSecondsLeft(total);
    const startedAt = Date.now();
    decisionTickRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, total - elapsed);
      setDecisionSecondsLeft(left);
    }, 250);
    decisionTimeoutRef.current = window.setTimeout(() => {
      decisionTimeoutRef.current = null;
      if (decisionTickRef.current) {
        window.clearInterval(decisionTickRef.current);
        decisionTickRef.current = null;
      }
      setDecisionSecondsLeft(null);
      beginProcessingThenResolve(dayIdx, false);
    }, total * 1000);
  }, [beginProcessingThenResolve]);

  const onInterveneNow = useCallback(() => {
    if (!lockedWarPlan || currentDayIndex >= lockedWarPlan.length) return;
    if (focus <= 0) return;
    // must be within decision window
    if (decisionSecondsLeft == null) return;

    if (decisionTimeoutRef.current) {
      window.clearTimeout(decisionTimeoutRef.current);
      decisionTimeoutRef.current = null;
    }
    if (decisionTickRef.current) {
      window.clearInterval(decisionTickRef.current);
      decisionTickRef.current = null;
    }
    setDecisionSecondsLeft(null);
    setFocus((f) => Math.max(0, f - INTERVENTION_COST));
    setActionStamp(
      corePhilosophy === "growth"
        ? "激進加碼！"
        : corePhilosophy === "value"
          ? "危機入市成功！"
          : "資產再平衡！",
    );
    window.setTimeout(() => setActionStamp(null), 900);
    beginProcessingThenResolve(currentDayIndex, true);
  }, [beginProcessingThenResolve, corePhilosophy, currentDayIndex, decisionSecondsLeft, focus, lockedWarPlan]);

  useEffect(() => {
    if (currentScreen !== "live") return;
    if (!lockedWarPlan || !corePhilosophy || !gameConfig) return;
    if (currentDayIndex >= lockedWarPlan.length) return;
    if (isProcessing) return;
    if (decisionSecondsLeft != null) return;
    if (isInterventionModalOpen) return;

    // Start-of-day: show headline immediately.
    setCurrentNews(eventsData[currentDayIndex] ?? null);

    if (focus <= 0) {
      // Passive observer: read 3s then resolve automatically.
      decisionTimeoutRef.current = window.setTimeout(() => {
        decisionTimeoutRef.current = null;
        beginProcessingThenResolve(currentDayIndex, false);
      }, 3000);
      return;
    }

    // Focus available: pause for decision with a 5s countdown.
    startDecisionWindow(currentDayIndex);
  }, [
    beginProcessingThenResolve,
    corePhilosophy,
    currentDayIndex,
    currentScreen,
    decisionSecondsLeft,
    focus,
    gameConfig,
    isInterventionModalOpen,
    isProcessing,
    lockedWarPlan,
    startDecisionWindow,
  ]);

  return (
    <main className="relative flex min-h-[calc(100dvh-1px)] flex-1 items-center justify-center overflow-hidden bg-zinc-950 px-4 py-14 text-zinc-50 sm:py-16">
      <AnimatePresence>
        {flashEffect ? (
          <motion.div
            key="flash"
            className={`pointer-events-none fixed inset-0 z-[60] ${
              flashEffect === "value"
                ? "bg-sky-400/20"
                : flashEffect === "growth"
                  ? "bg-orange-400/25"
                  : "bg-amber-200/25"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, times: [0, 0.2, 1] }}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-220px] h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -right-24 bottom-[-220px] h-[520px] w-[520px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),rgba(0,0,0,0))]" />
      </div>

      <section className="relative w-full max-w-xl lg:max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <Swords className="h-6 w-6 text-white/90" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-1 text-sm leading-6 text-zinc-200/75">
                證明你的實力，贏下你的入場券。
              </p>
            </div>
          </div>

          {currentScreen === "welcome" ? (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-pretty text-base font-semibold leading-7 text-white">
                  歡迎來到《決戰投報率》！
                </p>
                <p className="mt-2 text-pretty text-sm leading-7 text-zinc-200/75">
                  一場證明你投資直覺的挑戰，執掌百萬資金，應對瞬息萬變的市場
                </p>

                <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">
                    完成挑戰，即可獲得...
                  </p>
                  <p className="mt-2 text-pretty text-sm leading-7 text-amber-50/85">
                    一張 <span className="font-semibold text-white">免費的線下投資講座電子入場券</span>！
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentScreen("modeSelection")}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-300 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                    開始挑戰
                </button>
              </div>
            </div>
          ) : currentScreen === "modeSelection" ? (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
                    <Crown className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">遊戲模式</h2>
                    <p className="mt-0.5 text-sm text-zinc-200/70">
                      新手建議從 5 天開始，上手後挑戰 10 天完整版
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
                  <div className="grid gap-3 md:grid-cols-2">
                    {/* 5-Day Sprint */}
                    <div
                      onMouseEnter={() => setHoveredMode("sprint")}
                      onMouseLeave={() => setHoveredMode(null)}
                      onFocusCapture={() => setHoveredMode("sprint")}
                      onBlurCapture={() => setHoveredMode(null)}
                      className={`rounded-2xl border bg-white/5 p-5 transition-colors ${
                        selectedMode === "sprint"
                          ? "border-emerald-300/40 bg-emerald-300/10"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          5日衝刺
                        </p>
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                          推薦新手
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-zinc-200/70">
                        完成即可領取獎勵！
                      </p>
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs font-semibold text-zinc-200/85">
                          專注力：初始 3（每次干預消耗 1）
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleModeClick("sprint")}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                      >
                        選擇5日衝刺戰
                      </button>
                    </div>

                    {/* 10-Day Marathon */}
                    <div
                      onMouseEnter={() => setHoveredMode("standard")}
                      onMouseLeave={() => setHoveredMode(null)}
                      onFocusCapture={() => setHoveredMode("standard")}
                      onBlurCapture={() => setHoveredMode(null)}
                      className={`rounded-2xl border bg-white/5 p-5 transition-colors ${
                        selectedMode === "standard"
                          ? "border-emerald-300/40 bg-emerald-300/10"
                          : "border-white/10"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">
                        10日馬拉松
                      </p>
                      <p className="mt-1 text-xs font-medium text-zinc-200/70">
                        你的遠見受到終極考驗。完成即可領取獎勵！
                      </p>
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                        <p className="text-xs font-semibold text-zinc-200/85">
                          專注力：初始 3（每次干預消耗 1）
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleModeClick("standard")}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                      >
                        選擇10日馬拉松戰爭
                      </button>
                    </div>
                  </div>

                  {/* Hover details panel */}
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    {(() => {
                      const modeToShow = selectedMode || hoveredMode || "sprint";
                      const hint =
                        selectedMode !== null ? (
                          <p className="mt-2 text-xs font-semibold text-emerald-200/90">
                            再次點擊以確認
                          </p>
                        ) : null;

                      if (modeToShow === "sprint") {
                        return (
                          <div>
                            <p className="text-sm font-semibold text-white">
                              5日衝刺{" "}
                              <span className="font-semibold text-emerald-200">
                                （推薦新手）
                              </span>
                            </p>
                            {hint}
                            <p className="mt-3 text-sm leading-6 text-zinc-200/70">
                              開始你的投資之旅！
                            </p>
                            <p className="mt-3 text-sm leading-6 text-zinc-200/70">
                              簡短、快節奏，旨在讓你快速掌握核心玩法
                            </p>
                            <p className="mt-4 text-xs font-semibold text-zinc-200/70">
                              為何選擇它？
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-200/70">
                              <li>幾分鐘內完成你的第一場遊戲</li>
                              <li>學習規則: 無壓力地理解不同投資信仰的影響</li>
                            </ul>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <p className="text-sm font-semibold text-white">
                            10日馬拉松
                          </p>
                          {hint}
                          <p className="mt-3 text-sm leading-6 text-zinc-200/70">
                            真正的市場挑戰!
                          </p>
                          <p className="mt-3 text-sm leading-6 text-zinc-200/70">
                            完整、更具深度的遊戲體驗，為測試自己策略的玩家設計。
                          </p>
                          <p className="mt-4 text-xs font-semibold text-zinc-200/70">
                            為何選擇它？
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-200/70">
                            <li>完整體驗: 經歷更長的市場週期、關鍵日和意外事件。</li>
                            <li>精心管理你的「專注力」資源，做出影響深遠的決策。</li>
                          </ul>
                          <p className="mt-3 text-xs font-semibold text-zinc-200/70">
                            對你投資智慧的考驗。
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => resetToWelcome()}
                  className="text-xs font-semibold text-zinc-200/70 underline-offset-4 hover:text-white hover:underline"
                >
                  返回歡迎頁
                </button>
              </div>
            </div>
          ) : currentScreen === "planning" ? (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-white">選擇你的投資信仰</p>

                <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-xs font-semibold text-zinc-200/80">
                      起始資金
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      $100,000
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-xs font-semibold text-zinc-200/80">
                      市場
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      模擬美國股市
                    </p>
                  </div>
                </div>

                {planningStep === "philosophy" ? (
                  <div className="mt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white">
                          選擇你的投資信仰
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                          這項選擇在本局遊戲中不可更改。
                        </p>
                      </div>
                      {corePhilosophy ? (
                        <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                          已鎖定
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
                      <div className="grid gap-3">
                        {(
                          [
                            {
                              key: "growth",
                              title: "成長型投資",
                              icon: (
                                <Flame className="h-5 w-5 text-rose-200" aria-hidden="true" />
                              ),
                            },
                            {
                              key: "value",
                              title: "價值型投資",
                              icon: (
                                <Landmark className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                              ),
                            },
                            {
                              key: "technical",
                              title: "穩健平衡",
                              icon: (
                                <TrendingUp className="h-5 w-5 text-sky-200" aria-hidden="true" />
                              ),
                            },
                          ] as const
                        ).map((item) => {
                          const key = item.key;
                          const selected = (corePhilosophy ?? corePhilosophyDraft) === key;
                          const lockedOut = corePhilosophy !== null && !selected;
                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={corePhilosophy !== null}
                              onMouseEnter={() => setHoveredPhilosophy(key)}
                              onMouseLeave={() => setHoveredPhilosophy(null)}
                              onFocus={() => setHoveredPhilosophy(key)}
                              onBlur={() => setHoveredPhilosophy(null)}
                              onClick={() => setCorePhilosophyDraft(key)}
                              className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                                selected
                                  ? "border-emerald-300/35 bg-emerald-300/10"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              } ${lockedOut ? "opacity-60" : ""}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">
                                  {item.title}
                                </p>
                                <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/20">
                                  {item.icon}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                                {philosophyDetails[key].description}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        {(() => {
                          const key =
                            hoveredPhilosophy ??
                            (corePhilosophy ?? corePhilosophyDraft) ??
                            "growth";
                          const d = philosophyDetails[key];
                          return (
                            <div>
                      <p className="text-xs font-semibold text-zinc-200/70">
                        角色卡（點選查看，再點一次確認）
                      </p>
                              <p className="mt-2 text-base font-semibold text-white">
                                {d.name}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                                {d.description}
                              </p>

                              <div className="mt-4 grid gap-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                  <p className="text-xs font-semibold text-emerald-200/90">
                                    優勢
                                  </p>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-200/70">
                                    {d.advantages.map((t) => (
                                      <li key={t}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                  <p className="text-xs font-semibold text-rose-200/90">
                                    劣勢
                                  </p>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-200/70">
                                    {d.disadvantages.map((t) => (
                                      <li key={t}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                  <p className="text-xs font-semibold text-amber-200/90">
                                    主动技能
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-white">
                                    {d.ability.name}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-zinc-200/70">
                                    {d.ability.effect}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={(corePhilosophy ?? corePhilosophyDraft) === null}
                      onClick={() => {
                        const chosen = corePhilosophyDraft;
                        if (!chosen) return;
                        setCorePhilosophy(chosen);
                        setPlanningStep("timeline");
                      }}
                      className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                        corePhilosophy ?? corePhilosophyDraft
                          ? "bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
                          : "cursor-not-allowed bg-white/10 text-white/50"
                      }`}
                    >
                      確認並繼續
                    </button>
                  </div>
                ) : (
                  <div className="mt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white">
                          战略时间线（War Plan Timeline）
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                          為每個交易日設定風險指令。像軍師一樣先定計畫，再上戰場。
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-200/80">
                        {gameConfig?.days ?? 0} 天
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-zinc-200/70">
                          目前核心投資哲學：{" "}
                            <span className="text-white">
                              {corePhilosophy ? philosophyToLabel(corePhilosophy) : "-"}
                            </span>
                        </p>
                        <p className="text-xs text-zinc-200/50">
                          需完成全部天數才可鎖定計畫
                        </p>
                      </div>

                      <div className="relative mt-4">
                        <div
                          ref={warPlanTimelineScrollRef}
                          className="overflow-x-auto pb-2"
                        >
                          <div
                            className="grid gap-3"
                            style={{
                              gridAutoFlow: "column",
                              gridAutoColumns: "minmax(220px, 1fr)",
                            }}
                          >
                          {warPlanDraft.map((mandate, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    第 {idx + 1} 天
                                  </p>
                                  <p className="mt-0.5 text-xs text-zinc-200/60">
                                    選擇當日風險指令
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {criticalDays.includes(idx) ? (
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/15 text-xs font-extrabold text-amber-200">
                                      !
                                    </span>
                                  ) : null}
                                  <span
                                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      mandate
                                        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                                        : "border-white/10 bg-black/20 text-zinc-200/70"
                                    }`}
                                  >
                                    {mandate ? "已設定" : "未設定"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-2">
                                {RISK_MANDATES.map((opt) => {
                                  const selected = mandate === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() =>
                                        updateMandateForDay(idx, opt.value)
                                      }
                                      className={`w-full rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                                        selected
                                          ? "border-emerald-300/35 bg-emerald-300/10"
                                          : "border-white/10 bg-black/20 hover:bg-white/5"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold text-white">
                                          {opt.label}
                                        </p>
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                            selected
                                              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                                              : "border-white/10 bg-black/20 text-zinc-200/60"
                                          }`}
                                        >
                                          {opt.ratioTag}
                                        </span>
                                      </div>
                                      <p className="mt-0.5 text-[11px] leading-5 text-zinc-200/65">
                                        {opt.detail}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          </div>
                        </div>
                        <ScrollEdgeArrows targetRef={warPlanTimelineScrollRef} />
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          disabled={!allDaysPlanned}
                          onClick={() => setIsLockConfirmOpen(true)}
                          className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto ${
                            allDaysPlanned
                              ? "bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
                              : "cursor-not-allowed bg-white/10 text-white/50"
                          }`}
                        >
                          鎖定計畫
                        </button>
                        <p className="text-xs leading-5 text-zinc-200/55">
                          {allDaysPlanned
                            ? "計畫已完整，可鎖定。"
                            : "請為每一天選擇一條風險指令。"}
                        </p>
                      </div>
                    </div>

                    {isLockConfirmOpen ? (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        role="dialog"
                        aria-modal="true"
                      >
                        <div
                          className="absolute inset-0 bg-black/70"
                          onClick={() => setIsLockConfirmOpen(false)}
                          aria-hidden="true"
                        />
                        <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-7">
                          <p className="text-sm font-semibold text-white">
                            確認鎖定計畫？
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-200/70">
                            一旦鎖定，你的每日風險指令將不可更改。之後若要修改，只能使用昂貴的
                            「干預」。
                          </p>
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold text-zinc-200/80">
                              已规划天数：{" "}
                              <span className="text-white">
                                {warPlanDraft.length}
                              </span>
                              {" · "}專注力（Focus）：{" "}
                              <span className="text-white">100</span>
                            </p>
                          </div>
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => setIsLockConfirmOpen(false)}
                              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const plan = warPlanDraft.filter(
                                  (v): v is RiskMandate => v !== null,
                                );
                                setLockedWarPlan(plan);
                                setIsLockConfirmOpen(false);
                                const initial = 100000;
                                setCurrentDayIndex(0);
                                setPreviousValue(initial);
                                setPortfolioValue(initial);
                                setPortfolioHistory([initial]);
                                setBenchmarkHistory([initial]);
                                setLiveLog([]);
                                setFocus(3);
                                setInterventionCooldownUntilDay(0);
                                setIsDisciplinedEligible(true);
                                setInterventions([]);
                                setIsInterventionModalOpen(false);
                                setExecutedMandates([]);
                                setDayPhase("idle");
                                setDisplayedPortfolioValue(initial);
                                // Market DNA + Critical Days are rolled at game start.
                                const dnaPool: MarketCondition[] = [
                                  "bull",
                                  "bear",
                                  "volatile",
                                  "neutral",
                                ];
                                const dna =
                                  dnaPool[Math.floor(Math.random() * dnaPool.length)] ??
                                  "neutral";
                                setMarketCondition(dna);

                                const totalDays = plan.length;
                                const criticalCount = totalDays >= 8 ? (Math.random() < 0.5 ? 1 : 2) : 1;
                                const picked = new Set<number>();
                                while (picked.size < Math.min(criticalCount, totalDays)) {
                                  picked.add(Math.floor(Math.random() * totalDays));
                                }
                                setCriticalDays(Array.from(picked.values()).sort((a, b) => a - b));
                                setCurrentScreen("live");
                              }}
                              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                            >
                              確認鎖定
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-zinc-200/50">
                    模式：{" "}
                    <span className="font-semibold text-white">
                      {gameConfig?.mode === "sprint"
                        ? "5日衝刺"
                        : gameConfig?.mode === "standard"
                          ? "10日馬拉松"
                          : "-"}
                    </span>
                    {" · "}天數：{" "}
                    <span className="font-semibold text-white">
                      {gameConfig?.days}
                    </span>
                    {" · "}專注力：{" "}
                    <span className="font-semibold text-white">100</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGameConfig(null);
                      setPlanningStep("philosophy");
                      setCorePhilosophy(null);
                      setWarPlanDraft([]);
                      setLockedWarPlan(null);
                      setIsLockConfirmOpen(false);
                      setCurrentScreen("modeSelection");
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                  >
                    返回模式選擇
                  </button>
                </div>

                {/* Sticky mobile footer actions */}
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/80 p-3 backdrop-blur sm:hidden">
                  <div className="mx-auto flex max-w-xl items-center gap-3">
                    <button
                      type="button"
                      disabled={focus <= 0 || decisionSecondsLeft == null || isProcessing}
                      onClick={() => {
                        onInterveneNow();
                      }}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                        focus <= 0 || decisionSecondsLeft == null || isProcessing
                          ? "cursor-not-allowed bg-white/10 text-white/50"
                          : "bg-amber-300 text-zinc-950 hover:bg-amber-200"
                      }`}
                    >
                      <CirclePause className="h-5 w-5" aria-hidden="true" />
                      <span className="font-mono text-xs">
                        {decisionSecondsLeft != null ? `${decisionSecondsLeft}s` : "-"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={true}
                      onClick={() => {}}
                      className={`inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                        isProcessing || currentDayIndex >= (lockedWarPlan?.length ?? 0)
                          ? "cursor-not-allowed bg-white/10 text-white/50"
                          : "bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
                      }`}
                    >
                      自動進行中
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : currentScreen === "live" ? (
            <div className="mt-6">
              <div className="relative rounded-2xl border border-white/10 bg-black/20 p-4 pb-24 sm:p-5 sm:pb-5">
                <AnimatePresence>
                  {isProcessing ? (
                    <motion.div
                      key="processing"
                      className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-[rgba(200,0,0,0.10)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      aria-hidden="true"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          className="grid h-14 w-14 place-items-center rounded-3xl border border-white/10 bg-black/30"
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Activity className="h-7 w-7 text-rose-200" aria-hidden="true" />
                        </motion.div>
                        <p className="text-sm font-semibold text-white">
                          市場開盤
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence>
                  {actionStamp ? (
                    <motion.div
                      key="stamp"
                      className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    >
                      <div className="rounded-full border border-amber-300/30 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 shadow-lg shadow-black/30">
                        {actionStamp}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        投資直播間
                      </p>
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full bg-rose-500"
                        animate={{
                          scale: [1, 1.25, 1],
                          opacity: [1, 0.8, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="text-xs font-semibold text-rose-200/90">
                        直播
                      </span>
                      {corePhilosophy ? (
                        <span className="ml-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-200/80">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-black/30">
                            {corePhilosophy === "value" ? (
                              <Landmark className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />
                            ) : corePhilosophy === "growth" ? (
                              <Flame className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
                            )}
                          </span>
                          {philosophyToLabel(corePhilosophy)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                      觀察你的計畫如何在市場中展開。
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-200/80">
                    第 {Math.min(currentDayIndex + 1, lockedWarPlan?.length ?? 0)} 天/
                    {lockedWarPlan?.length ?? 0}
                  </div>
                </div>
                <div className="mt-3 hidden flex-wrap items-center gap-2 text-xs font-semibold text-zinc-200/70 sm:flex">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {marketCondition === "bull" ? (
                      <TrendingUp className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                    ) : marketCondition === "bear" ? (
                      <TrendingDown className="h-4 w-4 text-rose-200" aria-hidden="true" />
                    ) : marketCondition === "volatile" ? (
                      <Activity className="h-4 w-4 text-amber-200" aria-hidden="true" />
                    ) : (
                      <Minus className="h-4 w-4 text-zinc-200/70" aria-hidden="true" />
                    )}
                    市場基因：{" "}
                    <span className="text-white">
                      {marketCondition === "bull"
                        ? "牛市"
                        : marketCondition === "bear"
                          ? "熊市"
                          : marketCondition === "volatile"
                            ? "劇烈震盪"
                            : "中性"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/15 text-[11px] font-extrabold text-amber-200">
                      !
                    </span>
                    關鍵日：{" "}
                    <span className="text-white">
                      {criticalDays.length === 0
                        ? "-"
                        : criticalDays.map((d) => `第 ${d + 1} 天`).join("、")}
                    </span>
                  </span>
                </div>

                <div className="mt-3 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:block">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-zinc-200/70">
                      專注力
                    </p>
                    <p className="font-mono text-xs font-semibold text-white">
                      {focus}
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-300/80"
                      style={{
                        width: `${Math.min(100, Math.max(0, (focus / 100) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Mobile-first: daily event card lives in content area below */}

                <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:flex">
                  <p className="text-xs font-semibold text-zinc-200/70">
                    狀態：{" "}
                    <span className="font-semibold text-white">
                      {dayPhase === "marketOpen"
                        ? "開盤倒數（5秒視窗）"
                        : dayPhase === "news"
                          ? "晨間快訊（4秒）"
                        : dayPhase === "pause"
                          ? "結算暫停（2秒）"
                          : dayPhase === "intervening"
                            ? "干預中（已暫停）"
                            : "準備開盤"}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-200/55">
                    干預記錄：{interventions.length} ·{" "}
                    {isDisciplinedEligible ? "仍具備" : "已失去"} 頂級「紀律嚴明」資格
                  </p>
                </div>

                {/* Mobile-first: chart (top) + compact stats bar (below chart) */}

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold text-zinc-200/70">
                    資產曲線圖
                  </p>
                  <div className="relative mt-3 h-[32svh] min-h-[220px] w-full sm:h-56" ref={chartWrapperRef}>
                    <motion.div
                      ref={dotScope}
                      className={`pointer-events-none absolute top-0 left-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        marketMoveSign === "down" ? "bg-rose-300" : "bg-emerald-300"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{
                        scale:
                          dayPhase === "marketOpen" || dayPhase === "intervening"
                            ? [1, 1.25, 1]
                            : 1,
                        opacity:
                          dayPhase === "marketOpen" || dayPhase === "intervening"
                            ? 1
                            : 0,
                      }}
                      transition={{
                        duration: 1.2,
                        repeat:
                          dayPhase === "marketOpen" || dayPhase === "intervening"
                            ? Infinity
                            : 0,
                        ease: "easeInOut",
                      }}
                      style={{
                        opacity: 0,
                        boxShadow:
                          marketMoveSign === "down"
                            ? "0 0 18px rgba(251,113,133,0.85)"
                            : "0 0 18px rgba(110,231,183,0.85)",
                      }}
                    />
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={portfolioHistory.map((v, i) => ({
                          day: i,
                          portfolio: v,
                          benchmark: benchmarkHistory[i] ?? benchmarkHistory[benchmarkHistory.length - 1],
                        }))}
                        margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="day"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                          tickFormatter={(d) => (d === 0 ? "起點" : `第${d}天`)}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                          axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                          width={70}
                          tickFormatter={(n) =>
                            n.toLocaleString(undefined, { maximumFractionDigits: 0 })
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(9,9,11,0.9)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                          }}
                          labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                          formatter={(value, name) => {
                            const valueLabel =
                              typeof value === "number"
                                ? formatCurrency(value)
                                : String(value);
                            const nameLabel =
                              name === "portfolio" ? "資產" : "標普500";
                            return [valueLabel, nameLabel];
                          }}
                          labelFormatter={(label) =>
                            label === 0 ? "起點" : `第${label}天`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="benchmark"
                          stroke="rgba(56,189,248,0.85)"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-in-out"
                          activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="portfolio"
                          stroke="rgba(110,231,183,0.9)"
                          strokeWidth={2.5}
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-in-out"
                          activeDot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-200/60">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-300/80" />
                      資產
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-300/80" />
                      標普500
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-semibold text-zinc-200/80">
                  <span className="text-zinc-200/60">資產：</span>{" "}
                  <span className="text-white">{formatCurrency(animatedPortfolioValue)}</span>
                  <span className="mx-2 text-white/15">|</span>
                  <span className="text-zinc-200/60">天數：</span>{" "}
                  <span className="text-white">
                    {Math.min(currentDayIndex + 1, lockedWarPlan?.length ?? 0)}/
                    {lockedWarPlan?.length ?? 0}
                  </span>
                  <span className="mx-2 text-white/15">|</span>
                  <span className="text-zinc-200/60">專注點：</span>{" "}
                  <span className="text-white">{focus}</span>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold text-zinc-200/70">
                    今日事件
                  </p>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5">
                      {(() => {
                        const ev = eventsData[currentDayIndex] ?? eventsData[0];
                        const icons: Record<MarketEventCategory, React.ReactNode> = {
                          economy: <BarChart2 className="h-6 w-6 text-blue-300" aria-hidden="true" />,
                          monetary: <Landmark className="h-6 w-6 text-emerald-300" aria-hidden="true" />,
                          industry: <Briefcase className="h-6 w-6 text-yellow-300" aria-hidden="true" />,
                          tech: <Cpu className="h-6 w-6 text-purple-300" aria-hidden="true" />,
                          geopolitics: <Flame className="h-6 w-6 text-rose-300" aria-hidden="true" />,
                          regulation: <ShieldAlert className="h-6 w-6 text-orange-300" aria-hidden="true" />,
                          market: <TrendingUp className="h-6 w-6 text-zinc-200/70" aria-hidden="true" />,
                        };
                        return icons[ev?.category ?? "market"] ?? (
                          <Newspaper className="h-6 w-6 text-sky-200" aria-hidden="true" />
                        );
                      })()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-100/70">
                        晨間快訊
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {(eventsData[currentDayIndex] ?? eventsData[0])?.headline ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <button
                      type="button"
                      disabled={
                        focus <= 0 ||
                        !lockedWarPlan ||
                        !gameConfig ||
                        currentDayIndex >= (lockedWarPlan?.length ?? 0) ||
                        decisionSecondsLeft == null ||
                        isProcessing
                      }
                      onClick={() => {
                        onInterveneNow();
                      }}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto ${
                        focus <= 0 || decisionSecondsLeft == null || isProcessing
                          ? "cursor-not-allowed bg-white/10 text-white/50"
                          : "bg-amber-300 text-zinc-950 hover:bg-amber-200"
                      }`}
                    >
                      <CirclePause className="h-6 w-6" aria-hidden="true" />
                      <span className="text-sm font-semibold">
                        {corePhilosophy === "value"
                          ? "穩健化重組"
                          : corePhilosophy === "growth"
                            ? "激進交易"
                            : "精準擇時"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-black/10 px-2 py-1 text-xs font-semibold text-zinc-950">
                        <span className="font-mono">
                          {decisionSecondsLeft != null ? `${decisionSecondsLeft}s` : "-"}
                        </span>
                      </span>
                    </button>
                    {decisionSecondsLeft != null && focus > 0 ? (
                      <span className="text-xs font-semibold text-amber-200/80">
                        {decisionSecondsLeft}s 內可出手（不操作將自動結算）
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/70 sm:w-auto">
                    自動進行中
                  </span>
                </div>

                <div className="mt-5 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:block">
                  <p className="text-xs font-semibold text-zinc-200/70">
                    交易 / 每日紀錄
                  </p>

                  <div className="relative mt-3">
                    <div ref={liveLogScrollRef} className="overflow-x-auto">
                      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-xs">
                      <thead>
                        <tr className="text-zinc-200/60">
                          <th className="border-b border-white/10 px-3 py-2 font-semibold">
                            天
                          </th>
                          <th className="border-b border-white/10 px-3 py-2 font-semibold">
                            你的風險指令
                          </th>
                          <th className="border-b border-white/10 px-3 py-2 font-semibold">
                            市場結果
                          </th>
                          <th className="border-b border-white/10 px-3 py-2 font-semibold">
                            當日盈虧
                          </th>
                          <th className="border-b border-white/10 px-3 py-2 font-semibold">
                            收盤資產
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveLog.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-4 text-zinc-200/55"
                            >
                              市場將在每個交易日自動開盤並結算（無需手動推進）。
                            </td>
                          </tr>
                        ) : (
                          liveLog.map((row) => (
                            <tr key={row.day} className="text-zinc-50/90">
                              <td className="border-b border-white/10 px-3 py-2">
                                第 {row.day} 天
                              </td>
                              <td className="border-b border-white/10 px-3 py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span>{row.mandateLabel}</span>
                                  {row.intervention ? (
                                    <span className="text-[11px] font-semibold text-amber-200/90">
                                      行政干預：{row.intervention.originalMandateLabel} →{" "}
                                      {row.intervention.newMandateLabel}（費{" "}
                                      {formatCurrency(row.intervention.feeCost)}）
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="border-b border-white/10 px-3 py-2">
                                {row.philosophyReturn >= 0 ? "+" : ""}
                                {(row.philosophyReturn * 100).toFixed(2)}%
                              </td>
                              <td
                                className={`border-b border-white/10 px-3 py-2 font-semibold ${
                                  row.dailyPL >= 0
                                    ? "text-emerald-200"
                                    : "text-rose-200"
                                }`}
                              >
                                {formatSignedCurrency(row.dailyPL)}
                              </td>
                              <td className="border-b border-white/10 px-3 py-2 font-semibold text-white">
                                {formatCurrency(row.endValue)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      </table>
                    </div>
                    <ScrollEdgeArrows targetRef={liveLogScrollRef} scrollByPx={360} />
                  </div>
                </div>

                {false && isInterventionModalOpen && lockedWarPlan && gameConfig ? (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div
                      className="absolute inset-0 bg-black/70"
                      onClick={() => setIsInterventionModalOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            行政干預
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                            本操作將消耗 {INTERVENTION_COST} 點專注力，並對你造成三項懲罰。
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-200/80">
                          <span className="font-mono">專注力</span>
                          <span className="text-white">{focus}</span>
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold text-white">
                            即時財務成本
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                            立即從你的總資產中扣除 1% 的「緊急清算費」。
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold text-white">
                            聲譽成本
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                            你將失去獲得頂級「紀律嚴明」類投資者原型的資格。
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold text-white">
                            時間成本
                          </p>
                          <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                            使用後將啟動 24 小時（即 1 個交易日）的「冷卻期」，在此期間無法再次干預。
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-semibold text-white">
                          {(() => {
                            if (!corePhilosophy) return "執行干預";
                            if (corePhilosophy === "value") return "穩健化重組";
                            if (corePhilosophy === "growth") return "激進交易";
                            return "精準擇時";
                          })()}
                        </p>
                        <p className="mt-1 text-sm text-zinc-200/70">
                          第 {currentDayIndex + 1} 天 · 目前指令：{" "}
                          <span className="font-semibold text-white">
                            {(() => {
                              const m = lockedWarPlan?.[currentDayIndex] ?? null;
                              if (m === null) return "-";
                              return mandateToDisplayLabel(m as RiskMandate);
                            })()}
                          </span>
                          {" · "}新聞影響將被你的哲學規則重新定價。
                        </p>

                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="grid gap-2 text-sm text-zinc-200/75">
                            <p className="font-semibold text-white">本次效果</p>
                            <p>
                              {(() => {
                                if (!corePhilosophy) return "";
                                if (corePhilosophy === "value")
                                  return "將今日波動壓縮 50%（收益與虧損都會被削弱）。";
                                if (corePhilosophy === "growth")
                                  return "將今日波動放大 50%（收益更大，回撤也更深）。";
                                return "根據當日方向獲得擇時獎金（虧損日更強的減傷）。";
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsInterventionModalOpen(false);
                            setDayPhase("idle");
                            resumeMarketOpen();
                          }}
                          className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          disabled={!canIntervene()}
                          onClick={() => {
                            if (!lockedWarPlan || !gameConfig) return;
                            if (!canIntervene()) return;

                            const dayIdx = currentDayIndex;
                            const mandate = lockedWarPlan[dayIdx];

                            const feeCost = portfolioValue * 0.01;
                            const valueAfterFee = portfolioValue - feeCost;

                            if (!corePhilosophy) return;
                            const event = eventsData[dayIdx];
                            const baseImpact = event?.impact ?? (sp500Benchmark[dayIdx] ?? 0);
                            const dnaImpact = applyMarketDNA(baseImpact, marketCondition);
                            const multiplier =
                              philosophyModifiers[corePhilosophy][event?.category ?? "market"] ?? 1.0;
                            const afterPhilosophy = dnaImpact * multiplier;
                            const finalImpact =
                              criticalDays.includes(dayIdx) ? afterPhilosophy * 2.0 : afterPhilosophy;

                            const interventionImpact = (() => {
                              if (corePhilosophy === "value") return finalImpact * 0.5;
                              if (corePhilosophy === "growth") return finalImpact * 1.5;
                              return finalImpact;
                            })();

                            const interventionBonus = (() => {
                              if (corePhilosophy !== "technical") return 0;
                              return finalImpact < 0 ? 100000 * 0.02 : 100000 * 0.01;
                            })();

                            const withoutResult = calculateDailyPerformance({
                              currentValue: portfolioValue,
                              riskMandate: mandateToLabel(mandate),
                              impact: finalImpact,
                            });
                            const withResult = calculateDailyPerformance({
                              currentValue: valueAfterFee,
                              riskMandate: mandateToLabel(mandate),
                              impact: interventionImpact,
                            });
                            const withValueFinal = withResult.newValue + interventionBonus;

                            setIsDisciplinedEligible(false);
                            setFocus((f) => Math.max(0, f - INTERVENTION_COST));
                            setFlashEffect(corePhilosophy);
                            window.setTimeout(() => setFlashEffect(null), 500);
                            setInterventions((prev) => [
                              ...prev,
                              {
                                day: dayIdx + 1,
                                originalPlan: mandate,
                                newPlan: mandate,
                                feeCost,
                                valueWithoutIntervention: withoutResult.newValue,
                                valueWithIntervention: withValueFinal,
                              },
                            ]);

                            // Cooldown blocks the NEXT trading day (dayIdx+1).
                            setInterventionCooldownUntilDay(dayIdx + 2);

                            setIsInterventionModalOpen(false);
                            setDayPhase("pause");
                            setDisplayedPortfolioValue(withValueFinal);

                            advanceOneDay({
                              dayIdx,
                              mandate,
                              valueAtStartOfDay: valueAfterFee,
                              impactOverride: interventionImpact,
                              bonusOverride: interventionBonus,
                              interventionContext: {
                                originalMandateLabel:
                                  corePhilosophy === "value"
                                    ? "稳健化重组"
                                    : corePhilosophy === "growth"
                                      ? "激进交易"
                                      : "精准择时",
                                newMandateLabel:
                                  corePhilosophy === "value"
                                    ? "影响×0.5"
                                    : corePhilosophy === "growth"
                                      ? "影响×1.5"
                                      : `奖金+${formatCurrency(interventionBonus)}`,
                                feeCost,
                              },
                            });
                            schedulePauseThenNext();
                          }}
                          className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto ${
                            canIntervene()
                              ? "bg-amber-300 text-zinc-950 hover:bg-amber-200"
                              : "cursor-not-allowed bg-white/10 text-white/50"
                          }`}
                        >
                          確認並執行
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Mobile sticky action footer: always visible, no-scroll cockpit */}
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/80 p-3 backdrop-blur sm:hidden">
                  <div className="mx-auto flex max-w-xl items-center gap-3">
                    {decisionSecondsLeft != null ? (
                      <button
                        type="button"
                        disabled={focus <= 0 || isProcessing}
                        onClick={() => {
                          onInterveneNow();
                        }}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                          focus <= 0 || isProcessing
                            ? "cursor-not-allowed bg-white/10 text-white/50"
                            : "bg-amber-300 text-zinc-950 hover:bg-amber-200"
                        }`}
                      >
                        <CirclePause className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm font-semibold">
                          {corePhilosophy === "value"
                            ? "穩健化重組"
                            : corePhilosophy === "growth"
                              ? "激進交易"
                              : "精準擇時"}
                        </span>
                        <span className="rounded-full border border-black/15 bg-black/10 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-950">
                          {decisionSecondsLeft}s
                        </span>
                      </button>
                    ) : (
                      <div className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-white/70">
                        {isProcessing ? "處理中…" : "自動進行中"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : currentScreen === "voucher" ? (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      恭喜你完成《決戰投報率》
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                      在登記講座頁面按"Add a voucher" 貼上兌換碼，獲取免費門票
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                    GUARANTEED
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                  <p className="text-xs font-semibold text-amber-100/80">VOUCHER</p>
                  <p className="mt-2 font-mono text-2xl font-semibold tracking-wider text-white">
                    2C_FreeTix26
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText("2C_FreeTix26");
                        setRewardCopied(true);
                        window.setTimeout(() => setRewardCopied(false), 1500);
                      } catch {
                        // ignore clipboard errors (e.g., insecure context)
                      }
                    }}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-amber-300 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    {rewardCopied ? "已複製" : "複製兌換碼"}
                  </button>
                  <a
                    href="https://luma.com/vbjuzo79"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/90 shadow-sm transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    前往領取入場券
                  </a>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen("review")}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    返回成績頁
                  </button>
                  <button
                    type="button"
                    onClick={() => replaySameSettings()}
                    className="inline-flex w-full items-center justify-center rounded-full bg-emerald-300 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    再玩一次（相同設定）
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Review Phase</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-200/70">
                      恭喜完成挑戰！現在，來領取你的專屬獎勵。
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-200/80">
                    已完成 {lockedWarPlan?.length ?? 0} 天
                  </div>
                </div>

                {(() => {
                  const score = calculateFinalScore(
                    portfolioHistory,
                    100000,
                    interventions.length,
                  );
                  return (
                    <>
                      <GradeBadge score={score} displayScore={scoreTicker} />
                      <PeerComparison score={score} />
                      {corePhilosophy ? (
                        <NarrativeSummary
                          philosophy={corePhilosophy}
                          prototypeTitle={computePrototypeLabel().title}
                          interventionsCount={interventions.length}
                          liveLog={liveLog}
                        />
                      ) : null}
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[11px] font-semibold text-zinc-200/70">
                            最終資產曲線
                          </p>
                          <div className="mt-3 h-56 w-full sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={portfolioHistory.map((v, i) => ({
                                  day: i,
                                  portfolio: v,
                                  benchmark:
                                    benchmarkHistory[i] ??
                                    benchmarkHistory[benchmarkHistory.length - 1],
                                }))}
                                margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
                              >
                                <XAxis
                                  dataKey="day"
                                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                                  tickFormatter={(d) => (d === 0 ? "起點" : `第${d}天`)}
                                />
                                <YAxis
                                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                                  width={70}
                                  tickFormatter={(n) =>
                                    n.toLocaleString(undefined, { maximumFractionDigits: 0 })
                                  }
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: "rgba(9,9,11,0.9)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 12,
                                  }}
                                  labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                                  formatter={(value, name) => {
                                    const valueLabel =
                                      typeof value === "number"
                                        ? formatCurrency(value)
                                        : String(value);
                                    const nameLabel =
                                      name === "portfolio" ? "資產" : "標普500";
                                    return [valueLabel, nameLabel];
                                  }}
                                  labelFormatter={(label) =>
                                    label === 0 ? "起點" : `第${label}天`
                                  }
                                />
                                <Line
                                  type="monotone"
                                  dataKey="benchmark"
                                  stroke="rgba(56,189,248,0.85)"
                                  strokeWidth={2}
                                  dot={false}
                                  isAnimationActive={true}
                                  animationDuration={1200}
                                  animationEasing="ease-in-out"
                                  activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="portfolio"
                                  stroke="rgba(110,231,183,0.9)"
                                  strokeWidth={2.5}
                                  dot={false}
                                  isAnimationActive={true}
                                  animationDuration={1200}
                                  animationEasing="ease-in-out"
                                  activeDot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-200/60">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-300/80" />
                              資產
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-sky-300/80" />
                              標普500
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[11px] font-semibold text-zinc-200/70">
                            投資者概覽
                          </p>
                          {(() => {
                            const pls = liveLog.map((r) => r.dailyPL);
                            const best = pls.length ? Math.max(...pls) : 0;
                            const worst = pls.length ? Math.min(...pls) : 0;
                            return (
                              <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="flex items-center gap-2 text-[11px] font-semibold text-zinc-200/60">
                                    <Briefcase className="h-4 w-4 text-zinc-200/70" aria-hidden="true" />
                                    最終資產
                                  </p>
                                  <p className="mt-1 text-lg font-semibold tracking-tight text-white">
                                    {formatCurrency(portfolioValue)}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="flex items-center gap-2 text-[11px] font-semibold text-zinc-200/60">
                                    <BarChart2 className="h-4 w-4 text-zinc-200/70" aria-hidden="true" />
                                    總計盈虧
                                  </p>
                                  <p
                                    className={`mt-1 text-lg font-semibold tracking-tight ${
                                      portfolioValue - 100000 >= 0
                                        ? "text-emerald-200"
                                        : "text-rose-200"
                                    }`}
                                  >
                                    {formatSignedCurrency(portfolioValue - 100000)}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="flex items-center gap-2 text-[11px] font-semibold text-zinc-200/60">
                                    <TrendingUp className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                                    最佳單日
                                  </p>
                                  <p className="mt-1 text-lg font-semibold tracking-tight text-emerald-200">
                                    {formatSignedCurrency(best)}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                  <p className="flex items-center gap-2 text-[11px] font-semibold text-zinc-200/60">
                                    <TrendingDown className="h-4 w-4 text-rose-200" aria-hidden="true" />
                                    最差單日
                                  </p>
                                  <p className="mt-1 text-lg font-semibold tracking-tight text-rose-200">
                                    {formatSignedCurrency(worst)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold text-zinc-200/70">
                          Philosophy Lens
                        </p>
                        <p className="mt-2 text-xs leading-5 text-zinc-200/70">
                          {(() => {
                            if (!corePhilosophy || !lockedWarPlan) return "";
                            const label = philosophyToLabel(corePhilosophy);
                            const days = lockedWarPlan.length;
                            const impacts = Array.from({ length: days }, (_, i) => {
                              const ev = eventsData[i];
                              const base = ev?.impact ?? (sp500Benchmark[i] ?? 0);
                              const mult =
                                philosophyModifiers[corePhilosophy][ev?.category ?? "market"] ??
                                1.0;
                              return base * mult;
                            });
                            let bestIdx = 0;
                            let worstIdx = 0;
                            for (let i = 0; i < impacts.length; i += 1) {
                              if (impacts[i] > impacts[bestIdx]) bestIdx = i;
                              if (impacts[i] < impacts[worstIdx]) worstIdx = i;
                            }
                            const bestEv = eventsData[bestIdx];
                            const worstEv = eventsData[worstIdx];

                            const interventionLine = (() => {
                              if (interventions.length === 0) return "";
                              const bestDelta = interventions.reduce((acc, it) => {
                                const diff = it.valueWithIntervention - it.valueWithoutIntervention;
                                return diff > acc.diff ? { day: it.day, diff } : acc;
                              }, { day: interventions[0]?.day ?? 1, diff: -Infinity as number });
                              if (!Number.isFinite(bestDelta.diff) || bestDelta.diff <= 0) {
                                return `你的干預更偏向「止損/止盈」而非提升回報。`;
                              }
                              return `你的哲學干預在第 ${bestDelta.day} 天為你鎖定了約 ${formatCurrency(bestDelta.diff)} 的超額收益。`;
                            })();

                            if (corePhilosophy === "growth") {
                              return `作為一個 ${label}，你在「${bestEv?.headline ?? "利好日"}」中獲得了更大的放大收益，但也會在「${worstEv?.headline ?? "利空日"}」時承受更深回撤。${interventionLine}`;
                            }
                            if (corePhilosophy === "value") {
                              return `作為一個 ${label}，你更受益於經濟/產業的確定性：在「${bestEv?.headline ?? "利好日"}」中回報更穩健；而在「${worstEv?.headline ?? "利空日"}」時，重組可以顯著壓縮波動。${interventionLine}`;
                            }
                            return `作為一個 ${label}，你對新聞衝擊保持中性，但「精準擇時」的獎金能在關鍵方向放大優勢或減輕回撤。你的最佳環境出現在「${bestEv?.headline ?? "利好日"}」，而最艱難的一天是「${worstEv?.headline ?? "利空日"}」。${interventionLine}`;
                          })()}
                        </p>
                      </div>
                    </>
                  );
                })()}

                <DailyReviewTable
                  days={lockedWarPlan?.length ?? liveLog.length}
                  events={eventsData}
                  dailyResults={liveLog}
                  formatSignedCurrency={formatSignedCurrency}
                />

                {/* Attribution Analysis */}
                <details className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-200/70">
                    深度解析（分析與歸因）
                  </summary>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">
                      你的計畫 vs. 市場現實
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-200/70">
                      {(() => {
                        if (!corePhilosophy || !lockedWarPlan) return "";
                        const label = philosophyToLabel(corePhilosophy);
                        const days = lockedWarPlan.length;
                        const impacts = Array.from({ length: days }, (_, i) => {
                          const ev = eventsData[i];
                          const base = ev?.impact ?? (sp500Benchmark[i] ?? 0);
                          const mult =
                            philosophyModifiers[corePhilosophy][ev?.category ?? "market"] ?? 1.0;
                          return base * mult;
                        });
                        let bestIdx = 0;
                        let worstIdx = 0;
                        for (let i = 0; i < impacts.length; i += 1) {
                          if (impacts[i] > impacts[bestIdx]) bestIdx = i;
                          if (impacts[i] < impacts[worstIdx]) worstIdx = i;
                        }
                        const bestPct = (impacts[bestIdx] * 100).toFixed(2);
                        const worstPct = (impacts[worstIdx] * 100).toFixed(2);
                        const vol = Math.max(...impacts) - Math.min(...impacts);
                        const volTag =
                          vol >= 0.05
                            ? "高波動"
                            : vol >= 0.03
                              ? "中度波動"
                              : "相對平穩";
                        return `你的「${label}」哲學在本輪呈現${volTag}特徵：第 ${bestIdx + 1} 天錄得 ${bestPct}% 的強勢表現，而第 ${worstIdx + 1} 天出現 ${worstPct}% 的回撤。你的時間線計畫決定了你在這些關鍵波動日的暴露程度。`;
                      })()}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">
                      搖擺不定的代價：你的干預歷史
                    </p>

                    {interventions.length === 0 ? (
                      <p className="mt-2 text-sm leading-6 text-emerald-200/90">
                        恭喜！你展現了非凡的紀律性，堅持了你的原始計畫。你已獲得「紀律嚴明的規劃者」資格。
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {interventions.map((it) => {
                          const marketReturn = (() => {
                            if (!corePhilosophy) return 0;
                            const i = it.day - 1;
                            const ev = eventsData[i];
                            const base = ev?.impact ?? (sp500Benchmark[i] ?? 0);
                            const mult =
                              philosophyModifiers[corePhilosophy][ev?.category ?? "market"] ?? 1.0;
                            return base * mult;
                          })();
                          const condition = marketConditionLabel(marketReturn);
                          const diff = it.valueWithIntervention - it.valueWithoutIntervention;
                          const diffAbs = Math.abs(diff);
                          const diffWord =
                            diff > 0
                              ? "多赚了"
                              : diff < 0
                                ? "多亏了"
                                : "结果相同";
                          return (
                            <div
                              key={it.day}
                              className="rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                              <p className="text-sm font-semibold text-white">
                                干預 #第 {it.day} 天
                              </p>
                              <div className="mt-2 grid gap-2 text-sm leading-6 text-zinc-200/70">
                                <p>
                                  <span className="font-semibold text-zinc-200/85">
                                    觸發點：
                                  </span>{" "}
                                  在第 {it.day} 天，面對「{condition}」的市場情況，你選擇干預。
                                </p>
                                <p>
                                  <span className="font-semibold text-zinc-200/85">
                                    你的行動：
                                  </span>{" "}
                                  你將指令從{" "}
                                  <span className="font-semibold text-white">
                                    {mandateToDisplayLabel(it.originalPlan)}
                                  </span>{" "}
                                  更改為{" "}
                                  <span className="font-semibold text-white">
                                    {mandateToDisplayLabel(it.newPlan)}
                                  </span>
                                  。
                                </p>
                                <p>
                                  <span className="font-semibold text-zinc-200/85">
                                    即時成本：
                                  </span>{" "}
                                  本次干預的直接財務成本為{" "}
                                  <span className="font-semibold text-white">
                                    {formatCurrency(it.feeCost)}
                                  </span>
                                  。
                                </p>
                                <p>
                                  <span className="font-semibold text-zinc-200/85">
                                    結果分析：
                                  </span>{" "}
                                  如果沒有干預，你當天的資產會是{" "}
                                  <span className="font-semibold text-white">
                                    {formatCurrency(it.valueWithoutIntervention)}
                                  </span>
                                  。干預後，你的資產變為{" "}
                                  <span className="font-semibold text-white">
                                    {formatCurrency(it.valueWithIntervention)}
                                  </span>
                                  。這次干預最終讓你{" "}
                                  <span
                                    className={`font-semibold ${
                                      diff >= 0 ? "text-emerald-200" : "text-rose-200"
                                    }`}
                                  >
                                    {diffWord}
                                    {diff === 0 ? "" : ` ${formatCurrency(diffAbs)}`}
                                  </span>
                                  。
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </details>

                {/* Final Prototype */}
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold text-zinc-200/70">
                    最終投資者原型
                  </p>
                  {(() => {
                    const proto = computePrototypeLabel();
                    const interventionCount = interventions.length;
                    const badgeIcons: Record<string, React.ReactNode> = {
                      "纪律严明的规划者":
                        <Diamond className="h-12 w-12 text-sky-200" aria-hidden="true" />,
                      "情绪化的反应者":
                        <Flame className="h-12 w-12 text-rose-200" aria-hidden="true" />,
                      "犹豫的战术家":
                        <ShieldAlert className="h-12 w-12 text-orange-200" aria-hidden="true" />,
                      "卓越的预测者":
                        <Crown className="h-12 w-12 text-amber-200" aria-hidden="true" />,
                      "错配的策略师":
                        <Swords className="h-12 w-12 text-zinc-200/80" aria-hidden="true" />,
                    };
                    return (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="grid h-20 w-20 place-items-center rounded-[28px] border border-white/10 bg-white/5">
                            {badgeIcons[proto.title] ?? (
                              <Diamond className="h-12 w-12 text-zinc-200/80" aria-hidden="true" />
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-semibold tracking-tight text-white">
                              {proto.title}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-zinc-200/70">
                              干預次數：{interventionCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Guaranteed Reward */}
                <div className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">
                    感謝你完成挑戰！這是你的專屬獎勵！
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-50/85">
                    你的投資之旅值得讚賞。作為謝禮，我們將贈送你一張{" "}
                    <span className="font-semibold text-white">
                      免費線下投資講座的電子入場券
                    </span>
                    。
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen("voucher")}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-amber-300 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    按此領取您的入場券
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">
                    想挑戰更高的評級嗎？
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200/70">
                    你的投資之旅尚未結束！試試用不同的「投資信仰」再玩一次，看看你能否超越這次的成績，衝擊「投資之神」的稱號！
                  </p>
                </div>

                {/* Replay System */}
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold text-zinc-200/70">
                    再玩一次
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => replaySameSettings()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    >
                      <RotateCcw className="h-5 w-5" aria-hidden="true" />
                      再玩一次（相同設定）
                    </button>
                    <button
                      type="button"
                      onClick={() => resetToWelcome()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    >
                      <Home className="h-5 w-5" aria-hidden="true" />
                      返回主選單（選擇新策略）
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

