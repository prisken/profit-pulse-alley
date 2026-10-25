// PPA Webinar Series 2026 — eight weekly Saturday sessions.
// One shared bilingual source of truth so each session can be detailed without
// touching the other seven. Route convention mirrors the existing event pages:
// src/app/events/<slug>/page.tsx → getWebinarEvent(slug, locale).

import type { SiteLocale } from "@/lib/i18n/locales";
import type { EventDetailData } from "@/lib/events/types";

export type WebinarSeriesEvent = {
  week: number;
  slug: string;
  /** ISO date in Asia/Hong_Kong (all Saturdays). */
  date: string;
  targetEn: string;
  targetZh: string;
  topicEn: string;
  topicZh: string;
  angleEn: string;
  angleZh: string;
  /**
   * Optional fully-written detail for a session. When absent the page falls back
   * to the short series scaffold (topic + angle + TBC logistics).
   */
  detail?: {
    titleEn?: string;
    titleZh?: string;
    subheadEn?: string;
    subheadZh?: string;
    audienceEn?: string;
    audienceZh?: string;
    learnEn?: string[];
    learnZh?: string[];
    bonusEn?: string;
    bonusZh?: string;
    sessions?: { time: string; labelEn: string; labelZh: string }[];
    venueEn?: string;
    venueZh?: string;
    costEn?: string;
    costZh?: string;
  };
};

