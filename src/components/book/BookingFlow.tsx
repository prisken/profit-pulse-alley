"use client";

import { useCallback, useMemo, useState } from "react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { WeekOption } from "@/lib/book/availability";

type Step =
  | { name: "contact" }
  | { name: "week" }
  | { name: "day" }
  | { name: "time" }
  | { name: "slots" }
  | { name: "confirm" }
  | { name: "done" };

type SlotChoice = { start: string; end: string; dayLabel: string; timeLabel: string };

type FlowState = {
  name: string;
  email: string;
  whatsapp: string;
  week: WeekOption | null;
  day: "weekday" | "weekend" | null;
  time: "office" | "after_office" | null;
  slot: SlotChoice | null;
};

const INITIAL_STATE: FlowState = {
  name: "",
  email: "",
  whatsapp: "",
  week: null,
  day: null,
  time: null,
  slot: null,
};

const TOTAL_STEPS = 5;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20";

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function BookingFlow({ initialWeeks }: { initialWeeks: WeekOption[] }) {
  const { t, locale } = useTranslations();
  const [step, setStep] = useState<Step>({ name: "contact" });
  const [state, setState] = useState<FlowState>(INITIAL_STATE);
  const [slots, setSlots] = useState<SlotChoice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = useMemo(
    () => initialWeeks,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialWeeks],
  );

  const go = useCallback((next: Step) => {
    setError(null);
    setStep(next);
  }, []);

  const requestSlots = useCallback(
    async (week: WeekOption, day: "weekday" | "weekend", time: "office" | "after_office") => {
      setLoading(true);
      setError(null);
      setSlots(null);
      try {
        const res = await fetch("/api/book/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekKey: week.key,
            dayPref: day,
            timePref: time,
            locale,
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          slots?: SlotChoice[];
          code?: string;
          error?: string;
        };
        if (!data.ok) {
          if (data.code === "stale_week") {
            setError(t("book.flow.errors.staleWeek"));
            window.location.reload();
            return;
          }
          setError(
            data.code === "no_slots"
              ? t("book.flow.errors.noSlots")
              : data.error ?? t("book.flow.errors.generic"),
          );
          return;
        }
        setSlots(data.slots ?? []);
        go({ name: "slots" });
      } catch {
        setError(t("book.flow.errors.generic"));
      } finally {
        setLoading(false);
      }
    },
    [go, locale, t],
  );

  const confirm = useCallback(async () => {
    if (!state.week || !state.day || !state.time || !state.slot) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/book/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          whatsapp: state.whatsapp,
          weekKey: state.week.key,
          dayPref: state.day,
          timePref: state.time,
          slotStart: state.slot.start,
        }),
      });
      const data = (await res.json()) as { ok: boolean; code?: string; error?: string };
      if (!data.ok) {
        if (data.code === "stale_week" || data.code === "slot_taken") {
          setError(
            data.code === "stale_week"
              ? t("book.flow.errors.staleWeek")
              : t("book.flow.errors.slotTaken"),
          );
          go({ name: "time" }); // go back one step; user can re-pick
          return;
        }
        setError(data.error ?? t("book.flow.errors.generic"));
        return;
      }
      go({ name: "done" });
    } catch {
      setError(t("book.flow.errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [go, state, t]);

  const stepNumber =
    step.name === "done"
      ? TOTAL_STEPS
      : ["contact", "week", "day", "time", "slots", "confirm"].indexOf(step.name) + 1;

  const canContinue =
    state.name.trim().length > 0 &&
    isValidEmail(state.email) &&
    isValidPhone(state.whatsapp);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-24">
      {/* progress */}
      {step.name !== "done" && (
        <div className="mb-6 flex items-center justify-between text-xs text-foreground/40">
          <button
            type="button"
            onClick={() =>
              go(
                step.name === "week"
                  ? { name: "contact" }
                  : step.name === "day"
                    ? { name: "week" }
                    : step.name === "time"
                      ? { name: "day" }
                      : step.name === "slots"
                        ? { name: "time" }
                        : step.name === "confirm"
                          ? { name: "slots" }
                          : { name: "contact" },
              )
            }
            className="rounded-lg px-2 py-1 transition hover:text-foreground/70"
          >
            ← {t("book.flow.back")}
          </button>
          <span>
            {t("book.flow.stepOf", { n: stepNumber, total: TOTAL_STEPS })}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ── Contact ─────────────────────────────────────────── */}
      {step.name === "contact" && (
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("book.flow.contact.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/55">
            {t("book.flow.contact.subtitle")}
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">
                {t("book.flow.contact.name")}
              </label>
              <input
                className={inputClass}
                value={state.name}
                onChange={(e) => setState({ ...state, name: e.target.value })}
                placeholder={t("book.flow.contact.namePlaceholder")}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">
                {t("book.flow.contact.email")}
              </label>
              <input
                className={inputClass}
                type="email"
                value={state.email}
                onChange={(e) => setState({ ...state, email: e.target.value })}
                placeholder={t("book.flow.contact.emailPlaceholder")}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">
                {t("book.flow.contact.whatsapp")}
              </label>
              <input
                className={inputClass}
                type="tel"
                value={state.whatsapp}
                onChange={(e) => setState({ ...state, whatsapp: e.target.value })}
                placeholder={t("book.flow.contact.whatsappPlaceholder")}
                autoComplete="tel"
              />
              <p className="mt-1.5 text-xs text-foreground/40">
                {t("book.flow.contact.whatsappHint")}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!canContinue || loading}
            onClick={() => canContinue && go({ name: "week" })}
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-mp-pulse px-6 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("book.flow.contact.continue")}
          </button>
        </div>
      )}

      {/* ── Week ────────────────────────────────────────────── */}
      {step.name === "week" && (
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("book.flow.week.title")}</h2>
          <p className="mt-2 text-sm text-foreground/55">{t("book.flow.week.subtitle")}</p>
          <div className="mt-6 space-y-3">
            {weeks.map((week) => (
              <button
                key={week.key}
                type="button"
                onClick={() => {
                  setState({ ...state, week });
                  go({ name: "day" });
                }}
                className="w-full rounded-2xl border border-white/10 bg-[#111318] p-5 text-left transition hover:border-emerald-500/40 hover:bg-[#15181f]"
              >
                <span className="text-base font-semibold">
                  {t("book.flow.week.option", {
                    monday: week.label[locale === "zh-Hant" ? "zhHant" : "en"],
                  })}
                </span>
                <span className="mt-1 block text-xs text-foreground/45">
                  {week.startIso.slice(0, 10)} – {week.endIso.slice(0, 10)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Day pref ────────────────────────────────────────── */}
      {step.name === "day" && (
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("book.flow.day.title")}</h2>
          <p className="mt-2 text-sm text-foreground/55">{t("book.flow.day.subtitle")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(["weekday", "weekend"] as const).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setState({ ...state, day });
                  go({ name: "time" });
                }}
                className="rounded-2xl border border-white/10 bg-[#111318] p-5 text-left transition hover:border-emerald-500/40 hover:bg-[#15181f]"
              >
                <span className="text-base font-semibold">
                  {t(`book.flow.day.${day}.label`)}
                </span>
                <span className="mt-1 block text-xs text-foreground/45">
                  {t(`book.flow.day.${day}.description`)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Time pref ───────────────────────────────────────── */}
      {step.name === "time" && (
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("book.flow.time.title")}</h2>
          <p className="mt-2 text-sm text-foreground/55">{t("book.flow.time.subtitle")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["office", "book.flow.time.office.label", "book.flow.time.office.description"],
                [
                  "after_office",
                  "book.flow.time.afterOffice.label",
                  "book.flow.time.afterOffice.description",
                ],
              ] as const
            ).map(([value, labelKey, descKey]) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                onClick={() => {
                  const week = state.week;
                  if (!week) return;
                  setState({ ...state, time: value });
                  void requestSlots(week, state.day ?? "weekday", value);
                }}
                className="rounded-2xl border border-white/10 bg-[#111318] p-5 text-left transition hover:border-emerald-500/40 hover:bg-[#15181f] disabled:opacity-50"
              >
                <span className="text-base font-semibold">{t(labelKey)}</span>
                <span className="mt-1 block text-xs text-foreground/45">{t(descKey)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Slots ───────────────────────────────────────────── */}
      {step.name === "slots" && (
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("book.flow.slots.title")}</h2>
          <p className="mt-2 text-sm text-foreground/55">{t("book.flow.slots.subtitle")}</p>
          {slots === null ? (
            <div className="mt-8 text-sm text-foreground/50">{t("book.flow.slots.loading")}</div>
          ) : slots.length === 0 ? (
            <div className="mt-8 text-sm text-red-300">{t("book.flow.errors.noSlots")}</div>
          ) : (
            <div className="mt-6 space-y-3">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => {
                    setState({ ...state, slot });
                    go({ name: "confirm" });
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#111318] px-5 py-4 text-left transition hover:border-emerald-500/40 hover:bg-[#15181f]"
                >
                  <div>
                    <div className="text-sm font-semibold">{slot.dayLabel}</div>
                    <div className="mt-0.5 text-xs text-foreground/50">{slot.timeLabel}</div>
                  </div>
                  <span className="text-emerald-400">→</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-4 text-center text-xs text-foreground/40">
            {t("book.flow.slots.hktNote")}
          </p>
          {state.week && state.day && state.time && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestSlots(state.week!, state.day!, state.time!)}
              className="mt-4 w-full rounded-xl border border-white/10 px-5 py-3 text-sm text-foreground/60 transition hover:border-emerald-500/30 hover:text-foreground/90 disabled:opacity-50"
            >
              {t("book.flow.slots.refresh")}
            </button>
          )}
        </div>
      )}

      {/* ── Confirm ─────────────────────────────────────────── */}
      {step.name === "confirm" && state.slot && (
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("book.flow.confirm.title")}</h2>
          <p className="mt-2 text-sm text-foreground/55">{t("book.flow.confirm.subtitle")}</p>
          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-[#111318] p-5">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-foreground/50">{t("book.flow.confirm.slot")}</span>
              <span className="text-right font-semibold">
                {state.slot.dayLabel} · {state.slot.timeLabel}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-foreground/50">{t("book.flow.confirm.name")}</span>
              <span className="text-right font-semibold">{state.name}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-foreground/50">{t("book.flow.confirm.email")}</span>
              <span className="text-right font-semibold">{state.email}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-foreground/50">{t("book.flow.confirm.whatsapp")}</span>
              <span className="text-right font-semibold">{state.whatsapp}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void confirm()}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-mp-pulse px-6 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? t("book.flow.confirm.busy") : t("book.flow.confirm.button")}
          </button>
        </div>
      )}

      {/* ── Done ────────────────────────────────────────────── */}
      {step.name === "done" && state.slot && (
        <div className="text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{t("book.flow.success.title")}</h2>
          <div className="mx-auto mt-4 max-w-md rounded-2xl border border-white/10 bg-[#111318] p-5 text-sm">
            <div className="text-foreground/50">{t("book.flow.success.slot")}</div>
            <div className="mt-1 font-semibold">
              {state.slot.dayLabel} · {state.slot.timeLabel} (HKT)
            </div>
          </div>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-foreground/55">
            {t("book.flow.success.body")}
          </p>
          <button
            type="button"
            onClick={() => {
              setState(INITIAL_STATE);
              setSlots(null);
              go({ name: "contact" });
            }}
            className="mt-6 text-xs text-foreground/45 underline-offset-4 transition hover:text-foreground/70 hover:underline"
          >
            {t("book.flow.success.another")}
          </button>
        </div>
      )}
    </div>
  );
}
