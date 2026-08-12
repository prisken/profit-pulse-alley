import type { Metadata } from "next";

import PitchGame from "@/components/pitch/PitchGame";
import { INVESTOR, SETUP_COPY, type Bi } from "@/lib/pitch-game/content";
import { getServerSiteLocale } from "@/lib/i18n/server";
import type { SiteLocale } from "@/lib/i18n/locales";

/** Allow the DeepSeek-backed reaction sentence room within serverless limits. */
export const maxDuration = 60;

function pick<T>(bi: { en: T; zhHant: T }, locale: SiteLocale): T {
  return locale === "zh-Hant" ? bi.zhHant : bi.en;
}

const HERO: {
  eyebrow: Bi;
  h1a: Bi;
  h1b: Bi;
  sub: Bi;
  cta: Bi;
} = {
  eyebrow: {
    en: "A PROFIT PULSE ALLY EXPERIMENT",
    zhHant: "PROFIT PULSE ALLY 實驗企劃",
  },
  h1a: { en: "Pitch your business.", zhHant: "向投資者提案。" },
  h1b: { en: "Get the honest read.", zhHant: "得到誠實的評價。" },
  sub: {
    en: "You get 20 minutes with {name}, a {title} at {firm}. She'll push on the number that matters — and tell you, in one sentence, what it would take to get the check.",
    zhHant:
      "你有20分鐘與{firm}的{title}{name}會面。她會追問最關鍵的數字——並用一句話告訴你，要拿到支票還差甚麼。",
  },
  cta: { en: "Play the meeting", zhHant: "開始這場會議" },
};

const BADGES: Bi[] = [
  { en: "⏱️ 3 minutes", zhHant: "⏱️ 3分鐘" },
  { en: "👆 Six taps", zhHant: "👆 六次點按" },
  { en: "📊 No typing until the numbers", zhHant: "📊 數字環節前無需打字" },
  { en: "⚙️ Your automation gap, named", zhHant: "⚙️ 點名你的自動化缺口" },
];

const WHY_PLAY: { icon: string; title: Bi; body: Bi }[] = [
  {
    icon: "🎯",
    title: {
      en: "The questions that actually matter",
      zhHant: "真正重要的問題",
    },
    body: {
      en: "Not another business quiz. You'll face the same pushback a real investor gives — on the numbers that decide whether deals get done.",
      zhHant: "這不是另一份商業問卷。你會面對真實投資者給出的同一種追問——針對那些決定交易成敗的數字。",
    },
  },
  {
    icon: "⚙️",
    title: {
      en: "Your automation gap, named",
      zhHant: "點名你的自動化缺口",
    },
    body: {
      en: "Every weak spot the game finds maps to a concrete automation fix — the thing eating your time, margin, or pipeline right now.",
      zhHant: "遊戲發現的每個弱點，都對應一個具體的自動化解法——就是那個正在吞噬你時間、利潤或管道的東西。",
    },
  },
  {
    icon: "🤝",
    title: {
      en: "A human follow-up, not a bot",
      zhHant: "真人跟進，不是機器人",
    },
    body: {
      en: "Leave your details and a real person from the Profit Pulse Ally team sends your full readout — and shows you the fix.",
      zhHant: "留下你的資料，Profit Pulse Ally 團隊的真人會把完整評估報告寄給你——並示範解決方法。",
    },
  },
];

const BOTTOM: {
  titleA: Bi;
  titleB: Bi;
  sub: Bi;
} = {
  titleA: {
    en: "Not ready to pitch?",
    zhHant: "還未準備好提案？",
  },
  titleB: {
    en: "Steal the questions anyway.",
    zhHant: "那就先把問題偷走。",
  },
  sub: {
    en: "Every number Elena pushes on is the number a real investor pushes on. Walk into your next meeting having already answered the hard one.",
    zhHant: "Elena追問的每個數字，都是真實投資者會追問的數字。帶着已經想好的答案，走進你的下一場會議。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  return {
    title:
      locale === "zh-Hant"
        ? "提案會議 | Profit Pulse Ally"
        : "The Pitch Meeting | Profit Pulse Ally",
    description: pick(
      {
        en: "A 3-minute game: pitch your business to an investor, get the honest read on your numbers, and find out exactly what to automate before the next meeting.",
        zhHant:
          "一個3分鐘遊戲：向投資者提案、得到對你數字的誠實評價，並找出下一場會議前你必須自動化的環節。",
      },
      locale,
    ),
    openGraph: {
      title: pick(
        {
          en: "The Pitch Meeting — get the honest read",
          zhHant: "提案會議——得到誠實的評價",
        },
        locale,
      ),
      description: pick(
        {
          en: "20 minutes, one investor, one checkbook. Find out what it takes to get the check — and what to automate to be ready.",
          zhHant:
            "20分鐘、一位投資者、一本支票簿。看看要拿到支票還差甚麼——以及你要自動化甚麼才能準備好。",
        },
        locale,
      ),
      type: "website",
    },
  };
}

