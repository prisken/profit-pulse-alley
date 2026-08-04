"use client";

import { createElement, type ReactNode } from "react";
import { Pencil, icons, type LucideIcon } from "lucide-react";

import CollapsibleWidget from "@/components/workshop/CollapsibleWidget";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import type { Bilingual, LayerFlag } from "@/lib/workshop/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

type StatusTone = NonNullable<WorkshopStatCardProps["status"]>;

const STATUS_STYLES: Record<
  StatusTone,
  { ring: string; badge: string; icon: string; pill: string }
> = {
  green: {
    ring: "border-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]",
    badge: "border-emerald-200 bg-emerald-50",
    icon: "text-emerald-600",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  amber: {
    ring: "border-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.1)]",
    badge: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    pill: "border-amber-200 bg-amber-50 text-amber-800",
  },
  red: {
    ring: "border-rose-200 shadow-[0_0_0_1px_rgba(244,63,94,0.1)]",
    badge: "border-rose-200 bg-rose-50",
    icon: "text-rose-600",
    pill: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

const NEUTRAL = {
  ring: "border-slate-200/80",
  badge: "border-slate-200 bg-slate-50",
  icon: "text-slate-600",
  pill: "border-slate-200 bg-slate-50 text-slate-600",
};

const FLAG_LABEL_KEYS: Record<LayerFlag, MessageKey> = {
  green: "workshop.layerFlags.green",
  amber: "workshop.layerFlags.amber",
  red: "workshop.layerFlags.red",
};

function resolveIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
}

function defaultExpandedForStatus(status?: LayerFlag): boolean {
  return status === "amber" || status === "red";
}

export type WorkshopStatCardProps = Readonly<{
  icon: string;
  status?: LayerFlag;
  label: string;
  /** Static display value — ignored when `valueContent` is provided. */
  value?: string | number;
  /** Optional custom value slot (e.g. inline number input). */
  valueContent?: ReactNode;
  subtext?: string;
  expandableText?: string | Bilingual;
  /** Extra detail body (shown inside the collapsible panel when present). */
  children?: ReactNode;
  onEdit?: () => void;
  /**
   * Override accordion open state.
   * Defaults to `false` for green / unset, `true` for amber / red.
   */
  defaultExpanded?: boolean;
  className?: string;
}>;

/**
 * Generic icon + value card for workshop steps. Layout (grid/stack) is caller-owned.
 * Light ProjectionLab surface; collapses detail when `expandableText` or `children` exist.
 */
export default function WorkshopStatCard({
  icon,
  status,
  label,
  value,
  valueContent,
  subtext,
  expandableText,
  children,
  onEdit,
  defaultExpanded,
  className,
}: WorkshopStatCardProps) {
  const { t, locale } = useTranslations();
  const tone = status ? STATUS_STYLES[status] : NEUTRAL;

  const resolvedExpandable =
    expandableText == null || expandableText === ""
      ? ""
      : pickBilingual(expandableText, locale);

  const hasCollapsibleBody =
    Boolean(resolvedExpandable) || children != null;

  const resolvedDefaultExpanded =
    defaultExpanded ?? defaultExpandedForStatus(status);

  const iconNode = (
    <span
      className={[
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
        tone.badge,
        tone.icon,
      ].join(" ")}
      aria-hidden="true"
    >
      {createElement(resolveIcon(icon), {
        className: "h-5 w-5",
        strokeWidth: 2,
      })}
    </span>
  );

  const statusBadge = status ? (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone.pill,
      ].join(" ")}
    >
      {t(FLAG_LABEL_KEYS[status])}
    </span>
  ) : null;

  const editButton = onEdit ? (
    <button
      type="button"
      onClick={onEdit}
      className={[
        "inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900",
        focusRing,
      ].join(" ")}
      aria-label={t("workshop.stat.editAria").replace("{label}", label)}
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      {t("workshop.stat.edit")}
    </button>
  ) : null;

  const valueBlock = valueContent ? (
    <div className="min-w-0">{valueContent}</div>
  ) : value != null && value !== "" ? (
    <p className="min-w-0 break-words text-2xl font-semibold tracking-tight text-slate-900 [overflow-wrap:anywhere] sm:text-[1.65rem]">
      {value}
    </p>
  ) : null;

  const subtextBlock = subtext ? (
    <p className="text-pretty text-xs leading-relaxed text-slate-500 sm:text-[13px]">
      {subtext}
    </p>
  ) : null;

  if (hasCollapsibleBody) {
    return (
      <CollapsibleWidget
        className={[tone.ring, className].filter(Boolean).join(" ")}
        icon={iconNode}
        title={
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </span>
        }
        subtitle={
          !valueContent && value != null && value !== "" ? (
            <span className="text-slate-900">{value}</span>
          ) : undefined
        }
        badge={
          <>
            {statusBadge}
            {editButton}
          </>
        }
        defaultExpanded={resolvedDefaultExpanded}
      >
        <div className="space-y-2.5">
          {valueContent ? valueBlock : null}
          {subtextBlock}
          {resolvedExpandable ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {t("workshop.ui.showDetails")}
              </p>
              <p className="text-pretty text-sm leading-relaxed text-slate-600">
                {resolvedExpandable}
              </p>
            </div>
          ) : null}
          {children}
        </div>
      </CollapsibleWidget>
    );
  }

  return (
    <article
      className={[
        "min-w-0 overflow-hidden rounded-2xl border bg-white px-3.5 py-3.5 shadow-sm transition-all duration-200 hover:shadow-md sm:px-4 sm:py-4",
        tone.ring,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        {iconNode}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <p className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </p>
              {statusBadge}
            </div>
            {editButton}
          </div>

          <div className="mt-1.5 space-y-1">
            {valueBlock}
            {subtextBlock}
          </div>
        </div>
      </div>
    </article>
  );
}
