import type { Metadata } from "next";

import MatchingPulseLandingPage from "@/components/matching-pulse/MatchingPulseLandingPage";
import {
  buildMatchingPulseRequestPath,
  getMatchingPulseRequestCreateInitialSource,
  isMatchingPulseWorkshopSource,
} from "@/lib/matching-pulse/create-source";

export const metadata: Metadata = {
  title: "Matching Pulse | Profit Pulse Ally",
  description:
    "Turn conversations into collaborations. Post a business need, offer, or partnership idea — PPA reviews requests and may help connect relevant members.",
};

type MatchingPulsePageProps = Readonly<{
  searchParams: Promise<{ source?: string | string[] }>;
}>;

export default async function MatchingPulsePage({
  searchParams,
}: MatchingPulsePageProps) {
  const params = await searchParams;
  const source = getMatchingPulseRequestCreateInitialSource(params);
  const requestHref = buildMatchingPulseRequestPath(params);

  return (
    <MatchingPulseLandingPage
      requestHref={requestHref}
      showWorkshopNote={isMatchingPulseWorkshopSource(source)}
    />
  );
}
