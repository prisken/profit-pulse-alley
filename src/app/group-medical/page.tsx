import type { Metadata } from "next";
import Link from "next/link";

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
  licence: "",            // e.g. "IA licence no. XXXXXXXX" — blank hides the row
  email: "hello@profitpulseally.com",
  phone: "",              // blank hides the row
  office: "",             // full building + address — blank hides the row
  photo: "/prisken-headshot.png",  // blank falls back to initials
  caseStudy: null as null | {
    industryZh: string; industryEn: string; headcount: string; comparedOn: string;
    before: string; after: string; diff: string; coverageZh: string; coverageEn: string;
    firstYearOnly: string;
  },
};

/**
 * Testimonials. `real: false` renders a visible placeholder tag — the layout is
 * ready, but nothing on the page claims to be a client's words until a genuine
 * quote is dropped in with real: true.
 */
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

const OFFER = null as null | {
  nameZh: string; nameEn: string;
  whoZh: string; whoEn: string;
  whatZh: string; whatEn: string;
  scopeZh: string; scopeEn: string;
  deadlineZh: string; deadlineEn: string;
};

const copy = {
  "zh-Hant": {
    kicker: "AIA 友邦團體醫療｜獨立代理｜公司東主・HR・財務主管",
    h1: "團體醫療就快續保？睇清楚可以慳幾多，保障又差幾多。",
    lead: `我係 ${AGENT.name}，${AGENT.titleZh}。幫你比較現有續保方案同合適嘅 AIA 團體醫療方案，列清全年保費、主要保障差異同適用優惠。決定投保後，再協助你跟進申請、保障銜接同員工啟用。`,
    cta: "索取一頁團體醫療報價及比較",
    reassure: "免費查詢，毋須即時投保。資料齊備後提供報價；實際保費及承保條件以正式文件為準。",
    strip: "公司團體醫療 12 月到期？先睇比較，再決定續保。",
    bTitle: "唔係淨係畀個價你，係幫你交到份清楚嘅比較。",
    bRows: [
      ["現有續保保費", "建議 AIA 保費"],
      ["年度公司支出", "每名員工年度成本"],
      ["住院及手術", "門診及專科"],
      ["網絡限制", "賠償上限與員工自付"],
      ["已有病症處理", "相關等候期"],
      ["適用優惠、資格及期限", "建議轉保日期"],
    ],
    sampleLabel: "示意樣本，並非實際報價",
    bCopy: "平咗係因為優惠、保障組合唔同，定係員工要自己畀多咗？我會分開列清楚，方便你同老闆、財務同員工交代。",
    cTitle: "慳錢，要睇實際數字，唔係淨係睇折扣。",
    c1t: "公司保費：比較實際年度支出",
    c1b: "按公司人數、員工資料同保障需要整理合適方案，睇清楚全年支出有冇下降，以及保障有咩改變。AIA Flexi Choice 3 為合資格公司提供不同核心保障級別及自選保障，適合按預算與保障需要作比較——並非劃一的減費承諾。",
    c2t: "額外福利：列清楚已包括啲乜",
    c2b: "除醫療保障外，我會核實合資格員工可用嘅增值服務，並協助介紹使用方法。例如 MindAid 為合資格受保成員提供文字形式嘅心理健康支援，受指定時段及供應情況限制，屬非保證增值服務，並非無限次心理治療。",
    c3t: "員工自選保障：同公司保費分開計",
    c3b: "合資格員工可另行了解自費加強保障，例如 StepUp 2；是否參加由員工自行決定，不會與公司基本團體醫療保費混算。",
    offerTitle: "優惠資料",
    dTitle: "唔止幫你出單，仲幫你跟到同事識用。",
    dStages: [
      ["投保前", "一份文件清單、保障比較、建議轉保時間表"],
      ["投保期間", "核對文件完整性、協調遞交、跟進待補項目"],
      ["生效前", "確認獲批保障、生效日期及銜接安排"],
      ["員工啟用", "簡介會、App 使用指引、簡明索償指南"],
      ["持續支援", "指定聯絡人處理行政查詢及索償跟進"],
      ["續保前", "按預算、人數及保障需要作檢視"],
    ],
    dCopy: "HR 唔使自己逐份文件摸索。我會列清楚要交咩、邊一步由邊個跟，並協助向員工講解保障同索償流程。承保及理賠決定由保險公司按條款處理。",
    eTitle: "你搵到嘅，係一位可以核實身份、直接聯絡嘅代理。",
    eName: "姓名",
    eTitleLabel: "職銜",
    eLicence: "保險中介人牌照號碼",
    eRegister: "於保險業監管局登記冊核實",
    eOffice: "面對面會面",
    eOfficeNote: "亦可安排視像傾談。",
    eContact: "聯絡方式",
    fTitle: "實際例子",
    tTitle: "客戶怎麼說",
    tPlaceholder: "範本內容，並非真實客戶評語",
    gTitle: "先畀幾項基本資料，我幫你開始比較。",
    gNote: "我會先按你揀嘅方式聯絡，確認公司需要同報價所需資料。呢一步唔係投保申請。",
    disclaimer:
      "本頁由 AIA 保險代理提供，並非 AIA 官方網站，亦不代表 AIA 承保或認可任何內容。AIA 為保單承保人；保障範圍、保費、核保及理賠決定均由 AIA 按保單條款作出。頁內比較屬示意，並非實際報價或要約。優惠（如有）受條款、資格及期限限制。",
    sourceNote: "產品資料來源：AIA 香港官方網站；牌照資料可於保險業監管局登記冊查核。",
  },
  en: {
    kicker: "AIA group medical · independent agent · for owners, HR and finance",
    h1: "Renewal coming up? See what you'd actually save — and what you'd give up.",
    lead: `I'm ${AGENT.name}, an ${AGENT.titleEn}. I compare your existing renewal with suitable AIA group medical options, setting out the annual premium, the material coverage differences and any offer that applies. If you decide to proceed, I stay on to help with the application, the transition and employee onboarding.`,
    cta: "Get my one-page comparison",
    reassure: "Free to ask. No obligation to buy. A quote follows once we have the details; final premiums and terms are set by the insurer.",
    strip: "Group medical renewing in December? Compare first, then decide.",
    bTitle: "Not just a number — a comparison you can hand to your boss.",
    bRows: [
      ["Current renewal premium", "Proposed AIA premium"],
      ["Annual company cost", "Annual cost per employee"],
      ["Hospital and surgery", "Outpatient and specialist"],
      ["Network limits", "Reimbursement caps and staff contributions"],
      ["Pre-existing conditions", "Waiting periods"],
      ["Discounts, eligibility, expiry", "Proposed transition date"],
    ],
    sampleLabel: "Illustrative sample — not a quotation",
    bCopy: "Is the lower number a discount, a different benefit mix, or staff paying more themselves? I set those out separately so you can explain it to the owner, finance and your team.",
    cTitle: "Savings need numbers, not a discount headline.",
    c1t: "Company premium: compare the actual annual spend",
    c1b: "We match options to headcount, employee data and coverage needs, then look at whether the annual outlay falls — and what changes in cover. AIA Flexi Choice 3 offers eligible companies different core benefit levels and optional benefits, which suits a budget-and-coverage comparison. It is not a blanket promise of cheaper cover.",
    c2t: "Extra benefits: state exactly what is included",
    c2b: "Beyond medical cover, I check which value-added services eligible employees can actually use and explain how to access them. For example, MindAid provides text-based mental-wellness support for eligible insured members, subject to set hours and availability — a non-guaranteed service, not unlimited psychotherapy.",
    c3t: "Employee voluntary cover: kept separate from company cost",
    c3b: "Eligible employees can separately look at employee-paid protection such as StepUp 2. Joining is their choice and it is never mixed into the employer's group premium.",
    offerTitle: "Offer details",
    dTitle: "Not just a policy — someone who gets your team using it.",
    dStages: [
      ["Before applying", "One document checklist, coverage comparison, proposed timetable"],
      ["During application", "Completeness check, submission coordination, chasing outstanding items"],
      ["Before commencement", "Confirm approved cover, effective dates, transition issues"],
      ["Employee launch", "Intro session, app guidance, a one-page claims guide"],
      ["Ongoing", "A named contact for admin questions and claims follow-up"],
      ["Before renewal", "A scheduled review of budget, headcount and benefits"],
    ],
    dCopy: "HR shouldn't have to work out the paperwork alone. I list what's needed, who does which step, and explain cover and claims to staff. Underwriting and claims decisions rest with the insurer under the policy terms.",
    eTitle: "You're dealing with someone whose identity you can check.",
    eName: "Name",
    eTitleLabel: "Title",
    eLicence: "Insurance intermediary licence",
    eRegister: "Verify on the Insurance Authority register",
    eOffice: "Meet in person",
    eOfficeNote: "Video calls are fine too.",
    eContact: "Contact",
    fTitle: "A real example",
    tTitle: "What clients say",
    tPlaceholder: "Placeholder — not a real testimonial",
    gTitle: "A few basics, and I'll start the comparison.",
    gNote: "I'll reply the way you choose, confirm what the company needs and what the quote requires. This step is not an application for cover.",
    disclaimer:
      "This page is provided by an AIA insurance agent. It is not an AIA website and does not represent AIA underwriting or endorsement of its content. AIA is the insurer; cover, premiums, underwriting and claims are decided by AIA under the policy terms. Comparisons shown are illustrative, not a quotation or an offer. Any offer is subject to terms, eligibility and expiry.",
    sourceNote: "Product information: AIA Hong Kong. Licence details can be checked on the Insurance Authority register.",
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

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      {/* A — offer, outcome, action */}
      <section className="mx-auto grid w-full max-w-6xl items-start gap-10 px-4 pb-7 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:pt-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold">{t.kicker}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight sm:text-[2.6rem]">{t.h1}</h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/75 sm:text-[15px]">{t.lead}</p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a href="#quote" className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3.5 text-sm font-bold text-brand-black transition hover:bg-brand-gold-deep">
              {t.cta}
            </a>
          </div>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-foreground/55">{t.reassure}</p>

          <p className="mt-6 inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/[0.07] px-4 py-2 text-xs font-semibold text-foreground/80">
            {t.strip}
          </p>
        </div>

        <aside className="rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-5">
          <div className="flex items-start gap-4">
            {a.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photo} alt={a.name} className="h-20 w-20 flex-none rounded-2xl object-cover object-top ring-1 ring-foreground/10" />
            ) : (
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-brand-gold/15 text-base font-bold text-brand-gold">
                {a.name.split(" ").map((w) => w[0]).join("")}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{a.name}</p>
              <p className="text-xs text-foreground/65">{isZh ? a.titleZh : a.titleEn}</p>
              {a.licence ? <p className="mt-1 text-[11px] text-foreground/55">{a.licence}</p> : null}
              <p className="mt-2 text-[11px] text-foreground/55">
                <a href="https://iir.ia.org.hk/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  {t.eRegister}
                </a>
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1 border-t border-foreground/10 pt-3 text-[11px] text-foreground/60">
            <p className="break-all">{a.email}</p>
            {a.phone ? <p>{a.phone}</p> : null}
            {a.office ? <p className="mt-2">{t.eOffice}：{a.office}</p> : null}
          </div>
        </aside>
      </section>

      {/* B — the comparison you get */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">{t.bTitle}</h2>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40">Comparison sheet</p>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600">{t.sampleLabel}</span>
              </div>
              <dl className="mt-4 divide-y divide-foreground/10">
                {t.bRows.map(([left, right]) => (
                  <div key={left} className="grid grid-cols-2 gap-3 py-2.5 text-xs">
                    <dt className="text-foreground/60">{left}</dt>
                    <dd className="text-right font-medium text-foreground/85">{right}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex items-center">
              <p className="text-sm leading-relaxed text-foreground/70">{t.bCopy}</p>
            </div>
          </div>
        </div>
      </section>

      {/* C — financial value, in three parts */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">{t.cTitle}</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {[[t.c1t, t.c1b], [t.c2t, t.c2b], [t.c3t, t.c3b]].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-foreground/10 bg-background p-5">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-foreground/65">{body}</p>
              </div>
            ))}
          </div>

          {OFFER ? (
            <div className="mt-6 rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">{t.offerTitle}</p>
              <p className="mt-2 text-sm font-semibold">{isZh ? OFFER.nameZh : OFFER.nameEn}</p>
              <dl className="mt-3 grid gap-1.5 text-[11.5px] text-foreground/70 sm:grid-cols-2">
                <div><dt className="inline font-semibold">{isZh ? "適用對象：" : "Who: "}</dt><dd className="inline">{isZh ? OFFER.whoZh : OFFER.whoEn}</dd></div>
                <div><dt className="inline font-semibold">{isZh ? "優惠內容：" : "What: "}</dt><dd className="inline">{isZh ? OFFER.whatZh : OFFER.whatEn}</dd></div>
                <div><dt className="inline font-semibold">{isZh ? "適用產品及保費部分：" : "Applies to: "}</dt><dd className="inline">{isZh ? OFFER.scopeZh : OFFER.scopeEn}</dd></div>
                <div><dt className="inline font-semibold">{isZh ? "期限及條件：" : "Deadline: "}</dt><dd className="inline">{isZh ? OFFER.deadlineZh : OFFER.deadlineEn}</dd></div>
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      {/* D — onboarding service */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.dTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/70">{t.dCopy}</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-foreground/10">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-foreground/10">
                {t.dStages.map(([stage, what]) => (
                  <tr key={stage}>
                    <th className="w-32 bg-foreground/[0.03] px-4 py-3 align-top font-semibold">{stage}</th>
                    <td className="px-4 py-3 text-foreground/70">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* E — verifiable identity */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">{t.eTitle}</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-foreground/10 p-4">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">{t.eName}</dt>
              <dd className="mt-1 text-sm font-semibold">{a.name}</dd>
            </div>
            <div className="rounded-xl border border-foreground/10 p-4">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">{t.eTitleLabel}</dt>
              <dd className="mt-1 text-sm font-semibold">{isZh ? a.titleZh : a.titleEn}</dd>
            </div>
            {a.licence ? (
              <div className="rounded-xl border border-foreground/10 p-4">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">{t.eLicence}</dt>
                <dd className="mt-1 text-sm font-semibold">{a.licence}</dd>
              </div>
            ) : null}
            <div className="rounded-xl border border-foreground/10 p-4">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">{t.eContact}</dt>
              <dd className="mt-1 text-sm font-semibold break-all">{a.email}</dd>
              {a.phone ? <dd className="text-xs text-foreground/60">{a.phone}</dd> : null}
            </div>
          </dl>
          {a.office ? (
            <p className="mt-4 text-xs text-foreground/60">
              {t.eOffice}：{a.office} · {t.eOfficeNote}
            </p>
          ) : null}
        </div>
      </section>

      {/* F — real case, only when supplied */}
      {a.caseStudy ? (
        <section className="border-t border-foreground/10">
          <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.fTitle}</h2>
            <div className="mt-5 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 text-sm">
              <p className="font-semibold">
                {isZh ? a.caseStudy.industryZh : a.caseStudy.industryEn} · {a.caseStudy.headcount} · {a.caseStudy.comparedOn}
              </p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div><dt className="text-[11px] text-foreground/50">{isZh ? "原有續保報價" : "Previous renewal"}</dt><dd className="font-semibold tabular-nums">{a.caseStudy.before}</dd></div>
                <div><dt className="text-[11px] text-foreground/50">{isZh ? "最終採用方案" : "Adopted option"}</dt><dd className="font-semibold tabular-nums">{a.caseStudy.after}</dd></div>
                <div><dt className="text-[11px] text-foreground/50">{isZh ? "年度保費差額" : "Annual difference"}</dt><dd className="font-semibold tabular-nums">{a.caseStudy.diff}</dd></div>
                <div><dt className="text-[11px] text-foreground/50">{isZh ? "優惠是否只限首年" : "First-year only?"}</dt><dd className="font-semibold">{a.caseStudy.firstYearOnly}</dd></div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-foreground/65">
                {isZh ? a.caseStudy.coverageZh : a.caseStudy.coverageEn}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Testimonials — layout ready; placeholders are labelled as such */}
      {TESTIMONIALS.length ? (
        <section className="border-t border-foreground/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.tTitle}</h2>
              {TESTIMONIALS.some((x) => !x.real) ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600">{t.tPlaceholder}</span>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((x, i) => (
                <figure key={i} className={`rounded-2xl border p-5 ${x.real ? "border-foreground/10 bg-foreground/[0.02]" : "border-dashed border-amber-500/40 bg-amber-500/[0.04]"}`}>
                  <blockquote className="text-sm leading-relaxed text-foreground/75">“{isZh ? x.quoteZh : x.quoteEn}”</blockquote>
                  <figcaption className="mt-3 text-[11px] text-foreground/50">{isZh ? x.whoZh : x.whoEn}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* G — enquiry form */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.gTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t.gNote}</p>
            <p className="mt-6 text-xs leading-relaxed text-foreground/50">{t.sourceNote}</p>
          </div>
          <div id="quote" className="scroll-mt-24">
            <GroupMedicalForm locale={locale} />
          </div>
        </div>
      </section>

      {/* Partners and supporting organisations — always shown */}
      <section className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
          <figure className="overflow-hidden rounded-2xl border border-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/event/strategy-collaboration.png"
              alt={isZh ? "與合作機構進行方案討論" : "Working through options with partner organisations"}
              className="h-48 w-full object-cover sm:h-64"
              loading="lazy"
            />
            <figcaption className="bg-foreground/[0.02] px-4 py-3 text-[11px] leading-relaxed text-foreground/55">
              {isZh
                ? "與銀行、專業事務所及社區場地合辦簡報與工作坊——圖為方案討論現場。"
                : "Briefings and workshops with banks, professional firms and community venues — shown here mid-discussion."}
            </figcaption>
          </figure>
        </div>
      </section>
      <CommunityPartnersSection />

      <footer className="border-t border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <p className="max-w-3xl text-[13px] leading-relaxed text-foreground/60">{t.disclaimer}</p>
          <p className="mt-4 text-xs text-foreground/45">
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">Profit Pulse Ally</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
