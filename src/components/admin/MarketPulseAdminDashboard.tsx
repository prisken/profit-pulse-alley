"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  MarketPulseGameRuntimeStatus,
} from "@prisma/client";

import MarketPulsePrizeReview from "@/components/admin/MarketPulsePrizeReview";
import FirstCycleGuidancePanel from "@/components/admin/FirstCycleGuidancePanel";
import {
  MarketPulseAdminAlerts,
  MarketPulseAdminQuickActions,
  MarketPulseAdminSection,
  MarketPulseAdminSectionNav,
  MarketPulseAdminStatusHeader,
  MarketPulsePpaCompleteBadge,
  MarketPulsePpaRevealWarningBanner,
} from "@/components/admin/MarketPulseAdminShell";
import MarketPulseCardList from "@/components/admin/MarketPulseCardList";
import MarketPulseCycleForm from "@/components/admin/MarketPulseCycleForm";
import {
  closeMarketPulseCycleAction,
  createMarketPulseCycleAction,
  exportMarketPulseLeaderboardAction,
  updateMarketPulseCycleAction,
  updateMarketPulseRuntimeStatusAction,
  type AdminActionResult,
} from "@/lib/market-pulse/admin-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import MarketPulseRevealScoringSection from "@/components/admin/MarketPulseRevealScoringSection";
import RevealCycleButton from "@/components/admin/RevealCycleButton";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";
import { translate } from "@/lib/i18n/messages";
import type { MarketPulseAdminDashboardData } from "@/lib/market-pulse/admin-data";
import {
  formatAdminAverageDecisions,
  formatAdminCompletionRate,
} from "@/lib/market-pulse/admin-cycle-stats";
import {
  buildMarketPulsePlayabilityAlerts,
  buildMarketPulseStatusSnapshot,
} from "@/lib/market-pulse/admin-mp-status";
import {
  evaluatePpaRevealWarning,
} from "@/lib/market-pulse/admin-ppa-reveal-warning";
import type { RevealPpaMissingField } from "@/lib/market-pulse/reveal-ppa-validation";
import type { RevealSectionData } from "@/lib/market-pulse/admin-reveal-data";
import { evaluateRevealReadiness } from "@/lib/market-pulse/admin-reveal-status";
import type { PrizeReviewData } from "@/lib/market-pulse/prize-review-data";
import {
  getFirstPublicCycleFormPrefill,
} from "@/lib/market-pulse/first-cycle-admin-guidance";
import type { MarketPulseCycleFormValues } from "@/lib/market-pulse/cycle-validation";
import { toDatetimeLocalValue } from "@/lib/market-pulse/cycle-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const inputClass =
  `w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100 sm:text-sm sm:max-w-xs ${focusRing}`;

const buttonClass =
  `min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto ${focusRing}`;

const primaryButtonClass =
  `min-h-11 w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 sm:w-auto ${focusRing}`;

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
      return "bg-zinc-800 text-zinc-300";
    default:
      return "bg-zinc-800 text-zinc-300";
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
  revealSection: RevealSectionData;
};

