import type { Metadata } from "next";

import BookingFlow from "@/components/book/BookingFlow";
import { getWeekOptions } from "@/lib/book/availability";
import { getServerSiteLocale } from "@/lib/i18n/server";
import type { SiteLocale } from "@/lib/i18n/locales";

type Bi = { en: string; zhHant: string };

function pick<T>(bi: { en: T; zhHant: T }, locale: SiteLocale): T {
  return locale === "zh-Hant" ? bi.zhHant : bi.en;
}

/** WhatsApp deep link for booking enquiries. Swap number/message here. */
const WHATSAPP_NUMBER = "85260147819";

function waLink(message: Bi): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    pick(message, "en"),
  )}`;
}

const HERO: {
  eyebrow: Bi;
  h1a: Bi;
  h1b: Bi;
  sub: Bi;
  cta: Bi;
} = {
  eyebrow: {
    en: "PROFIT PULSE ALLY · 1-ON-1",
    zhHant: "PROFIT PULSE ALLY · 一對一",
  },
  h1a: { en: "Your money,", zhHant: "你的財務，" },
  h1b: { en: "one honest read at a time.", zhHant: "一次誠實的分析。" },
  sub: {
    en: "A private one-on-one session with a financial analyst. Bring your numbers — leave with a prioritized action plan across protection, emergency fund, goals, and investments.",
    zhHant:
      "與理財分析師進行一對一私人諮詢。帶上你的數字——帶走一份涵蓋保障、應急基金、目標與投資的優先行動計劃。",
  },
  cta: { en: "Book your session", zhHant: "預約分析時段" },
};

const BADGES: Bi[] = [
  { en: "⏱️ 60 minutes", zhHant: "⏱️ 60分鐘" },
  { en: "🎯 A plan you can act on", zhHant: "🎯 立即可行的計劃" },
  { en: "🔒 Private & confidential", zhHant: "🔒 保密處理" },
  { en: "🌐 EN / 廣東話 / 普通話", zhHant: "🌐 英語 / 廣東話 / 普通話" },
];

const VALUE: { icon: string; title: Bi; body: Bi }[] = [
  {
    icon: "🧭",
    title: {
      en: "Your full picture, mapped",
      zhHant: "全面檢視你的財務狀況",
    },
    body: {
      en: "We walk through all four layers — protection, emergency fund, goals, and investments — and show how they fit together.",
      zhHant: "我們逐層檢視四大範疇——保障、應急基金、目標與投資——並顯示它們如何互相配合。",
    },
  },
  {
    icon: "🎯",
    title: {
      en: "An action plan, not a lecture",
      zhHant: "行動計劃，不是講課",
    },
    body: {
      en: "You leave with a short, prioritized list of what to do next — and what can safely wait.",
      zhHant: "你會帶走一份簡短而分優先次序的清單，列出接下來要做的事，以及哪些可以放心押後。",
    },
  },
  {
    icon: "🤝",
    title: {
      en: "A human who follows up",
      zhHant: "真人跟進",
    },
    body: {
      en: "Not a bot, not a broadcast. A real person reviews your situation and stays with you as you act on the plan.",
      zhHant: "不是機械人，不是群發訊息。真人會檢視你的情況，並在你執行計劃的過程中繼續跟進。",
    },
  },
];

const STEPS: { step: string; title: Bi; body: Bi }[] = [
  {
    step: "1",
    title: { en: "Book", zhHant: "預約" },
    body: {
      en: "Message us on WhatsApp, pick a time, and tell us a little about what you'd like to cover.",
      zhHant: "透過 WhatsApp 聯絡我們，選擇時間，並簡單告訴我們你想討論的範圍。",
    },
  },
  {
    step: "2",
    title: { en: "Share", zhHant: "分享" },
    body: {
      en: "Bring your numbers and questions — or send them ahead so we can make the session count.",
      zhHant: "帶上你的數字與問題——或提前發送給我們，讓分析時段更具效率。",
    },
  },
  {
    step: "3",
    title: { en: "Act", zhHant: "行動" },
    body: {
      en: "Leave with your analysis and a prioritized action plan you can start this week.",
      zhHant: "帶走你的分析結果與分優先次序的行動計劃，本週即可開始執行。",
    },
  },
];

const BOTTOM: {
  titleA: Bi;
  titleB: Bi;
  sub: Bi;
  cta: Bi;
  alt: Bi;
} = {
  titleA: { en: "Ready to get a clear read?", zhHant: "準備好了解自己的財務狀況？" },
  titleB: { en: "Let's talk.", zhHant: "讓我們談談。" },
  sub: {
    en: "One session. One honest read. A plan you can actually follow.",
    zhHant: "一次分析。一個誠實的評估。一份真正可行的計劃。",
  },
  cta: { en: "Book your session", zhHant: "預約分析時段" },
  alt: {
    en: "Not sure yet? Send a question first — no booking needed.",
    zhHant: "還未決定？可先發送問題——無需預約。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title:
      locale === "zh-Hant"
        ? "一對一財務分析 | Profit Pulse Ally"
        : "One-on-One Financial Analysis | Profit Pulse Ally",
    description: pick(
      {
        en: "A private 60-minute one-on-one financial analysis session. Bring your numbers — leave with a prioritized action plan across protection, emergency fund, goals, and investments.",
        zhHant:
          "60分鐘一對一私人財務分析。帶上你的數字——帶走一份涵蓋保障、應急基金、目標與投資的優先行動計劃。",
      },
      locale,
    ),
    openGraph: {
      title: pick(
        {
          en: "One-on-One Financial Analysis — get a clear read on your money",
          zhHant: "一對一財務分析——清楚了解你的財務狀況",
        },
        locale,
      ),
      description: pick(
        {
          en: "60 minutes, one analyst, one honest read. Book your session today.",
          zhHant: "60分鐘、一位分析師、一次誠實的評估。立即預約。",
        },
        locale,
      ),
      type: "website",
    },
  };
}

const BOOK_MESSAGE: Bi = {
  en: "Hi! I'd like to book a one-on-one financial analysis session.",
  zhHant: "你好！我想預約一對一財務分析時段。",
};

const QUESTION_MESSAGE: Bi = {
  en: "Hi! I have a question about the one-on-one financial analysis — no booking yet.",
  zhHant: "你好！我想先查詢一對一財務分析的詳情——暫時未預約。",
};

export default async function BookPage() {
  const locale = await getServerSiteLocale();

  return (
    <main className="relative overflow-hidden">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,230,118,0.09),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[30rem] -z-10 h-[30rem] bg-[radial-gradient(50%_50%_at_70%_20%,rgba(45,212,191,0.05),transparent_70%)]"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-6 pt-14 text-center sm:pt-16">
        <p className="mp-text-ticker text-mp-pulse">— {pick(HERO.eyebrow, locale)} —</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          {pick(HERO.h1a, locale)}
          <br />
          <span className="text-mp-pulse">{pick(HERO.h1b, locale)}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground/60 sm:text-lg">
          {pick(HERO.sub, locale)}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-foreground/45">
          {BADGES.map((b) => (
            <span key={b.en} className="rounded-full border border-white/10 px-3 py-1">
              {pick(b, locale)}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="#book-flow"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-mp-pulse px-7 py-3.5 text-sm font-bold text-black transition hover:brightness-110 mp-focus-pulse"
          >
            {pick(HERO.cta, locale)} ↓
          </a>
        </div>
      </section>

      {/* ── Booking flow ──────────────────────────────────── */}
      <section id="book-flow" className="scroll-mt-20">
        <BookingFlow initialWeeks={getWeekOptions(new Date())} />
      </section>

      {/* ── What you get ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUE.map((item) => (
            <div
              key={item.title.en}
              className="rounded-2xl border border-white/10 bg-[#111318] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-3 text-sm font-semibold sm:text-base">{pick(item.title, locale)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/55">
                {pick(item.body, locale)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          {pick(
            {
              en: "How it works",
              zhHant: "流程",
            },
            locale,
          )}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="relative rounded-2xl border border-white/10 bg-[#111318] p-5">
              <span className="mp-text-ticker text-mp-pulse">0{item.step}</span>
              <h3 className="mt-2 text-sm font-semibold sm:text-base">{pick(item.title, locale)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/55">
                {pick(item.body, locale)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-20 text-center">
        <p className="text-2xl font-bold sm:text-3xl">
          {pick(BOTTOM.titleA, locale)}{" "}
          <span className="text-mp-pulse">{pick(BOTTOM.titleB, locale)}</span>
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-foreground/55">
          {pick(BOTTOM.sub, locale)}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href="#book-flow"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-mp-pulse px-7 py-3.5 text-sm font-bold text-black transition hover:brightness-110 mp-focus-pulse"
          >
            {pick(BOTTOM.cta, locale)} ↓
          </a>
          <a
            href={waLink(QUESTION_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground/45 underline-offset-4 transition hover:text-foreground/70 hover:underline"
          >
            {pick(BOTTOM.alt, locale)}
          </a>
        </div>
      </section>
    </main>
  );
}
