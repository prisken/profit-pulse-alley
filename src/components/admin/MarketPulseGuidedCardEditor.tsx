"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MarketPulseSignal } from "@prisma/client";

import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith, type MessageKey } from "@/lib/i18n/messages";
import {
  approveGuidedMarketPulseCardPpaAction,
  updateGuidedMarketPulseCardAction,
} from "@/lib/market-pulse/admin-actions";
import type { MarketPulseAdminCardRow } from "@/lib/market-pulse/admin-data";
import { isCardPublished } from "@/lib/market-pulse/admin-card-filter";
import { marketPulseCycleBuilderPath } from "@/lib/market-pulse/admin-mp-navigation";
import {
  getGuidedCardFieldReadiness,
  type GuidedCardFieldReadiness,
  type GuidedContentFieldId,
  type GuidedPpaFieldId,
  type GuidedSaveBlockingFieldId,
} from "@/lib/market-pulse/guided-card-field-readiness";
import {
  getGuidedCardStatus,
  isGuidedPpaApproved,
} from "@/lib/market-pulse/guided-card-status";
import { isMarketPulseRestCard } from "@/lib/market-pulse/card-type";
import { MARKET_PULSE_SIGNAL_OPTIONS } from "@/lib/market-pulse/card-validation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fieldClass = `mt-2 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-base text-zinc-50 outline-none disabled:opacity-60 sm:text-sm ${focusRing}`;

const fieldErrorClass = "border-red-500/50";

const buttonClass = `inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const primaryButtonClass = `inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

type FieldErrors = Partial<Record<string, string>>;

type ReadinessFieldId =
  | GuidedContentFieldId
  | GuidedSaveBlockingFieldId
  | GuidedPpaFieldId;

function getReadinessFieldLabelKey(
  fieldId: ReadinessFieldId,
  isRest: boolean,
): MessageKey {
  switch (fieldId) {
    case "headline":
      return isRest
        ? "auth.admin.mp.guidedCards.field.restTitle"
        : "auth.admin.mp.guidedCards.field.headline";
    case "newsBody":
      return isRest
        ? "auth.admin.mp.guidedCards.field.restBody"
        : "auth.admin.mp.guidedCards.field.newsBody";
    case "companyName":
      return "auth.admin.mp.guidedCards.field.company";
    case "ticker":
      return "auth.admin.mp.guidedCards.field.ticker";
    case "summary":
      return "auth.admin.mp.guidedCards.field.summary";
    case "dayIndex":
      return "auth.admin.mp.guidedCards.field.day";
    case "cardImageUrl":
      return "auth.admin.mp.guidedCards.field.imageUrl";
    case "cardImageAlt":
      return "auth.admin.mp.guidedCards.field.imageAlt";
    case "ppaSignal":
      return "auth.admin.mp.guidedCards.field.ppaDecision";
    case "ppaInsight":
      return "auth.admin.mp.guidedCards.field.ppaInsight";
    case "ppaApproval":
      return "auth.admin.mp.guidedCards.readiness.field.ppaApproval";
    default:
      return "auth.admin.mp.guidedCards.readiness.title";
  }
}

function getInlineReadinessHint(
  fieldId: ReadinessFieldId,
  readiness: GuidedCardFieldReadiness,
  t: (key: MessageKey) => string,
): string | null {
  if (readiness.missingSaveFields.includes(fieldId as GuidedSaveBlockingFieldId)) {
    if (fieldId === "cardImageAlt") {
      return t("auth.admin.mp.guidedCards.readiness.imageAltRequired");
    }
    return t("auth.admin.mp.guidedCards.readiness.requiredBeforeSaving");
  }

  if (readiness.missingContentFields.includes(fieldId as GuidedContentFieldId)) {
    return t("auth.admin.mp.guidedCards.readiness.requiredForLaunch");
  }

  if (readiness.missingPpaFields.includes(fieldId as GuidedPpaFieldId)) {
    return t("auth.admin.mp.guidedCards.readiness.requiredForLaunch");
  }

  return null;
}