export default function MarketPulseAdminDashboard({
  initialData,
  prizeReview,
  revealSection,
}: Props) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
  const [createCardOpen, setCreateCardOpen] = useState(false);

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleQuickCreateCycle() {
    setCreateCycleOpen(true);
    scrollToSection("cycles");
  }

  function handleQuickCreateCard() {
    setCreateCardOpen(true);
    scrollToSection("cards");
  }

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

  const activeCycleCards = useMemo(
    () =>
      activeCycle
        ? initialData.cards.filter((card) => card.cycleId === activeCycle.id)
        : [],
    [initialData.cards, activeCycle],
  );

  const statusSnapshot = useMemo(
    () =>
      buildMarketPulseStatusSnapshot({
        runtimeStatus: initialData.runtimeStatus,
        activeCycle,
        activeCycleCards,
      }),
    [initialData.runtimeStatus, activeCycle, activeCycleCards],
  );

  function handleEditCard(cardId: string) {
    const card = initialData.cards.find((item) => item.id === cardId);
    if (card && card.cycleId !== selectedCycleId) {
      setSelectedCycleId(card.cycleId);
    }
    scrollToSection("cards");
    window.setTimeout(() => {
      document.getElementById(`mp-card-${cardId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  }

  const ppaRevealWarning = useMemo(
    () =>
      evaluatePpaRevealWarning({
        activeCycle,
        cards: initialData.cards,
      }),
    [activeCycle, initialData.cards],
  );

  const ppaWarningBannerCards = useMemo(() => {
    if (ppaRevealWarning.severity !== "urgent") {
      return [];
    }
    return ppaRevealWarning.missingCards.map((card) => ({
      ...card,
      missingFieldsLabel: formatPpaMissingFieldsForLocale(locale, card.missing),
    }));
  }, [ppaRevealWarning, locale]);

  const playabilityAlerts = useMemo(
    () =>
      buildMarketPulsePlayabilityAlerts({
        runtimeStatus: initialData.runtimeStatus,
        activeCycle,
        activeCycleCards,
      }),
    [initialData.runtimeStatus, activeCycle, activeCycleCards],
  );

  function runAction(action: () => Promise<AdminActionResult>) {
    setMessage(null);
    setWarning(null);
    setError(null);
    startTransition(async () => {
      await invokeAdminAction(action, {
        onSuccess: (successMessage, successWarning, success) => {
          if (success?.csv && success.filename) {
            downloadCsv(success.csv, success.filename);
          }
          setMessage(successMessage ?? t("auth.admin.mp.done"));
          setWarning(successWarning ?? null);
          router.refresh();
        },
        onError: (actionError) => {
          setError(actionError ?? t("auth.admin.mp.actionFailed"));
        },
        onThrow: () => router.refresh(),
      });
    });
  }


  return (
    <div className="space-y-6">
      {(message || warning || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
          role="status"
        >
          {error
            ? translateAuthMessage(locale, error)
            : message
              ? translateAuthMessage(locale, message)
              : null}
          {warning ? <p className="mt-2 text-amber-200">{warning}</p> : null}
        </div>
      )}

      <MarketPulseAdminStatusHeader snapshot={statusSnapshot} />

      <div className="space-y-4">
        <MarketPulseAdminQuickActions
          onCreateCycle={handleQuickCreateCycle}
          onCreateCard={handleQuickCreateCard}
          createCardDisabled={!selectedCycle}
        />
        {ppaRevealWarning.severity === "urgent" && ppaRevealWarning.revealAtIso ? (
          <MarketPulsePpaRevealWarningBanner
            revealAtLabel={formatDateTime(ppaRevealWarning.revealAtIso)}
            missingCount={ppaRevealWarning.missingCards.length}
            cards={ppaWarningBannerCards}
            onEditCard={handleEditCard}
          />
        ) : null}
        <MarketPulseAdminAlerts alerts={playabilityAlerts} />
        <MarketPulseAdminSectionNav />
      </div>

      <MarketPulseAdminSection
        id="overview"
        title={t("auth.admin.mp.overview")}
      >
        <OverviewSection
          initialData={initialData}
          activeCycle={activeCycle}
          totals={totals}
          ppaComplete={ppaRevealWarning.severity === "complete"}
        />
      </MarketPulseAdminSection>

      <MarketPulseAdminSection
        id="setup"
        title={t("auth.admin.mp.shell.setup")}
        description={t("auth.admin.mp.shell.setupSummary")}
      >
        <details className="rounded-lg border border-sky-500/25 bg-sky-500/5">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-sky-100 marker:content-none [&::-webkit-details-marker]:hidden">
            {t("auth.admin.mp.shell.setupSummary")}
          </summary>
          <div className="border-t border-sky-500/20 px-4 pb-4 pt-3">
            <FirstCycleGuidancePanel
              runtimeStatus={initialData.runtimeStatus}
              activeCycle={activeCycle}
              cards={initialData.cards}
              onPrefillCreateCycle={handlePrefillFirstCycle}
              embedded
            />
          </div>
        </details>
      </MarketPulseAdminSection>

      <MarketPulseAdminSection
        id="runtime"
        title={t("auth.admin.mp.runtime")}
        description={t("auth.admin.mp.runtimeHelp")}
      >
        <RuntimeSection
          runtimeStatus={runtimeStatus}
          setRuntimeStatus={setRuntimeStatus}
          initialRuntimeStatus={initialData.runtimeStatus}
          isPending={isPending}
          onSave={() =>
            runAction(() => updateMarketPulseRuntimeStatusAction(runtimeStatus))
          }
        />
      </MarketPulseAdminSection>

      <MarketPulseAdminSection
        id="cycles"
        title={t("auth.admin.mp.cycles")}
        description={t("auth.admin.mp.shell.revealHelp")}
      >
        <CyclesSection
          cycles={initialData.cycles}
          cards={initialData.cards}
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
      </MarketPulseAdminSection>

      {selectedCycle ? (
        <MarketPulseAdminSection
          id="cards"
          title={t("auth.admin.mp.cards").replace("{name}", selectedCycle.name)}
        >
          <CardsSection
            cycles={initialData.cycles}
            selectedCycleId={selectedCycleId}
            allCards={initialData.cards}
            isPending={isPending}
            createCardOpen={createCardOpen}
            onCreateCardOpenChange={setCreateCardOpen}
            onRefresh={() => router.refresh()}
          />
        </MarketPulseAdminSection>
      ) : (
        <MarketPulseAdminSection
          id="cards"
          title={t("auth.admin.mp.shell.cardsNav")}
          description={t("auth.admin.mp.noCycles")}
        >
          <p className="text-sm text-zinc-400">{t("auth.admin.mp.manageCards")}</p>
        </MarketPulseAdminSection>
      )}

      <MarketPulseAdminSection
        id="reveal-scoring"
        title={t("auth.admin.mp.reveal.sectionTitle")}
        description={t("auth.admin.mp.reveal.sectionDescription")}
      >
        <MarketPulseRevealScoringSection
          cycles={initialData.cycles}
          cards={initialData.cards}
          activeCycleId={initialData.activeCycleId}
          revealSection={revealSection}
          disabled={isPending}
          onSuccess={() => router.refresh()}
        />
      </MarketPulseAdminSection>

      <section
        id="prize-claims"
        className="scroll-mt-36 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm sm:p-5 lg:scroll-mt-44"
      >
        <MarketPulsePrizeReview data={prizeReview} embedded />
      </section>

      <MarketPulseAdminSection
        id="audit"
        title={t("auth.admin.mp.activity")}
      >
        {initialData.recentActivity.length === 0 ? (
          <p className="text-sm text-zinc-400">{t("auth.admin.mp.noActivity")}</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {initialData.recentActivity.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="text-zinc-200">{item.label}</span>
                <span className="text-xs text-zinc-500">
                  {formatDateTime(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </MarketPulseAdminSection>
    </div>
  );
}

function formatPpaMissingFieldsForLocale(
  locale: Parameters<typeof translate>[0],
  missing: RevealPpaMissingField[],
): string {
  const labels = missing.map((field) => {
    switch (field) {
      case "ppaSignal":
        return translate(locale, "auth.admin.mp.ppaWarning.fieldSignal");
      case "ppaInsight":
        return translate(locale, "auth.admin.mp.ppaWarning.fieldInsight");
      case "ppaLocked":
        return translate(locale, "auth.admin.mp.ppaWarning.fieldLock");
      default:
        return field;
    }
  });
  return labels.join(", ");
}

function OverviewSection({
  initialData,
  activeCycle,
  totals,
  ppaComplete,
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
  ppaComplete: boolean;
}) {
  const { t } = useTranslations();

  return (
    <div className="space-y-4">
      {activeCycle && ppaComplete ? <MarketPulsePpaCompleteBadge /> : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
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
    </div>
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
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
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
  );
}

function CyclesSection({
  cycles,
  cards,
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
  cards: MarketPulseAdminDashboardData["cards"];
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
    <div>
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
              cards={cards}
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
    </div>
  );
}

function CardsSection({
  cycles,
  selectedCycleId,
  allCards,
  isPending,
  createCardOpen,
  onCreateCardOpenChange,
  onRefresh,
}: {
  cycles: MarketPulseAdminDashboardData["cycles"];
  selectedCycleId: string;
  allCards: MarketPulseAdminDashboardData["cards"];
  isPending: boolean;
  createCardOpen: boolean;
  onCreateCardOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}) {
  return (
    <MarketPulseCardList
      cycles={cycles}
      cards={allCards}
      selectedCycleId={selectedCycleId}
      disabled={isPending}
      createCardOpen={createCardOpen}
      onCreateCardOpenChange={onCreateCardOpenChange}
      onRefresh={onRefresh}
    />
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-zinc-100 sm:text-base">
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

function formatAdminPoints(score: number): string {
  return new Intl.NumberFormat("en-HK").format(score);
}

function CycleParticipationStats({
  cycle,
}: Readonly<{
  cycle: MarketPulseAdminDashboardData["cycles"][number];
}>) {
  const { t } = useTranslations();

  const hasParticipation =
    cycle.usersPlayed > 0 || cycle.decisionCount > 0;

  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {t("auth.admin.mp.cycleStats.title")}
      </p>
      {!hasParticipation ? (
        <p className="text-sm text-zinc-400">
          {t("auth.admin.mp.cycleStats.noParticipation")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label={t("auth.admin.mp.cycleStats.cards")}
            value={String(cycle.cardCount)}
          />
          <StatCard
            label={t("auth.admin.mp.cycleStats.participants")}
            value={String(cycle.usersPlayed)}
          />
          <StatCard
            label={t("auth.admin.mp.cycleStats.decisions")}
            value={String(cycle.decisionCount)}
          />
          <StatCard
            label={t("auth.admin.mp.cycleStats.avgDecisions")}
            value={formatAdminAverageDecisions(
              cycle.averageDecisionsPerParticipant,
            )}
          />
          <StatCard
            label={t("auth.admin.mp.cycleStats.completion")}
            value={formatAdminCompletionRate(cycle.completionRatePercent)}
          />
          <StatCard
            label={t("auth.admin.mp.cycleStats.scores")}
            value={
              cycle.scoresGenerated
                ? `${t("auth.admin.mp.cycleStats.scoredYes")} (${cycle.scoreEventCount})`
                : t("auth.admin.mp.cycleStats.notScoredYet")
            }
          />
          <StatCard
            label={t("auth.admin.mp.cycleStats.topWinner")}
            value={
              cycle.topWinnerName
                ? `${cycle.topWinnerName}${cycle.topWinnerScore != null ? ` · ${formatAdminPoints(cycle.topWinnerScore)}` : ""}`
                : t("auth.admin.mp.cycleStats.noWinner")
            }
          />
        </div>
      )}
    </div>
  );
}

function CyclePanel({
  cycle,
  cards,
  disabled,
  selected,
  onSelect,
  onRefresh,
  onClose,
  onExport,
}: {
  cycle: MarketPulseAdminDashboardData["cycles"][number];
  cards: MarketPulseAdminDashboardData["cards"];
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
  onRefresh: () => void;
  onClose: () => void;
  onExport: () => void;
}) {
  const { t } = useTranslations();
  const [editing, setEditing] = useState(false);
  const revealReadiness = evaluateRevealReadiness(cycle, cards);

  return (
    <article
      className={`rounded-lg border p-4 ${selected ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/40"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-100">{cycle.name}</h3>
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
          <p className="mt-1 text-xs text-zinc-500">
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

      <CycleParticipationStats cycle={cycle} />

      <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
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
            disabled={disabled || !revealReadiness.canReveal}
            blockMessage={revealReadiness.blockMessage}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {editing ? (
        <div className="mt-4 border-t border-zinc-800 pt-4">
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