export const WEBINAR_SERIES_2026: WebinarSeriesEvent[] = [
  {
    week: 1,
    slug: "w1-founder-protection-stack",
    date: "2026-11-07",
    targetEn: "Business Owners",
    targetZh: "企業東主",
    topicEn: "The Founder Disappears. Where Does the Money Land?",
    topicZh: "創辦人突然離場，錢會去邊？",
    angleEn:
      "Keyman vs Buy-Sell Split: show why tax-deductible keyman cover and shareholder buyout funding are not the same structure.",
    angleZh:
      "Keyman 保險 vs 股東買賣協議：點解扣稅嘅 keyman 保障同股東收購資金係兩套唔同架構，唔可以混為一談。",
    detail: {
      titleEn:
        "The Founder Protection Stack 創辦人防守架構：公司現金流、股東延續與家族保障",
      titleZh: "The Founder Protection Stack 創辦人防守架構：公司現金流、股東延續與家族保障",
      subheadEn:
        "Founder dies. Company needs cash. Family wants liquidity. Shareholders want control. Is your plan built for all three?",
      subheadZh:
        "創辦人突然離世，公司要現金、家人要保障、股東要控制權。你嘅安排係咪三樣都處理到？",
      audienceEn:
        "For Hong Kong founders, SME owners, directors, and shareholder-partners who want to avoid the “one-policy-solves-everything” mistake.",
      audienceZh:
        "專為香港創辦人、中小企東主、董事及股東合夥人而設，避免將公司保障、股東買賣及家庭保障混為一談。",
      learnEn: [
        "Why keyman insurance and buy-sell funding are not the same thing",
        "How to identify who should own the policy and who should receive the proceeds",
        "Why a shareholder agreement without funding can still fail",
        "How to estimate company cashflow, buyout, and family liquidity needs",
        "What to review with your CPA, solicitor, and licensed insurance adviser",
      ],
      learnZh: [
        "點解要員保險同股東買賣資金係兩件唔同嘅事",
        "點樣決定保單應該由邊個持有、賠償應該俾邊個",
        "點解有股東協議但無資金安排，方案仍然會失敗",
        "點樣估算公司現金流、股東收購同家庭流動性需要",
        "應該同會計師、律師及持牌保險顧問檢視啲乜",
      ],
      bonusEn:
        "Every registrant receives the Founder Continuity Checklist — 21 questions every HK business owner should answer before a founder exits, dies, or becomes disabled.",
      bonusZh:
        "所有報名者均可獲得《創辦人延續檢查清單》——創辦人離世、退股或失去工作能力前，香港東主必答的 21 條問題。",
      sessions: [
        { time: "10:00–10:45", labelEn: "Cantonese session", labelZh: "廣東話場" },
        { time: "11:15–12:00", labelEn: "English session", labelZh: "英語場" },
      ],
      venueEn:
        "Online webinar — the join link will be sent to registered attendees. Two sessions on the same day: Cantonese at 10:00, English at 11:15.",
      venueZh:
        "網上研討會——觀看連結將發送給已報名參加者。同日設兩場：上午 10:00 廣東話場，上午 11:15 英語場。",
      costEn: "Free · registration required",
      costZh: "免費 · 需預先報名",
    },
  },
  {
    week: 2,
    slug: "w2-asset-holding-shell-trap",
    date: "2026-11-14",
    targetEn: "HNW Families",
    targetZh: "高淨值家庭",
    topicEn: "The Asset-Holding Shell Trap",
    topicZh: "公司名義持有豪宅名車：富裕家庭的隱形責任缺口",
    angleEn:
      "Map ownership gaps when homes, cars, helpers, collections, and family assets sit under different HK/BVI/company names.",
    angleZh:
      "拆解資產擁有權缺口：當住宅、車輛、家傭、收藏品同家族資產分別登記喺香港、BVI、公司名下，風險會喺邊度漏出嚟。",
  },
  {
    week: 3,
    slug: "w3-new-family-risk-reset",
    date: "2026-11-21",
    targetEn: "Newlyweds / Parents",
    targetZh: "新婚夫婦／新手爸媽",
    topicEn: "New Family. Old Policies. Hidden Gaps.",
    topicZh: "新家庭。舊保單。隱藏缺口。",
    angleEn:
      "Compare employer medical, spouse benefits, child medical, life cover, CI, and education funding before buying more policies.",
    angleZh:
      "買新保單之前，先比較僱主醫療、配偶福利、子女醫療、人壽、危疾同教育基金，避免重複投保同保障錯配。",
  },
  {
    week: 4,
    slug: "w4-tax-smart-retirement",
    date: "2026-11-28",
    targetEn: "Pre-Retirees",
    targetZh: "準退休人士",
    topicEn: "Your Tax Plan Saved Money. Did It Save Your Retirement?",
    topicZh: "慳稅，唔等於退休穩陣。",
    angleEn:
      "Deduction ≠ refund: calculate real VHIS and QDAP/TVC tax savings, then link to retirement healthcare cashflow.",
    angleZh:
      "扣稅唔等於退稅：計清 VHIS 同 QDAP/TVC 嘅實際稅務節省，再連繫到退休醫療現金流同通脹壓力測試。",
  },
  {
    week: 5,
    slug: "w5-sme-hidden-liability",
    date: "2026-12-05",
    targetEn: "Business Owners",
    targetZh: "中小企東主",
    topicEn: "Hidden Liability for HK SMEs",
    topicZh: "中小企隱形責任：數據外洩、僱傭糾紛、董事責任與 EC 以外風險",
    angleEn:
      "“Your EC policy is not your cyber plan.” Use a customer-data breach and employee-claim scenario to expose gaps.",
    angleZh:
      "「你張 EC 保單唔等於你嘅網絡安全計劃。」用客戶資料外洩同僱員索償情境，揭示保障缺口。",
  },
  {
    week: 6,
    slug: "w6-premium-financing-stress-test",
    date: "2026-12-12",
    targetEn: "HNW / Cross-Border",
    targetZh: "高淨值／跨境家庭",
    topicEn: "Premium Financing & Global Medical Stress Test",
    topicZh: "保費融資與環球醫療：高淨值家庭的槓桿壓力測試",
    angleEn:
      "Replace “arbitrage” with stress tests: rate rises, currency mismatch, call loan, non-guaranteed returns, children overseas.",
    angleZh:
      "唔講「套息」，改做壓力測試：利率上升、貨幣錯配、call loan、非保證回報，同子女海外升學。",
  },
  {
    week: 7,
    slug: "w7-homebuyer-protection-playbook",
    date: "2026-12-19",
    targetEn: "Homebuyers",
    targetZh: "置業人士",
    topicEn: "The Modern Homebuyer’s Protection Playbook",
    topicZh: "置業防守學：按揭、人壽、火險、家居與責任保障",
    angleEn:
      "Bank-sold mortgage cover vs independent life cover: compare control, beneficiary, portability, and total cost.",
    angleZh:
      "銀行按揭保險 vs 獨立人壽保障：比較控制權、受益人、可攜性同總成本。",
  },
  {
    week: 8,
    slug: "w8-legacy-architecture",
    date: "2026-12-26",
    targetEn: "Pre-Retirees / Legacy",
    targetZh: "準退休／傳承規劃",
    topicEn: "Legacy Architecture",
    topicZh: "財富傳承與資產防護：流動性、受益人、遺囑與家庭治理",
    angleEn:
      "HK estate duty has been abolished for deaths on or after 11 February 2006, but probate, liquidity, cross-border assets, and family conflict still matter.",
    angleZh:
      "香港喺 2006 年 2 月 11 日或之後已取消遺產稅，但遺產承辦、流動性、跨境資產同家庭爭議仍然要處理。",
  },
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Saturday, 7 November 2026" — date-only; time is intentionally TBC. */
export function formatEnDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `Saturday, ${d} ${EN_MONTHS[m - 1]} ${y}`;
}

