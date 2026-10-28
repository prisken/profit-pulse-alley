import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet, Scale, Users, Quote, ArrowRight } from "lucide-react";

import CommunityPartnersSection from "@/components/home/CommunityPartnersSection";
import GroupMedicalForm from "@/components/group-medical/GroupMedicalForm";
import { getServerSiteLocale } from "@/lib/i18n/server";

/**
 * Facts the agent must supply before they can be published. Anything blank is
 * NOT rendered — the page never shows a placeholder licence number, a fake
 * address, or an invented case study.
 */
const AGENT = {
  name: "Prisken Lo",
  titleZh: "AIA 友邦保險代理",
  titleEn: "AIA insurance agent",
  licence: "",
  email: "hello@profitpulseally.com",
  phone: "",
  office: "",
  photo: "/prisken-headshot.png",
  caseStudy: null as null | {
    industryZh: string; industryEn: string; headcount: string; comparedOn: string;
    before: string; after: string; diff: string; coverageZh: string; coverageEn: string;
    firstYearOnly: string;
  },
};

const TESTIMONIALS: {
  quoteZh: string; quoteEn: string; whoZh: string; whoEn: string; real: boolean;
}[] = [
  {
    quoteZh: "我哋最明白續保唔係淨係睇價錢，而係要睇清楚保障差異同總成本。團隊好有次序咁做 one-page comparison，令 decision 得更快，亦減少到不必要嘅追問。",
    quoteEn: "Renewal isn't just about price — it's about seeing the coverage differences and the total cost. The team built the one-page comparison in order, which made the decision faster and cut out a lot of unnecessary back-and-forth.",
    whoZh: "Jane C. · HR Manager", whoEn: "Jane C. · HR Manager", real: true,
  },
  {
    quoteZh: "團隊處理得好專業：從資料整理、方案比較，到轉保銜接安排，都清楚列明要做咩、交咩文件、同埋時間表。對公司同 HR 來講，係一份好安心嘅支援。",
    quoteEn: "Very professional throughout: from organising the information and comparing options to the transition arrangements, everything set out what had to be done, which documents to submit, and the timeline. For the company and HR, that is reassuring support.",
    whoZh: "Kevin L. · Company Director", whoEn: "Kevin L. · Company Director", real: true,
  },
  {
    quoteZh: "成個流程唔複雜，但好有效率。先同我哋講清楚 company cost（公司負擔）同員工自選（如果有）嘅分別，再協助整理文件，令交接順暢。",
    quoteEn: "The process wasn't complicated, but it was efficient. They first made the distinction between company cost and employee voluntary cover (if any) clear, then helped organise the documents so the handover was smooth.",
    whoZh: "Sam T. · Operations Manager", whoEn: "Sam T. · Operations Manager", real: true,
  },
  {
    quoteZh: "最欣賞係透明度。團隊冇用一堆術語，而係用簡單方式講到保障點樣對應員工需要。就算最後未必即刻轉，都令我哋明白取捨原因。",
    quoteEn: "What I valued most was the transparency. No wall of jargon — they explained in plain terms how the cover maps to what employees need. Even though we didn't switch straight away, we understood the trade-offs.",
    whoZh: "Evelyn K. · HR Generalist", whoEn: "Evelyn K. · HR Generalist", real: true,
  },
  {
    quoteZh: "員工啟用支援做得好到位：公司收到指引之後，可以更快幫同事理解保障同索償方法。當員工清楚咗，HR 日常跟進壓力就會下降。",
    quoteEn: "The employee onboarding support was excellent: once the company had the guidance, we could help colleagues understand cover and claims faster. When staff are clear, HR's day-to-day follow-up pressure drops.",
    whoZh: "Raymond P. · Founder", whoEn: "Raymond P. · Founder", real: true,
  },
  {
    quoteZh: "團隊同公司同財務溝通方式好得體。佢哋會把成本、保障差異、轉保安排用表格化嘅方式呈現，令到 Finance/董事會更容易審閱同批准。",
    quoteEn: "They handled communication with the company and finance very well. Costs, coverage differences and transition arrangements were presented in tables, which made it easier for Finance and the board to review and approve.",
    whoZh: "Amy S. · HR Manager", whoEn: "Amy S. · HR Manager", real: true,
  },
  {
    quoteZh: "續保最怕混亂，但呢次安排得好穩陣。團隊有跟進申請進度、提醒需要補交嘅項目，亦確保保障銜接到位，減少到過渡期嘅風險。",
    quoteEn: "Renewals are where things usually get messy, but this one was steady. They tracked the application, reminded us of outstanding items, and made sure cover connected properly — reducing transition risk.",
    whoZh: "Michelle W. · Finance Lead", whoEn: "Michelle W. · Finance Lead", real: true,
  },
  {
    quoteZh: "公司最重視係可控成本同可清楚解釋嘅決策依據。團隊用實際比較令到我哋知：點解會有幅度、保障又有咩變化——決定更加有根有據。",
    quoteEn: "What matters most to us is controllable cost and a decision we can explain. The actual comparison showed us why the numbers moved and what changed in cover — so the decision had a basis.",
    whoZh: "Tommy N. · CFO (SME)", whoEn: "Tommy N. · CFO (SME)", real: true,
  },
  {
    quoteZh: "團隊亦做得好貼心：會提前整理清單，令到公司準備資料唔使臨時搵食。overall experience 感覺係‘有人跟住做’，而唔係我哋自己一頭蝦。",
    quoteEn: "Thoughtful, too: they prepared the checklist in advance so we weren't scrambling for documents at the last minute. Overall it felt like someone was on it with us, rather than us fumbling alone.",
    whoZh: "Doris H. · HR & Admin", whoEn: "Doris H. · HR & Admin", real: true,
  },
  {
    quoteZh: "如果公司想要一個可以長期合作嘅支援夥伴，呢個團隊係值得信任嘅選擇。由比較、申請、到保障生效後嘅對接，都保持到專業同一致性。",
    quoteEn: "If a company wants a support partner for the long term, this is a team you can trust. From comparison to application to the handover after cover starts, it stayed professional and consistent.",
    whoZh: "Peter C. · Business Owner", whoEn: "Peter C. · Business Owner", real: true,
  },
];

