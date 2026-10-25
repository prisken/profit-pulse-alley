"use client";

// Registration for one PPA Webinar Series 2026 session.
// Posts to /api/events/register, which forwards the registrant to the same CRM
// pipeline used by member signup. The event slug is the source of truth.

import { useState } from "react";
import type { FormEvent } from "react";
import type { SiteLocale } from "@/lib/i18n/locales";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const copy = {
  en: {
    title: "Register for this session",
    subtitle:
      "Enter your details and we’ll send the join link before the session. Registration is free.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    phone: "Phone (optional)",
    phonePlaceholder: "+852 …",
    company: "Company (optional)",
    companyPlaceholder: "Company or organisation",
    submit: "Confirm registration",
    sending: "Registering…",
    success: "You’re registered. We’ll email the join link before the session.",
    error: "Something went wrong. Please try again, or email us directly.",
    privacy: "We use your details only to manage this webinar registration.",
    needEmail: "Please enter a valid email address.",
  },
  "zh-Hant": {
    title: "報名參加本場研討會",
    subtitle: "填寫資料後，我們會於活動前發送觀看連結。報名費用全免。",
    name: "姓名",
    namePlaceholder: "你的姓名",
    email: "電郵",
    emailPlaceholder: "you@example.com",
    phone: "電話（可選）",
    phonePlaceholder: "+852 …",
    company: "公司（可選）",
    companyPlaceholder: "公司或機構名稱",
    submit: "確認報名",
    sending: "報名中…",
    success: "報名成功。我們會於活動前以電郵發送觀看連結。",
    error: "提交失敗，請再試一次，或直接電郵聯絡我們。",
    privacy: "你的資料只會用於處理本次研討會報名。",
    needEmail: "請輸入有效的電郵地址。",
  },
} as const;

export default function WebinarRegistrationSection({
  slug,
  title,
  locale,
  downloadHref,
  downloadLabel,
}: {
  slug: string;
  title: string;
  locale: SiteLocale;
  downloadHref?: string;
  downloadLabel?: string;
}) {
  const t = copy[locale === "zh-Hant" ? "zh-Hant" : "en"];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const inputClass = `mt-1 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/40 focus:outline-none ${focusRing}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.needEmail);
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          locale,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setState("done");
    } catch {
      setState("error");
      setError(t.error);
    }
  }

  return (
    <section
      id="register"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-3 pb-16 sm:px-6 sm:pb-20"
      aria-labelledby="webinar-register-heading"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 sm:p-6">
        <h2
          id="webinar-register-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {t.title}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-foreground/70 sm:text-sm">
          {t.subtitle}
        </p>

        {state === "done" ? (
          <div>
            <p
              role="status"
              className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
            >
              {t.success}
            </p>
            {downloadHref && downloadLabel ? (
              <a
                href={downloadHref}
                download
                className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-gold-deep"
              >
                {downloadLabel}
              </a>
            ) : null}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/60">
                {t.name}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className={inputClass}
                autoComplete="name"
                required
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/60">
                {t.email}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className={inputClass}
                autoComplete="email"
                required
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/60">
                {t.phone}
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className={inputClass}
                autoComplete="tel"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-foreground/60">
                {t.company}
              </span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t.companyPlaceholder}
                className={inputClass}
                autoComplete="organization"
              />
            </label>

            {error ? (
              <p role="alert" className="text-xs text-pink-600 dark:text-pink-300 sm:col-span-2">
                {error}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={state === "sending"}
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${focusRing}`}
              >
                {state === "sending" ? t.sending : t.submit}
              </button>
            </div>
          </form>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-foreground/45">
          {t.privacy}
        </p>
      </div>
    </section>
  );
}
