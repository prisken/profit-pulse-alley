import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortify Your Future | Profit Pulse Ally",
  description:
    "Register for Fortify Your Future — an exclusive fireside chat on sales and marketing. July 17 at WeWork Lee Garden.",
};

export default function FortifySurveyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
