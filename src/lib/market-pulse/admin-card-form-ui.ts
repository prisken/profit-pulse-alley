import type { CardFormFieldErrors } from "@/lib/market-pulse/card-validation";

export const CARD_FORM_FIELD_IDS = {
  headline: "mp-card-headline",
  newsBody: "mp-card-news-body",
  summary: "mp-card-summary",
  userPrompt: "mp-card-user-prompt",
  companyName: "mp-card-company-name",
  companyNameZh: "mp-card-company-name-zh",
  ticker: "mp-card-ticker",
  exchange: "mp-card-exchange",
  logoUrl: "mp-card-logo-url",
  logoInitials: "mp-card-logo-initials",
  priceLabel: "mp-card-price-label",
  priceDirection: "mp-card-price-direction",
  sourceName: "mp-card-source-name",
  sourceDate: "mp-card-source-date",
  sourceUrl: "mp-card-source-url",
  cardImageUrl: "mp-card-image-url",
  cardImageAlt: "mp-card-image-alt",
  ppaSignal: "mp-card-ppa-signal",
  ppaInsight: "mp-card-ppa-insight",
  changeReason: "mp-card-change-reason",
  dayIndex: "mp-card-day-index",
  publishedAt: "mp-card-published-at",
  revealAt: "mp-card-reveal-at",
} as const;

export const CARD_FORM_FIELD_ORDER = [
  "headline",
  "summary",
  "companyName",
  "ticker",
  "dayIndex",
  "userPrompt",
  "newsBody",
  "exchange",
  "logoUrl",
  "sourceUrl",
  "sourceDate",
  "cardImageUrl",
  "cardImageAlt",
  "ppaSignal",
  "ppaInsight",
  "publishedAt",
  "revealAt",
  "global",
] as const satisfies readonly (keyof CardFormFieldErrors)[];

export function cardFieldId(name: keyof typeof CARD_FORM_FIELD_IDS): string {
  return CARD_FORM_FIELD_IDS[name];
}

export function cardFieldErrorId(name: keyof typeof CARD_FORM_FIELD_IDS): string {
  return `${CARD_FORM_FIELD_IDS[name]}-error`;
}

function isDomElement(target: EventTarget | null): target is HTMLElement {
  return (
    target !== null &&
    typeof target === "object" &&
    "tagName" in target &&
    typeof (target as HTMLElement).tagName === "string"
  );
}

function isFocusableDomElement(element: Element | null): element is HTMLElement {
  return (
    element !== null &&
    typeof element === "object" &&
    "focus" in element &&
    typeof (element as HTMLElement).focus === "function"
  );
}

export function shouldTriggerDraftSaveShortcut(event: KeyboardEvent): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
    return false;
  }

  const target = event.target;
  if (!isDomElement(target)) {
    return false;
  }

  if (target.tagName === "TEXTAREA") {
    return false;
  }

  if (target.isContentEditable) {
    return false;
  }

  return true;
}

export function focusFirstInvalidCardField(
  errors: CardFormFieldErrors,
): keyof CardFormFieldErrors | null {
  for (const key of CARD_FORM_FIELD_ORDER) {
    if (!errors[key]) {
      continue;
    }

    const fieldId =
      key in CARD_FORM_FIELD_IDS
        ? CARD_FORM_FIELD_IDS[key as keyof typeof CARD_FORM_FIELD_IDS]
        : null;

    if (fieldId) {
      const element = document.getElementById(fieldId);
      if (isFocusableDomElement(element)) {
        element.focus({ preventScroll: false });
        element.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return key;
      }
    }
  }

  return null;
}

export function requestFormDraftSave(formId: string): void {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const draftButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"][value="draft"]',
  );

  if (draftButton) {
    draftButton.click();
    return;
  }

  const fallback = document.querySelector<HTMLButtonElement>(
    `button[type="submit"][form="${formId}"][value="draft"]`,
  );
  fallback?.click();
}
