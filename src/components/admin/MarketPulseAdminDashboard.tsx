"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  MarketPulseGameRuntimeStatus,
} from "@prisma/client";

import MarketPulsePrizeReview from "@/components/admin/MarketPulsePrizeReview";
import FirstCycleGuidancePanel from "@/components/admin/FirstCycleGuidancePanel";
import {
  CreateCardSection,
  MarketPulseCardPanel,
} from "@/components/admin/MarketPulseCardPanel";
import MarketPulseCycleForm from "@/components/admin/MarketPulseCycleForm";
import {
  closeMarketPulseCycleAction,
  createMarketPulseCycleAction,
  exportMarketPulseLeaderboardAction,
  updateMarketPulseCycleAction,
  updateMarketPulseRuntimeStatusAction,
} from "@/lib/market-pulse/admin-actions";
import RevealCycleButton from "@/components/admin/RevealCycleButton";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import type {
  MarketPulseAdminDashboardData,
} from "@/lib/market-pulse/admin-data";
import type { PrizeReviewData } from "@/lib/market-pulse/prize-review-data";
import {
  getFirstPublicCycleFormPrefill,
} from "@/lib/market-pulse/first-cycle-admin-guidance";
import type { MarketPulseCycleFormValues } from "@/lib/market-pulse/cycle-validation";
import { toDatetimeLocalValue } from "@/lib/market-pulse/cycle-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const inputClass =
  `w-full min-h-11 rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-base text-foreground sm:text-sm sm:max-w-xs ${focusRing}`;

const buttonClass =
  `min-h-11 w-full rounded-md border border-foreground/15 bg-foreground/5 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50 sm:w-auto ${focusRing}`;

const primaryButtonClass =
  `min-h-11 w-full rounded-md bg-foreground px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto ${focusRing}`;