export default async function PitchPage() {
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[60rem] -z-10 h-[30rem] bg-[radial-gradient(50%_50%_at_20%_30%,rgba(167,139,250,0.04),transparent_70%)]"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:pt-16">
        <p className="mp-text-ticker text-mp-pulse">
          — {pick(SETUP_COPY.eyebrow, locale)} · {pick(HERO.eyebrow, locale)} —
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          {pick(HERO.h1a, locale)}
          <br />
          <span className="text-mp-pulse">{pick(HERO.h1b, locale)}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground/60 sm:text-lg">
          {pick(HERO.sub, locale)
            .replace("{name}", INVESTOR.name)
            .replace("{title}", pick(INVESTOR.title, locale))
            .replace("{firm}", INVESTOR.firm)}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-foreground/45">
          {BADGES.map((b) => (
            <span key={b.en} className="rounded-full border border-white/10 px-3 py-1">
              {pick(b, locale)}
            </span>
          ))}
        </div>
      </section>

      {/* ── Hero graphic ─────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 pb-4">
        <HeroGraphic />
      </div>

      {/* ── The game ─────────────────────────────────────────── */}
      <section id="game" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-16 pt-4">
        <PitchGame />
      </section>

      {/* ── Why play ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {WHY_PLAY.map((item) => (
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

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-20 text-center">
        <p className="text-2xl font-bold sm:text-3xl">
          {pick(BOTTOM.titleA, locale)}{" "}
          <span className="text-mp-pulse">{pick(BOTTOM.titleB, locale)}</span>
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-foreground/55">
          {pick(BOTTOM.sub, locale)}
        </p>
        <a
          href="#game"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-foreground/85 transition hover:border-mp-pulse/40 hover:bg-mp-pulse/5 mp-focus-pulse"
        >
          {pick(HERO.cta, locale)}
        </a>
      </section>
    </main>
  );
}

/** Term-sheet + growing-chart illustration — pure SVG, dark-theme friendly. */
function HeroGraphic() {
  return (
    <svg
      viewBox="0 0 560 240"
      className="mx-auto w-full max-w-xl"
      role="img"
      aria-label="Illustration: an investor's term sheet next to a growing bar chart"
    >
      <defs>
        <linearGradient id="pg-doc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1f26" />
          <stop offset="100%" stopColor="#111318" />
        </linearGradient>
        <linearGradient id="pg-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#0ea56c" />
        </linearGradient>
        <linearGradient id="pg-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id="pg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* subtle grid */}
      <g stroke="rgba(255,255,255,0.045)" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={40 + i * 60} y1="20" x2={40 + i * 60} y2="220" />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`h${i}`} x1="40" y1={30 + i * 48} x2="520" y2={30 + i * 48} />
        ))}
      </g>

      {/* term sheet doc */}
      <g transform="translate(48, 44)">
        <rect width="250" height="152" rx="14" fill="url(#pg-doc)" stroke="rgba(255,255,255,0.14)" />
        <rect x="18" y="16" width="84" height="8" rx="4" fill="rgba(0,230,118,0.9)" />
        <rect x="18" y="34" width="120" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
        <rect x="18" y="52" width="210" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
        <rect x="18" y="64" width="190" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
        <rect x="18" y="76" width="200" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
        <rect x="18" y="96" width="110" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
        {/* signature */}
        <path d="M18 124 C 40 112, 52 138, 74 122 S 108 132, 128 120" stroke="rgba(250,204,21,0.85)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="18" y="134" width="120" height="3" rx="1.5" fill="rgba(255,255,255,0.14)" />
        {/* ILLUSTRATIVE stamp */}
        <g transform="rotate(-8, 210, 120)">
          <rect x="170" y="104" width="80" height="22" rx="4" fill="none" stroke="rgba(250,204,21,0.55)" strokeWidth="1.5" />
          <text x="210" y="119" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill="rgba(250,204,21,0.75)" fontFamily="JetBrains Mono, monospace">
            ILLUSTRATIVE
          </text>
        </g>
      </g>

      {/* growing bars */}
      <g transform="translate(352, 58)">
        <rect x="0" y="76" width="34" height="62" rx="6" fill="rgba(255,255,255,0.1)" />
        <rect x="48" y="52" width="34" height="86" rx="6" fill="rgba(255,255,255,0.16)" />
        <rect x="96" y="20" width="34" height="118" rx="6" fill="url(#pg-bar)" filter="url(#pg-glow)" />
        <path d="M -4 142 H 148" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        {/* trend arrow */}
        <path d="M 132 40 L 132 96" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 4" />
        <path d="M 127 44 L 132 36 L 137 44" stroke="rgba(0,230,118,0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* coin stack */}
      <g transform="translate(318, 150)">
        <ellipse cx="16" cy="52" rx="16" ry="5" fill="rgba(250,204,21,0.25)" />
        <rect x="0" y="38" width="32" height="14" rx="4" fill="url(#pg-gold)" />
        <ellipse cx="16" cy="38" rx="16" ry="5" fill="#fde047" />
        <rect x="4" y="24" width="24" height="14" rx="4" fill="url(#pg-gold)" opacity="0.85" />
        <ellipse cx="16" cy="24" rx="12" ry="4" fill="#fef08a" />
        <text x="16" y="33" textAnchor="middle" fontSize="10" fontWeight="800" fill="#713f12" fontFamily="JetBrains Mono, monospace">$</text>
      </g>

      {/* checkmark stamp */}
      <g transform="translate(468, 30)">
        <circle cx="24" cy="24" r="23" fill="rgba(0,230,118,0.12)" stroke="rgba(0,230,118,0.55)" strokeWidth="2" />
        <path d="M 14 25 L 21 32 L 35 16" stroke="#00e676" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* sparkles */}
      <g fill="#00e676">
        <path d="M 300 40 l 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" opacity="0.7" />
        <path d="M 120 210 l 2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5 z" opacity="0.45" />
        <path d="M 470 150 l 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" opacity="0.55" />
      </g>
    </svg>
  );
}
