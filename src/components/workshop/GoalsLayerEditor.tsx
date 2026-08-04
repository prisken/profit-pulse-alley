"use client";

import { createElement, useId, useState } from "react";
import { Target, icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
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
  "mt-1.5 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/30 sm:text-sm";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const FLAG_LABEL_KEYS: Record<LayerFlag, MessageKey> = {
  green: "workshop.layerFlags.green",
  amber: "workshop.layerFlags.amber",
  red: "workshop.layerFlags.red",
};

const FLAG_PILL: Record<LayerFlag, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-700",
};

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
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
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

  const rationaleText =
    rationale == null || rationale === ""
      ? ""
      : pickBilingual(rationale, locale);

  return (
    <CollapsibleWidget
      icon={
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
          <Target className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      title={t("workshop.pyramid.layers.goals.title")}
      subtitle={countLabel}
      badge={
        status ? (
          <span
            className={[
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              FLAG_PILL[status],
            ].join(" ")}
          >
            {t(FLAG_LABEL_KEYS[status])}
          </span>
        ) : null
      }
      defaultExpanded={status !== "green"}
    >
      <div className="min-w-0 space-y-3">
        <p className="text-sm text-slate-600">
          {t("workshop.pyramid.goals.combinedTargets").replace(
            "{amount}",
            formatHkd(total),
          )}
        </p>

        {rationaleText ? (
          <p className="text-pretty text-sm leading-relaxed text-slate-600">
            {rationaleText}
          </p>
        ) : null}

        <div className="space-y-3" id={listId}>
          {goals.map((goal) => {
            const localizedLabel = pickBilingual(goal.label, locale);
            return (
              <div
                key={goal.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3.5 sm:px-4"
              >
                <WorkshopStatCard
                  icon={resolveGoalIcon(goal.icon)}
                  label={
                    localizedLabel || t("workshop.pyramid.goals.fallbackLabel")
                  }
                  value={formatHkd(goal.targetAmountHKD)}
                  subtext={t(
                    "workshop.pyramid.goals.targetYearSubtext",
                  ).replace("{year}", String(goal.targetYear))}
                />

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
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
                      className="text-sm font-medium text-slate-700"
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
                      "inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50",
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

        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-3.5 sm:px-4">
          <p className="text-xs font-medium text-slate-500">
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
              "mt-3 inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:w-auto",
              focusRing,
            ].join(" ")}
          >
            {t("workshop.pyramid.goals.addButton")}
          </button>
        </div>
      </div>
    </CollapsibleWidget>
  );
}
