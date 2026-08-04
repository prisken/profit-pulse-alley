"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { pickBilingual } from "@/lib/workshop/bilingual";
import {
  allocationSliceColor,
  WORKSHOP_CHART,
} from "@/lib/workshop/chart-tokens";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import type { AllocationSlice } from "@/lib/workshop/types";

export type WorkshopAllocationDonutProps = {
  slices: AllocationSlice[];
  size?: "large" | "compact";
  centerLabel?: string;
  centerValue?: string;
  highlightChanged?: boolean;
};

type ChartDatum = {
  key: string;
  name: string;
  value: number;
  changed: boolean;
  fill: string;
};

const SIZE_CONFIG = {
  large: {
    height: 220,
    outer: 88,
    inner: 54,
    chartClass: "h-[220px] w-full max-w-[280px]",
    rootClass: "w-full min-w-0 overflow-x-hidden",
    legendClass:
      "mt-3 flex w-full min-w-0 flex-wrap justify-center gap-x-3 gap-y-1.5",
    centerLabelClass: "text-[10px] font-medium uppercase tracking-wide text-slate-500",
    centerValueClass: "text-sm font-semibold tabular-nums text-slate-900",
  },
  compact: {
    height: 132,
    outer: 52,
    inner: 32,
    chartClass: "mx-auto h-[132px] w-full max-w-[148px]",
    rootClass: "w-full min-w-0 max-w-[168px] overflow-x-hidden",
    legendClass:
      "mt-2 flex w-full min-w-0 flex-col gap-1 sm:gap-1.5",
    centerLabelClass: "text-[9px] font-medium uppercase tracking-wide text-slate-500",
    centerValueClass: "text-xs font-semibold tabular-nums text-slate-900",
  },
} as const;

function buildChartData(
  slices: AllocationSlice[],
  locale: "en" | "zh-Hant",
): ChartDatum[] {
  return slices
    .filter((slice) => slice.amountHKD > 0)
    .map((slice, index) => ({
      key: slice.key,
      name: pickBilingual(slice.label, locale),
      value: Math.max(0, slice.amountHKD),
      changed: slice.changed === true,
      fill: allocationSliceColor(slice.key, index),
    }));
}

export default function WorkshopAllocationDonut({
  slices,
  size = "large",
  centerLabel,
  centerValue,
  highlightChanged = false,
}: WorkshopAllocationDonutProps) {
  const { locale, t } = useTranslations();
  const config = SIZE_CONFIG[size];
  const data = buildChartData(slices, locale);
  const totalHKD = slices.reduce((sum, slice) => sum + Math.max(0, slice.amountHKD), 0);
  const resolvedCenterValue =
    centerValue ?? (totalHKD > 0 ? formatCompactHkd(totalHKD) : "—");

  return (
    <div
      className={config.rootClass}
      data-testid="workshop-allocation-donut"
      data-size={size}
    >
      <div className={`relative mx-auto ${config.chartClass}`}>
        <ResponsiveContainer width="100%" height={config.height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={config.inner}
              outerRadius={config.outer}
              paddingAngle={1.5}
              stroke={WORKSHOP_CHART.white}
              strokeWidth={1}
              isAnimationActive={false}
            >
              {data.map((entry) => {
                const showChanged =
                  highlightChanged && entry.changed;
                return (
                  <Cell
                    key={entry.key}
                    fill={entry.fill}
                    stroke={
                      showChanged ? WORKSHOP_CHART.ink : WORKSHOP_CHART.white
                    }
                    strokeWidth={showChanged ? 2.5 : 1}
                    strokeDasharray={showChanged ? "5 3" : undefined}
                    data-changed={showChanged ? "true" : "false"}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center"
          data-testid="workshop-allocation-donut-center"
        >
          {centerLabel ? (
            <span className={config.centerLabelClass}>{centerLabel}</span>
          ) : null}
          <span className={config.centerValueClass}>{resolvedCenterValue}</span>
        </div>
      </div>

      <ul
        className={config.legendClass}
        data-testid="workshop-allocation-donut-legend"
      >
        {data.map((entry) => {
          const showChanged = highlightChanged && entry.changed;
          return (
            <li
              key={entry.key}
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-[11px] text-slate-600"
              data-slice-key={entry.key}
              data-changed={showChanged ? "true" : "false"}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{
                  backgroundColor: entry.fill,
                  outline: showChanged
                    ? `1.5px dashed ${WORKSHOP_CHART.ink}`
                    : undefined,
                  outlineOffset: showChanged ? 1 : undefined,
                }}
                aria-hidden
              />
              <span className="min-w-0 truncate">{entry.name}</span>
              <span className="shrink-0 font-mono tabular-nums text-slate-500">
                {formatCompactHkd(entry.value)}
              </span>
              {showChanged ? (
                <span
                  className="inline-flex shrink-0 items-center rounded-md border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9px] font-medium text-amber-900"
                  data-testid="workshop-allocation-changed-chip"
                >
                  {t("workshop.allocation.changed")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
