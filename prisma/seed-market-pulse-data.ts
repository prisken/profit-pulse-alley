import type { MarketPulseSignal } from "@prisma/client";

/** Stable marker — seed is skipped if this cycle already exists (safe re-runs). */
export const DEMO_CYCLE_NAME = "[DEMO] Market Pulse Local Seed";

export type DemoCardSeed = {
  dayIndex: number;
  companyName: string;
  companyNameZh?: string;
  ticker: string;
  exchange?: string;
  headline: string;
  sourceName: string;
  summary: string;
  ppaSignal: MarketPulseSignal;
  ppaInsight: string;
  priceLabel?: string;
  priceDirection?: string;
};

export const DEMO_CYCLE_PRIZE_LABEL =
  "Demo prizes — Ocean Park tickets (1st) · PPA report (2nd–10th)";

export const DEMO_CARDS: DemoCardSeed[] = [
  {
    dayIndex: 1,
    companyName: "TSMC",
    companyNameZh: "台積電",
    ticker: "2330.TW",
    exchange: "TWSE",
    headline: "TSMC announces expanded advanced chip capacity plan.",
    sourceName: "Demo Wire — Semiconductor Desk",
    summary:
      "Sample card: TSMC outlined a multi-year capex plan focused on 3nm and packaging. Demo content for local Market Pulse testing only.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Capacity expansion supports medium-term revenue visibility; watch utilisation and export demand.",
    priceLabel: "NT$892",
    priceDirection: "+1.8%",
  },
  {
    dayIndex: 2,
    companyName: "NVIDIA",
    ticker: "NVDA",
    exchange: "NASDAQ",
    headline: "NVIDIA highlights continued demand for AI accelerators.",
    sourceName: "Demo Wire — Tech Desk",
    summary:
      "Sample card: Management commentary points to sustained data-centre orders. For development demos — not investment advice.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "AI infrastructure spend remains the narrative driver; monitor hyperscaler capex commentary.",
    priceLabel: "$142.50",
    priceDirection: "+2.4%",
  },
  {
    dayIndex: 3,
    companyName: "HSBC",
    ticker: "0005.HK",
    exchange: "HKEX",
    headline: "HSBC faces pressure from changing rate expectations.",
    sourceName: "Demo Wire — Banks Desk",
    summary:
      "Sample card: Net interest margin outlook is in focus as markets price policy shifts. Demo-only headline.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Rate-path uncertainty can compress NIM assumptions; favour clarity on credit costs.",
    priceLabel: "HK$68.20",
    priceDirection: "-0.6%",
  },
  {
    dayIndex: 4,
    companyName: "Apple",
    ticker: "AAPL",
    exchange: "NASDAQ",
    headline: "Apple services growth offsets softer hardware upgrade cycle.",
    sourceName: "Demo Wire — Consumer Tech",
    summary:
      "Sample card: Services revenue remains a stabiliser while iPhone demand is mixed. Local seed data.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Recurring services revenue improves earnings quality; hardware cycles still matter near-term.",
    priceLabel: "$227.10",
    priceDirection: "+0.9%",
  },
  {
    dayIndex: 5,
    companyName: "Tesla",
    ticker: "TSLA",
    exchange: "NASDAQ",
    headline: "Tesla delivery estimates revised amid pricing competition.",
    sourceName: "Demo Wire — Autos Desk",
    summary:
      "Sample card: Margin vs volume trade-off in EV markets. Demo content for swipe-card UI testing.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Price cuts can defend share but pressure margins; watch delivery guides and energy storage mix.",
    priceLabel: "$248.30",
    priceDirection: "-1.2%",
  },
  {
    dayIndex: 6,
    companyName: "Alibaba",
    companyNameZh: "阿里巴巴",
    ticker: "BABA",
    exchange: "NYSE",
    headline: "Alibaba cloud unit growth slows as enterprise budgets tighten.",
    sourceName: "Demo Wire — China Internet",
    summary:
      "Sample card: Cloud and commerce segments face mixed demand signals. Not real market news.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Cloud deceleration warrants patience; recovery depends on domestic consumption and regulation tone.",
    priceLabel: "$86.40",
    priceDirection: "-0.4%",
  },
  {
    dayIndex: 7,
    companyName: "Microsoft",
    ticker: "MSFT",
    exchange: "NASDAQ",
    headline: "Microsoft Azure growth reaccelerates on AI workload adoption.",
    sourceName: "Demo Wire — Software Desk",
    summary:
      "Sample card: Enterprise AI bundles lift cloud attach rates in demo scenario.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Copilot monetisation and Azure AI services support a constructive setup; mind valuation.",
    priceLabel: "$442.80",
    priceDirection: "+1.1%",
  },
  {
    dayIndex: 8,
    companyName: "BYD",
    companyNameZh: "比亞迪",
    ticker: "1211.HK",
    exchange: "HKEX",
    headline: "BYD export volumes rise as European EV competition intensifies.",
    sourceName: "Demo Wire — EV Desk",
    summary:
      "Sample card: Overseas shipments improve but pricing remains competitive. Demo seed only.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Scale and battery integration are strengths; monitor overseas tariff and pricing headlines.",
    priceLabel: "HK$312.00",
    priceDirection: "+2.0%",
  },
  {
    dayIndex: 9,
    companyName: "Samsung Electronics",
    companyNameZh: "三星電子",
    ticker: "005930.KS",
    exchange: "KRX",
    headline: "Samsung memory outlook improves on HBM supply tightness.",
    sourceName: "Demo Wire — Hardware Desk",
    summary:
      "Sample card: HBM demand tied to AI servers lifts memory pricing assumptions in this demo story.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Memory up-cycle narrative strengthens with AI servers; cyclicality still high.",
    priceLabel: "₩82,400",
    priceDirection: "+3.2%",
  },
  {
    dayIndex: 10,
    companyName: "Meta Platforms",
    ticker: "META",
    exchange: "NASDAQ",
    headline: "Meta ad revenue beats estimates while Reality Labs losses persist.",
    sourceName: "Demo Wire — Digital Ads",
    summary:
      "Sample card: Core ads business remains the profit engine in this fictional earnings recap.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Ad recovery is supportive but metaverse spend is a drag; weigh efficiency vs reinvestment.",
    priceLabel: "$612.50",
    priceDirection: "+0.5%",
  },
];
