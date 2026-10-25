"use client";

// W4 — Tax-Smart Retirement Health & Income: seat details, then the
// eight-question retirement follow-up.

import { useState } from "react";
import type { FormEvent } from "react";
import type { SiteLocale } from "@/lib/i18n/locales";

type Step = "form" | "questions" | "done";

const copy = {
  en: {
    first: "First name", last: "Last name", email: "Email", phone: "WhatsApp / mobile",
    submit: "Reserve my seat", sending: "Reserving…",
    consent: "I agree to receive event reminders and educational updates from Profit Pulse Ally. I can withdraw consent at any time, and every message includes an opt-out.",
    needName: "Please enter your first and last name.",
    needEmail: "Please enter a valid email address.",
    needConsent: "Please tick the consent box so we can send the join link.",
    error: "Something went wrong. Please try again, or email us directly.",
    qTitle: "Eight quick questions — so the session fits your retirement",
    qIntro: "These shape the scenarios we run on the day. Confidential, and you can skip and answer by reply later.",
    fields: {
      ageBand: "Age band", retirementAge: "Target retirement age", vhis: "Do you have VHIS?",
      tvc: "Do you contribute to TVC?", qdap: "Do you have QDAP?",
      concern: "Biggest concern", checklist: "Would you like the checklist?", xray: "Interested in a one-on-one Retirement Pulse X-Ray?",
    },
    opts: {
      ageBand: ["30–39", "40–49", "50–59", "60+"],
      retirementAge: ["Before 55", "55–59", "60–64", "65+", "Not sure"],
      yesNoNotSure: ["Yes", "No", "Not sure"],
      concern: ["Tax", "Medical cost", "Inflation", "Retirement income", "Parents", "Early retirement", "Not sure"],
      yesNo: ["Yes", "No"],
      xray: ["Yes", "No", "Maybe"],
    },
    send: "Send answers", sendingAnswers: "Sending…", skip: "Skip for now",
    doneTitle: "You’re registered.",
    doneBody: "We’ll send the join link and the Retirement Stress-Test Sheet before the session — WhatsApp where we have a number, email otherwise.",
    doneNote: "Saturday, 28 November 2026 · Cantonese 10:30 · English 12:00 (HKT)",
  },
  "zh-Hant": {
    first: "名字", last: "姓氏", email: "電郵", phone: "WhatsApp／手機",
    submit: "預留座位", sending: "提交中…",
    consent: "我同意接收 Profit Pulse Ally 的活動提醒及教育資訊。我可隨時撤回同意，每則訊息均附取消訂閱方法。",
    needName: "請輸入名字及姓氏。",
    needEmail: "請輸入有效的電郵地址。",
    needConsent: "請勾選同意，我們才能發送觀看連結給你。",
    error: "提交失敗，請再試一次，或直接電郵聯絡我們。",
    qTitle: "八條簡短問題，讓內容更貼合你的退休規劃",
    qIntro: "用來設計當日情景，資料絕對保密。你亦可跳過，稍後回覆補上。",
    fields: {
      ageBand: "年齡組別", retirementAge: "目標退休年齡", vhis: "現有 VHIS？",
      tvc: "現有供 TVC？", qdap: "現有 QDAP？",
      concern: "最大關注", checklist: "是否需要檢查清單？", xray: "是否想一對一「退休脈搏 X 光對話」？",
    },
    opts: {
      ageBand: ["30–39", "40–49", "50–59", "60+"],
      retirementAge: ["55 歲前", "55–59", "60–64", "65+", "不確定"],
      yesNoNotSure: ["有", "沒有", "不確定"],
      concern: ["稅務", "醫療費用", "通脹", "退休收入", "父母", "提早退休", "不確定"],
      yesNo: ["需要", "不需要"],
      xray: ["想", "不想", "可能"],
    },
    send: "提交答案", sendingAnswers: "提交中…", skip: "暫時跳過",
    doneTitle: "報名成功。",
    doneBody: "我們會於活動前發送觀看連結及《退休壓力測試表》。有 WhatsApp 號碼者以 WhatsApp 發送，其餘以電郵發送。",
    doneNote: "2026 年 11 月 28 日（星期六）· 廣東話 10:30 · 英語 12:00（HKT）",
  },
} as const;

