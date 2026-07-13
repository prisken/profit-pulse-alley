"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  createGuidedMarketPulseCycleAction,
  type CreateGuidedMarketPulseCycleResult,
} from "@/lib/market-pulse/admin-actions";
import {
  ADMIN_MARKET_PULSE_PATH,
  marketPulseGuidedLaunchPath,
} from "@/lib/market-pulse/admin-mp-navigation";
import {
  buildGuidedCycleDayPlan,
  type GuidedCycleDayPlanRow,
  type GuidedCycleDayType,
  validateGuidedCycleInput,
} from "@/lib/market-pulse/guided-cycle";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fieldClass = `mt-2 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-base text-zinc-50 outline-none disabled:opacity-60 sm:text-sm ${focusRing}`;

const fieldErrorClass = "border-red-500/50";

const buttonClass = `inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const primaryButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

type FieldErrors = Partial<
  Record<
    | "name"
    | "startDate"
    | "endDate"
    | "revealDate"
    | "defaultSignalCardsPerDay"
    | "dayPlan",
    string
  >
>;

function mergeDayOverrides(
  basePlan: GuidedCycleDayPlanRow[],
  previous: GuidedCycleDayPlanRow[],
): GuidedCycleDayPlanRow[] {
  const previousByDay = new Map(previous.map((row) => [row.dayIndex, row]));

  return basePlan.map((row) => {
    const saved = previousByDay.get(row.dayIndex);
    if (!saved) {
      return row;
    }

    return {
      ...row,
      dayType: saved.dayType,
      signalCardCount:
        saved.dayType === "REST" ? 1 : Math.max(1, saved.signalCardCount),
    };
  });
}

export default function MarketPulseGuidedCycleWizard() {
  const { t } = useTranslations();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [revealDate, setRevealDate] = useState("");
  const [defaultSignalCardsPerDay, setDefaultSignalCardsPerDay] = useState(3);
  const [dayPlan, setDayPlan] = useState<GuidedCycleDayPlanRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<CreateGuidedMarketPulseCycleResult | null>(
    null,
  );

  const baseDayPlan = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }

    return buildGuidedCycleDayPlan({
      startDate,
      endDate,
      defaultSignalCardsPerDay,
    });
  }, [startDate, endDate, defaultSignalCardsPerDay]);

  useEffect(() => {
    if (!baseDayPlan) {
      setDayPlan([]);
      return;
    }

    setDayPlan((current) => mergeDayOverrides(baseDayPlan, current));
  }, [baseDayPlan]);

  const updateDayRow = (
    dayIndex: number,
    patch: Partial<Pick<GuidedCycleDayPlanRow, "dayType" | "signalCardCount">>,
  ) => {
    setDayPlan((current) =>
      current.map((row) => {
        if (row.dayIndex !== dayIndex) {
          return row;
        }

        const dayType = patch.dayType ?? row.dayType;
        const signalCardCount =
          dayType === "REST"
            ? 1
            : Math.max(1, patch.signalCardCount ?? row.signalCardCount);

        return {
          ...row,
          dayType,
          signalCardCount,
        };
      }),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const clientValidation = validateGuidedCycleInput({
      name,
      startDate,
      endDate,
      revealDate,
      defaultSignalCardsPerDay,
      dayOverrides: dayPlan.map((row) => ({
        dayIndex: row.dayIndex,
        dayType: row.dayType,
        signalCardCount: row.signalCardCount,
      })),
    });

    if (!clientValidation.valid) {
      setFieldErrors(clientValidation.fieldErrors);
      setFormError(clientValidation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGuidedMarketPulseCycleAction({
        name,
        startDate,
        endDate,
        revealDate,
        defaultSignalCardsPerDay,
        dayOverrides: dayPlan.map((row) => ({
          dayIndex: row.dayIndex,
          dayType: row.dayType,
          signalCardCount: row.signalCardCount,
        })),
      });

      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) {
          const nextErrors: FieldErrors = {};
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            if (messages[0]) {
              nextErrors[key as keyof FieldErrors] = messages[0];
            }
          }
          setFieldErrors(nextErrors);
        }
        return;
      }

      if (result.data) {
        setSuccess(result.data);
      }
    } catch (error) {
      console.error("[admin] guided cycle create threw:", error);
      setFormError(
        "Something went wrong. Refresh the page to see if your change was saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">
          {t("auth.admin.mp.guidedCycle.success.badge")}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedCycle.success.title")}
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          {t("auth.admin.mp.guidedCycle.success.body")}
        </p>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.name")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{success.name}</dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.startDate")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{success.startDate}</dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.endDate")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{success.endDate}</dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.field.revealDate")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{success.revealDate}</dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.success.signalCards")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">
              {success.signalCardCount}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              {t("auth.admin.mp.guidedCycle.success.restCards")}
            </dt>
            <dd className="mt-1 font-medium text-zinc-100">{success.restCardCount}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={success.guidedCardsPath} className={primaryButtonClass}>
            {t("auth.admin.mp.guidedCards.entryButton")}
          </Link>
          <Link href={success.builderPath} className={buttonClass}>
            {t("auth.admin.mp.guidedCycle.success.openBuilder")}
          </Link>
          <Link
            href={marketPulseGuidedLaunchPath(success.cycleId)}
            className={buttonClass}
          >
            {t("auth.admin.mp.guidedLaunch.entryButton")}
          </Link>
          <Link href={ADMIN_MARKET_PULSE_PATH} className={buttonClass}>
            {t("auth.admin.mp.guidedCycle.success.backToAdmin")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedCycle.section.cycle")}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {t("auth.admin.mp.guidedCycle.section.cycleHelp")}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCycle.field.name")}
            </span>
            <input
              type="text"
              className={`${fieldClass} ${fieldErrors.name ? fieldErrorClass : ""}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCycle.field.startDate")}
            </span>
            <input
              type="date"
              className={`${fieldClass} ${fieldErrors.startDate ? fieldErrorClass : ""}`}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t("auth.admin.mp.guidedCycle.hint.startTime")}
            </p>
            {fieldErrors.startDate ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.startDate}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCycle.field.endDate")}
            </span>
            <input
              type="date"
              className={`${fieldClass} ${fieldErrors.endDate ? fieldErrorClass : ""}`}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t("auth.admin.mp.guidedCycle.hint.endTime")}
            </p>
            {fieldErrors.endDate ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.endDate}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCycle.field.revealDate")}
            </span>
            <input
              type="date"
              className={`${fieldClass} ${fieldErrors.revealDate ? fieldErrorClass : ""}`}
              value={revealDate}
              onChange={(event) => setRevealDate(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t("auth.admin.mp.guidedCycle.hint.revealTime")}
            </p>
            {fieldErrors.revealDate ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.revealDate}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCycle.field.defaultSignalCards")}
            </span>
            <input
              type="number"
              min={1}
              className={`${fieldClass} ${fieldErrors.defaultSignalCardsPerDay ? fieldErrorClass : ""}`}
              value={defaultSignalCardsPerDay}
              onChange={(event) =>
                setDefaultSignalCardsPerDay(Number(event.target.value))
              }
              disabled={isSubmitting}
            />
            {fieldErrors.defaultSignalCardsPerDay ? (
              <p className="mt-1 text-xs text-red-400">
                {fieldErrors.defaultSignalCardsPerDay}
              </p>
            ) : null}
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50">
          {t("auth.admin.mp.guidedCycle.section.dayPlan")}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {t("auth.admin.mp.guidedCycle.section.dayPlanHelp")}
        </p>

        {fieldErrors.dayPlan ? (
          <p className="mt-3 text-sm text-red-400">{fieldErrors.dayPlan}</p>
        ) : null}

        {dayPlan.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
            {t("auth.admin.mp.guidedCycle.dayPlan.empty")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">
                    {t("auth.admin.mp.guidedCycle.dayPlan.colDay")}
                  </th>
                  <th className="px-3 py-2.5 font-medium">
                    {t("auth.admin.mp.guidedCycle.dayPlan.colDate")}
                  </th>
                  <th className="px-3 py-2.5 font-medium">
                    {t("auth.admin.mp.guidedCycle.dayPlan.colType")}
                  </th>
                  <th className="px-3 py-2.5 font-medium">
                    {t("auth.admin.mp.guidedCycle.dayPlan.colCards")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {dayPlan.map((row) => (
                  <tr key={row.dayIndex}>
                    <td className="px-3 py-2.5 font-medium text-zinc-100">
                      {row.dayIndex}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-300">{row.hktDate}</td>
                    <td className="px-3 py-2.5">
                      <select
                        className={`${fieldClass} mt-0 min-h-9 py-1.5`}
                        value={row.dayType}
                        disabled={isSubmitting}
                        onChange={(event) =>
                          updateDayRow(row.dayIndex, {
                            dayType: event.target.value as GuidedCycleDayType,
                          })
                        }
                      >
                        <option value="SIGNAL">
                          {t("auth.admin.mp.guidedCycle.dayType.signal")}
                        </option>
                        <option value="REST">
                          {t("auth.admin.mp.guidedCycle.dayType.rest")}
                        </option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      {row.dayType === "REST" ? (
                        <span className="text-zinc-400">1</span>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          className={`${fieldClass} mt-0 min-h-9 max-w-24 py-1.5`}
                          value={row.signalCardCount}
                          disabled={isSubmitting}
                          onChange={(event) =>
                            updateDayRow(row.dayIndex, {
                              signalCardCount: Number(event.target.value),
                            })
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
          {isSubmitting
            ? t("auth.admin.mp.guidedCycle.submitting")
            : t("auth.admin.mp.guidedCycle.submit")}
        </button>
        <Link href={ADMIN_MARKET_PULSE_PATH} className={buttonClass}>
          {t("auth.admin.mp.guidedCycle.cancel")}
        </Link>
      </div>
    </form>
  );
}
