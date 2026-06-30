"use client";

import Link from "next/link";

import { useTranslations } from "@/components/providers/LocaleProvider";
import type { AdminMpBreadcrumb } from "@/lib/market-pulse/admin-mp-navigation";
import type { MessageKey } from "@/lib/i18n/messages";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Props = {
  items: AdminMpBreadcrumb[];
};

export default function MarketPulseAdminBreadcrumbs({ items }: Readonly<Props>) {
  const { t } = useTranslations();

  return (
    <nav aria-label={t("auth.admin.breadcrumb.aria")} className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label = item.label ?? (item.labelKey ? t(item.labelKey as MessageKey) : "—");

          return (
            <li key={`${label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span className="text-zinc-600" aria-hidden>
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300 hover:underline ${focusRing}`}
                >
                  {label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-zinc-200" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
