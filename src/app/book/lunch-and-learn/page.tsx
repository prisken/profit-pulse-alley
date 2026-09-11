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
    en: "PROFIT PULSE ALLY · LUNCH & LEARN",
    zhHant: "PROFIT PULSE ALLY · 午餐研討會",
  },
  h1a: { en: "Is your team leaking", zhHant: "你的團隊使用 AI 時，" },
  h1b: { en: "sensitive data while using AI?", zhHant: "有否洩漏敏感資料？" },
  sub: {
    en: "Three Lunch & Learn sessions across WeWork Hong Kong, 12:30–14:00 each. We demoed a data-redaction gateway and a smart LLM router with semantic caching — then handed out a 3-Tier Safe AI Architecture blueprint and a 30-day roadmap. This is the next step: a private one-on-one to map it onto your own team, tools, and stack.",
    zhHant:
      "三場 Lunch & Learn 於 WeWork 香港各場地舉行，每場 12:30–14:00。我們即場示範資料遮蔽閘道（data-redaction gateway）與具備語意快取的智能 LLM 路由器，並派發「三層安全 AI 架構」藍圖與 30 天導入路線圖。下一步：一對一私人時段，把它套用到你的團隊、工具與技術架構。",
  },
  cta: { en: "Book a private 1-on-1", zhHant: "預約一對一私人時段" },
};

const BADGES: Bi[] = [
  { en: "🍱 3 sessions · 12:30–14:00 HKT", zhHant: "🍱 三場 · 12:30–14:00 HKT" },
  { en: "🛡️ 3-Tier Safe AI Architecture", zhHant: "🛡️ 三層安全 AI 架構" },
  { en: "📉 70–90% lower API cost", zhHant: "📉 API 成本降低 70–90%" },
  { en: "🗺️ 30-day adoption roadmap", zhHant: "🗺️ 30 天導入路線圖" },
];

type Session = { date: Bi; venue: Bi; note?: Bi };

const SESSIONS: Session[] = [
  {
    date: { en: "Wed 16 Sep", zhHant: "9月16日（星期三）" },
    venue: { en: "WeWork Lee Garden", zhHant: "WeWork Lee Garden" },
  },
  {
    date: { en: "Wed 23 Sep", zhHant: "9月23日（星期三）" },
    venue: { en: "WeWork YF Life Tower", zhHant: "WeWork YF Life Tower" },
  },
  {
    date: { en: "Tue 29 Sep", zhHant: "9月29日（星期二）" },
    venue: { en: "WeWork Cityplaza, Taikoo", zhHant: "WeWork Cityplaza（太古）" },
    note: { en: "Note: this one is a Tuesday", zhHant: "注意：此場為星期二" },
  },
];

const COVERED: { icon: string; title: Bi; body: Bi }[] = [
  {
    icon: "🛡️",
    title: { en: "Data-redaction gateway, live", zhHant: "資料遮蔽閘道（即場示範）" },
    body: {
      en: "We watched employee prompts get PII masked before they ever reach a public LLM — so sensitive text never leaves your perimeter.",
      zhHant: "我們即場看到員工的提示在送往公共 LLM 之前先被遮蔽個資（PII），敏感內容不會離開你的防線。",
    },
  },
  {
    icon: "🧭",
    title: { en: "LLM router + semantic caching", zhHant: "LLM 路由器與語意快取" },
    body: {
      en: "A smart router that sends each task to the right model, backed by semantic caching — the demo showed roughly 70–90% lower API cost.",
      zhHant: "智能路由器會把每個任務導向合適的模型，配合語意快取——示範顯示 API 成本可降低約 70–90%。",
    },
  },
  {
    icon: "🗺️",
    title: { en: "3-Tier Safe AI Architecture", zhHant: "三層安全 AI 架構" },
    body: {
      en: "The blueprint we handed out, plus a 30-day adoption roadmap so you can roll it out in stages instead of all at once.",
      zhHant: "我們派發的架構藍圖，加上 30 天導入路線圖，讓你分階段推行，而無需一次過全面上線。",
    },
  },
];

const BRIDGE: { eyebrow: Bi; titleA: Bi; titleB: Bi; sub: Bi } = {
  eyebrow: { en: "FROM THE ROOM TO YOUR STACK", zhHant: "由研討會走到你的團隊" },
  titleA: { en: "You came to the lunch & learn.", zhHant: "你來過午餐研討會。" },
  titleB: { en: "Now map it onto your team.", zhHant: "現在把它套用到你的團隊。" },
  sub: {
    en: "Book a private one-on-one. Bring your tools, your stack, and the data-flow questions you'd rather not raise in the room — we'll map the pieces that fit your setup, in the order that matters.",
    zhHant:
      "預約一對一私人時段。帶上你的工具、技術架構，以及你不便在大庭廣眾提出的資料流問題——我們會按優先次序，為你的實際環境規劃可行的方案。",
  },
};

