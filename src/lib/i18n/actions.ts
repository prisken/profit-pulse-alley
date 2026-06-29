"use server";

import { cookies } from "next/headers";

import {
  LOCALE_COOKIE_NAME,
  parseSiteLocale,
  SITE_LOCALES,
} from "@/lib/i18n/locales";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type SetSiteLocaleResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setSiteLocaleAction(
  locale: string,
): Promise<SetSiteLocaleResult> {
  const parsed = parseSiteLocale(locale);
  if (!SITE_LOCALES.includes(parsed)) {
    return { ok: false, error: "Unsupported language." };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, parsed, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { ok: true };
}
