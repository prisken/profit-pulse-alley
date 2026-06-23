"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  MarketPulseGameRuntimeStatus,
} from "@prisma/client";

import MarketPulsePrizeReview from "@/components/admin/MarketPulsePrizeReview";
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
import type {
  MarketPulseAdminDashboardData,
} from "@/lib/market-pulse/admin-data";
import type { PrizeReviewData } from "@/lib/market-pulse/prize-review-data";
import { toDatetimeLocalValue } from "@/lib/market-pulse/cycle-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const inputClass =
  `w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground ${focusRing}`;

const buttonClass =
  `rounded-md border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50 ${focusRing}`;

const primaryButtonClass =
  `rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 ${focusRing}`;

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
        setError(result.error ?? "Action failed.");
        return;
      }
      if (result.csv && result.filename) {
        downloadCsv(result.csv, result.filename);
      }
      setMessage(result.message ?? "Done.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          }`}
          role="status"
        >
          {error ?? message}
        </div>
      )}

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-lg font-semibold text-foreground">
          Overview
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Runtime" value={initialData.runtimeStatus} />
          <StatCard
            label="Active cycle"
            value={activeCycle?.name ?? "None"}
          />
          <StatCard
            label="Cycle status"
            value={activeCycle?.status ?? "—"}
          />
          <StatCard
            label="Cards"
            value={totals ? String(totals.cards) : "—"}
          />
          <StatCard
            label="Decisions"
            value={totals ? String(totals.decisions) : "—"}
          />
          <StatCard
            label="Users played"
            value={totals ? String(totals.usersPlayed) : "—"}
          />
          <StatCard
            label="Reveal date"
            value={totals ? formatDateTime(totals.revealAt) : "—"}
          />
          <StatCard
            label="Prize"
            value={totals?.prizeLabel?.trim() || "—"}
          />
          <StatCard
            label="PPA gaps"
            value={
              totals
                ? `${totals.missingSignal} missing · ${totals.unlocked} unlocked`
                : "—"
            }
          />
        </div>
      </section>

      <section aria-labelledby="runtime-heading" className="rounded-lg border border-foreground/10 p-4 sm:p-5">
        <h2 id="runtime-heading" className="text-lg font-semibold text-foreground">
          Runtime status
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          Controls whether players can access Market Pulse (OPEN, CLOSED, MAINTENANCE).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={runtimeStatus}
            onChange={(event) =>
              setRuntimeStatus(event.target.value as MarketPulseGameRuntimeStatus)
            }
            className={inputClass}
            style={{ maxWidth: "14rem" }}
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
            disabled={isPending || runtimeStatus === initialData.runtimeStatus}
            onClick={() =>
              runAction(() => updateMarketPulseRuntimeStatusAction(runtimeStatus))
            }
          >
            Save runtime
          </button>
        </div>
      </section>

      <section aria-labelledby="cycles-heading">
        <h2 id="cycles-heading" className="text-lg font-semibold text-foreground">
          Cycles
        </h2>
        <CreateCycleSection
          disabled={isPending}
          onRefresh={() => router.refresh()}
        />
        <div className="mt-6 space-y-4">
          {initialData.cycles.length === 0 ? (
            <p className="text-sm text-foreground/65">No cycles yet.</p>
          ) : (
            initialData.cycles.map((cycle) => (
              <CyclePanel
                key={cycle.id}
                cycle={cycle}
                disabled={isPending}
                selected={cycle.id === selectedCycleId}
                onSelect={() => setSelectedCycleId(cycle.id)}
                onRefresh={() => router.refresh()}
                onClose={() => runAction(() => closeMarketPulseCycleAction(cycle.id))}
                onExport={() => runAction(() => exportMarketPulseLeaderboardAction(cycle.id))}
              />
            ))
          )}
        </div>
      </section>

      {selectedCycle && (
        <section aria-labelledby="cards-heading">
          <h2 id="cards-heading" className="text-lg font-semibold text-foreground">
            Cards · {selectedCycle.name}
          </h2>
          <CreateCardSection
            cycleId={selectedCycle.id}
            cycleName={selectedCycle.name}
            nextDayIndex={(cycleCards.at(-1)?.dayIndex ?? 0) + 1}
            existingDayIndexes={cycleDayIndexes}
            disabled={isPending}
            onRefresh={() => router.refresh()}
          />
          <div className="mt-6 space-y-4">
            {cycleCards.length === 0 ? (
              <p className="text-sm text-foreground/65">No cards for this cycle.</p>
            ) : (
              cycleCards.map((card) => (
                <MarketPulseCardPanel
                  key={card.id}
                  card={card}
                  cycleName={selectedCycle.name}
                  existingDayIndexes={cycleDayIndexes}
                  disabled={isPending}
                  onRefresh={() => router.refresh()}
                />
              ))
            )}
          </div>
        </section>
      )}

      <MarketPulsePrizeReview data={prizeReview} />

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-lg font-semibold text-foreground">
          Recent activity
        </h2>
        {initialData.recentActivity.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/65">No recent activity.</p>
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
    <div className="rounded-lg border border-foreground/10 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/45">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
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
}: {
  disabled: boolean;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className={`${buttonClass} mt-3`}
        onClick={() => setOpen(true)}
      >
        + Create cycle
      </button>
    );
  }

  return (
    <div className="mt-4">
      <MarketPulseCycleForm
        mode="create"
        disabled={disabled}
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
                Active
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-foreground/55">
            {cycle.cardCount} cards · {cycle.decisionCount} decisions · {cycle.usersPlayed} players ·{" "}
            {cycle.missingSignalCount} missing signal · {cycle.unlockedCount} unlocked
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={onSelect}>
            {selected ? "Viewing cards" : "Manage cards"}
          </button>
          <button type="button" className={buttonClass} disabled={disabled} onClick={onExport}>
            Export leaderboard
          </button>
          {cycle.status !== "CLOSED" && cycle.status !== "REVEALED" ? (
            <button type="button" className={buttonClass} disabled={disabled} onClick={onClose}>
              Close cycle
            </button>
          ) : null}
          <button
            type="button"
            className={buttonClass}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Hide edit" : "Edit"}
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-foreground/10 pt-4">
        <RevealCycleButton
          cycleId={cycle.id}
          cycleName={cycle.name}
          cycleStatus={cycle.status}
          disabled={disabled}
          onSuccess={onRefresh}
        />
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
