"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { SiteLocale } from "@/lib/i18n/locales";

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

const copy = {
  en: {
    title: "Four fields. Your quote lands by tomorrow.",
    note: "No call unless you ask for one.",
    name: "Your name",
    email: "Work email",
    phone: "WhatsApp number",
    contact: "Preferred contact",
    contactEmail: "Email",
    contactWhatsApp: "WhatsApp",
    companySize: "Team size",
    sizePlaceholder: "How many people?",
    submit: "Send me the one-page quote",
    sending: "Sending…",
    successTitle: "On its way.",
    successBody:
      "We’ll email a one-page quote within one working day — plans, premiums and the gaps worth knowing about. If you’d rather talk first, just reply to that email.",
    needName: "Please tell us your name.",
    needEmail: "Please use a valid work email.",
    needPhone: "Add a WhatsApp number, or switch to email.",
    needSize: "Pick your team size.",
    error: "That didn’t send. Please try again, or email hello@profitpulseally.com.",
    nextLabel: "What happens next",
    steps: [
      "You send this form",
      "We may email one clarifying question",
      "A one-page quote within 1 working day",
      "You decide — no follow-up pressure",
    ],
    privacy: "We only contact you about this enquiry. No mailing list.",
  },
  "zh-Hant": {
    title: "填四個欄位，明日收到報價。",
    note: "除非你要求，否則不會致電。",
    name: "你的名字",
    email: "工作電郵",
    phone: "WhatsApp 號碼",
    contact: "聯絡偏好",
    contactEmail: "電郵",
    contactWhatsApp: "WhatsApp",
    companySize: "團隊人數",
    sizePlaceholder: "公司有幾多人？",
    submit: "發送一頁報價給我",
    sending: "發送中…",
    successTitle: "已送出。",
    successBody:
      "我們會於一個工作天內以電郵發送一頁報價：計劃、保費，以及值得知道的保障缺口。如想先傾談，直接回覆該電郵即可。",
    needName: "請填寫你的名字。",
    needEmail: "請使用有效的工作電郵。",
    needPhone: "請填寫 WhatsApp 號碼，或改為電郵聯絡。",
    needSize: "請選擇團隊人數。",
    error: "發送失敗，請再試一次，或電郵 hello@profitpulseally.com。",
    nextLabel: "之後會發生什麼",
    steps: [
      "你提交此表格",
      "我們可能電郵一個澄清問題",
      "一個工作天內收到一頁報價",
      "由你決定——不會追問施壓",
    ],
    privacy: "我們只會就這次查詢聯絡你，不會加入群發名單。",
  },
} as const;

const field =
  "mt-1.5 w-full min-w-0 rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-foreground/35 focus:border-brand-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/25";
const label = "block text-[11px] uppercase tracking-[0.14em] text-foreground/50";

export default function GroupMedicalForm({ locale }: { locale: SiteLocale }) {
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState<"email" | "whatsapp">("email");
  const [companySize, setCompanySize] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError(t.needName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t.needEmail);
    if (contact === "whatsapp" && phone.replace(/\D/g, "").length < 6) return setError(t.needPhone);
    if (!companySize) return setError(t.needSize);

    setState("sending");
    try {
      const res = await fetch("/api/group-medical/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: contact === "whatsapp" ? phone : "",
          companySize,
          locale,
          preferredContact: contact,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("form");
      setError(t.error);
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-6 sm:p-8">
        <p className="text-2xl">✉️</p>
        <h3 className="mt-2 text-xl font-semibold">{t.successTitle}</h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-5 sm:p-7">
      <h3 className="text-xl font-semibold leading-snug">{t.title}</h3>
      <p className="mt-1 text-xs text-foreground/60">{t.note}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>{t.name}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>{t.email}</span>
          <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" />
        </label>

        <div className="block sm:col-span-2">
          <span className={label}>{t.contact}</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["email", "whatsapp"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContact(c)}
                aria-pressed={contact === c}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  contact === c
                    ? "border-brand-gold bg-brand-gold/10 text-foreground"
                    : "border-foreground/15 bg-background text-foreground/60 hover:border-foreground/30"
                }`}
              >
                {c === "email" ? t.contactEmail : t.contactWhatsApp}
              </button>
            ))}
          </div>
        </div>

        {contact === "whatsapp" ? (
          <label className="block sm:col-span-2">
            <span className={label}>{t.phone}</span>
            <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+852 …" />
          </label>
        ) : null}

        <label className="block sm:col-span-2">
          <span className={label}>{t.companySize}</span>
          <select className={field} value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
            <option value="">{t.sizePlaceholder}</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="mt-4 text-xs text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gold px-6 py-4 text-sm font-bold text-brand-black transition hover:bg-brand-gold-deep disabled:opacity-60"
      >
        {state === "sending" ? t.sending : t.submit}
      </button>

      <div className="mt-5 rounded-xl border border-foreground/10 bg-background/60 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/40">{t.nextLabel}</p>
        <ol className="mt-2 space-y-1.5">
          {t.steps.map((step, i) => (
            <li key={step} className="flex gap-2 text-[11.5px] leading-snug text-foreground/65">
              <span className="font-semibold text-brand-gold tabular-nums">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-3 text-center text-[11px] text-foreground/50">{t.privacy}</p>
    </form>
  );
}