/** Three quotes that speak to a renewal decision: comparison, cost, handover. */
const FEATURED = [0, 7, 8] as const;

const OFFER = null as null | {
  nameZh: string; nameEn: string;
  whoZh: string; whoEn: string;
  whatZh: string; whatEn: string;
  scopeZh: string; scopeEn: string;
  deadlineZh: string; deadlineEn: string;
};

const copy = {
  "zh-Hant": {
    kicker: "香港公司團體醫療｜AIA 獨立代理",
    h1: "續保加價？先睇清慳幾多、保障差幾多。",
    lead: "畀香港中小企東主、HR 同財務。填公司人數同續保月份，我出一頁比較同報價。免費，唔使即刻轉。",
    strip: "12 月到期？而家比較，先決定續定轉。",
    chips: [
      ["一頁交到俾老闆", "而家續保 vs 建議方案：保費、保障、員工自付分開列"],
      ["公司出同員工出分開", "公司保費同員工自選唔會混在一張數"],
      ["員工識 claim 先有用", "文件清單、轉保日期、App 同索償點做"],
    ],
    tTitle: "HR 同財務批得快，因為數字清楚。",
    moreQuotes: "再睇 7 段評語",
    stepsTitle: "三步，唔使你自己砌表",
    steps: [
      ["1", "公司資料", "幾多人、幾時續保、WhatsApp 定電郵"],
      ["2", "一頁比較", "而家續保 vs 建議方案，保費同保障分開列"],
      ["3", "決定續定轉", "要轉我幫手跟文件；唔轉都冇事"],
    ],
    sheetTitle: "交俾財務嗰頁，大概係咁",
    sheetNow: "現有續保",
    sheetNext: "建議方案",
    sheetRows: [
      ["全年公司保費", "現有數字", "建議數字"],
      ["每名員工成本", "現有", "建議"],
      ["住院 / 門診", "現有保障", "建議保障"],
      ["員工自付", "現有", "分開列明"],
    ],
    sampleLabel: "示意樣本，並非實際報價",
    gNote: "我會按你揀嘅方式回覆。呢一步唔係投保申請。",
    sticky: "索取免費比較",
    eRegister: "於保險業監管局登記冊核實",
    disclaimer:
      "本頁由 AIA 保險代理提供，並非 AIA 官方網站，亦不代表 AIA 承保或認可任何內容。AIA 為保單承保人；保障範圍、保費、核保及理賠決定均由 AIA 按保單條款作出。頁內比較屬示意，並非實際報價或要約。優惠（如有）受條款、資格及期限限制。",
    sourceNote: "產品資料來源：AIA 香港官方網站。",
  },
  en: {
    kicker: "Hong Kong group medical · AIA independent agent",
    h1: "Renewal going up? See the saving — and the gap in cover — first.",
    lead: "For HK SME owners, HR and finance. Company size and renewal month. I send a one-page comparison. Free. No need to switch.",
    strip: "Renewing in December? Compare now, then decide.",
    chips: [
      ["One page for the boss", "Current renewal vs proposed: premium, cover, staff pay-in — split out"],
      ["Company cost vs staff top-up", "Employer premium and employee voluntary cover never mixed"],
      ["Staff who can actually claim", "Checklist, switch date, app and claims in plain language"],
    ],
    tTitle: "HR and finance signed off faster when the numbers were clear.",
    moreQuotes: "7 more quotes",
    stepsTitle: "Three steps. You don't have to build the spreadsheet.",
    steps: [
      ["1", "Company basics", "How many staff, which month it renews, WhatsApp or email"],
      ["2", "One-page comparison", "This year's renewal vs a proposed plan — premium and cover split out"],
      ["3", "Stay or switch", "If you switch, I handle the paperwork. If you don't, that's fine."],
    ],
    sheetTitle: "The page you can send to finance",
    sheetNow: "Current renewal",
    sheetNext: "Proposed",
    sheetRows: [
      ["Annual company premium", "Your figure", "Proposed figure"],
      ["Cost per employee", "Current", "Proposed"],
      ["Hospital / outpatient", "Current cover", "Proposed cover"],
      ["Staff contribution", "Current", "Shown separately"],
    ],
    sampleLabel: "Illustrative sample — not a quotation",
    gNote: "I'll reply the way you choose. This is not an application for cover.",
    sticky: "Get the free comparison",
    eRegister: "Verify on the Insurance Authority register",
    disclaimer:
      "This page is provided by an AIA insurance agent. It is not an AIA website and does not represent AIA underwriting or endorsement of its content. AIA is the insurer; cover, premiums, underwriting and claims are decided by AIA under the policy terms. Comparisons shown are illustrative, not a quotation or an offer. Any offer is subject to terms, eligibility and expiry.",
    sourceNote: "Product information: AIA Hong Kong.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerSiteLocale();
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  return { title: `${t.h1} — ${AGENT.name}`, description: t.lead };
}

export default async function GroupMedicalPage() {
  const locale = await getServerSiteLocale();
  const isZh = locale === "zh-Hant";
  const t = copy[isZh ? "zh-Hant" : "en"];
  const a = AGENT;
  const featured = FEATURED.map((i) => TESTIMONIALS[i]);
  const rest = TESTIMONIALS.filter((_, i) => !(FEATURED as readonly number[]).includes(i));

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pb-6 pt-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pt-14">
        <div>
          <div className="flex flex-col items-start gap-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:gap-4">
            {a.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photo} alt={a.name} className="h-24 w-24 flex-none rounded-2xl object-cover object-top ring-1 ring-foreground/15 min-[360px]:h-28 min-[360px]:w-28 sm:h-32 sm:w-32" />
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold">{t.kicker}</p>
              <p className="mt-1.5 text-lg font-semibold leading-tight">{a.name}</p>
              <p className="text-xs text-foreground/60">{isZh ? a.titleZh : a.titleEn}</p>
              <p className="mt-1 text-[11px] font-semibold text-brand-gold">{t.strip}</p>
            </div>
          </div>
          <h1 className="mt-5 text-[1.85rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.35rem]">{t.h1}</h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-foreground/75">{t.lead}</p>

          <ul className="mt-7 space-y-3">
            {t.chips.map(([title, body], i) => {
              const Icon = [FileSpreadsheet, Scale, Users][i];
              return (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-gold/12 text-brand-gold">
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">{body}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <a href="https://iir.ia.org.hk/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block py-1.5 text-[12px] text-foreground/55 underline underline-offset-4">
            {t.eRegister}
          </a>
        </div>

        <div id="quote" className="scroll-mt-24">
          <GroupMedicalForm locale={locale} compact />
        </div>
      </section>

      <section className="border-t border-foreground/10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.stepsTitle}</h2>
            <ol className="mt-6 space-y-4">
              {t.steps.map(([n, title, body], i) => (
                <li key={n} className="flex gap-3">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-brand-black">{n}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">{body}</p>
                    {i < t.steps.length - 1 ? <ArrowRight className="mt-2 h-3.5 w-3.5 text-brand-gold/70" aria-hidden /> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t.sheetTitle}</p>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600">{t.sampleLabel}</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10">
              <div className="grid grid-cols-2 gap-x-3 bg-foreground/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45 sm:grid-cols-3">
                <span className="hidden sm:block" />
                <span className="sm:text-right">{t.sheetNow}</span>
                <span className="text-right text-brand-gold">{t.sheetNext}</span>
              </div>
              {t.sheetRows.map(([label, left, right]) => (
                <div key={label} className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-foreground/8 px-3 py-2.5 sm:grid-cols-3 sm:items-center sm:gap-y-0">
                  <span className="col-span-2 text-[11px] font-medium text-foreground/60 sm:col-span-1 sm:text-xs sm:font-normal">{label}</span>
                  <span className="text-xs text-foreground/50 sm:text-right">{left}</span>
                  <span className="text-right text-xs font-medium text-foreground/85">{right}</span>
                </div>
              ))}
            </div>
            <a href="#quote" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:underline">
              {t.sticky} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      {OFFER ? (
        <section className="border-t border-foreground/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-5">
              <p className="text-sm font-semibold">{isZh ? OFFER.nameZh : OFFER.nameEn}</p>
              <p className="mt-1 text-xs text-foreground/70">{isZh ? OFFER.whatZh : OFFER.whatEn} · {isZh ? OFFER.deadlineZh : OFFER.deadlineEn}</p>
            </div>
          </div>
        </section>
      ) : null}

      {featured.length ? (
        <section className="border-t border-foreground/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.tTitle}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {featured.map((x) => (
                <figure key={x.whoEn} className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5">
                  <Quote className="h-4 w-4 text-brand-gold/70" aria-hidden />
                  <blockquote className="mt-2 text-sm leading-relaxed text-foreground/75">“{isZh ? x.quoteZh : x.quoteEn}”</blockquote>
                  <figcaption className="mt-3 text-[11px] text-foreground/50">{isZh ? x.whoZh : x.whoEn}</figcaption>
                </figure>
              ))}
            </div>
            {rest.length ? (
              <details className="mt-5">
                <summary className="cursor-pointer text-xs font-semibold text-foreground/55 hover:text-foreground">{t.moreQuotes}</summary>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {rest.map((x) => (
                    <figure key={x.whoEn} className="rounded-xl border border-foreground/8 p-4">
                      <blockquote className="text-xs leading-relaxed text-foreground/70">“{isZh ? x.quoteZh : x.quoteEn}”</blockquote>
                      <figcaption className="mt-2 text-[11px] text-foreground/45">{isZh ? x.whoZh : x.whoEn}</figcaption>
                    </figure>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </section>
      ) : null}

      {a.caseStudy ? (
        <section className="border-t border-foreground/10">
          <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
            <p className="font-semibold">
              {isZh ? a.caseStudy.industryZh : a.caseStudy.industryEn} · {a.caseStudy.headcount}
            </p>
            <p className="mt-2 text-sm tabular-nums">{a.caseStudy.before} → {a.caseStudy.after} · {a.caseStudy.diff}</p>
          </div>
        </section>
      ) : null}

      <CommunityPartnersSection />

      <footer className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
          <p className="max-w-3xl text-[12px] leading-relaxed text-foreground/55">{t.disclaimer}</p>
          <p className="mt-3 text-[11px] text-foreground/40">{t.sourceNote} {t.gNote}</p>
          <p className="mt-4 text-xs text-foreground/45">
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">Profit Pulse Ally</Link>
            {" · "}
            <a href={`mailto:${a.email}`} className="underline underline-offset-4 hover:text-foreground">{a.email}</a>
          </p>
        </div>
      </footer>

    </main>
  );
}
