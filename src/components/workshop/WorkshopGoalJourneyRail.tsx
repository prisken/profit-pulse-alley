"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopGoalJourneyCard from "@/components/workshop/WorkshopGoalJourneyCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  areSpendGoalsResolved,
  buildGoalJourneyRailItems,
  emptyGoalJourneyState,
  firstPendingRailGoalId,
  isGoalJourneyResolved,
  isRailGoalLocked,
  journeyDecisionForGoal,
  resolveGoalJourneyRailChip,
  type GoalJourneyRailChip,
} from "@/lib/workshop/goal-journey";
import { pickBilingual } from "@/lib/workshop/bilingual";
import { formatCompactHkd } from "@/lib/workshop/format-compact-hkd";
import type { ApplyGoalJourneyDecisionActionResult } from "@/lib/workshop/pyramid-actions";
import type { TimelineResult } from "@/lib/workshop/timeline-engine";
import type {
  ExpensesState,
  GoalItem,
  GoalJourneyState,
  PyramidState,
  WorkshopTone,
} from "@/lib/workshop/types";

const CHIP_PILL: Record<GoalJourneyRailChip, string> = {
  on_track: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delayed: "border-amber-200 bg-amber-50 text-amber-800",
  given_up: "border-slate-200 bg-slate-50 text-slate-600",
};

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
}

export type GoalJourneyPlanUpdate = ApplyGoalJourneyDecisionActionResult;

type WorkshopGoalJourneyRailProps = Readonly<{
  sessionId: string;
  tone: WorkshopTone;
  pyramid: PyramidState;
  expenses: ExpensesState;
  journey?: GoalJourneyState;
  timeline?: TimelineResult | null;
  onPlanChange?: (update: GoalJourneyPlanUpdate) => void;
  /** Fires when every spend goal has a decision (Continue unlocks). */
  onGoalsResolvedChange?: (resolved: boolean) => void;
}>;

/**
 * Vertical age-rail of spend-goal CollapsibleWidgets with sequencing locks.
 * Every goal is a spend goal; Continue unlocks once all have a decision.
 */
