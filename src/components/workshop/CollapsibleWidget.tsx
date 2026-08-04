"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";

const DEFAULT_CARD_CLASS =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export type CollapsibleWidgetProps = Readonly<{
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}>;

/**
 * ProjectionLab-style accordion card with framer-motion height animation.
 */
export default function CollapsibleWidget({
  title,
  subtitle,
  badge,
  icon,
  defaultExpanded = false,
  children,
  className,
  headerClassName,
}: CollapsibleWidgetProps) {
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className={[DEFAULT_CARD_CLASS, className].filter(Boolean).join(" ")}>
      <div
        className={[
          "flex min-h-12 w-full items-center gap-2 px-3.5 py-2 sm:px-4",
          headerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={[
            "flex min-h-12 min-w-0 flex-1 touch-manipulation items-center gap-3 py-1 text-left",
            focusRing,
          ].join(" ")}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-label={
            isExpanded ? t("workshop.ui.collapse") : t("workshop.ui.expand")
          }
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {icon ? (
            <span
              className="flex shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}

          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="min-w-0 text-sm font-semibold text-slate-900">
                {title}
              </span>
            </span>
            {subtitle ? (
              <span className="mt-0.5 block min-w-0 break-words text-base font-semibold tracking-tight text-slate-800 [overflow-wrap:anywhere] sm:text-lg">
                {subtitle}
              </span>
            ) : null}
          </span>

          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500"
            aria-hidden="true"
          >
            <ChevronDown
              className={[
                "h-5 w-5 transition-transform duration-200",
                isExpanded ? "rotate-180" : "",
              ].join(" ")}
              strokeWidth={2}
            />
          </span>
        </button>

        {badge ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {badge}
          </div>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            id={panelId}
            key="collapsible-body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
            }
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
