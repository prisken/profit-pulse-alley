"use client";

import { createElement, useId, useState } from "react";
import { icons, type LucideIcon } from "lucide-react";

import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  bilingualBoth,
  patchBilingual,
  pickBilingual,
} from "@/lib/workshop/bilingual";
import type {
  Bilingual,
  GoalItem,
  GoalsLayer,
  LayerFlag,
} from "@/lib/workshop/types";

const fieldClass =
  "mt-1.5 w-full min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-base text-white outline-none placeholder:text-zinc-500 focus-visible:border-emerald-400/40 focus-visible:ring-2 focus-visible:ring-emerald-400/40 sm:text-sm";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const GOAL_ICON_OPTIONS = [
  { id: "Heart", labelKey: "workshop.pyramid.goals.iconPicker.heart" },
  {
    id: "GraduationCap",
    labelKey: "workshop.pyramid.goals.iconPicker.graduationCap",
  },
  { id: "House", labelKey: "workshop.pyramid.goals.iconPicker.home" },
  { id: "Plane", labelKey: "workshop.pyramid.goals.iconPicker.plane" },
  { id: "Baby", labelKey: "workshop.pyramid.goals.iconPicker.baby" },
  { id: "PiggyBank", labelKey: "workshop.pyramid.goals.iconPicker.piggyBank" },
] as const satisfies ReadonlyArray<{ id: string; labelKey: MessageKey }>;

const ALLOWED_ICONS = new Set<string>(GOAL_ICON_OPTIONS.map((o) => o.id));

function resolveLucide(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Target;
}

function formatHkd(value: number): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function slugify(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "goal";
}

function uniqueGoalId(label: string, existing: GoalItem[]): string {
  const base = slugify(label);
  if (!existing.some((g) => g.id === base)) {
    return base;
  }
  let i = 2;
  while (existing.some((g) => g.id === `${base}-${i}`)) {
    i += 1;
  }
  return `${base}-${i}`;
}

function resolveGoalIcon(icon: string): string {
  return ALLOWED_ICONS.has(icon) ? icon : "Target";
}

type GoalsLayerEditorProps = Readonly<{
  value: GoalsLayer;
  onChange: (next: GoalsLayer) => void;
  status?: LayerFlag;
  rationale?: Bilingual | string;
  disabled?: boolean;
}>;

function GoalIconPicker({
  value,
  onChange,
  disabled,
}: Readonly<{
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}>) {
  const { t } = useTranslations();

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label={t("workshop.pyramid.goals.iconPickerAria")}
    >
      {GOAL_ICON_OPTIONS.map((option) => {
        const selected = value === option.id;
        const label = t(option.labelKey);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={[
              "inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border transition-colors",
              focusRing,
              selected
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            ].join(" ")}
          >
            {createElement(resolveLucide(option.id), {
              className: "h-4 w-4",
              strokeWidth: 2,
            })}
          </button>
        );
      })}
    </div>
  );
}