const input = "mt-1.5 w-full min-w-0 rounded-xl border border-foreground/15 bg-foreground/[0.03] px-4 py-3.5 text-sm text-foreground placeholder:text-foreground/35 focus:border-brand-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/25";
const lbl = "block min-w-0 text-[11px] uppercase tracking-[0.14em] text-foreground/50";

export default function W4RetirementRegistration({
  slug,
  locale,
  downloadHref,
  downloadLabel,
}: {
  slug: string;
  locale: SiteLocale;
  downloadHref?: string;
  downloadLabel?: string;
}) {
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  const [step, setStep] = useState<Step>("form");
  const [first, setFirst] = useState(""); const [last, setLast] = useState("");
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false); const [error, setError] = useState("");

  const set = (k: string) => (e: { target: { value: string } }) =>
    setAnswers((a) => ({ ...a, [k]: e.target.value }));

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/events/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, locale, ...payload }),
    });
    if (!res.ok) throw new Error("request failed");
  }

  async function register(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!first.trim() || !last.trim()) return setError(t.needName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t.needEmail);
    if (!consent) return setError(t.needConsent);
    setSending(true);
    try {
      await post({ name: `${first.trim()} ${last.trim()}`, email: email.trim(), phone: phone.trim(), answers: { step: "registered" } });
      setStep("questions");
    } catch { setError(t.error); } finally { setSending(false); }
  }

  async function send(e: FormEvent) {
    e.preventDefault(); setSending(true); setError("");
    try {
      await post({ name: `${first.trim()} ${last.trim()}`, email: email.trim(), phone: phone.trim(), answers });
      setStep("done");
    } catch { setError(t.error); } finally { setSending(false); }
  }

  if (step === "done") return (
    <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-6 sm:p-8">
      <h3 className="text-xl font-semibold">{t.doneTitle}</h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t.doneBody}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-brand-gold">{t.doneNote}</p>
            {downloadHref && downloadLabel ? (
          <a
            href={downloadHref}
            download
            className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep"
          >
            {downloadLabel}
          </a>
        ) : null}
</div>
  );

  if (step === "questions") {
    const selects: Array<[string, string, readonly string[]]> = [
      ["ageBand", t.fields.ageBand, t.opts.ageBand],
      ["retirementAge", t.fields.retirementAge, t.opts.retirementAge],
      ["vhis", t.fields.vhis, t.opts.yesNoNotSure],
      ["tvc", t.fields.tvc, t.opts.yesNoNotSure],
      ["qdap", t.fields.qdap, t.opts.yesNoNotSure],
      ["concern", t.fields.concern, t.opts.concern],
      ["checklist", t.fields.checklist, t.opts.yesNo],
      ["xray", t.fields.xray, t.opts.xray],
    ];
    return (
      <form onSubmit={send} className="rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-5 sm:p-7">
        <h3 className="text-lg font-semibold">{t.qTitle}</h3>
        <p className="mt-2 text-xs leading-relaxed text-foreground/60">{t.qIntro}</p>

        {downloadHref && downloadLabel ? (
          <a
            href={downloadHref}
            download
            className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep"
          >
            {downloadLabel}
          </a>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {selects.map(([k, label, opts]) => (
            <label key={k} className="block">
              <span className={lbl}>{label}</span>
              <select className={input} value={answers[k] ?? ""} onChange={set(k)}>
                <option value="">—</option>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
        {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={sending}
            className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep disabled:opacity-60">
            {sending ? t.sendingAnswers : t.send}
          </button>
          <button type="button" onClick={() => setStep("done")}
            className="text-xs text-foreground/50 underline underline-offset-4 hover:text-foreground/80">{t.skip}</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={register} className="rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={lbl}>{t.first}</span>
          <input className={input} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" /></label>
        <label className="block"><span className={lbl}>{t.last}</span>
          <input className={input} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" /></label>
        <label className="block"><span className={lbl}>{t.email}</span>
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
        <label className="block"><span className={lbl}>{t.phone}</span>
          <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+852 …" /></label>
      </div>
      <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-foreground/60">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none rounded border-foreground/30 bg-transparent accent-brand-gold" />
        <span>{t.consent}</span>
      </label>
      {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : null}
      <button type="submit" disabled={sending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gold px-6 py-3.5 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep disabled:opacity-60 sm:w-auto">
        {sending ? t.sending : t.submit}
      </button>
    </form>
  );
}
