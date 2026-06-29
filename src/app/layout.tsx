import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { siteLocaleToHtmlLang } from "@/lib/i18n/locales";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Profit Pulse Ally",
  description: "News, insights, and events for profit-minded builders.",
  metadataBase: new URL("https://profit-pulse-alley.vercel.app"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerSiteLocale();

  return (
    <html
      lang={siteLocaleToHtmlLang(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background font-sans text-foreground">
        <LocaleProvider initialLocale={locale}>
          <AuthSessionProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthSessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
