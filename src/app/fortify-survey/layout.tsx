import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortify Your Future | Profit Pulse Ally",
  description:
    "Register for Fortify Your Future — an exclusive fireside chat on business defense and investment. June 26 at WeWork YF Life Tower.",
};

export default function FortifySurveyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
