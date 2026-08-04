"use client";

/**
 * Dual cash-flow / asset line charts + age scrubber.
 * Mounted inside the retirement finale card on the goal journey rail.
 */

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import WorkshopRangeSlider from "@/components/workshop/WorkshopRangeSlider";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  computePassiveCoverageRatio,
  formatCoveragePercent,
  type CoverageRatioBand,
} from "@/lib/workshop/coverage-ratio";
import {
  formatCompactHkd,
  truncateLabelCjkSafe,
} from "@/lib/workshop/format-compact-hkd";
import { pickBilingual } from "@/lib/workshop/bilingual";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";
import type { PyramidState } from "@/lib/workshop/types";

const COVERAGE_TEXT: Record<CoverageRatioBand, string> = {
  emerald: "text-emerald-700",
  amber: "text-amber-800",
  rose: "text-rose-700",
};

type ChartRow = {
  age: number;
  calendarYear: number;
  totalIncome: number;
  expenses: number;
  bandBase: number;
  surplusFill: number;
  shortfallFill: number;
  liquidPool: number;
  investedPool: number;
  salaryIncome: number;
  passiveIncome: number;
  investedLiquidatedHKD: number;
  liquidationMark: number | null;
};

type ChartTooltipPayloadItem = {
  dataKey?: string | number;
  value?: number | string;
  name?: string;
  payload?: ChartRow;
};

function CashFlowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
}) {
  const { t } = useTranslations();
  if (!active || !payload?.length) {
    return null;
  }
  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 text-slate-900 shadow-xl backdrop-blur">
      <p className="font-mono text-xs font-semibold text-slate-500">
        {t("workshop.stressTest.scrubAge").replace("{age}", String(row.age))}
      </p>
      <div className="mt-2 space-y-1 text-xs">
        <p>
          {t("workshop.stressTest.legendIncome")}{" "}
          <span className="font-mono font-medium">
            {formatCompactHkd(row.totalIncome)}
          </span>
        </p>
        <p>
          {t("workshop.stressTest.legendExpenses")}{" "}
          <span className="font-mono font-medium">
            {formatCompactHkd(row.expenses)}
          </span>
        </p>
        {row.passiveIncome > 0 ? (
          <p>
            {t("workshop.stressTest.passiveIncome")}{" "}
            <span className="font-mono font-medium">
              {formatCompactHkd(row.passiveIncome)}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AssetsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
}) {
  const { t } = useTranslations();
  if (!active || !payload?.length) {
    return null;
  }
  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 text-slate-900 shadow-xl backdrop-blur">
      <p className="font-mono text-xs font-semibold text-slate-500">
        {t("workshop.stressTest.scrubAge").replace("{age}", String(row.age))}
      </p>
      <div className="mt-2 space-y-1 text-xs">
        <p>
          {t("workshop.stressTest.legendLiquid")}{" "}
          <span className="font-mono font-medium">
            {formatCompactHkd(row.liquidPool)}
          </span>
        </p>
        <p>
          {t("workshop.stressTest.legendInvested")}{" "}
          <span className="font-mono font-medium">
            {formatCompactHkd(row.investedPool)}
          </span>
        </p>
        {row.investedLiquidatedHKD > 0 ? (
          <p className="text-amber-800">
            {t("workshop.stressTest.liquidationNote")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GoalChipLabel({
  viewBox,
  label,
}: {
  viewBox?: { x?: number; y?: number };
  label: string;
}) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <foreignObject x={-36} y={4} width={72} height={22}>
        <div className="flex justify-center overflow-hidden">
          <span className="max-w-[72px] truncate rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-900">
            {label}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

function NestEggLabel({
  viewBox,
  text,
  tone,
}: {
  viewBox?: { x?: number; y?: number };
  text: string;
  tone: "emerald" | "amber" | "rose";
}) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const color =
    tone === "emerald" ? "#047857" : tone === "amber" ? "#b45309" : "#e11d48";
  return (
    <text
      x={x}
      y={y - 6}
      fill={color}
      fontSize={10}
      fontWeight={600}
      textAnchor="end"
    >
      {text}
    </text>
  );
}

function DepletedLabel({
  viewBox,
  title,
  subtitle,
}: {
  viewBox?: { x?: number; y?: number };
  title: string;
  subtitle: string;
}) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text x={4} y={12} fill="#e11d48" fontSize={10} fontWeight={600}>
        {title}
      </text>
      <text x={4} y={24} fill="#e11d48" fontSize={9} opacity={0.85}>
        {subtitle}
      </text>
    </g>
  );
}

export type WorkshopRetirementFinaleChartsProps = Readonly<{
  timeline: TimelineResult;
  pyramid: PyramidState;
  scrubAge: number;
  onScrubAgeChange: (age: number) => void;
}>;

export default function WorkshopRetirementFinaleCharts({
  timeline,
  pyramid,
  scrubAge,
  onScrubAgeChange,
}: WorkshopRetirementFinaleChartsProps) {
  const { t, locale } = useTranslations();
  const result = timeline;
  const minAge = result.rows[0]?.age ?? scrubAge;
  const maxAge = result.rows[result.rows.length - 1]?.age ?? scrubAge;
  const startYear = result.rows[0]?.year ?? new Date().getFullYear();
  const activeScrubAge = scrubAge;
  const retirementAge = result.retirement.retirementAge;

  const chartData = useMemo((): ChartRow[] => {
    return result.rows.map((row) => {
      const income = row.totalIncome;
      const exp = row.expenses;
      const liquidated = row.investedLiquidatedHKD ?? 0;
      return {
        age: row.age,
        calendarYear: row.year,
        totalIncome: income,
        expenses: exp,
        bandBase: Math.min(income, exp),
        surplusFill: Math.max(0, income - exp),
        shortfallFill: Math.max(0, exp - income),
        liquidPool: row.liquidPool,
        investedPool: row.investedPool,
        salaryIncome: row.salaryIncome,
        passiveIncome: row.passiveIncome,
        investedLiquidatedHKD: liquidated,
        liquidationMark: liquidated > 0 ? row.investedPool : null,
      };
    });
  }, [result]);

  const spendGoalMarkers = useMemo(() => {
    return result.goals
      .filter((g) => (g.goalType ?? "spend") === "spend")
      .map((g) => {
        const fromPyramid = pyramid.goals.goals.find((p) => p.id === g.goalId);
        const rawLabel = fromPyramid
          ? pickBilingual(fromPyramid.label, locale)
          : g.goalId;
        return {
          goalId: g.goalId,
          age: g.targetAge,
          label: truncateLabelCjkSafe(rawLabel, 6),
          icon: fromPyramid?.icon ?? "Target",
        };
      })
      .filter((g) => g.age >= minAge && g.age <= maxAge);
  }, [result, pyramid, locale, minAge, maxAge]);

  const nestEggLines = useMemo(() => {
    return (result.retirementTargets ?? []).map((rt) => {
      let tone: "emerald" | "amber" | "rose" = "rose";
      if (rt.met) {
        tone = "emerald";
      } else if (rt.gapHKD / Math.max(1, rt.targetHKD) <= 0.2) {
        tone = "amber";
      }
      return { ...rt, tone };
    });
  }, [result]);

  const rowAtScrub = useMemo(() => {
    return (
      result.rows.find((r) => r.age === activeScrubAge) ?? result.rows[0] ?? null
    );
  }, [result, activeScrubAge]);

  const scrubCalendarYear = rowAtScrub?.year ?? startYear;
  const scrubCoverage = useMemo(() => {
    if (!rowAtScrub) {
      return computePassiveCoverageRatio(0, 1);
    }
    return computePassiveCoverageRatio(
      rowAtScrub.passiveIncome,
      rowAtScrub.expenses,
    );
  }, [rowAtScrub]);

  const scrubPct =
    maxAge === minAge
      ? 0
      : ((activeScrubAge - minAge) / (maxAge - minAge)) * 100;

  const depletedAge = result.retirement.assetsDepletedAtAge;
  const yearsAfterRetire =
    depletedAge != null ? Math.max(0, depletedAge - retirementAge) : null;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden" data-testid="workshop-retirement-finale-charts">
      {chartData.length > 0 ? (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("workshop.stressTest.chartCashFlow")}
            </p>
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("workshop.stressTest.legendIncome")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {t("workshop.stressTest.legendExpenses")}
              </span>
            </div>
          </div>
          <p className="mb-2 text-[11px] leading-snug text-slate-500">
            {t("workshop.stressTest.realTermsCaption")}
          </p>
          <div className="relative mb-1 flex justify-between px-1 text-[10px] font-medium text-slate-400">
            <span>{t("workshop.stressTest.phaseWorking")}</span>
            <span>{t("workshop.stressTest.phaseRetirement")}</span>
          </div>
          <div className="h-52 w-full min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={[minAge, maxAge]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => formatCompactHkd(Number(v))}
                />
                <Tooltip content={CashFlowTooltip as never} />
                <ReferenceArea
                  x1={minAge}
                  x2={retirementAge}
                  fill="#f1f5f9"
                  fillOpacity={0.55}
                  ifOverflow="extendDomain"
                />
                <ReferenceArea
                  x1={retirementAge}
                  x2={maxAge}
                  fill="#eef2ff"
                  fillOpacity={0.45}
                  ifOverflow="extendDomain"
                />
                <Area
                  type="monotone"
                  dataKey="bandBase"
                  stackId="gap"
                  stroke="none"
                  fill="transparent"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="surplusFill"
                  stackId="gap"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.22}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="shortfallFill"
                  stackId="gap"
                  stroke="none"
                  fill="#f43f5e"
                  fillOpacity={0.2}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="totalIncome"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                  name={t("workshop.stressTest.legendIncome")}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name={t("workshop.stressTest.legendExpenses")}
                />
                <ReferenceLine
                  x={retirementAge}
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                  label={{
                    value: t("workshop.stressTest.retirementMarker"),
                    fill: "#0f172a",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <ReferenceLine
                  x={activeScrubAge}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {chartData.length > 0 ? (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("workshop.stressTest.chartAssets")}
            </p>
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("workshop.stressTest.legendLiquid")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {t("workshop.stressTest.legendInvested")}
              </span>
            </div>
          </div>
          <p className="mb-2 text-[11px] leading-snug text-slate-500">
            {t("workshop.stressTest.realTermsCaption")}
          </p>
          <div className="h-52 w-full min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 28, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="wsLiquidFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient
                    id="wsInvestedFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={[minAge, maxAge]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => formatCompactHkd(Number(v))}
                />
                <Tooltip content={AssetsTooltip as never} />
                <Area
                  type="monotone"
                  dataKey="liquidPool"
                  stackId="assets"
                  stroke="#059669"
                  strokeWidth={1.5}
                  fill="url(#wsLiquidFill)"
                />
                <Area
                  type="monotone"
                  dataKey="investedPool"
                  stackId="assets"
                  stroke="#4f46e5"
                  strokeWidth={1.5}
                  fill="url(#wsInvestedFill)"
                />
                <Line
                  type="monotone"
                  dataKey="liquidationMark"
                  stroke="none"
                  connectNulls={false}
                  dot={(props: {
                    cx?: number;
                    cy?: number;
                    payload?: ChartRow;
                  }) => {
                    if (
                      props.payload == null ||
                      props.payload.investedLiquidatedHKD <= 0 ||
                      props.cx == null ||
                      props.cy == null
                    ) {
                      return <g key={`liq-empty-${props.cx ?? 0}`} />;
                    }
                    return (
                      <circle
                        key={`liq-${props.payload.age}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill="#b45309"
                        stroke="#fff"
                        strokeWidth={1.5}
                      >
                        <title>{t("workshop.stressTest.liquidationNote")}</title>
                      </circle>
                    );
                  }}
                  activeDot={false}
                  isAnimationActive={false}
                />
                <ReferenceLine
                  x={retirementAge}
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                  label={{
                    value: t("workshop.stressTest.retirementMarker"),
                    fill: "#0f172a",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                {nestEggLines.map((rt) => (
                  <ReferenceLine
                    key={`nest-${rt.goalId}`}
                    y={rt.targetHKD}
                    stroke={
                      rt.tone === "emerald"
                        ? "#059669"
                        : rt.tone === "amber"
                          ? "#d97706"
                          : "#e11d48"
                    }
                    strokeDasharray="5 4"
                    label={
                      <NestEggLabel
                        text={t("workshop.stressTest.nestEggTarget").replace(
                          "{amount}",
                          formatCompactHkd(rt.targetHKD),
                        )}
                        tone={rt.tone}
                      />
                    }
                  />
                ))}
                {depletedAge != null && yearsAfterRetire != null ? (
                  <ReferenceLine
                    x={depletedAge}
                    stroke="#e11d48"
                    strokeWidth={2}
                    label={
                      <DepletedLabel
                        title={t("workshop.stressTest.depletedMarker")}
                        subtitle={t(
                          "workshop.stressTest.depletedYearsAfter",
                        ).replace("{n}", String(yearsAfterRetire))}
                      />
                    }
                  />
                ) : null}
                {spendGoalMarkers.map((m) => (
                  <ReferenceLine
                    key={m.goalId}
                    x={m.age}
                    stroke="#f59e0b"
                    strokeDasharray="2 3"
                    strokeOpacity={0.75}
                    label={<GoalChipLabel label={m.label} />}
                  />
                ))}
                <ReferenceLine
                  x={activeScrubAge}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-4 shadow-sm touch-pan-y sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("workshop.stressTest.scrubberLabel")}
          </p>
          {rowAtScrub ? (
            <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  {
                    key: "salary",
                    label: t("workshop.stressTest.salaryIncome"),
                    value: formatCompactHkd(rowAtScrub.salaryIncome),
                  },
                  {
                    key: "passive",
                    label: t("workshop.stressTest.passiveIncome"),
                    value: formatCompactHkd(rowAtScrub.passiveIncome),
                  },
                  {
                    key: "expenses",
                    label: t("workshop.stressTest.expenses"),
                    value: formatCompactHkd(rowAtScrub.expenses),
                  },
                  {
                    key: "liquid",
                    label: t("workshop.stressTest.liquidPool"),
                    value: formatCompactHkd(rowAtScrub.liquidPool),
                  },
                  {
                    key: "invested",
                    label: t("workshop.stressTest.investedPool"),
                    value: formatCompactHkd(rowAtScrub.investedPool),
                  },
                  {
                    key: "coverage",
                    label: t("workshop.stressTest.coverageRatio"),
                    value: formatCoveragePercent(scrubCoverage.percent),
                    className: COVERAGE_TEXT[scrubCoverage.band],
                  },
                ] as const
              ).map((cell) => (
                <div
                  key={cell.key}
                  className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                >
                  <p className="truncate text-[10px] font-medium text-slate-500">
                    {cell.label}
                  </p>
                  <p
                    className={[
                      "mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-slate-800",
                      "className" in cell ? cell.className : "",
                    ].join(" ")}
                  >
                    {cell.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative mt-4 touch-none pt-9">
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
            style={{
              left: `clamp(1.5rem, ${scrubPct}%, calc(100% - 1.5rem))`,
            }}
          >
            <span className="inline-flex max-w-[10rem] truncate rounded-full bg-slate-900 px-3 py-1 font-mono text-[11px] font-semibold text-white shadow-md sm:max-w-none sm:text-xs">
              {t("workshop.stressTest.scrubBubble")
                .replace("{year}", String(scrubCalendarYear))
                .replace("{age}", String(activeScrubAge))}
            </span>
          </div>
          <WorkshopRangeSlider
            min={minAge}
            max={maxAge}
            step={1}
            value={activeScrubAge}
            aria-label={t("workshop.stressTest.yearScrubAria")}
            aria-valuetext={t("workshop.stressTest.yearValueAria")
              .replace("{age}", String(activeScrubAge))
              .replace("{year}", String(scrubCalendarYear))}
            onChange={onScrubAgeChange}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
          <span>{minAge}</span>
          <span>
            {t("workshop.stressTest.horizonHint")
              .replace("{minAge}", String(minAge))
              .replace("{maxAge}", String(maxAge))}
          </span>
        </div>
      </div>
    </div>
  );
}
