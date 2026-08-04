"use client";

import { Check, icons, type LucideIcon } from "lucide-react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { WORKSHOP_TONES } from "@/lib/workshop/tone";
import type { WorkshopTone } from "@/lib/workshop/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const TONE_LABEL_KEYS: Record<WorkshopTone, MessageKey> = {
  fun: "workshop.tone.options.fun.label",
  professional: "workshop.tone.options.professional.label",
  simple: "workshop.tone.options.simple.label",
  direct: "workshop.tone.options.direct.label",
  warm: "workshop.tone.options.warm.label",
};

const TONE_DESCRIPTION_KEYS: Record<WorkshopTone, MessageKey> = {
  fun: "workshop.tone.options.fun.description",
  professional: "workshop.tone.options.professional.description",
  simple: "workshop.tone.options.simple.description",
  direct: "workshop.tone.options.direct.description",
  warm: "workshop.tone.options.warm.description",
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
      className="grid grid-cols-2 gap-2.5 lg:grid-cols-5"
      role="radiogroup"
      aria-label={t("workshop.tone.heading")}
    >
      {WORKSHOP_TONES.map((tone) => {
        const selected = value === tone.id;
        const Icon = resolveToneIcon(tone.icon);

        return (
          <button
            key={tone.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(tone.id)}
            className={[
              "relative flex min-h-[5.25rem] touch-manipulation flex-col items-start gap-1.5 rounded-xl border px-3 py-3 text-left transition-colors sm:min-h-[5.5rem] sm:gap-2 sm:px-3.5 sm:py-3.5",
              "disabled:cursor-not-allowed disabled:opacity-60",
              focusRing,
              selected
                ? "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
            ].join(" ")}
          >
            {selected ? (
              <span
                className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-zinc-950"
                aria-hidden="true"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : null}
            <span
              className={[
                "flex h-9 w-9 items-center justify-center rounded-lg border",
                selected
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                  : "border-white/10 bg-white/[0.04] text-zinc-300",
              ].join(" ")}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 pr-5">
              <span className="block text-sm font-semibold text-white">
                {t(TONE_LABEL_KEYS[tone.id])}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-zinc-400">
                {t(TONE_DESCRIPTION_KEYS[tone.id])}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
