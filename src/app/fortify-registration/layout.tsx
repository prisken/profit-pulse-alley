import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortify Your Future (Lunch & Learn) | Profit Pulse Ally",
  description:
    "Register for Fortify Your Future Lunch & Learn — 30 July 2026, 12:30–13:30 at WeWork Taikoo Room 22B. Free. Guest speaker Vickie Yau.",
};

export default function FortifyRegistrationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
