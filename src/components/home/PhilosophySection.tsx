import Image from "next/image";
import { Quote } from "lucide-react";

import { getExpertsShowcase } from "@/lib/home/proof-of-concept";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function PhilosophySection() {
  const { t, locale } = await getServerTranslations();
  const experts = getExpertsShowcase(locale);

  return (
    <section
      id="philosophy"
      className="border-t border-white/10 bg-zinc-950 px-3 py-6 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="philosophy-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2 id="philosophy-heading" className="sr-only">
          {t("home.philosophy.srHeading")}
        </h2>

        <figure className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 sm:rounded-3xl sm:px-10 sm:py-12 md:px-14 md:py-14">
          <Quote
            className="absolute left-3 top-3 h-7 w-7 text-amber-400/40 sm:left-8 sm:top-8 sm:h-12 sm:w-12"
            aria-hidden="true"
          />
          <blockquote className="relative text-center">
            <p className="text-pretty text-sm font-medium leading-relaxed text-zinc-100 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-relaxed">
              &ldquo;{t("home.philosophy.quote")}&rdquo;
            </p>
          </blockquote>
        </figure>

        <div className="mt-8 sm:mt-14">
          <h3 className="text-center text-base font-semibold tracking-tight text-white sm:text-2xl">
            {t("home.philosophy.mindsHeading")}
          </h3>
          <ul className="mt-5 flex flex-wrap justify-center gap-6 sm:mt-10 sm:gap-12 md:gap-16">
            {experts.map((expert) => (
              <li key={expert.name} className="flex flex-col items-center text-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-amber-400/40 ring-2 ring-amber-500/10 sm:h-28 sm:w-28 sm:ring-4 md:h-32 md:w-32">
                  <Image
                    src={expert.headshotSrc}
                    alt={expert.name}
                    fill
                    className={`object-cover ${
                      expert.imageObjectPosition === "top"
                        ? "object-top"
                        : "object-center"
                    }`}
                    sizes="128px"
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-white sm:mt-4 sm:text-lg">
                  {expert.name}
                </p>
                <p className="mt-0.5 max-w-[12rem] text-[11px] leading-snug text-zinc-400 sm:mt-1 sm:max-w-[14rem] sm:text-sm">
                  {expert.title}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