export default function WorkshopGoalJourneyRail({
  sessionId,
  tone,
  pyramid,
  expenses,
  journey: journeyProp,
  timeline = null,
  onPlanChange,
  onGoalsResolvedChange,
}: WorkshopGoalJourneyRailProps) {
  const { t, locale } = useTranslations();
  const [journey, setJourney] = useState<GoalJourneyState>(
    () => journeyProp ?? emptyGoalJourneyState(),
  );
  const [needsRevisit, setNeedsRevisit] = useState<Set<string>>(() => new Set());
  const [livePyramid, setLivePyramid] = useState(pyramid);
  const [liveTimeline, setLiveTimeline] = useState(timeline);
  /** Bumped every time a decision lands — cards refetch outlook/recommendation. */
  const [planRevision, setPlanRevision] = useState(0);

  useEffect(() => {
    if (journeyProp) {
      setJourney(journeyProp);
    }
  }, [journeyProp]);

  useEffect(() => {
    setLivePyramid(pyramid);
  }, [pyramid]);

  useEffect(() => {
    setLiveTimeline(timeline);
  }, [timeline]);

  const railItems = useMemo(
    () =>
      buildGoalJourneyRailItems({
        goals: livePyramid.goals.goals,
      }),
    [livePyramid.goals.goals],
  );

  const finaleReached = useMemo(
    () => areSpendGoalsResolved(railItems, journey),
    [railItems, journey],
  );

  useEffect(() => {
    onGoalsResolvedChange?.(finaleReached);
  }, [finaleReached, onGoalsResolvedChange]);

  const firstPendingId = useMemo(
    () => firstPendingRailGoalId(railItems, journey),
    [railItems, journey],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedId((current) => {
      if (current && railItems.some((g) => g.id === current)) {
        const idx = railItems.findIndex((g) => g.id === current);
        if (idx >= 0 && !isRailGoalLocked(railItems, journey, idx)) {
          return current;
        }
      }
      return firstPendingId;
    });
  }, [firstPendingId, railItems, journey]);

  function handleExpandedChange(goal: GoalItem, index: number, next: boolean) {
    if (isRailGoalLocked(railItems, journey, index)) {
      return;
    }
    if (!next) {
      setExpandedId((id) => (id === goal.id ? null : id));
      return;
    }

    const decision = journeyDecisionForGoal(journey, goal.id);
    if (isGoalJourneyResolved(decision)) {
      setNeedsRevisit((prev) => {
        const updated = new Set(prev);
        for (let i = index + 1; i < railItems.length; i += 1) {
          const later = railItems[i]!;
          if (
            isGoalJourneyResolved(journeyDecisionForGoal(journey, later.id))
          ) {
            updated.add(later.id);
          }
        }
        return updated;
      });
    }
    setExpandedId(goal.id);
  }

  function handleDecisionComplete(result: ApplyGoalJourneyDecisionActionResult) {
    setJourney(result.journey);
    setLivePyramid(result.pyramid);
    setLiveTimeline(result.timeline);
    setPlanRevision((n) => n + 1);
    setNeedsRevisit((prev) => {
      const updated = new Set(prev);
      const decided = result.journey.decisions[result.journey.decisions.length - 1];
      if (decided) {
        updated.delete(decided.goalId);
      }
      return updated;
    });
    const nextPending = firstPendingRailGoalId(
      buildGoalJourneyRailItems({
        goals: result.pyramid.goals.goals,
      }),
      result.journey,
    );
    setExpandedId(nextPending);
    onPlanChange?.(result);
  }

  return (
    <section
      className="min-w-0 space-y-3 overflow-x-hidden"
      data-testid="workshop-goal-journey-rail"
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {t("workshop.journey.railTitle")}
      </h3>

      <ol className="relative min-w-0 space-y-3 pl-0 sm:pl-1">
        <div
          className="pointer-events-none absolute bottom-3 left-[1.35rem] top-3 hidden w-px bg-slate-200 sm:block"
          aria-hidden
        />

        {railItems.map((goal, index) => {
          const locked = isRailGoalLocked(railItems, journey, index);
          const decision = journeyDecisionForGoal(journey, goal.id);
          const timelineGoal = liveTimeline?.goals.find(
            (row) => row.goalId === goal.id,
          );
          const chip = resolveGoalJourneyRailChip({
            decision,
            timelineStatus: timelineGoal?.status ?? null,
          });
          const title = pickBilingual(goal.label, locale);
          const subtitle = t("workshop.stressTest.goalTargetAmount").replace(
            "{amount}",
            formatCompactHkd(goal.targetAmountHKD),
          );
          const showRevisit =
            needsRevisit.has(goal.id) && isGoalJourneyResolved(decision);
          const isExpanded = !locked && expandedId === goal.id;

          return (
            <li
              key={goal.id}
              className="relative flex min-w-0 gap-2.5 sm:gap-3"
              data-goal-id={goal.id}
              data-locked={locked ? "true" : "false"}
              data-revisit={showRevisit ? "true" : "false"}
            >
              <div className="flex w-11 shrink-0 flex-col items-center pt-2 sm:w-12">
                <span
                  className={[
                    "relative z-[1] flex h-9 w-full max-w-[2.75rem] items-center justify-center overflow-hidden text-[10px] font-semibold tabular-nums text-slate-700 sm:h-10 sm:text-[11px]",
                    locked
                      ? "bg-slate-100 text-slate-400"
                      : chip === "on_track"
                        ? "bg-emerald-100 text-emerald-800"
                        : chip === "delayed"
                          ? "bg-amber-100 text-amber-900"
                          : chip === "given_up"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                  style={{
                    clipPath: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)",
                  }}
                  title={t("workshop.journey.ageMarker").replace(
                    "{age}",
                    String(goal.targetAge),
                  )}
                >
                  {goal.targetAge}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <CollapsibleWidget
                  disabled={locked}
                  expanded={isExpanded}
                  onExpandedChange={(next) =>
                    handleExpandedChange(goal, index, next)
                  }
                  className={showRevisit ? "ring-1 ring-amber-200" : undefined}
                  icon={
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                      {createElement(resolveIcon(goal.icon || "Target"), {
                        className: "h-5 w-5",
                        strokeWidth: 2,
                      })}
                    </span>
                  }
                  title={title}
                  subtitle={subtitle}
                  badge={
                    <div className="flex max-w-[9rem] flex-col items-end gap-1 sm:max-w-none sm:flex-row sm:items-center">
                      {showRevisit ? (
                        <span
                          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                          data-testid="workshop-journey-revisit-badge"
                        >
                          {t("workshop.journey.revisitBadge")}
                        </span>
                      ) : null}
                      {chip ? (
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                            CHIP_PILL[chip],
                          ].join(" ")}
                          data-testid={`workshop-journey-chip-${chip}`}
                        >
                          {chip === "on_track"
                            ? t("workshop.journey.statusOnTrack")
                            : chip === "delayed"
                              ? t("workshop.journey.statusDelayed")
                              : t("workshop.journey.statusGivenUp")}
                        </span>
                      ) : locked ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {t("workshop.journey.lockedHint")}
                        </span>
                      ) : null}
                    </div>
                  }
                >
                  {isExpanded ? (
                    <WorkshopGoalJourneyCard
                      sessionId={sessionId}
                      goal={goal}
                      tone={tone}
                      active={isExpanded}
                      planRevision={planRevision}
                      onDecisionComplete={handleDecisionComplete}
                    />
                  ) : (
                    <p className="text-sm text-slate-400">
                      {t("workshop.journey.stubPlaceholder")}
                    </p>
                  )}
                </CollapsibleWidget>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