const RUNTIME_OPTIONS: MarketPulseGameRuntimeStatus[] = [
  "OPEN",
  "CLOSED",
  "MAINTENANCE",
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusBadge(status: string): string {
  switch (status) {
    case "OPEN":
    case "PUBLISHED":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "CLOSED":
    case "MAINTENANCE":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
    case "REVEALED":
      return "bg-violet-500/15 text-violet-800 dark:text-violet-200";
    case "DRAFT":
      return "bg-foreground/10 text-foreground/70";
    default:
      return "bg-foreground/10 text-foreground/70";
  }
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type Props = {
  initialData: MarketPulseAdminDashboardData;
  prizeReview: PrizeReviewData;
};

export default function MarketPulseAdminDashboard({
  initialData,
  prizeReview,
}: Props) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [runtimeStatus, setRuntimeStatus] = useState(
    initialData.runtimeStatus,
  );
  const [selectedCycleId, setSelectedCycleId] = useState(
    initialData.activeCycleId ?? initialData.cycles[0]?.id ?? "",
  );
  const [cyclePrefill, setCyclePrefill] = useState<
    Partial<MarketPulseCycleFormValues> | null
  >(null);
  const [cyclePrefillNonce, setCyclePrefillNonce] = useState(0);
  const [createCycleOpen, setCreateCycleOpen] = useState(false);

  function handlePrefillFirstCycle() {
    setCyclePrefill(getFirstPublicCycleFormPrefill());
    setCyclePrefillNonce((value) => value + 1);
    setCreateCycleOpen(true);
  }

  const activeCycle = useMemo(
    () => initialData.cycles.find((cycle) => cycle.isActive) ?? null,
    [initialData.cycles],
  );

  const selectedCycle = useMemo(
    () => initialData.cycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
    [initialData.cycles, selectedCycleId],
  );

  const cycleCards = useMemo(
    () =>
      initialData.cards
        .filter((card) => card.cycleId === selectedCycleId)
        .sort((a, b) => a.dayIndex - b.dayIndex),
    [initialData.cards, selectedCycleId],
  );

  const totals = useMemo(() => {
    if (!activeCycle) {
      return null;
    }
    return {
      cards: activeCycle.cardCount,
      decisions: activeCycle.decisionCount,
      usersPlayed: activeCycle.usersPlayed,
      missingSignal: activeCycle.missingSignalCount,
      unlocked: activeCycle.unlockedCount,
      revealAt: activeCycle.revealAt,
      prizeLabel: activeCycle.prizeLabel,
    };
  }, [activeCycle]);

  const cycleDayIndexes = useMemo(
    () => cycleCards.map((card) => card.dayIndex),
    [cycleCards],
  );

  function runAction(action: () => Promise<{ ok: boolean; error?: string; message?: string; csv?: string; filename?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? t("auth.admin.mp.actionFailed"));
        return;
      }
      if (result.csv && result.filename) {
        downloadCsv(result.csv, result.filename);
      }
      setMessage(result.message ?? t("auth.admin.mp.done"));
      router.refresh();
    });
  }

  const activeCyclePlayable = activeCycle?.isPlayableNow ?? false;

  return (
    <div className="space-y-6 lg:space-y-10">
      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          }`}
          role="status"
        >
          {error ? translateAuthMessage(locale, error) : message ? translateAuthMessage(locale, message) : null}
        </div>
      )}

      {activeCycle?.isActive && !activeCyclePlayable && activeCycle.playabilityIssue ? (
        <div
          className="sticky top-0 z-20 rounded-lg border-2 border-amber-500/50 bg-amber-500/15 px-3 py-3 text-sm text-amber-950 shadow-sm dark:text-amber-100 sm:px-4"
          role="alert"
        >
          <p className="font-semibold">Active cycle is not visible to players</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            {activeCycle.playabilityIssue} Update dates under Edit cycle, or create a
            new cycle and set it active.
          </p>
        </div>
      ) : null}

      <FirstCycleGuidancePanel
        runtimeStatus={initialData.runtimeStatus}
        activeCycle={activeCycle}
        cards={initialData.cards}
        onPrefillCreateCycle={handlePrefillFirstCycle}
      />

      <details className="rounded-lg border border-foreground/10 lg:hidden" open>
        <summary className="cursor-pointer list-none px-4 py-3 text-base font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          Overview &amp; runtime
        </summary>
        <div className="space-y-4 border-t border-foreground/10 px-4 pb-4 pt-3">
          <OverviewSection
            initialData={initialData}
            activeCycle={activeCycle}
            totals={totals}
          />
          <RuntimeSection
            runtimeStatus={runtimeStatus}
            setRuntimeStatus={setRuntimeStatus}
            initialRuntimeStatus={initialData.runtimeStatus}
            isPending={isPending}
            onSave={() =>
              runAction(() => updateMarketPulseRuntimeStatusAction(runtimeStatus))
            }
          />
        </div>
      </details>

      <div className="hidden space-y-10 lg:block">
        <OverviewSection
          initialData={initialData}
          activeCycle={activeCycle}
          totals={totals}
        />
        <RuntimeSection
          runtimeStatus={runtimeStatus}
          setRuntimeStatus={setRuntimeStatus}
          initialRuntimeStatus={initialData.runtimeStatus}
          isPending={isPending}
          onSave={() =>
            runAction(() => updateMarketPulseRuntimeStatusAction(runtimeStatus))
          }
        />
      </div>

      <details className="rounded-lg border border-foreground/10 lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-base font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          Cycles
        </summary>
        <div className="border-t border-foreground/10 px-4 pb-4 pt-3">
          <CyclesSection
            cycles={initialData.cycles}
            selectedCycleId={selectedCycleId}
            isPending={isPending}
            cyclePrefill={cyclePrefill}
            cyclePrefillNonce={cyclePrefillNonce}
            createCycleOpen={createCycleOpen}
            setCreateCycleOpen={setCreateCycleOpen}
            onSelectCycle={setSelectedCycleId}
            onRefresh={() => router.refresh()}
            onClose={(cycleId) => runAction(() => closeMarketPulseCycleAction(cycleId))}
            onExport={(cycleId) =>
              runAction(() => exportMarketPulseLeaderboardAction(cycleId))
            }
          />
        </div>
      </details>

      <div className="hidden lg:block">
        <CyclesSection
          cycles={initialData.cycles}
          selectedCycleId={selectedCycleId}
          isPending={isPending}
          cyclePrefill={cyclePrefill}
          cyclePrefillNonce={cyclePrefillNonce}
          createCycleOpen={createCycleOpen}
          setCreateCycleOpen={setCreateCycleOpen}
          onSelectCycle={setSelectedCycleId}
          onRefresh={() => router.refresh()}
          onClose={(cycleId) => runAction(() => closeMarketPulseCycleAction(cycleId))}
          onExport={(cycleId) =>
            runAction(() => exportMarketPulseLeaderboardAction(cycleId))
          }
        />
      </div>

      {selectedCycle && (
        <details className="rounded-lg border border-foreground/10 lg:hidden" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-base font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            Cards · {selectedCycle.name}
          </summary>
          <div className="border-t border-foreground/10 px-4 pb-4 pt-3">
            <CardsSection
              selectedCycle={selectedCycle}
              cycleCards={cycleCards}
              cycleDayIndexes={cycleDayIndexes}
              isPending={isPending}
              onRefresh={() => router.refresh()}
            />
          </div>
        </details>
      )}

      {selectedCycle ? (
        <div className="hidden lg:block">
          <CardsSection
            selectedCycle={selectedCycle}
            cycleCards={cycleCards}
            cycleDayIndexes={cycleDayIndexes}
            isPending={isPending}
            onRefresh={() => router.refresh()}
          />
        </div>
      ) : null}

      <MarketPulsePrizeReview data={prizeReview} />

      <section aria-labelledby="activity-heading" className="rounded-lg border border-foreground/10 p-4 sm:p-5">
        <h2 id="activity-heading" className="text-lg font-semibold text-foreground">
          {t("auth.admin.mp.activity")}
        </h2>
        {initialData.recentActivity.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/65">{t("auth.admin.mp.noActivity")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-foreground/10 rounded-lg border border-foreground/10">
            {initialData.recentActivity.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="text-foreground">{item.label}</span>
                <span className="text-xs text-foreground/50">
                  {formatDateTime(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OverviewSection({
  initialData,
  activeCycle,
  totals,
}: {
  initialData: MarketPulseAdminDashboardData;
  activeCycle: MarketPulseAdminDashboardData["cycles"][number] | null;
  totals: {
    cards: number;
    decisions: number;
    usersPlayed: number;
    missingSignal: number;
    unlocked: number;
    revealAt: string;
    prizeLabel: string | null;
  } | null;
}) {
  const { t } = useTranslations();

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="text-base font-semibold text-foreground sm:text-lg">
        {t("auth.admin.mp.overview")}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <StatCard label={t("auth.admin.mp.statRuntime")} value={initialData.runtimeStatus} />
        <StatCard label={t("auth.admin.mp.statActiveCycle")} value={activeCycle?.name ?? t("auth.admin.mp.none")} />
        <StatCard label={t("auth.admin.mp.statCycleStatus")} value={activeCycle?.status ?? "—"} />
        <StatCard label={t("auth.admin.mp.statCards")} value={totals ? String(totals.cards) : "—"} />
        <StatCard label={t("auth.admin.mp.statDecisions")} value={totals ? String(totals.decisions) : "—"} />
        <StatCard label={t("auth.admin.mp.statUsersPlayed")} value={totals ? String(totals.usersPlayed) : "—"} />
        <StatCard
          label={t("auth.admin.mp.statRevealDate")}
          value={totals ? formatDateTime(totals.revealAt) : "—"}
        />
        <StatCard label={t("auth.admin.mp.statPrize")} value={totals?.prizeLabel?.trim() || "—"} />
        <StatCard
          label={t("auth.admin.mp.statPpaGaps")}
          value={
            totals
              ? `${totals.missingSignal} missing · ${totals.unlocked} unlocked`
              : "—"
          }
        />
      </div>
    </section>
  );
}

function RuntimeSection({
  runtimeStatus,
  setRuntimeStatus,
  initialRuntimeStatus,
  isPending,
  onSave,
}: {
  runtimeStatus: MarketPulseGameRuntimeStatus;
  setRuntimeStatus: (value: MarketPulseGameRuntimeStatus) => void;
  initialRuntimeStatus: MarketPulseGameRuntimeStatus;
  isPending: boolean;
  onSave: () => void;
}) {
  const { t } = useTranslations();

  return (
    <section
      aria-labelledby="runtime-heading"
      className="rounded-lg border border-foreground/10 p-4 sm:p-5"
    >
      <h2 id="runtime-heading" className="text-base font-semibold text-foreground sm:text-lg">
        {t("auth.admin.mp.runtime")}
      </h2>
      <p className="mt-1 text-xs text-foreground/65 sm:text-sm">
        {t("auth.admin.mp.runtimeHelp")}
      </p>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <select
          value={runtimeStatus}
          onChange={(event) =>
            setRuntimeStatus(event.target.value as MarketPulseGameRuntimeStatus)
          }
          className={inputClass}
        >
          {RUNTIME_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={isPending || runtimeStatus === initialRuntimeStatus}
          onClick={onSave}
        >
          {t("auth.admin.mp.saveRuntime")}
        </button>
      </div>
    </section>
  );
}

function CyclesSection({
  cycles,
  selectedCycleId,
  isPending,
  cyclePrefill,
  cyclePrefillNonce,
  createCycleOpen,
  setCreateCycleOpen,
  onSelectCycle,
  onRefresh,
  onClose,
  onExport,
}: {
  cycles: MarketPulseAdminDashboardData["cycles"];
  selectedCycleId: string;
  isPending: boolean;
  cyclePrefill: Partial<MarketPulseCycleFormValues> | null;
  cyclePrefillNonce: number;
  createCycleOpen: boolean;
  setCreateCycleOpen: (open: boolean) => void;
  onSelectCycle: (id: string) => void;
  onRefresh: () => void;
  onClose: (cycleId: string) => void;
  onExport: (cycleId: string) => void;
}) {
  const { t } = useTranslations();

  return (
    <section aria-labelledby="cycles-heading">
      <h2 id="cycles-heading" className="text-base font-semibold text-foreground sm:text-lg">
        {t("auth.admin.mp.cycles")}
      </h2>
      <CreateCycleSection
        disabled={isPending}
        onRefresh={onRefresh}
        prefillValues={cyclePrefill}
        prefillNonce={cyclePrefillNonce}
        open={createCycleOpen}
        setOpen={setCreateCycleOpen}
      />
      <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
        {cycles.length === 0 ? (
          <p className="text-sm text-foreground/65">{t("auth.admin.mp.noCycles")}</p>
        ) : (
          cycles.map((cycle) => (
            <CyclePanel
              key={cycle.id}
              cycle={cycle}
              disabled={isPending}
              selected={cycle.id === selectedCycleId}
              onSelect={() => onSelectCycle(cycle.id)}
              onRefresh={onRefresh}
              onClose={() => onClose(cycle.id)}
              onExport={() => onExport(cycle.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CardsSection({
  selectedCycle,
  cycleCards,
  cycleDayIndexes,
  isPending,
  onRefresh,
}: {
  selectedCycle: MarketPulseAdminDashboardData["cycles"][number];
  cycleCards: MarketPulseAdminDashboardData["cards"];
  cycleDayIndexes: number[];
  isPending: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslations();

  return (
    <section aria-labelledby="cards-heading">
      <h2 id="cards-heading" className="text-base font-semibold text-foreground sm:text-lg">
        {t("auth.admin.mp.cards").replace("{name}", selectedCycle.name)}
      </h2>
      <CreateCardSection
        cycleId={selectedCycle.id}
        cycleName={selectedCycle.name}
        nextDayIndex={(cycleDayIndexes.at(-1) ?? 0) + 1}
        existingDayIndexes={cycleDayIndexes}
        disabled={isPending}
        onRefresh={onRefresh}
      />
      <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
        {cycleCards.length === 0 ? (
          <p className="text-sm text-foreground/65">{t("auth.admin.mp.noCards")}</p>
        ) : (
          cycleCards.map((card) => (
            <MarketPulseCardPanel
              key={card.id}
              card={card}
              cycleName={selectedCycle.name}
              existingDayIndexes={cycleDayIndexes}
              disabled={isPending}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-foreground/10 px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/45 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-foreground sm:text-base">
        {value}
      </p>
      {sub ? (
        <span
          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${statusBadge(sub)}`}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