/** "2026年11月7日（星期六）" */
export function formatZhDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日（星期六）`;
}

export function getWebinarSeriesEvent(slug: string): WebinarSeriesEvent | undefined {
  return WEBINAR_SERIES_2026.find((event) => event.slug === slug);
}

/**
 * Bilingual EventDetailData for one series session. Speakers and agenda are
 * empty on purpose: the owner will detail each session in the next step, and
 * EventDetailTemplate hides those sections when they are empty.
 */
export function getWebinarEvent(
  slug: string,
  locale: SiteLocale,
): EventDetailData | undefined {
  const event = getWebinarSeriesEvent(slug);
  if (!event) return undefined;

  const zh = locale === "zh-Hant";
  const date = zh ? formatZhDate(event.date) : formatEnDate(event.date);
  const detail = event.detail;
  const title = (zh ? detail?.titleZh : detail?.titleEn) ?? (zh ? event.topicZh : event.topicEn);
  const angle = zh ? event.angleZh : event.angleEn;
  const target = zh ? event.targetZh : event.targetEn;
  const audience = (zh ? detail?.audienceZh : detail?.audienceEn) ?? target;
  const learn = (zh ? detail?.learnZh : detail?.learnEn) ?? [];
  const bonus = zh ? detail?.bonusZh : detail?.bonusEn;
  const sessions = detail?.sessions ?? [];
  const sessionText = sessions.length
    ? sessions.map((s) => `${s.time} ${zh ? s.labelZh : s.labelEn}`).join(" · ")
    : zh
      ? "時間待定"
      : "Time TBC";

  const highlights: EventDetailData["highlights"] = [
    {
      label: zh ? "對象：" : "Who it’s for:",
      text: audience,
    },
    ...learn.map((text) => ({ label: "", text })),
    ...(bonus
      ? [{ label: zh ? "免費資源：" : "Free resource:", text: bonus }]
      : []),
    {
      label: zh ? "形式：" : "Format:",
      text: sessions.length
        ? zh
          ? `網上研討會，同日兩場：${sessionText}。報名後發送觀看連結。`
          : `Online webinar, two sessions on the day: ${sessionText}. Join link sent after registration.`
        : zh
          ? "網上研討會，報名後發送觀看連結。"
          : "Online webinar — the join link is sent to registered attendees.",
    },
    {
      label: zh ? "系列：" : "Series:",
      text: zh
        ? `PPA 2026 網上研討會系列第 ${event.week} 場（共 8 場）。`
        : `Part ${event.week} of 8 in the PPA Webinar Series 2026.`,
    },
    {
      label: zh ? "日期：" : "Date:",
      text: `${date} · ${sessionText}`,
    },
  ];

  return {
    pageTitle: `${title} | PPA Webinar Series 2026`,
    title,
    subtitle: (zh ? detail?.subheadZh : detail?.subheadEn) ?? angle,
    highlights,
    registrationLink: "#register",
    registrationText: zh ? "預留名額 + 取得檢查清單" : "Reserve my seat + get the checklist",
    registrationDisabled: false,
    speakersSectionTitle: zh ? "講者" : "Speakers",
    speakers: [],
    agenda: sessions.map((s) => ({
      time: s.time,
      description: zh ? s.labelZh : s.labelEn,
    })),
    venueDescription:
      (zh ? detail?.venueZh : detail?.venueEn) ??
      (zh
        ? "網上研討會——觀看連結將發送給已報名參加者。"
        : "Online webinar — the join link will be sent to registered attendees."),
    eventDateTime: `${date} · ${sessionText}`,
    eventLocation: zh ? "網上研討會" : "Online webinar",
    eventCost:
      (zh ? detail?.costZh : detail?.costEn) ??
      (zh ? "免費 · 需預先報名" : "Free · registration required"),
  };
}
