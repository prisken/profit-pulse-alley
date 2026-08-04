"use client";

import { Check, icons, type LucideIcon } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { WORKSHOP_TONES } from "@/lib/workshop/tone";
import type { WorkshopTone } from "@/lib/workshop/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const TONE_LABEL_KEYS: Record<WorkshopTone, MessageKey> = {
  fun: "workshop.tone.options.fun.label",
  professional: "workshop.tone.options.professional.label",
  simple: "workshop.tone.options.simple.label",
  direct: "workshop.tone.options.direct.label",
  warm: "workshop.tone.options.warm.label",
};

/** Always-on colorful picker chrome — each tone should read as a different “character”. */
const TONE_PICKER: Record<
  WorkshopTone,
  {
    card: string;
    cardSelected: string;
    iconWrap: string;
    label: string;
    check: string;
  }
> = {
  fun: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-indigo-100 shadow-violet-200/50 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md hover:shadow-violet-300/40",
    cardSelected:
      "border-violet-500 bg-gradient-to-br from-violet-200 via-fuchsia-100 to-indigo-200 shadow-lg shadow-violet-400/35 ring-2 ring-violet-400/50 -translate-y-0.5",
    iconWrap:
      "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-violet-500/45 rotate-[-6deg]",
    label:
      "bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text font-bold tracking-tight text-transparent",
    check: "bg-violet-600",
  },
  professional: {
    card: "border-slate-300/90 bg-gradient-to-br from-slate-100 via-white to-sky-50 shadow-slate-200/40 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md hover:shadow-sky-200/50",
    cardSelected:
      "border-sky-600 bg-gradient-to-br from-slate-200 via-sky-50 to-sky-100 shadow-lg shadow-sky-400/25 ring-2 ring-sky-500/40 -translate-y-0.5",
    iconWrap:
      "rounded-lg bg-gradient-to-br from-slate-700 to-sky-700 text-white shadow-md shadow-slate-500/30",
    label: "font-semibold tracking-wide text-slate-800",
    check: "bg-sky-700",
  },
  simple: {
    card: "border-cyan-200/90 bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 shadow-cyan-100/60 hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-200/50",
    cardSelected:
      "border-cyan-500 bg-gradient-to-br from-cyan-100 via-sky-100 to-teal-100 shadow-lg shadow-cyan-300/40 ring-2 ring-cyan-400/45 -translate-y-0.5",
    iconWrap:
      "rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-lg shadow-cyan-400/40",
    label: "font-semibold tracking-normal text-cyan-950",
    check: "bg-cyan-600",
  },
  direct: {
    card: "border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 shadow-amber-200/50 hover:-translate-y-0.5 hover:border-rose-500 hover:shadow-md hover:shadow-rose-300/40",
    cardSelected:
      "border-2 border-rose-500 bg-gradient-to-br from-amber-200 via-orange-100 to-rose-200 shadow-lg shadow-rose-400/35 ring-2 ring-amber-400/60 -translate-y-0.5",
    iconWrap:
      "rounded-md bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/40 rotate-[6deg]",
    label: "font-black uppercase tracking-wider text-rose-800",
    check: "bg-rose-600",
  },
  warm: {
    card: "border-rose-200/90 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 shadow-rose-100/70 hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md hover:shadow-rose-200/50",
    cardSelected:
      "border-rose-400 bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 shadow-lg shadow-rose-300/40 ring-2 ring-rose-300/50 -translate-y-0.5",
    iconWrap:
      "rounded-full bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 text-white shadow-lg shadow-rose-400/40",
    label: "font-semibold tracking-tight text-rose-900",
    check: "bg-rose-500",
  },
};

function resolveToneIcon(name: string): LucideIcon {
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? icons.Circle;
}

type WorkshopToneSelectorProps = Readonly<{
  value: WorkshopTone | null;
  onChange: (tone: WorkshopTone) => void;
  disabled?: boolean;
}>;

export default function WorkshopToneSelector({
  value,
  onChange,
  disabled = false,
}: WorkshopToneSelectorProps) {
  const { t } = useTranslations();

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-5"
      role="radiogroup"
      aria-label={t("workshop.tone.heading")}
    >
      {WORKSHOP_TONES.map((tone) => {
        const selected = value === tone.id;
        const Icon = resolveToneIcon(tone.icon);
        const picker = TONE_PICKER[tone.id];

        return (
          <button
            key={tone.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(TONE_LABEL_KEYS[tone.id])}
            disabled={disabled}
            onClick={() => onChange(tone.id)}
            className={[
              "relative flex min-h-[7.25rem] touch-manipulation flex-col items-center justify-center gap-3 rounded-2xl border px-3 py-4 text-center shadow-sm transition-all duration-200 sm:min-h-[7.75rem] sm:px-3.5 sm:py-5",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
              focusRing,
              selected ? picker.cardSelected : picker.card,
            ].join(" ")}
          >
            {selected ? (
              <span
                className={[
                  "absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm",
                  picker.check,
                ].join(" ")}
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            ) : null}

            <span
              className={[
                "flex h-14 w-14 items-center justify-center shadow-md transition-transform duration-200 sm:h-16 sm:w-16",
                picker.iconWrap,
                selected ? "scale-110" : "",
              ].join(" ")}
              aria-hidden="true"
            >
              <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} />
            </span>

            <span className={["block text-sm sm:text-base", picker.label].join(" ")}>
              {t(TONE_LABEL_KEYS[tone.id])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
