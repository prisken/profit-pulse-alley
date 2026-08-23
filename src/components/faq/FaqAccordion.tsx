"use client";

import { useState } from "react";
import Link from "next/link";
import { FAQ_SECTIONS } from "@/lib/faq-content";

type Locale = "en" | "zh-Hant";

function renderLinks(text: string) {
  // Convert [label](/path) markdown links into Next <Link> elements.
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) {
      return (
        <Link key={i} href={m[2]} className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
          {m[1]}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function FaqAccordion({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  }

  return (
    <div className="mt-6 space-y-8">
      {FAQ_SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`faq-${section.id}`}>
          <h2
            id={`faq-${section.id}`}
            className="text-lg font-bold tracking-tight text-white sm:text-xl"
          >
            {locale === "en" ? section.headingEn : section.headingZh}
          </h2>
          <div className="mt-3 divide-y divide-white/[0.08] rounded-xl border border-white/[0.08] bg-zinc-900/60">
            {section.items.map((item, i) => {
              const id = `${section.id}-${i}`;
              const isOpen = Boolean(open[id]);
              return (
                <div key={id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${id}`}
                    onClick={() => toggle(id)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/[0.03] sm:px-5 sm:text-base"
                  >
                    <span>{locale === "en" ? item.qEn : item.qZh}</span>
                    <span
                      className={`shrink-0 text-amber-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen ? (
                    <div
                      id={`faq-panel-${id}`}
                      className="px-4 pb-4 text-sm leading-relaxed text-zinc-400 sm:px-5 sm:text-[15px]"
                    >
                      {(locale === "en" ? item.aEn : item.aZh)
                        .split("\n\n")
                        .map((para, j) => (
                          <p key={j} className="mb-3 last:mb-0">
                            {renderLinks(para)}
                          </p>
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