const BOTTOM: {
  titleA: Bi;
  titleB: Bi;
  sub: Bi;
  cta: Bi;
  alt: Bi;
} = {
  titleA: { en: "Seen the demo.", zhHant: "看過示範，" },
  titleB: { en: "Now make it yours.", zhHant: "現在為你所用。" },
  sub: {
    en: "One private session. Your stack, your constraints, a plan you can start this month.",
    zhHant: "一次私人諮詢。你的架構、你的限制，一份本月即可啟動的計劃。",
  },
  cta: { en: "Book a private 1-on-1", zhHant: "預約一對一私人時段" },
  alt: {
    en: "Prefer to ask first? Send a question on WhatsApp — no booking needed.",
    zhHant: "想先了解？可透過 WhatsApp 提問——無需預約。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title:
      locale === "zh-Hant"
        ? "AI Copilot 午餐研討會——一對一預約 | Profit Pulse Ally"
        : "AI Copilot Lunch & Learn — private 1-on-1 booking | Profit Pulse Ally",
    description: pick(
      {
        en: "Attended the AI Copilot Lunch & Learn? Book a private one-on-one to map the data-redaction gateway, LLM router, and 3-Tier Safe AI Architecture onto your own team and stack.",
        zhHant:
          "參加過 AI Copilot 午餐研討會？預約一對一私人時段，把資料遮蔽閘道、LLM 路由器與三層安全 AI 架構套用到你的團隊與技術架構。",
      },
      locale,
    ),
    openGraph: {
      title: pick(
        {
          en: "AI Copilot Lunch & Learn — book a private 1-on-1 follow-up",
          zhHant: "AI Copilot 午餐研討會——預約一對一跟進時段",
        },
        locale,
      ),
      description: pick(
        {
          en: "Safe AI, applied to your stack. Book a private one-on-one after the Lunch & Learn series.",
          zhHant: "安全 AI，套用於你的架構。研討會系列後，預約一對一私人諮詢。",
        },
        locale,
      ),
      type: "website",
    },
  };
}

const QUESTION_MESSAGE: Bi = {
  en: "Hi! I attended the AI Copilot Lunch & Learn and would like to ask about a private 1-on-1 follow-up.",
  zhHant: "你好！我參加了 AI Copilot 午餐研討會，想查詢一對一跟進時段。",
};

export default async function LunchAndLearnBookPage() {
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

      {/* ── Sessions ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          {pick({ en: "The series", zhHant: "系列場次" }, locale)}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-foreground/55">
          {pick(
            {
              en: "Three sessions, 12:30–14:00 HKT each. You're welcome to book a one-on-one whether you made one, two, or all three.",
              zhHant:
                "三場活動，每場 12:30–14:00 HKT。無論你參加過一場、兩場還是全部三場，都歡迎預約一對一時段。",
            },
            locale,
          )}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {SESSIONS.map((s) => (
            <div
              key={s.date.en}
              className="rounded-2xl border border-white/10 bg-[#111318] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            >
              <p className="text-sm font-semibold">{pick(s.date, locale)}</p>
              <p className="mt-1 text-xs text-foreground/55">{pick(s.venue, locale)}</p>
              <p className="mt-2 text-xs text-foreground/40">12:30–14:00 HKT</p>
              {s.note && (
                <p className="mt-3 inline-block rounded-full border border-amber-500/30 px-2.5 py-0.5 text-[11px] text-amber-300/90">
                  {pick(s.note, locale)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── What we covered ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          {pick({ en: "What we put on the table", zhHant: "我們在會上示範了什麼" }, locale)}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {COVERED.map((item) => (
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

      {/* ── Bridge to the booking flow ───────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-10 text-center">
        <p className="mp-text-ticker text-mp-pulse">— {pick(BRIDGE.eyebrow, locale)} —</p>
        <p className="mt-3 text-2xl font-bold sm:text-3xl">
          {pick(BRIDGE.titleA, locale)}{" "}
          <span className="text-mp-pulse">{pick(BRIDGE.titleB, locale)}</span>
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-foreground/55">
          {pick(BRIDGE.sub, locale)}
        </p>
      </section>

      {/* ── Booking flow ──────────────────────────────────── */}
      <section id="book-flow" className="scroll-mt-20">
        <BookingFlow initialWeeks={getWeekOptions(new Date())} />
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
