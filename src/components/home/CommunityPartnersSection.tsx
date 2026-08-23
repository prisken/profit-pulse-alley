"use client";

import Image from "next/image";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  COMMUNITY_PARTNERS,
  partnersByGroup,
} from "@/lib/partners/community-partners";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mp-pulse/80 focus-visible:ring-offset-2 focus-visible:ring-offset-mp-obsidian";

/**
 * Community Collaborators & Venues.
 * Greyscale by default, full colour on hover — quiet credits, never a banner.
 * Variants: "section" (homepage/events) | "footer" (compact single row).
 */
export default function CommunityPartnersSection({
  variant = "section",
}: {
  variant?: "section" | "footer";
}) {
  const { t } = useTranslations();

  const renderLogo = (p: (typeof COMMUNITY_PARTNERS)[number]) => (
    <div
      key={p.slug}
      className={`flex items-center justify-center ${focusRing}`}
      title={p.nameZh ? `${p.name} ${p.nameZh}` : p.name}
    >
      <Image
        src={p.file}
        alt={p.nameZh ? `${p.name} ${p.nameZh}` : p.name}
        width={p.width}
        height={p.height}
        loading="lazy"
        className={`h-auto w-auto object-contain opacity-80 grayscale transition-[filter,opacity] duration-300 hover:opacity-100 hover:grayscale-0 ${
          variant === "footer" ? "max-h-8 sm:max-h-9" : "max-h-14 sm:max-h-20"
        }`}
        sizes={variant === "footer" ? "96px" : "192px"}
      />
    </div>
  );

  if (variant === "footer") {
    return (
      <div className="mt-8 border-t border-white/10 pt-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          {t("footer.partners.label")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          {COMMUNITY_PARTNERS.map(renderLogo)}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
          {t("home.partners.disclaimer")}
        </p>
      </div>
    );
  }

  return (
    <section
      className="mx-auto w-full max-w-5xl px-3 py-8 sm:px-6 sm:py-12"
      aria-labelledby="community-partners-heading"
    >
      <div className="text-center">
        <h2
          id="community-partners-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl"
        >
          {t("home.partners.heading")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
          {t("home.partners.subhead")}
        </p>
      </div>

      {/* Venues & community */}
      <div className="mt-8">
        <h3 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/45">
          {t("home.partners.group.venues")}
        </h3>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {partnersByGroup("venues").map(renderLogo)}
        </div>
      </div>

      {/* Educational session collaborators */}
      <div className="mt-8 border-t border-foreground/10 pt-6">
        <h3 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/45">
          {t("home.partners.group.educational")}
        </h3>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {partnersByGroup("educational").map(renderLogo)}
        </div>
      </div>

      {/* Compliance disclaimer — hard-coded, must stay under logos */}
      <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] leading-relaxed text-foreground/45">
        {t("home.partners.disclaimer")}
      </p>
    </section>
  );
}