export default function GoalsLayerEditor({
  value,
  onChange,
  status,
  rationale,
  disabled = false,
}: GoalsLayerEditorProps) {
  const { t, locale } = useTranslations();
  const listId = useId();
  const [draftIcon, setDraftIcon] = useState<string>("Heart");

  const goals = value.goals;
  const total = goals.reduce((sum, goal) => sum + goal.targetAmountHKD, 0);

  function updateGoal(id: string, patch: Partial<GoalItem>) {
    onChange({
      goals: goals.map((goal) =>
        goal.id === id ? { ...goal, ...patch } : goal,
      ),
    });
  }

  function removeGoal(id: string) {
    onChange({ goals: goals.filter((goal) => goal.id !== id) });
  }

  function addGoal() {
    const defaultText = t("workshop.pyramid.goals.newGoalDefault");
    const label = bilingualBoth(defaultText);
    const id = uniqueGoalId(defaultText, goals);
    const year = new Date().getFullYear() + 5;
    onChange({
      goals: [
        ...goals,
        {
          id,
          icon: draftIcon,
          label,
          targetAmountHKD: 100_000,
          targetYear: year,
        },
      ],
    });
  }

  const countLabel =
    goals.length === 1
      ? t("workshop.pyramid.goals.countOne").replace(
          "{count}",
          String(goals.length),
        )
      : t("workshop.pyramid.goals.countPlural").replace(
          "{count}",
          String(goals.length),
        );

  return (
    <div className="min-w-0 space-y-3">
      <WorkshopStatCard
        icon="Target"
        status={status}
        label={t("workshop.pyramid.goals.cardLabel")}
        value={countLabel}
        subtext={t("workshop.pyramid.goals.combinedTargets").replace(
          "{amount}",
          formatHkd(total),
        )}
        expandableText={rationale}
      />

      <div className="space-y-3" id={listId}>
        {goals.map((goal) => {
          const localizedLabel = pickBilingual(goal.label, locale);
          return (
            <div
              key={goal.id}
              className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-3.5 sm:px-4"
            >
              <WorkshopStatCard
                icon={resolveGoalIcon(goal.icon)}
                label={
                  localizedLabel || t("workshop.pyramid.goals.fallbackLabel")
                }
                value={formatHkd(goal.targetAmountHKD)}
                subtext={t("workshop.pyramid.goals.targetYearSubtext").replace(
                  "{year}",
                  String(goal.targetYear),
                )}
              />

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-zinc-400">
                    {t("workshop.pyramid.goals.iconLabel")}
                  </p>
                  <div className="mt-1.5">
                    <GoalIconPicker
                      value={resolveGoalIcon(goal.icon)}
                      disabled={disabled}
                      onChange={(icon) => updateGoal(goal.id, { icon })}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`goal-label-${goal.id}`}
                    className="text-sm font-medium text-zinc-200"
                  >
                    {t("workshop.pyramid.goals.labelField")}
                  </label>
                  <input
                    id={`goal-label-${goal.id}`}
                    type="text"
                    disabled={disabled}
                    value={localizedLabel}
                    onChange={(e) =>
                      updateGoal(goal.id, {
                        label: patchBilingual(
                          goal.label,
                          locale,
                          e.target.value,
                        ),
                      })
                    }
                    className={fieldClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <WorkshopNumberField
                    id={`goal-amount-${goal.id}`}
                    variant="currency"
                    label={t("workshop.pyramid.goals.amountField")}
                    min={0}
                    disabled={disabled}
                    value={goal.targetAmountHKD}
                    enterKeyHint="next"
                    onChange={(targetAmountHKD) =>
                      updateGoal(goal.id, { targetAmountHKD })
                    }
                  />
                  <WorkshopNumberField
                    id={`goal-year-${goal.id}`}
                    variant="year"
                    label={t("workshop.pyramid.goals.yearField")}
                    min={2000}
                    max={2100}
                    disabled={disabled}
                    value={goal.targetYear}
                    enterKeyHint="done"
                    onChange={(targetYear) =>
                      updateGoal(goal.id, { targetYear })
                    }
                  />
                </div>

                <button
                  type="button"
                  disabled={disabled || goals.length <= 1}
                  onClick={() => removeGoal(goal.id)}
                  className={[
                    "inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50",
                    focusRing,
                  ].join(" ")}
                >
                  {t("workshop.pyramid.goals.deleteButton")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-3.5 py-3.5 sm:px-4">
        <p className="text-xs font-medium text-zinc-400">
          {t("workshop.pyramid.goals.nextIconHint")}
        </p>
        <div className="mt-1.5">
          <GoalIconPicker
            value={draftIcon}
            disabled={disabled}
            onChange={setDraftIcon}
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={addGoal}
          className={[
            "mt-3 inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/15 sm:w-auto",
            focusRing,
          ].join(" ")}
        >
          {t("workshop.pyramid.goals.addButton")}
        </button>
      </div>
    </div>
  );
}
