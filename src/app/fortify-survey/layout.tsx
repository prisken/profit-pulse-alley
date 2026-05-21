import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortify Your Future | Profit Pulse Ally",
  description:
    "Register your interest for an exclusive fireside chat on business defense and investment.",
};

export default function FortifySurveyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
