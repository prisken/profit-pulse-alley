import { notFound } from "next/navigation";

import WorkshopTouchFixture from "@/components/workshop/WorkshopTouchFixture";

export const metadata = {
  title: "Workshop touch fixture",
  robots: { index: false, follow: false },
};

/**
 * Dev-only surface for touch / slider QA without calling DeepSeek.
 * Production always 404s.
 */
export default function WorkshopTouchFixturePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <WorkshopTouchFixture />;
}