function CreateCycleSection({
  disabled,
  onRefresh,
  prefillValues,
  prefillNonce,
  open,
  setOpen,
}: {
  disabled: boolean;
  onRefresh: () => void;
  prefillValues: Partial<MarketPulseCycleFormValues> | null;
  prefillNonce: number;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { t } = useTranslations();

  if (!open) {
    return (
      <button
        type="button"
        className={`${buttonClass} mt-3`}
        onClick={() => setOpen(true)}
      >
        {t("auth.admin.mp.createCycle")}
      </button>
    );
  }

  return (
    <div className="mt-4">
      <MarketPulseCycleForm
        key={prefillNonce > 0 ? `create-prefill-${prefillNonce}` : "create-default"}
        mode="create"
        disabled={disabled}
        initialValues={prefillValues ?? undefined}
        onCancel={() => setOpen(false)}
        onSuccess={() => {
          onRefresh();
          setOpen(false);
        }}
        onSubmit={(values) =>
          createMarketPulseCycleAction({
            name: values.name,
            startsAt: values.startsAt,
            endsAt: values.endsAt,
            revealAt: values.revealAt,
            prizeLabel: values.prizeLabel,
            status: values.status,
            setActive: values.setActive,
          })
        }
      />
    </div>
  );
}

function CyclePanel({
  cycle,
  disabled,
  selected,
  onSelect,
  onRefresh,
  onClose,
  onExport,
}: {
  cycle: MarketPulseAdminDashboardData["cycles"][number];
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
  onRefresh: () => void;
  onClose: () => void;
  onExport: () => void;
}) {
  const { t } = useTranslations();
  const [editing, setEditing] = useState(false);

  return (
    <article
      className={`rounded-lg border p-4 ${selected ? "border-foreground/25 bg-foreground/[0.02]" : "border-foreground/10"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{cycle.name}</h3>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge(cycle.status)}`}>
              {cycle.status}
            </span>
            {cycle.isActive ? (
              <span className="rounded bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-800 dark:text-sky-200">
                {t("auth.admin.mp.active")}
              </span>
            ) : null}
            {cycle.isActive && !cycle.isPlayableNow ? (
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-900 dark:text-amber-200">
                {t("auth.admin.mp.notPlayable")}
              </span>
            ) : null}
          </div>
          {!cycle.isPlayableNow && cycle.playabilityIssue ? (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              {cycle.playabilityIssue}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-foreground/55">
            {cycle.cardCount} cards · {cycle.decisionCount} decisions · {cycle.usersPlayed} players ·{" "}
            {cycle.missingSignalCount} missing signal · {cycle.unlockedCount} unlocked
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className={buttonClass} onClick={onSelect}>
            {selected ? t("auth.admin.mp.viewingCards") : t("auth.admin.mp.manageCards")}
          </button>
          <button type="button" className={buttonClass} disabled={disabled} onClick={onExport}>
            {t("auth.admin.mp.exportLeaderboard")}
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? t("auth.admin.mp.hideEdit") : t("auth.admin.mp.edit")}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-foreground/10 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
          {t("auth.admin.mp.cycleActions")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {cycle.status !== "CLOSED" && cycle.status !== "REVEALED" ? (
            <button type="button" className={buttonClass} disabled={disabled} onClick={onClose}>
              {t("auth.admin.mp.closeCycle")}
            </button>
          ) : null}
          <RevealCycleButton
            cycleId={cycle.id}
            cycleName={cycle.name}
            cycleStatus={cycle.status}
            disabled={disabled}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {editing ? (
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <MarketPulseCycleForm
            mode="edit"
            cycleId={cycle.id}
            isActive={cycle.isActive}
            disabled={disabled}
            initialValues={{
              name: cycle.name,
              startsAt: toDatetimeLocalValue(cycle.startsAt),
              endsAt: toDatetimeLocalValue(cycle.endsAt),
              revealAt: toDatetimeLocalValue(cycle.revealAt),
              prizeLabel: cycle.prizeLabel ?? "",
              status: cycle.status,
              setActive: cycle.isActive,
            }}
            onCancel={() => setEditing(false)}
            onSuccess={() => {
              onRefresh();
              setEditing(false);
            }}
            onSubmit={(values) =>
              updateMarketPulseCycleAction({
                cycleId: cycle.id,
                name: values.name,
                startsAt: values.startsAt,
                endsAt: values.endsAt,
                revealAt: values.revealAt,
                prizeLabel: values.prizeLabel,
                status: values.status,
                setActive: values.setActive,
              })
            }
          />
        </div>
      ) : null}
    </article>
  );
}
