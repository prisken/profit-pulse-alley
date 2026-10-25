"use client";

// W1 — The Founder Protection Stack.
// Two-step registration: seat details first, then the short qualification
// questionnaire the follow-up is built from. Both steps post to the same
// endpoint; the second call carries `answers`.

import { useState } from "react";
import type { FormEvent } from "react";
import type { SiteLocale } from "@/lib/i18n/locales";

type Step = "form" | "questions" | "done";

const copy = {
  en: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "WhatsApp / mobile",
    phoneHint: "+852 …",
    submit: "Reserve my seat",
    sending: "Reserving…",
    consent:
      "I agree to receive event reminders and future educational materials from Profit Pulse Ally. I can opt out at any time.",
    needEmail: "Please enter a valid email address.",
    needName: "Please enter your first and last name.",
    needConsent: "Please tick the consent box so we can send you the join link.",
    error: "Something went wrong. Please try again, or email us directly.",
    questionsTitle: "One more thing — so the session fits you",
    questionsIntro:
      "Six quick questions. They shape the examples we use on the day, and they stay confidential.",
    company: "Company name",
    role: "Your role",
    shareholders: "Number of shareholders",
    agreement: "Do you have a shareholder agreement?",
    cover: "Do you have company-owned keyman or life cover?",
    concern: "Biggest concern",
    shareOptions: ["1", "2", "3+", "Not sure"],
    yesNo: ["Yes", "No", "Not sure"],
    concerns: [
      "Company cashflow",
      "Shareholder buyout",
      "Family protection",
      "Tax treatment",
      "Not sure",
    ],
    finish: "Send answers",
    finishing: "Sending…",
    skip: "Skip for now",
    doneTitle: "You’re registered.",
    doneBody:
      "We’ll send the join link before the session, plus the Founder Continuity Checklist. If you skipped the questions, you can still reply to that email with the answers.",
    doneNote: "Add the date to your calendar: Saturday, 7 November 2026.",
  },
  "zh-Hant": {
    firstName: "名字",
    lastName: "姓氏",
    email: "電郵",
    phone: "WhatsApp／手機",
    phoneHint: "+852 …",
    submit: "預留座位",
    sending: "提交中…",
    consent:
      "我同意接收 Profit Pulse Ally 的活動提醒及日後教育資訊，並可隨時取消訂閱。",
    needEmail: "請輸入有效的電郵地址。",
    needName: "請輸入名字及姓氏。",
    needConsent: "請勾選同意，我們才能發送觀看連結給你。",
    error: "提交失敗，請再試一次，或直接電郵聯絡我們。",
    questionsTitle: "最後一步——讓當日內容更貼合你",
    questionsIntro: "六條簡短問題，用來設計當日例子，資料絕對保密。",
    company: "公司名稱",
    role: "你的職位",
    shareholders: "股東人數",
    agreement: "是否有股東協議？",
    cover: "是否有公司持有的要員或人壽保障？",
    concern: "最大關注",
    shareOptions: ["1", "2", "3+", "不確定"],
    yesNo: ["有", "沒有", "不確定"],
    concerns: ["公司現金流", "股東收購", "家庭保障", "稅務處理", "不確定"],
    finish: "提交答案",
    finishing: "提交中…",
    skip: "暫時跳過",
    doneTitle: "報名成功。",
    doneBody:
      "我們會於活動前發送觀看連結及《創辦人延續檢查清單》。若你跳過了問卷，亦可直接回覆該電郵補上答案。",
    doneNote: "請記下日期：2026 年 11 月 7 日（星期六）。",
  },
} as const;

const field =
  "mt-1.5 w-full min-w-0 rounded-xl border border-foreground/15 bg-foreground/[0.03] px-4 py-3.5 text-sm text-foreground placeholder:text-foreground/35 focus:border-brand-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/25";

const label = "block text-[11px] uppercase tracking-[0.14em] text-foreground/50";

export default function W1FounderRegistration({
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
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [shareholders, setShareholders] = useState("");
  const [agreement, setAgreement] = useState("");
  const [cover, setCover] = useState("");
  const [concern, setConcern] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/events/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, locale, ...payload }),
    });
    if (!res.ok) throw new Error("request failed");
  }

  async function register(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!first.trim() || !last.trim()) return setError(t.needName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t.needEmail);
    if (!consent) return setError(t.needConsent);

    setSending(true);
    try {
      await post({
        name: `${first.trim()} ${last.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        company: "",
        answers: { step: "registered" },
      });
      setStep("questions");
    } catch {
      setError(t.error);
    } finally {
      setSending(false);
    }
  }

  async function sendAnswers(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await post({
        name: `${first.trim()} ${last.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        answers: { company, role, shareholders, agreement, cover, concern },
      });
      setStep("done");
    } catch {
      setError(t.error);
    } finally {
      setSending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-foreground">{t.doneTitle}</h3>
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
  }

  if (step === "questions") {
    return (
      <form onSubmit={sendAnswers} className="rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-foreground">{t.questionsTitle}</h3>
        <p className="mt-2 text-xs leading-relaxed text-foreground/60">{t.questionsIntro}</p>

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
          <label className="block min-w-0">
            <span className={label}>{t.company}</span>
            <input className={field} value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label className="block min-w-0">
            <span className={label}>{t.role}</span>
            <input className={field} value={role} onChange={(e) => setRole(e.target.value)} />
          </label>

          <label className="block min-w-0">
            <span className={label}>{t.shareholders}</span>
            <select className={field} value={shareholders} onChange={(e) => setShareholders(e.target.value)}>
              <option value="">—</option>
              {t.shareOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className={label}>{t.agreement}</span>
            <select className={field} value={agreement} onChange={(e) => setAgreement(e.target.value)}>
              <option value="">—</option>
              {t.yesNo.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className={label}>{t.cover}</span>
            <select className={field} value={cover} onChange={(e) => setCover(e.target.value)}>
              <option value="">—</option>
              {t.yesNo.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className={label}>{t.concern}</span>
            <select className={field} value={concern} onChange={(e) => setConcern(e.target.value)}>
              <option value="">—</option>
              {t.concerns.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep disabled:opacity-60"
          >
            {sending ? t.finishing : t.finish}
          </button>
          <button
            type="button"
            onClick={() => setStep("done")}
            className="text-xs text-foreground/50 underline underline-offset-4 hover:text-foreground/80"
          >
            {t.skip}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={register} className="rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className={label}>{t.firstName}</span>
          <input className={field} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" />
        </label>
        <label className="block min-w-0">
          <span className={label}>{t.lastName}</span>
          <input className={field} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
        </label>
        <label className="block min-w-0">
          <span className={label}>{t.email}</span>
          <input
            className={field}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="block min-w-0">
          <span className={label}>{t.phone}</span>
          <input
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder={t.phoneHint}
          />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-foreground/60">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none rounded border-foreground/30 bg-transparent accent-brand-gold"
        />
        <span>{t.consent}</span>
      </label>

      {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gold px-6 py-3.5 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep disabled:opacity-60 sm:w-auto"
      >
        {sending ? t.sending : t.submit}
      </button>
    </form>
  );
}
