"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  MarketPulseCardReviewStatus,
  MarketPulseCycleStatus,
  MarketPulseSignal,
} from "@prisma/client";

import MarketPulseGuidedCardEditor from "@/components/admin/MarketPulseGuidedCardEditor";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  approveAndPublishMarketPulseCardAction,
  rejectMarketPulseCardAction,
} from "@/lib/market-pulse/admin-approval-actions";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import type { MarketPulseApprovalsPageData } from "@/lib/market-pulse/market-pulse-approvals-page-data";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const chipClass = (active: boolean) =>
  `inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
    active
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
  }`;

const buttonClass = `inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const primaryButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const dangerButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const fieldClass = `mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 outline-none disabled:opacity-60 ${focusRing}`;

const badgeClass = (tone: "emerald" | "amber" | "red" | "zinc") => {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "amber":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    case "red":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 ring-zinc-700";
  }
};

const badgeClassBase = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1";

function reviewBadgeClass(status: MarketPulseCardReviewStatus): string {
  if (status === "APPROVED") return badgeClass("emerald");
  if (status === "REJECTED") return badgeClass("red");
  return badgeClass("amber");
}

type ReviewFilter = "all" | MarketPulseCardReviewStatus;

type PpaDraft = {
  ppaSignal: MarketPulseSignal | "";
  ppaInsight: string;
  ppaInsightZhHant: string;
};

const EMPTY_PPA_DRAFT: PpaDraft = {
  ppaSignal: "",
  ppaInsight: "",
  ppaInsightZhHant: "",
};

const filterKeys: Record<ReviewFilter, MessageKey> = {
  PENDING: "auth.admin.mp.approvals.filter.pending",
  APPROVED: "auth.admin.mp.approvals.filter.approved",
  REJECTED: "auth.admin.mp.approvals.filter.rejected",
  all: "auth.admin.mp.approvals.filter.all",
};

const reviewStatusKeys: Record<MarketPulseCardReviewStatus, MessageKey> = {
  PENDING: "auth.admin.mp.approvals.status.pending",
  APPROVED: "auth.admin.mp.approvals.status.approved",
  REJECTED: "auth.admin.mp.approvals.status.rejected",
};

const cycleStatusKeys: Record<MarketPulseCycleStatus, MessageKey> = {
  DRAFT: "auth.admin.mp.approvals.cycleStatus.draft",
  OPEN: "auth.admin.mp.approvals.cycleStatus.open",
  CLOSED: "auth.admin.mp.approvals.cycleStatus.closed",
  REVEALED: "auth.admin.mp.approvals.cycleStatus.closed",
  ARCHIVED: "auth.admin.mp.approvals.cycleStatus.closed",
};

export default function MarketPulseApprovalsClient({
  data,
}: Readonly<{ data: MarketPulseApprovalsPageData }>) {
  const { t } = useTranslations();
  const router = useRouter();

  const [groups, setGroups] = useState(data.groups);
  const [filter, setFilter] = useState<ReviewFilter>("PENDING");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [rejectingCardId, setRejectingCardId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [ppaDrafts, setPpaDrafts] = useState<Record<string, PpaDraft>>({});

  const filters: ReviewFilter[] = ["PENDING", "APPROVED", "REJECTED", "all"];

  const filterLabel = (f: ReviewFilter) => t(filterKeys[f]);

  const visibleGroups = useMemo(() => {
    if (filter === "all") return groups;
    return groups
      .map((group) => ({
        ...group,
        days: group.days
          .map((day) => ({
            ...day,
            cards: day.cards.filter((card) => card.reviewStatus === filter),
          }))
          .filter((day) => day.cards.length > 0),
      }))
      .filter((group) => group.days.length > 0);
  }, [groups, filter]);

  const updateCardRow = (updated: MarketPulseAdminCardRow) => {
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        days: group.days.map((day) => ({
          ...day,
          cards: day.cards.map((card) =>
            card.id === updated.id ? updated : card,
          ),
        })),
      })),
    );
  };

  const handleApprovePublish = async (card: MarketPulseAdminCardRow) => {
    const isRest = isMarketPulseRestCard(card);
    const draft = ppaDrafts[card.id];
    setBusyCardId(card.id);
    setMessage(null);
    try {
      const result = await approveAndPublishMarketPulseCardAction({
        cardId: card.id,
        ...(isRest
          ? {}
          : {
              ppaSignal: draft?.ppaSignal ?? card.ppaSignal ?? "",
              ppaInsight: draft?.ppaInsight ?? card.ppaInsight ?? "",
              ppaInsightZhHant:
                draft?.ppaInsightZhHant ?? card.ppaInsightZhHant ?? "",
            }),
      });
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setMessage({ text: result.message, isError: false });
      router.refresh();
    } catch (error) {
      console.error("[admin] approvals approve threw:", error);
      setMessage({
        text: "Something went wrong while approving this card.",
        isError: true,
      });
    } finally {
      setBusyCardId(null);
    }
  };

  const handleReject = async (card: MarketPulseAdminCardRow) => {
    setBusyCardId(card.id);
    setMessage(null);
    try {
      const result = await rejectMarketPulseCardAction({
        cardId: card.id,
        reviewNote: rejectNote || undefined,
      });
      setRejectingCardId(null);
      setRejectNote("");
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setMessage({ text: result.message, isError: false });
      router.refresh();
    } catch (error) {
      console.error("[admin] approvals reject threw:", error);
      setMessage({
        text: "Something went wrong while rejecting this card.",
        isError: true,
      });
    } finally {
      setBusyCardId(null);
    }
  };

  const setPpaDraft = (cardId: string, patch: Partial<PpaDraft>) => {
    setPpaDrafts((prev) => ({
      ...prev,
      [cardId]: { ...EMPTY_PPA_DRAFT, ...prev[cardId], ...patch },
    }));
  };

  const renderCard = (card: MarketPulseAdminCardRow) => {
    const isRest = isMarketPulseRestCard(card);
    const needsPpaForm = !isRest && !card.ppaSignalLockedAt;
    const busy = busyCardId === card.id;
    const draft = ppaDrafts[card.id];
    const ppaSignalValue = draft?.ppaSignal ?? card.ppaSignal ?? "";
    const ppaInsightValue = draft?.ppaInsight ?? card.ppaInsight ?? "";
    const ppaInsightZhValue =
      draft?.ppaInsightZhHant ?? card.ppaInsightZhHant ?? "";

    return (
      <article
        key={card.id}
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`${badgeClassBase} ${badgeClass(isRest ? "zinc" : "emerald")}`}>
                {isRest ? "REST" : "SIGNAL"}
              </span>
              <span className={`${badgeClassBase} ${reviewBadgeClass(card.reviewStatus)}`}>
                {t(reviewStatusKeys[card.reviewStatus])}
              </span>
              {card.ppaSignal ? (
                <span className={`${badgeClassBase} ${card.ppaSignal === "BULLISH" ? badgeClass("emerald") : badgeClass("amber")}`}>
                  {card.ppaSignal === "BULLISH"
                    ? t("auth.admin.mp.approvals.signal.bullish")
                    : t("auth.admin.mp.approvals.signal.cautious")}
                </span>
              ) : null}
              {card.ppaSignalLockedAt ? (
                <span className={`${badgeClassBase} ${badgeClass("emerald")}`}>PPA ✓</span>
              ) : null}
            </div>
            <h4 className="text-base font-semibold text-zinc-50">{card.headline}</h4>
            {card.headlineZhHant ? (
              <p className="mt-0.5 text-sm text-zinc-400">{card.headlineZhHant}</p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-500">
              {card.companyName}
              {card.ticker ? ` · ${card.ticker}` : ""}
              {card.sourceName ? ` · ${card.sourceName}` : ""}
            </p>
          </div>
          {card.cardImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.cardImageUrl}
              alt={card.cardImageAlt ?? ""}
              className="h-20 w-32 shrink-0 rounded-lg border border-zinc-800 object-cover"
            />
          ) : null}
        </div>

        {card.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{card.summary}</p>
        ) : null}

        {card.researchNotes ? (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("auth.admin.mp.approvals.researchNotes")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
              {card.researchNotes}
            </p>
          </div>
        ) : null}

        {card.reviewNote ? (
          <p className="mt-2 text-xs text-red-300/80">
            {t("auth.admin.mp.approvals.reviewNote")}: {card.reviewNote}
          </p>
        ) : null}

        {card.sourceUrl ? (
          <a
            href={card.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-emerald-400/90 underline-offset-2 hover:underline"
          >
            {t("auth.admin.mp.approvals.source")} ↗
          </a>
        ) : null}

        {needsPpaForm ? (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              {t("auth.admin.mp.approvals.ppaSection")}
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-500">
                  {t("auth.admin.mp.approvals.ppaSignal")}
                </label>
                <select
                  value={ppaSignalValue}
                  onChange={(e) =>
                    setPpaDraft(card.id, {
                      ppaSignal: e.target.value as MarketPulseSignal | "",
                    })
                  }
                  className={fieldClass}
                >
                  <option value="">—</option>
                  <option value="BULLISH">
                    {t("auth.admin.mp.approvals.signal.bullish")}
                  </option>
                  <option value="CAUTIOUS">
                    {t("auth.admin.mp.approvals.signal.cautious")}
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500">
                  {t("auth.admin.mp.approvals.ppaInsight")}
                </label>
                <textarea
                  value={ppaInsightValue}
                  onChange={(e) =>
                    setPpaDraft(card.id, { ppaInsight: e.target.value })
                  }
                  rows={2}
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-500">
                  {t("auth.admin.mp.approvals.ppaInsightZh")}
                </label>
                <textarea
                  value={ppaInsightZhValue}
                  onChange={(e) =>
                    setPpaDraft(card.id, { ppaInsightZhHant: e.target.value })
                  }
                  rows={2}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        ) : null}

        {editingCardId === card.id ? (
          <div className="mt-4">
            <MarketPulseGuidedCardEditor
              key={card.id}
              card={card}
              onCardUpdated={updateCardRow}
            />
            <button
              type="button"
              className={`${buttonClass} mt-3`}
              onClick={() => setEditingCardId(null)}
            >
              {t("auth.admin.mp.approvals.close")}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy}
              onClick={() => handleApprovePublish(card)}
            >
              {t("auth.admin.mp.approvals.approvePublish")}
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={busy}
              onClick={() => {
                setRejectingCardId(card.id);
                setRejectNote("");
              }}
            >
              {t("auth.admin.mp.approvals.reject")}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => setEditingCardId(card.id)}
            >
              {t("auth.admin.mp.approvals.edit")}
            </button>
          </div>
        )}

        {rejectingCardId === card.id ? (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={2}
              placeholder={t("auth.admin.mp.approvals.rejectNote")}
              className={fieldClass}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={dangerButtonClass}
                disabled={busy}
                onClick={() => handleReject(card)}
              >
                {t("auth.admin.mp.approvals.confirmReject")}
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => setRejectingCardId(null)}
              >
                {t("auth.admin.mp.approvals.cancel")}
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={chipClass(filter === f)}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.isError
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {visibleGroups.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-500">
          {t("auth.admin.mp.approvals.empty")}
        </p>
      ) : (
        visibleGroups.map((group) => (
          <section
            key={group.cycleId}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
          >
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {group.cycleName}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {t(cycleStatusKeys[group.cycleStatus])}{" "}
                  · {t("auth.admin.mp.approvals.dayLabel")} {group.startDateHkt}
                </p>
              </div>
            </header>
            <div className="mt-4 space-y-6">
              {group.days.map((day) => (
                <div key={day.dayIndex}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t("auth.admin.mp.approvals.dayLabel")} {day.dayIndex}
                    {day.hktDate ? ` · ${day.hktDate}` : ""}
                  </h3>
                  <div className="space-y-4">{day.cards.map(renderCard)}</div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
