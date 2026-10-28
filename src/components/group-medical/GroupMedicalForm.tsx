"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { SiteLocale } from "@/lib/i18n/locales";

const SIZES = ["1-2", "3-10", "11-50", "51-200", "201-500", "500+"] as const;
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTHS_ZH = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] as const;

const copy = {
  en: {
    title: "Get the one-page comparison",
    note: "For Hong Kong companies. Four fields. I'll reply with the quote pack — not an application.",
    name: "Your name *",
    role: "Role",
    company: "Company name *",
    companySize: "Employee count *",
    renewalMonth: "Renewal month",
    email: "Work email *",
    phone: "WhatsApp number",
    contact: "Preferred contact *",
    contactEmail: "Email",
    contactWhatsApp: "WhatsApp",
    existing: "Current annual premium (optional)",
    existingHint: "A rough figure is fine — it makes the comparison concrete.",
    sizePlaceholder: "How many staff?",
    monthPlaceholder: "When does it renew?",
    submit: "Send me the comparison",
    sending: "Sending…",
    successTitle: "Got it.",
    successBody:
      "I'll reply the way you chose. A one-page comparison follows once I have the details. This step is not an application for cover.",
    needName: "Please add your name.",
    needCompany: "Please add the company name.",
    needEmail: "Please use a valid work email.",
    needPhone: "Add a WhatsApp number, or switch to email.",
    needSize: "Pick the employee count.",
    needContact: "Choose how you'd like to be contacted.",
    error: "That didn't send. Please try again, or email hello@profitpulseally.com.",
    privacy: "Used for this enquiry only. No mailing list. No employee medical data here.",
  },
  "zh-Hant": {
    title: "索取一頁比較及報價",
    note: "香港公司用。四項就夠。我會回你報價包——不是投保申請。",
    name: "你的名字 *",
    role: "職位",
    company: "公司名稱 *",
    companySize: "員工人數 *",
    renewalMonth: "續保月份",
    email: "工作電郵 *",
    phone: "WhatsApp 號碼",
    contact: "聯絡偏好 *",
    contactEmail: "電郵",
    contactWhatsApp: "WhatsApp",
    existing: "現時全年保費（可選）",
    existingHint: "大約數字就可以，有助做實際比較。",
    sizePlaceholder: "公司有幾多人？",
    monthPlaceholder: "幾時續保？",
    submit: "索取免費比較",
    sending: "發送中…",
    successTitle: "收到。",
    successBody:
      "我會按你揀嘅方式回覆。資料齊備後，會提供一頁比較。呢一步唔係投保申請。",
    needName: "請填寫你的名字。",
    needCompany: "請填寫公司名稱。",
    needEmail: "請使用有效的工作電郵。",
    needPhone: "請填寫 WhatsApp 號碼，或改為電郵聯絡。",
    needSize: "請選擇員工人數。",
    needContact: "請選擇聯絡方式。",
    error: "發送失敗，請再試一次，或電郵 hello@profitpulseally.com。",
    privacy: "只用於這次查詢，不會加入群發名單，亦不會在此收集員工醫療資料。",
  },
} as const;

const field =
  "mt-1.5 w-full min-w-0 rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 focus:border-brand-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/25";
const label = "block text-[11px] uppercase tracking-[0.14em] text-foreground/50";

export default function GroupMedicalForm({
  locale,
  compact = false,
}: {
  locale: SiteLocale;
  compact?: boolean;
}) {
  const isZh = locale === "zh-Hant";
  const t = copy[isZh ? "zh-Hant" : "en"];

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [renewalMonth, setRenewalMonth] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState<"email" | "whatsapp">("email");
  const [existing, setExisting] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError(t.needName);
    if (company.trim().length < 2) return setError(t.needCompany);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t.needEmail);
    if (contact === "whatsapp" && phone.replace(/\D/g, "").length < 6) return setError(t.needPhone);
    if (!companySize) return setError(t.needSize);

    setState("sending");
    try {
      const res = await fetch("/api/group-medical/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, role, company, companySize, renewalMonth,
          email, phone: contact === "whatsapp" ? phone : "",
          preferredContact: contact, existingPremium: existing, locale,
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
        <p className="text-2xl">✓</p>
        <h3 className="mt-2 text-xl font-semibold">{t.successTitle}</h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl border border-foreground/12 bg-foreground/[0.02] ${compact ? "p-4 sm:p-5" : "p-5 sm:p-7"}`}
    >
      <h3 className="text-lg font-semibold leading-snug sm:text-xl">{t.title}</h3>
      <p className="mt-1 text-xs text-foreground/60">{t.note}</p>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2" : "gap-4 sm:grid-cols-2"}`}>
        <label className="block">
          <span className={label}>{t.name}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="block">
          <span className={label}>{t.role}</span>
          <input className={field} value={role} onChange={(e) => setRole(e.target.value)} autoComplete="organization-title" placeholder={isZh ? "例如：HR 主管" : "e.g. HR lead"} />
        </label>

        <label className="block sm:col-span-2">
          <span className={label}>{t.company}</span>
          <input className={field} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
        </label>

        <label className="block">
          <span className={label}>{t.companySize}</span>
          <select className={field} value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
            <option value="">{t.sizePlaceholder}</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="block">
          <span className={label}>{t.renewalMonth}</span>
          <select className={field} value={renewalMonth} onChange={(e) => setRenewalMonth(e.target.value)}>
            <option value="">{t.monthPlaceholder}</option>
            {(isZh ? MONTHS_ZH : MONTHS_EN).map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>
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

        {!compact ? (
          <label className="block sm:col-span-2">
            <span className={label}>{t.existing}</span>
            <input className={field} value={existing} onChange={(e) => setExisting(e.target.value)} placeholder={isZh ? "例如：HK$ 480,000 / 年" : "e.g. HK$480,000 / year"} inputMode="numeric" />
            <span className="mt-1 block text-[11px] text-foreground/45">{t.existingHint}</span>
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-xs text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-gold px-6 py-4 text-sm font-bold text-brand-black transition hover:bg-brand-gold-deep disabled:opacity-60"
      >
        {state === "sending" ? t.sending : t.submit}
      </button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-foreground/50">{t.privacy}</p>
    </form>
  );
}