function GuidedCardReadinessPanel({
  readiness,
  isRest,
  t,
}: Readonly<{
  readiness: GuidedCardFieldReadiness;
  isRest: boolean;
  t: (key: MessageKey) => string;
}>) {
  const statusKey = `auth.admin.mp.guidedCards.status.${readiness.status}` as const;

  const renderFieldList = (
    titleKey: MessageKey,
    fieldIds: ReadinessFieldId[],
  ) => {
    if (fieldIds.length === 0) {
      return null;
    }

    return (
      <div>
        <p className="text-xs font-medium text-zinc-400">{t(titleKey)}</p>
        <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
          {fieldIds.map((fieldId) => (
            <li key={fieldId}>
              {t(getReadinessFieldLabelKey(fieldId, isRest))}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">
          {t("auth.admin.mp.guidedCards.readiness.title")}
        </h3>
        <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
          {t(statusKey)}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {renderFieldList(
          "auth.admin.mp.guidedCards.readiness.missingContent",
          readiness.missingContentFields,
        )}
        {renderFieldList(
          "auth.admin.mp.guidedCards.readiness.missingSave",
          readiness.missingSaveFields,
        )}
        {renderFieldList(
          "auth.admin.mp.guidedCards.readiness.missingPpa",
          readiness.missingPpaFields,
        )}
      </div>

      {readiness.hintKeys.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-zinc-500">
          {readiness.hintKeys.map((hintKey) => (
            <li key={hintKey}>{t(hintKey)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function InlineReadinessHint({
  fieldId,
  readiness,
  fieldErrors,
  t,
}: Readonly<{
  fieldId: ReadinessFieldId;
  readiness: GuidedCardFieldReadiness;
  fieldErrors: FieldErrors;
  t: (key: MessageKey) => string;
}>) {
  if (fieldErrors[fieldId]) {
    return null;
  }

  const hint = getInlineReadinessHint(fieldId, readiness, t);
  if (!hint) {
    return null;
  }

  return <p className="mt-1 text-xs text-amber-400/90">{hint}</p>;
}

type Props = {
  card: MarketPulseAdminCardRow;
  onCardUpdated: (card: MarketPulseAdminCardRow) => void;
};

export default function MarketPulseGuidedCardEditor({
  card,
  onCardUpdated,
}: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const isRest = isMarketPulseRestCard(card);
  const published = isCardPublished(card);
  const ppaApproved = isGuidedPpaApproved(card);

  const [headline, setHeadline] = useState(card.headline);
  const [newsBody, setNewsBody] = useState(card.newsBody ?? "");
  const [companyName, setCompanyName] = useState(card.companyName);
  const [ticker, setTicker] = useState(card.ticker);
  const [summary, setSummary] = useState(card.summary ?? "");
  const [priceLabel, setPriceLabel] = useState(card.priceLabel ?? "");
  const [dayIndex, setDayIndex] = useState(card.dayIndex);
  const [cardImageUrl, setCardImageUrl] = useState(card.cardImageUrl ?? "");
  const [cardImageAlt, setCardImageAlt] = useState(card.cardImageAlt ?? "");
  const [ppaSignal, setPpaSignal] = useState(card.ppaSignal ?? "");
  const [ppaInsight, setPpaInsight] = useState(card.ppaInsight ?? "");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const status = useMemo(() => getGuidedCardStatus(card), [card]);
  const readiness = useMemo(() => getGuidedCardFieldReadiness(card), [card]);
  const statusKey = `auth.admin.mp.guidedCards.status.${status}` as const;

  const applyFieldErrors = (errors?: Record<string, string[]>) => {
    if (!errors) {
      setFieldErrors({});
      return;
    }
    const next: FieldErrors = {};
    for (const [key, messages] of Object.entries(errors)) {
      if (messages[0]) {
        next[key] = messages[0];
      }
    }
    setFieldErrors(next);
  };

  const buildUpdatedCard = (
    patch: Partial<MarketPulseAdminCardRow>,
  ): MarketPulseAdminCardRow => ({
    ...card,
    ...patch,
  });

  const handleSave = async () => {
    setMessage(null);
    setFieldErrors({});
    setIsSaving(true);

    try {
      const result = await updateGuidedMarketPulseCardAction(
        isRest
          ? {
              cardId: card.id,
              cardType: "REST",
              headline,
              newsBody,
              dayIndex,
              cardImageUrl,
              cardImageAlt,
            }
          : {
              cardId: card.id,
              cardType: "SIGNAL",
              headline,
              newsBody,
              companyName,
              ticker,
              summary,
              dayIndex,
              priceLabel,
              cardImageUrl,
              cardImageAlt,
            },
      );

      if (!result.ok) {
        setIsError(true);
        setMessage(result.error);
        applyFieldErrors(result.fieldErrors);
        return;
      }

      const updated = buildUpdatedCard(
        isRest
          ? {
              headline: headline.trim(),
              newsBody: newsBody.trim() || null,
              summary: newsBody.trim() || null,
              dayIndex,
              cardImageUrl: cardImageUrl.trim() || null,
              cardImageAlt: cardImageAlt.trim() || null,
            }
          : {
              headline: headline.trim(),
              newsBody: newsBody.trim() || null,
              companyName: companyName.trim(),
              ticker: ticker.trim(),
              summary: summary.trim() || null,
              priceLabel: priceLabel.trim() || null,
              dayIndex,
              cardImageUrl: cardImageUrl.trim() || null,
              cardImageAlt: cardImageAlt.trim() || null,
            },
      );
      onCardUpdated(updated);
      setIsError(false);
      setMessage(result.message);
    } catch (error) {
      console.error("[admin] guided card save threw:", error);
      setIsError(true);
      setMessage("Something went wrong while saving this card.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovePpa = async () => {
    setMessage(null);
    setFieldErrors({});
    setIsApproving(true);

    try {
      const result = await approveGuidedMarketPulseCardPpaAction({
        cardId: card.id,
        ppaSignal: ppaSignal as MarketPulseSignal | "",
        ppaInsight,
      });

      if (!result.ok) {
        setIsError(true);
        setMessage(result.error);
        applyFieldErrors(result.fieldErrors);
        return;
      }

      const updated = buildUpdatedCard({
        ppaSignal: (ppaSignal || null) as MarketPulseAdminCardRow["ppaSignal"],
        ppaInsight: ppaInsight.trim() || null,
        ppaSignalLockedAt: new Date().toISOString(),
      });
      onCardUpdated(updated);
      setIsError(false);
      setMessage(result.message);
    } catch (error) {
      console.error("[admin] guided PPA approve threw:", error);
      setIsError(true);
      setMessage("Something went wrong while approving PPA.");
    } finally {
      setIsApproving(false);
    }
  };

  if (published) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300/90">
            {t("auth.admin.mp.guidedCards.status.published")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">{card.headline}</h2>
        </div>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {t("auth.admin.mp.guidedCards.editor.publishedNotice")}
        </p>
        <Link
          href={marketPulseCycleBuilderPath(card.cycleId)}
          className={buttonClass}
        >
          {t("auth.admin.mp.guidedCards.editor.openAdvancedBuilder")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            {isRest
              ? t("auth.admin.mp.guidedCards.editor.restTitle")
              : t("auth.admin.mp.guidedCards.editor.signalTitle")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">
            {translateWith(locale, "auth.admin.mp.guidedCards.editor.dayHeading", {
              day: String(dayIndex),
            })}
          </h2>
        </div>
        <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
          {t(statusKey)}
        </span>
      </div>

      <GuidedCardReadinessPanel readiness={readiness} isRest={isRest} t={t} />

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-200">
            {isRest
              ? t("auth.admin.mp.guidedCards.field.restTitle")
              : t("auth.admin.mp.guidedCards.field.headline")}
          </span>
          <input
            type="text"
            className={`${fieldClass} ${fieldErrors.headline ? fieldErrorClass : ""}`}
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            disabled={isSaving || isApproving}
          />
          {fieldErrors.headline ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.headline}</p>
          ) : (
            <InlineReadinessHint
              fieldId="headline"
              readiness={readiness}
              fieldErrors={fieldErrors}
              t={t}
            />
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-200">
            {isRest
              ? t("auth.admin.mp.guidedCards.field.restBody")
              : t("auth.admin.mp.guidedCards.field.newsBody")}
          </span>
          <textarea
            className={`${fieldClass} min-h-[8rem] ${fieldErrors.newsBody ? fieldErrorClass : ""}`}
            value={newsBody}
            onChange={(event) => setNewsBody(event.target.value)}
            disabled={isSaving || isApproving}
          />
          {fieldErrors.newsBody ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.newsBody}</p>
          ) : (
            <InlineReadinessHint
              fieldId="newsBody"
              readiness={readiness}
              fieldErrors={fieldErrors}
              t={t}
            />
          )}
        </label>

        {!isRest ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  {t("auth.admin.mp.guidedCards.field.company")}
                </span>
                <input
                  type="text"
                  className={`${fieldClass} ${fieldErrors.companyName ? fieldErrorClass : ""}`}
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  disabled={isSaving || isApproving}
                />
                {fieldErrors.companyName ? (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.companyName}</p>
                ) : (
                  <InlineReadinessHint
                    fieldId="companyName"
                    readiness={readiness}
                    fieldErrors={fieldErrors}
                    t={t}
                  />
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  {t("auth.admin.mp.guidedCards.field.ticker")}
                </span>
                <input
                  type="text"
                  className={`${fieldClass} ${fieldErrors.ticker ? fieldErrorClass : ""}`}
                  value={ticker}
                  onChange={(event) => setTicker(event.target.value)}
                  disabled={isSaving || isApproving}
                />
                {fieldErrors.ticker ? (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.ticker}</p>
                ) : (
                  <InlineReadinessHint
                    fieldId="ticker"
                    readiness={readiness}
                    fieldErrors={fieldErrors}
                    t={t}
                  />
                )}
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-zinc-200">
                {t("auth.admin.mp.guidedCards.field.summary")}
              </span>
              <textarea
                className={`${fieldClass} min-h-[5rem] ${fieldErrors.summary ? fieldErrorClass : ""}`}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                disabled={isSaving || isApproving}
              />
              {fieldErrors.summary ? (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.summary}</p>
              ) : (
                <InlineReadinessHint
                  fieldId="summary"
                  readiness={readiness}
                  fieldErrors={fieldErrors}
                  t={t}
                />
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-200">
                {t("auth.admin.mp.guidedCards.field.priceLabel")}
              </span>
              <input
                type="text"
                className={`${fieldClass} ${fieldErrors.priceLabel ? fieldErrorClass : ""}`}
                value={priceLabel}
                onChange={(event) => setPriceLabel(event.target.value)}
                disabled={isSaving || isApproving}
              />
            </label>
          </>
        ) : null}

        <label className="block sm:max-w-xs">
          <span className="text-sm font-medium text-zinc-200">
            {t("auth.admin.mp.guidedCards.field.day")}
          </span>
          <input
            type="number"
            min={1}
            className={`${fieldClass} ${fieldErrors.dayIndex ? fieldErrorClass : ""}`}
            value={dayIndex}
            onChange={(event) => setDayIndex(Number(event.target.value))}
            disabled={isSaving || isApproving}
          />
          {fieldErrors.dayIndex ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.dayIndex}</p>
          ) : (
            <InlineReadinessHint
              fieldId="dayIndex"
              readiness={readiness}
              fieldErrors={fieldErrors}
              t={t}
            />
          )}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCards.field.imageUrl")}
            </span>
            <input
              type="url"
              className={`${fieldClass} ${fieldErrors.cardImageUrl ? fieldErrorClass : ""}`}
              value={cardImageUrl}
              onChange={(event) => setCardImageUrl(event.target.value)}
              disabled={isSaving || isApproving}
            />
            {fieldErrors.cardImageUrl ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.cardImageUrl}</p>
            ) : (
              <InlineReadinessHint
                fieldId="cardImageUrl"
                readiness={readiness}
                fieldErrors={fieldErrors}
                t={t}
              />
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              {t("auth.admin.mp.guidedCards.field.imageAlt")}
            </span>
            <input
              type="text"
              className={`${fieldClass} ${fieldErrors.cardImageAlt ? fieldErrorClass : ""}`}
              value={cardImageAlt}
              onChange={(event) => setCardImageAlt(event.target.value)}
              disabled={isSaving || isApproving}
            />
            {fieldErrors.cardImageAlt ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.cardImageAlt}</p>
            ) : (
              <InlineReadinessHint
                fieldId="cardImageAlt"
                readiness={readiness}
                fieldErrors={fieldErrors}
                t={t}
              />
            )}
          </label>
        </div>
      </div>

      {!isRest ? (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">
            {t("auth.admin.mp.guidedCards.ppa.title")}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {ppaApproved
              ? t("auth.admin.mp.guidedCards.ppa.approvedHint")
              : t("auth.admin.mp.guidedCards.ppa.help")}
          </p>

          <div className="mt-4 grid gap-4">
            <label className="block sm:max-w-xs">
              <span className="text-sm font-medium text-zinc-200">
                {t("auth.admin.mp.guidedCards.field.ppaDecision")}
              </span>
              <select
                className={`${fieldClass} ${fieldErrors.ppaSignal ? fieldErrorClass : ""}`}
                value={ppaSignal}
                onChange={(event) => setPpaSignal(event.target.value)}
                disabled={isSaving || isApproving}
              >
                <option value="">{t("auth.admin.mp.guidedCards.ppa.selectDecision")}</option>
                {MARKET_PULSE_SIGNAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "BULLISH"
                      ? t("auth.admin.mp.guidedCards.ppa.bullish")
                      : t("auth.admin.mp.guidedCards.ppa.cautious")}
                  </option>
                ))}
              </select>
              {fieldErrors.ppaSignal ? (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.ppaSignal}</p>
              ) : (
                <InlineReadinessHint
                  fieldId="ppaSignal"
                  readiness={readiness}
                  fieldErrors={fieldErrors}
                  t={t}
                />
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-200">
                {t("auth.admin.mp.guidedCards.field.ppaInsight")}
              </span>
              <textarea
                className={`${fieldClass} min-h-[6rem] ${fieldErrors.ppaInsight ? fieldErrorClass : ""}`}
                value={ppaInsight}
                onChange={(event) => setPpaInsight(event.target.value)}
                disabled={isSaving || isApproving}
              />
              {fieldErrors.ppaInsight ? (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.ppaInsight}</p>
              ) : (
                <InlineReadinessHint
                  fieldId="ppaInsight"
                  readiness={readiness}
                  fieldErrors={fieldErrors}
                  t={t}
                />
              )}
            </label>
          </div>

          <div className="mt-4">
            <button
              type="button"
              className={buttonClass}
              disabled={isSaving || isApproving}
              onClick={handleApprovePpa}
            >
              {isApproving
                ? t("auth.admin.mp.guidedCards.ppa.approving")
                : t("auth.admin.mp.guidedCards.ppa.approve")}
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              {t("auth.admin.mp.guidedCards.readiness.approvePpaHelp")}
            </p>
          </div>
        </section>
      ) : null}

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${isError ? "border border-red-500/30 bg-red-500/10 text-red-200" : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <div>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={isSaving || isApproving}
            onClick={handleSave}
          >
            {isSaving ? t("auth.admin.mp.guidedCards.editor.saving") : t("auth.admin.mp.guidedCards.editor.save")}
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            {t("auth.admin.mp.guidedCards.readiness.saveHelp")}
          </p>
        </div>
        <Link href={marketPulseCycleBuilderPath(card.cycleId)} className={buttonClass}>
          {t("auth.admin.mp.guidedCards.editor.openAdvancedBuilder")}
        </Link>
      </div>
    </div>
  );
}
