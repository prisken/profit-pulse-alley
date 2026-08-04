"use client";

import { createElement, useId, useState } from "react";
import { Target, icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import WorkshopNumberField from "@/components/workshop/WorkshopNumberField";
import WorkshopStatCard from "@/components/workshop/WorkshopStatCard";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  workshopEnMessages,
  type WorkshopMessageKey,
} from "@/lib/i18n/messages/workshop-messages";
import { workshopZhHantMessages } from "@/lib/i18n/messages/workshop-messages.zh-Hant";
import {
  patchBilingual,
  pickBilingual,
} from "@/lib/workshop/bilingual";
import { deriveGoalYear } from "@/lib/workshop/goal-year";
import type {
  Bilingual,
  GoalItem,
  GoalType,
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

/** Lucide icon id → default bilingual label catalog key. */
const GOAL_ICON_DEFAULT_KEYS: Record<string, WorkshopMessageKey> = {
  House: "workshop.goals.defaults.home",
  Car: "workshop.goals.defaults.car",
  GraduationCap: "workshop.goals.defaults.education",
  Plane: "workshop.goals.defaults.travel",
  Heart: "workshop.goals.defaults.wedding",
  Briefcase: "workshop.goals.defaults.business",
  PiggyBank: "workshop.goals.defaults.retirementNestEgg",
  Target: "workshop.goals.defaults.other",
};

const GOAL_ICON_OPTIONS = [
  { id: "House", labelKey: "workshop.pyramid.goals.iconPicker.home" },
  { id: "Car", labelKey: "workshop.pyramid.goals.iconPicker.car" },
  {
    id: "GraduationCap",
    labelKey: "workshop.pyramid.goals.iconPicker.graduationCap",
  },
  { id: "Plane", labelKey: "workshop.pyramid.goals.iconPicker.plane" },
  { id: "Heart", labelKey: "workshop.pyramid.goals.iconPicker.heart" },
  { id: "Briefcase", labelKey: "workshop.pyramid.goals.iconPicker.briefcase" },
  { id: "PiggyBank", labelKey: "workshop.pyramid.goals.iconPicker.piggyBank" },
  { id: "Target", labelKey: "workshop.pyramid.goals.iconPicker.other" },
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
  if (ALLOWED_ICONS.has(icon)) {
    return icon;
  }
  // Legacy AI / older sessions
  if (icon === "Home" || icon === "Baby") {
    return icon === "Home" ? "House" : "Target";
  }
  return "Target";
}

function defaultLabelForIcon(icon: string): Bilingual {
  const key =
    GOAL_ICON_DEFAULT_KEYS[resolveGoalIcon(icon)] ??
    GOAL_ICON_DEFAULT_KEYS.Target!;
  return {
    en: workshopEnMessages[key],
    zhHant: workshopZhHantMessages[key],
  };
}

type GoalsLayerEditorProps = Readonly<{
  value: GoalsLayer;
  onChange: (next: GoalsLayer) => void;
  /** Current user age — used to derive `targetYear` from `targetAge`. */
  userAge: number;
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
  userAge,
  status,
  rationale,
  disabled = false,
}: GoalsLayerEditorProps) {
  const { t, locale } = useTranslations();
  const listId = useId();
  const [draftIcon, setDraftIcon] = useState<string>("House");
  /** Per-goal: true once the user manually edits the label field. */
  const [labelTouched, setLabelTouched] = useState<Record<string, boolean>>({});

  const goals = value.goals;
  const total = goals.reduce((sum, goal) => sum + goal.targetAmountHKD, 0);
  const minTargetAge = Math.max(1, Math.round(userAge) + 1);

  function updateGoal(id: string, patch: Partial<GoalItem>) {
    onChange({
      goals: goals.map((goal) => {
        if (goal.id !== id) {
          return goal;
        }
        const next = { ...goal, ...patch };
        if (
          typeof patch.targetAge === "number" &&
          Number.isFinite(patch.targetAge)
        ) {
          next.targetAge = Math.round(patch.targetAge);
          next.targetYear = deriveGoalYear(next.targetAge, userAge);
        }
        return next;
      }),
    });
  }

  function changeGoalIcon(id: string, icon: string) {
    const resolved = resolveGoalIcon(icon);
    const touched = labelTouched[id] === true;
    updateGoal(id, {
      icon: resolved,
      ...(!touched ? { label: defaultLabelForIcon(resolved) } : {}),
    });
  }

  function removeGoal(id: string) {
    onChange({ goals: goals.filter((goal) => goal.id !== id) });
    setLabelTouched((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function addGoal() {
    const icon = resolveGoalIcon(draftIcon);
    const label = defaultLabelForIcon(icon);
    const id = uniqueGoalId(label.en, goals);
    const targetAge = Math.min(90, Math.max(minTargetAge, Math.round(userAge) + 5));
    onChange({
      goals: [
        ...goals,
        {
          id,
          icon,
          label,
          targetAmountHKD: 100_000,
          targetAge,
          targetYear: deriveGoalYear(targetAge, userAge),
          goalType: "spend",
        },
      ],
    });
    setLabelTouched((prev) => ({ ...prev, [id]: false }));
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
            const derivedYear = deriveGoalYear(goal.targetAge, userAge);
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
                  subtext={t("workshop.pyramid.goals.targetAgeSubtext")
                    .replace("{age}", String(goal.targetAge))
                    .replace("{year}", String(derivedYear))}
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
                        onChange={(icon) => changeGoalIcon(goal.id, icon)}
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
                      onChange={(e) => {
                        setLabelTouched((prev) => ({
                          ...prev,
                          [goal.id]: true,
                        }));
                        updateGoal(goal.id, {
                          label: patchBilingual(
                            goal.label,
                            locale,
                            e.target.value,
                          ),
                        });
                      }}
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
                    <div className="min-w-0">
                      <WorkshopNumberField
                        id={`goal-age-${goal.id}`}
                        variant="age"
                        label={t("workshop.pyramid.goals.ageField")}
                        min={minTargetAge}
                        max={90}
                        disabled={disabled}
                        value={goal.targetAge}
                        enterKeyHint="done"
                        onChange={(targetAge) =>
                          updateGoal(goal.id, { targetAge })
                        }
                      />
                      <p className="mt-1.5 text-xs tabular-nums text-slate-500">
                        {t("workshop.pyramid.goals.derivedYearHint").replace(
                          "{year}",
                          String(derivedYear),
                        )}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label={t("workshop.pyramid.goals.goalType.aria")}
                  >
                    {(
                      [
                        {
                          id: "spend" as GoalType,
                          labelKey:
                            "workshop.pyramid.goals.goalType.spend" as const,
                        },
                        {
                          id: "retirementTarget" as GoalType,
                          labelKey:
                            "workshop.pyramid.goals.goalType.retirementTarget" as const,
                        },
                      ] as const
                    ).map((option) => {
                      const selected =
                        (goal.goalType ?? "spend") === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={disabled}
                          onClick={() =>
                            updateGoal(goal.id, { goalType: option.id })
                          }
                          className={[
                            "inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                            focusRing,
                            selected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          ].join(" ")}
                        >
                          {t(option.labelKey)}
                        </button>
                      );
                    })}
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
