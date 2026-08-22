import type { Metadata, Viewport } from "next";
import { Cinzel, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { auth } from "@/auth";
import { getServerSiteLocale } from "@/lib/i18n/server";
import { siteLocaleToHtmlLang } from "@/lib/i18n/locales";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// PPA brand typography (brand guide: hero display — Cinzel; pull quotes — Playfair Italic)
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
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
  const [locale, session] = await Promise.all([getServerSiteLocale(), auth()]);

  return (
    <html
      lang={siteLocaleToHtmlLang(locale)}
      className={`${inter.variable} ${jetbrainsMono.variable} ${cinzel.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background font-sans text-foreground">
        <LocaleProvider initialLocale={locale}>
          <AuthSessionProvider session={session}>
            <LayoutShell>{children}</LayoutShell>
          </AuthSessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
