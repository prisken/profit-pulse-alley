"use client";

import { useMemo, useState } from "react";

import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import {
  buildPyramidBenchmarks,
  computeLayerFlags,
  type PyramidBenchmarkSnapshot,
} from "@/lib/workshop/pyramid-benchmarks";
import { normalizePyramidState } from "@/lib/workshop/pyramid-normalize";
import type {
  ExpensesState,
  GoalItem,
  GoalJourneyState,
  LayerFlag,
  LayerFlags,
  PyramidState,
  RiskQuizState,
} from "@/lib/workshop/types";
import type { WorkshopAdminLeadRow } from "@/lib/workshop/admin-data";

const FLAG_BAR: Record<LayerFlag, string> = {
  green: "bg-emerald-500 text-white shadow-md shadow-emerald-500/25",
  amber: "bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30",
  red: "bg-rose-500 text-white shadow-md shadow-rose-500/25",
};

const FLAG_CHIP: Record<LayerFlag, string> = {
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  red: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

const FLAG_LABEL: Record<LayerFlag, string> = {
  green: "Strong",
  amber: "Watch",
  red: "Needs attention",
};

const BANDS: { key: keyof LayerFlags; label: string; width: string }[] = [
  { key: "investment", label: "Invest", width: "48%" },
  { key: "goals", label: "Goals", width: "62%" },
  { key: "emergencyFund", label: "Emergency", width: "76%" },
  { key: "protection", label: "Protection", width: "92%" },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pickEn(label: unknown): string | null {
  const record = asRecord(label);
  const en = record?.en;
  return typeof en === "string" && en.trim() ? en.trim() : null;
}

/** The pyramid, drawn exactly like the workshop: 4 stacked bands, flag-colored. */
function PyramidDiagram({
  finalJson,
  aiJson,
  age,
  monthlyIncomeHKD,
  industry,
  expensesTotalHKD,
}: {
  finalJson: unknown;
  aiJson: unknown;
  age: number;
  monthlyIncomeHKD: number | null;
  industry: string;
  expensesTotalHKD: number | null;
}) {
  const [mode, setMode] = useState<"final" | "ai">("final");

  const { pyramid, benchmarks, flags, source } = useMemo(() => {
    const finalPyramid = finalJson
      ? normalizePyramidState(finalJson, age)
      : null;
    const aiPyramid = aiJson ? normalizePyramidState(aiJson, age) : null;

    const chosen: PyramidState | null =
      mode === "final"
        ? finalPyramid ?? aiPyramid
        : aiPyramid ?? finalPyramid;
    if (!chosen) {
      return { pyramid: null, benchmarks: null, flags: null, source: null };
    }

    const benchmarks = buildPyramidBenchmarks({
      age,
      monthlyIncomeHKD: monthlyIncomeHKD ?? 0,
      industry,
    });
    const flags = computeLayerFlags(chosen, benchmarks, {
      monthlyIncomeHKD: monthlyIncomeHKD ?? undefined,
      monthlyExpensesHKD: expensesTotalHKD ?? undefined,
    });
    return {
      pyramid: chosen,
      benchmarks,
      flags,
      source:
        mode === "final" && finalPyramid
          ? "final"
          : mode === "ai" && aiPyramid
            ? "ai"
            : null,
    };
  }, [finalJson, aiJson, age, monthlyIncomeHKD, industry, expensesTotalHKD, mode]);

  if (!pyramid || !benchmarks || !flags) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-500">
        No pyramid data stored for this session.
      </div>
    );
  }

  const hasBoth = Boolean(finalJson) && Boolean(aiJson);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Financial pyramid
        </p>
        {hasBoth && (
          <div className="flex overflow-hidden rounded-md border border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setMode("final")}
              className={`px-2.5 py-1 font-medium transition ${
                mode === "final"
                  ? "bg-zinc-700 text-zinc-50"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Final
            </button>
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`border-l border-zinc-700 px-2.5 py-1 font-medium transition ${
                mode === "ai"
                  ? "bg-zinc-700 text-zinc-50"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              AI-predicted
            </button>
          </div>
        )}
      </div>

      {/* The pyramid — same trapezoid bands as the workshop */}
      <div className="mt-3 flex w-full flex-col items-center gap-1.5">
        {BANDS.map((band) => {
          const flag = flags[band.key];
          return (
            <div
              key={band.key}
              className="flex w-full items-center justify-center"
              title={`${band.label}: ${FLAG_LABEL[flag]}`}
            >
              <div
                className={`flex h-9 w-full items-center justify-center overflow-hidden px-2 text-center text-[11px] font-semibold leading-tight tracking-normal sm:h-10 sm:px-3 ${FLAG_BAR[flag]}`}
                style={{
                  width: band.width,
                  clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
                }}
              >
                <span className="block max-w-full truncate drop-shadow-sm">
                  {band.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer values */}
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <Value label="Protection · medical" value={`${pyramid.protection.medicalCoveragePercent}%`} />
        <Value
          label="Protection · critical illness"
          value={formatCompactHkd(pyramid.protection.criticalIllnessAmountHKD)}
        />
        <Value
          label="Emergency fund saved"
          value={`${formatCompactHkd(pyramid.emergencyFund.savedAmountHKD)} / ${formatCompactHkd(benchmarks.emergencyFundTargetHKD)} target`}
        />
        <Value
          label="Goals"
          value={`${pyramid.goals.goals.length} goal${pyramid.goals.goals.length === 1 ? "" : "s"}`}
        />
        <Value
          label="Investing"
          value={`${formatCompactHkd(pyramid.investment.monthlyInvestmentHKD)}/mo`}
        />
        <Value
          label="Lump sum · fun money"
          value={`${formatCompactHkd(pyramid.investment.lumpSumHKD)} · ${formatCompactHkd(pyramid.investment.monthlyFunHKD)}/mo`}
        />
      </dl>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(FLAG_LABEL) as LayerFlag[]).map((flag) => (
          <span
            key={flag}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${FLAG_CHIP[flag]}`}
          >
            {FLAG_LABEL[flag]}
          </span>
        ))}
        {source && (
          <span className="text-[11px] text-zinc-500">
            showing {source === "final" ? "final (user-confirmed)" : "AI-predicted"} pyramid
          </span>
        )}
      </div>
    </div>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="truncate font-mono tabular-nums text-zinc-200" title={value}>
        {value}
      </dd>
    </div>
  );
}

function ExpensesSummary({ json }: { json: unknown }) {
  const expenses = asRecord(json);
  const categories = Array.isArray(expenses?.categories)
    ? (expenses.categories as Record<string, unknown>[])
    : [];
  const total = asNumber(expenses?.totalHKD);

  if (categories.length === 0) {
    return null;
  }

  return (
    <Section title="Monthly expenses">
      <ul className="space-y-1.5">
        {categories.map((category) => {
          const amount = asNumber(category.amountHKD);
          const icon = typeof category.icon === "string" ? category.icon : "•";
          const key = typeof category.key === "string" ? category.key : "";
          return (
            <li key={key || icon} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-zinc-300">
                <span aria-hidden>{icon}</span>
                <span className="truncate capitalize">{key.replace("_", " ")}</span>
              </span>
              <span className="font-mono tabular-nums text-zinc-200">
                {amount == null ? "—" : formatCompactHkd(amount)}
              </span>
            </li>
          );
        })}
      </ul>
      {total != null && (
        <p className="mt-2 border-t border-zinc-800 pt-2 text-sm">
          <span className="text-zinc-500">Total</span>{" "}
          <span className="float-right font-mono tabular-nums text-zinc-100">
            {formatCompactHkd(total)}
          </span>
        </p>
      )}
    </Section>
  );
}

function GoalsSummary({
  goals,
  journeyJson,
}: {
  goals: GoalItem[];
  journeyJson: unknown;
}) {
  if (goals.length === 0) {
    return null;
  }

  const journey = asRecord(journeyJson);
  const decisions = Array.isArray(journey?.decisions)
    ? (journey.decisions as Record<string, unknown>[])
    : [];
  const statusByGoalId = new Map<string, string>();
  for (const decision of decisions) {
    const goalId = typeof decision.goalId === "string" ? decision.goalId : "";
    const status = typeof decision.status === "string" ? decision.status : "";
    if (goalId) {
      statusByGoalId.set(goalId, status);
    }
  }

  const statusChip: Record<string, string> = {
    applied: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    given_up: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    pending: "border-zinc-600 bg-zinc-800/60 text-zinc-300",
  };

  return (
    <Section title={`Goals (${goals.length})`}>
      <ul className="space-y-2">
        {goals.map((goal) => {
          const status = statusByGoalId.get(goal.id);
          return (
            <li key={goal.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-zinc-300">
                <span aria-hidden>{goal.icon}</span>
                <span className="truncate">{pickEn(goal.label) ?? goal.id}</span>
                {status && (
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusChip[status] ?? statusChip.pending}`}
                  >
                    {status.replace("_", " ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="font-mono tabular-nums text-zinc-200">
                  {formatCompactHkd(goal.targetAmountHKD)}
                </span>
                <span className="ml-1.5 text-xs text-zinc-500">age {goal.targetAge}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function RiskSummary({ json }: { json: unknown }) {
  const risk = asRecord(json);
  const profile = typeof risk?.profile === "string" ? risk.profile : null;
  const score = asNumber(risk?.score);
  if (!profile && score == null) {
    return null;
  }
  return (
    <Section title="Risk quiz">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {profile && (
          <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-300">
            {profile}
          </span>
        )}
        {score != null && (
          <span className="text-zinc-400">
            score <span className="font-mono tabular-nums text-zinc-200">{score}</span>
          </span>
        )}
      </div>
    </Section>
  );
}

function CrisisSummary({ goalsJson, crisisJson }: { goalsJson: unknown; crisisJson: unknown }) {
  const goals = asRecord(goalsJson);
  const fromGoals = asRecord(goals?.crisisStressTest);
  const crisis = asRecord(crisisJson);
  const summary = asRecord(crisis?.impactResult) ?? asRecord(crisis?.crisisStressTest);

  const verdict =
    typeof fromGoals?.verdict === "string"
      ? fromGoals.verdict
      : typeof summary?.verdict === "string"
        ? summary.verdict
        : null;
  const scenario = typeof summary?.scenario === "string" ? summary.scenario : null;
  const delayYears = asNumber(summary?.delayYears);
  const resilience = asNumber(fromGoals?.resilienceScore ?? summary?.resilienceScore);

  if (!verdict && !scenario && delayYears == null) {
    return null;
  }

  const verdictChip: Record<string, string> = {
    SHIELDED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    PARTIAL: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    PENETRATED: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  };

  return (
    <Section title="Crisis stress test">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {verdict && (
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${verdictChip[verdict] ?? "border-zinc-600 bg-zinc-800/60 text-zinc-300"}`}
          >
            {verdict}
          </span>
        )}
        {scenario && (
          <span className="text-xs uppercase tracking-wide text-zinc-400">
            {scenario.replace(/_/g, " ")}
          </span>
        )}
        {delayYears != null && (
          <span className="text-xs text-zinc-400">
            {delayYears === 0 ? "no delay" : `${delayYears} year${delayYears === 1 ? "" : "s"} delay`}
          </span>
        )}
        {resilience != null && (
          <span className="text-xs text-zinc-400">
            resilience{" "}
            <span className="font-mono tabular-nums text-zinc-200">{resilience}</span>
          </span>
        )}
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <h5 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h5>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * Read-only, visual view of everything a Workshop Pyramid Lab lead entered —
 * no raw JSON. Pyramid diagram matches the workshop's own rendering.
 */
export default function WorkshopSessionDetail({
  lead,
}: {
  lead: WorkshopAdminLeadRow;
}) {
  const expensesJson = lead.sessionJson?.expenses;
  const expenses = asRecord(expensesJson);
  const expensesTotal = asNumber(expenses?.totalHKD);

  const pyramidGoals = useMemo(() => {
    const json = lead.sessionJson?.finalPyramid ?? lead.sessionJson?.aiPyramid;
    if (!json) return [] as GoalItem[];
    try {
      const pyramid = normalizePyramidState(json, lead.age);
      return pyramid.goals.goals;
    } catch {
      return [] as GoalItem[];
    }
  }, [lead.sessionJson, lead.age]);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PyramidDiagram
          finalJson={lead.sessionJson?.finalPyramid}
          aiJson={lead.sessionJson?.aiPyramid}
          age={lead.age}
          monthlyIncomeHKD={lead.monthlyIncomeHKD}
          industry={lead.industry}
          expensesTotalHKD={expensesTotal}
        />
        <div className="grid content-start gap-4">
          <ExpensesSummary json={expensesJson} />
          <GoalsSummary goals={pyramidGoals} journeyJson={lead.sessionJson?.goalJourney} />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RiskSummary json={lead.sessionJson?.riskQuiz} />
        <CrisisSummary
          goalsJson={lead.sessionJson?.goals}
          crisisJson={lead.sessionJson?.crisis}
        />
      </div>
    </div>
  );
}
