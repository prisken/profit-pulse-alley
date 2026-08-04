"use client";

import { createElement, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Pencil, icons, type LucideIcon } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { pickBilingual } from "@/lib/workshop/bilingual";
import type { Bilingual, LayerFlag } from "@/lib/workshop/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type StatusTone = NonNullable<WorkshopStatCardProps["status"]>;

const STATUS_STYLES: Record<
  StatusTone,
  { ring: string; badge: string; icon: string; pill: string }
> = {
  green: {
    ring: "border-emerald-400/45 shadow-[0_0_0_1px_rgba(52,211,153,0.12)]",
    badge: "border-emerald-400/40 bg-emerald-400/15",
    icon: "text-emerald-200",
    pill: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
  },
  amber: {
    ring: "border-amber-400/45 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]",
    badge: "border-amber-400/40 bg-amber-400/15",
    icon: "text-amber-200",
    pill: "border-amber-400/40 bg-amber-400/15 text-amber-200",
  },
  red: {
    ring: "border-red-400/45 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]",
    badge: "border-red-400/40 bg-red-400/15",
    icon: "text-red-200",
    pill: "border-red-400/40 bg-red-400/15 text-red-200",
  },
};

const NEUTRAL = {
  ring: "border-white/10",
  badge: "border-white/10 bg-white/[0.05]",
  icon: "text-zinc-300",
  pill: "border-white/10 bg-white/[0.05] text-zinc-300",
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
  onEdit?: () => void;
}>;

/**
 * Generic icon + value card for workshop steps. Layout (grid/stack) is caller-owned.
 */
export default function WorkshopStatCard({
  icon,
  status,
  label,
  value,
  valueContent,
  subtext,
  expandableText,
  onEdit,
}: WorkshopStatCardProps) {
  const { t, locale } = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const tone = status ? STATUS_STYLES[status] : NEUTRAL;

  const resolvedExpandable =
    expandableText == null || expandableText === ""
      ? ""
      : pickBilingual(expandableText, locale);

  return (
    <article
      className={[
        "min-w-0 rounded-2xl border bg-white/[0.03] px-3.5 py-3.5 sm:px-4 sm:py-4",
        tone.ring,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
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

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <p className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {label}
              </p>
              {status ? (
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    tone.pill,
                  ].join(" ")}
                >
                  {t(FLAG_LABEL_KEYS[status])}
                </span>
              ) : null}
            </div>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className={[
                  "inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white",
                  focusRing,
                ].join(" ")}
                aria-label={t("workshop.stat.editAria").replace(
                  "{label}",
                  label,
                )}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {t("workshop.stat.edit")}
              </button>
            ) : null}
          </div>

          {valueContent ? (
            <div className="mt-1.5 min-w-0">{valueContent}</div>
          ) : (
            <p className="mt-1.5 min-w-0 break-words text-2xl font-semibold tracking-tight text-white [overflow-wrap:anywhere] sm:text-[1.65rem]">
              {value}
            </p>
          )}

          {subtext ? (
            <p className="mt-1 text-pretty text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
              {subtext}
            </p>
          ) : null}
        </div>
      </div>

      {resolvedExpandable ? (
        <div className="mt-3 border-t border-white/10 pt-2.5">
          <button
            type="button"
            className={[
              "inline-flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-left text-xs font-semibold text-emerald-300/90 transition-colors hover:text-emerald-200",
              focusRing,
            ].join(" ")}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((prev) => !prev)}
          >
            <span className="min-w-0 flex-1 text-pretty break-words">
              {expanded
                ? t("workshop.pyramid.whyThisMattersOpen")
                : t("workshop.pyramid.whyThisMatters")}
            </span>
            <ChevronDown
              className={[
                "h-4 w-4 shrink-0 transition-transform duration-200",
                expanded ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                id={panelId}
                key="why"
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={
                  reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                }
                className="overflow-hidden"
              >
                <p className="pb-1 pt-1.5 text-pretty text-sm leading-relaxed text-zinc-300">
                  {resolvedExpandable}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </article>
  );
}
