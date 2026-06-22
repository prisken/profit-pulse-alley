"use client";

import React, { useState } from "react";
import { Gift } from "lucide-react";

const GOOGLE_FORM_EMBED_HTML = `<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSccdr1mmGQghuBYcQ6gy9QYqCCOZG_zw_RuyStHgeOiWGv7ug/viewform?embedded=true" width="640" height="1789" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;

const content = {
  en: {
    title: "Fortify Your Future",
    subtitle: "A Fireside Chat on Business Defense & Investment.",
    hook_line1: "Trapped in the daily grind?",
    hook_line2:
      "When was the last time you stopped working *in* your business to work *on* it?",
    invitation:
      "Join us for an exclusive fireside chat designed to shift your mindset from operator to owner. We have now confirmed the event details. Secure your spot below.",
    event_details_heading: "Event Details",
    event_date_label: "Date:",
    event_date: "June 26th (Friday)",
    event_time_label: "Time:",
    event_time: "7:00 PM - 9:00 PM",
    event_venue_label: "Venue:",
    event_venue: "WeWork YF Life Tower",
    registration_title: "Register Now",
    registration_subtitle:
      "Fill out the form below to confirm your attendance. Seats are limited.",
    bonus_heading: "Bonus",
    bonus_text:
      "All attendees will receive a free professional headshot at the event. Plus, there might be hot dogs!",
    footer: "© 2026 ProfitPulseAlly. All Rights Reserved.",
  },
  zh: {
    title: "守業・增值・創未來",
    subtitle: "一場關於「商業防禦與投資」的圍爐對話。",
    hook_line1: "被日常工作困住？",
    hook_line2: "你上一次停下腳步，「規劃」你的業務，是在什麼時候？",
    invitation:
      "我們誠邀您參與這場專屬的爐邊對話，旨在將您的思維從「營運者」轉變為「擁有者」。活動詳情現已確定，請在下方預留您的席位。",
    event_details_heading: "活動詳情",
    event_date_label: "日期：",
    event_date: "6月26日 (星期五)",
    event_time_label: "時間：",
    event_time: "晚上 7:00 - 9:00",
    event_venue_label: "地點：",
    event_venue: "WeWork YF Life Tower",
    registration_title: "立即報名",
    registration_subtitle: "請填寫以下表格以確認出席。座位有限，請盡早報名。",
    bonus_heading: "額外禮遇",
    bonus_text: "所有出席者均可在活動中獲贈一張專業個人頭像照。另外，現場可能會有熱狗！",
    footer: "© 2026 ProfitPulseAlly. 版權所有。",
  },
};

type Lang = keyof typeof content;

function renderEmphasizedText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em
          key={index}
          className="font-medium text-amber-200/95 not-italic"
        >
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function FortifyYourFutureSurvey() {
  const [lang, setLang] = useState<Lang>("en");
  const t = content[lang];

  return (
    <main
      lang={lang === "en" ? "en" : "zh-Hant"}
      className="min-h-dvh bg-gray-950 text-gray-200"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="mb-6 flex w-full justify-end sm:mb-8">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="rounded-full border border-amber-400/40 bg-gray-900/80 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:border-amber-400/70 hover:bg-gray-800 hover:text-amber-300"
            aria-label={
              lang === "en" ? "Switch to Traditional Chinese" : "Switch to English"
            }
          >
            {lang === "en" ? "中文" : "English"}
          </button>
        </div>

        <header className="w-full text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>
          <p className="mt-3 text-pretty text-base text-gray-300 sm:mt-4 sm:text-lg">
            {t.subtitle}
          </p>
          <div
            className="mx-auto mt-6 flex items-center justify-center gap-3 sm:mt-8"
            aria-hidden="true"
          >
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/80 sm:w-24" />
            <span className="text-amber-400">♞</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/80 sm:w-24" />
          </div>
        </header>

        <section className="mt-10 w-full text-center sm:mt-12">
          <h2 className="text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-[1.65rem]">
            {t.hook_line1}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-gray-300 sm:text-lg">
            {renderEmphasizedText(t.hook_line2)}
          </p>
        </section>

        <section className="mt-10 w-full sm:mt-12">
          <p className="text-center text-pretty text-sm leading-relaxed text-gray-300 sm:text-base sm:leading-relaxed">
            {t.invitation}
          </p>
        </section>

        <section
          className="mt-8 w-full sm:mt-10"
          aria-labelledby="event-details-heading"
        >
          <div className="rounded-xl border border-amber-400/20 bg-gray-900/60 px-5 py-5 text-left sm:px-7 sm:py-6">
            <h2
              id="event-details-heading"
              className="text-center font-serif text-lg font-semibold text-amber-400 sm:text-xl"
            >
              {t.event_details_heading}
            </h2>
            <dl className="mx-auto mt-4 max-w-md space-y-2.5 text-sm text-gray-200 sm:text-base">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-white">{t.event_date_label}</dt>
                <dd>{t.event_date}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-white">{t.event_time_label}</dt>
                <dd>{t.event_time}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-white">{t.event_venue_label}</dt>
                <dd>{t.event_venue}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="mt-10 w-full sm:mt-12"
          aria-labelledby="registration-heading"
        >
          <div className="rounded-2xl border border-amber-400/25 bg-gray-900/80 px-4 py-8 shadow-[0_0_40px_rgba(251,191,36,0.06)] sm:px-8 sm:py-10">
            <h2
              id="registration-heading"
              className="text-center font-serif text-2xl font-semibold text-amber-400 sm:text-3xl"
            >
              {t.registration_title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-gray-400">
              {t.registration_subtitle}
            </p>

            <div
              className="mx-auto mt-8 w-full max-w-[640px] overflow-hidden rounded-lg border border-gray-700/80 bg-gray-800/50 [&_iframe]:block [&_iframe]:h-[1789px] [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: GOOGLE_FORM_EMBED_HTML }}
            />
          </div>
        </section>

        <section className="mt-10 w-full sm:mt-12">
          <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-950 px-5 py-6 text-center sm:px-8 sm:py-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
              <Gift className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              {t.bonus_heading}
            </p>
            <p className="mt-3 text-pretty text-base font-medium leading-relaxed text-gray-100 sm:text-lg">
              {t.bonus_text}
            </p>
          </div>
        </section>

        <footer className="mt-12 w-full border-t border-gray-800 pt-8 text-center sm:mt-14">
          <p className="text-xs text-gray-500 sm:text-sm">{t.footer}</p>
        </footer>
      </div>
    </main>
  );
}
