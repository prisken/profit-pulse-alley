"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { setSiteLocaleAction } from "@/lib/i18n/actions";
import type { SiteLocale } from "@/lib/i18n/locales";
import { translate, translateWith, type MessageKey } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: SiteLocale;
  setLocale: (locale: SiteLocale) => Promise<void>;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: Readonly<{
  initialLocale: SiteLocale;
  children: ReactNode;
}>) {
  const router = useRouter();

  const setLocale = useCallback(
    async (nextLocale: SiteLocale) => {
      if (nextLocale === initialLocale) {
        return;
      }
      const result = await setSiteLocaleAction(nextLocale);
      if (!result.ok) {
        return;
      }
      router.refresh();
    },
    [initialLocale, router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: initialLocale,
      setLocale,
      t: (key, vars) =>
        vars ? translateWith(initialLocale, key, vars) : translate(initialLocale, key),
    }),
    [initialLocale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useTranslations() {
  const { t, locale, setLocale } = useLocale();
  return { t, locale, setLocale };
}
