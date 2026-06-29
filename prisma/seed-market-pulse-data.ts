import type { MarketPulseSignal } from "@prisma/client";

/** Stable marker — seed is skipped if this cycle already exists (safe re-runs). */
export const DEMO_CYCLE_NAME = "[DEMO] Market Pulse Local Seed";

export const DEMO_DEFAULT_USER_PROMPT = "What is your read on this signal?";

/** Stable 16:9 demo hero (URL-only; no upload). */
export const DEMO_CARD_IMAGE_URL =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop";

export type DemoCardSeed = {
  dayIndex: number;
  companyName: string;
  companyNameZh?: string;
  ticker: string;
  exchange?: string;
  headline: string;
  newsBody?: string;
  sourceName: string;
  summary: string;
  ppaSignal: MarketPulseSignal;
  ppaInsight: string;
  priceLabel?: string;
  priceDirection?: string;
  logoInitials?: string;
  cardImageUrl?: string;
  cardImageAlt?: string;
  userPrompt?: string;
};

export const DEMO_CYCLE_PRIZE_LABEL = "1 Ocean Park ticket (cycle winner)";

export const DEMO_CARDS: DemoCardSeed[] = [
  {
    dayIndex: 1,
    companyName: "TSMC",
    companyNameZh: "台積電",
    ticker: "2330.TW",
    exchange: "TWSE",
    headline: "TSMC announces expanded advanced chip capacity plan.",
    newsBody:
      "The company outlined additional 3nm and advanced packaging capacity over the next several years, citing sustained AI and high-performance computing demand.",
    sourceName: "Demo Wire — Semiconductor Desk",
    summary:
      "Sample card: TSMC outlined a multi-year capex plan focused on 3nm and packaging. Demo content for local Market Pulse testing only.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Capacity expansion supports medium-term revenue visibility; watch utilisation and export demand.",
    priceLabel: "NT$892",
    priceDirection: "+1.8%",
    logoInitials: "TS",
    cardImageUrl: DEMO_CARD_IMAGE_URL,
    cardImageAlt: "Semiconductor fabrication facility (demo image)",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 2,
    companyName: "NVIDIA",
    ticker: "NVDA",
    exchange: "NASDAQ",
    headline: "NVIDIA highlights continued demand for AI accelerators.",
    newsBody:
      "Management commentary in this demo scenario points to sustained data-centre GPU orders and growing enterprise AI adoption.",
    sourceName: "Demo Wire — Tech Desk",
    summary:
      "Sample card: Management commentary points to sustained data-centre orders. For development demos — not investment advice.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "AI infrastructure spend remains the narrative driver; monitor hyperscaler capex commentary.",
    priceLabel: "$142.50",
    priceDirection: "+2.4%",
    logoInitials: "NV",
    cardImageUrl: DEMO_CARD_IMAGE_URL,
    cardImageAlt: "Server racks in a data centre (demo image)",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 3,
    companyName: "HSBC",
    ticker: "0005.HK",
    exchange: "HKEX",
    headline: "HSBC faces pressure from changing rate expectations.",
    newsBody:
      "Analysts in this demo story are revisiting net interest margin assumptions as markets price a shifting rate path.",
    sourceName: "Demo Wire — Banks Desk",
    summary:
      "Sample card: Net interest margin outlook is in focus as markets price policy shifts. Demo-only headline.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Rate-path uncertainty can compress NIM assumptions; favour clarity on credit costs.",
    priceLabel: "HK$68.20",
    priceDirection: "-0.6%",
    logoInitials: "HS",
    cardImageUrl: DEMO_CARD_IMAGE_URL,
    cardImageAlt: "Hong Kong financial district skyline (demo image)",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 4,
    companyName: "Apple",
    ticker: "AAPL",
    exchange: "NASDAQ",
    headline: "Apple services growth offsets softer hardware upgrade cycle.",
    newsBody:
      "Services revenue continues to stabilise results while iPhone upgrade demand remains uneven in this fictional recap.",
    sourceName: "Demo Wire — Consumer Tech",
    summary:
      "Sample card: Services revenue remains a stabiliser while iPhone demand is mixed. Local seed data.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Recurring services revenue improves earnings quality; hardware cycles still matter near-term.",
    priceLabel: "$227.10",
    priceDirection: "+0.9%",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 5,
    companyName: "Tesla",
    ticker: "TSLA",
    exchange: "NASDAQ",
    headline: "Tesla delivery estimates revised amid pricing competition.",
    newsBody:
      "Delivery trackers in this demo scenario trimmed near-term volume estimates as EV pricing competition intensifies.",
    sourceName: "Demo Wire — Autos Desk",
    summary:
      "Sample card: Margin vs volume trade-off in EV markets. Demo content for swipe-card UI testing.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Price cuts can defend share but pressure margins; watch delivery guides and energy storage mix.",
    priceLabel: "$248.30",
    priceDirection: "-1.2%",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 6,
    companyName: "Alibaba",
    companyNameZh: "阿里巴巴",
    ticker: "BABA",
    exchange: "NYSE",
    headline: "Alibaba cloud unit growth slows as enterprise budgets tighten.",
    newsBody:
      "Cloud revenue growth decelerated in this demo earnings recap as enterprise customers tightened IT budgets.",
    sourceName: "Demo Wire — China Internet",
    summary:
      "Sample card: Cloud and commerce segments face mixed demand signals. Not real market news.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Cloud deceleration warrants patience; recovery depends on domestic consumption and regulation tone.",
    priceLabel: "$86.40",
    priceDirection: "-0.4%",
    logoInitials: "AB",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 7,
    companyName: "Microsoft",
    ticker: "MSFT",
    exchange: "NASDAQ",
    headline: "Microsoft Azure growth reaccelerates on AI workload adoption.",
    newsBody:
      "Azure growth improved in this demo scenario as enterprises attach AI workloads to existing cloud contracts.",
    sourceName: "Demo Wire — Software Desk",
    summary:
      "Sample card: Enterprise AI bundles lift cloud attach rates in demo scenario.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Copilot monetisation and Azure AI services support a constructive setup; mind valuation.",
    priceLabel: "$442.80",
    priceDirection: "+1.1%",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 8,
    companyName: "BYD",
    companyNameZh: "比亞迪",
    ticker: "1211.HK",
    exchange: "HKEX",
    headline: "BYD export volumes rise as European EV competition intensifies.",
    newsBody:
      "Overseas shipment data in this demo story improved even as European competitors cut prices to defend share.",
    sourceName: "Demo Wire — EV Desk",
    summary:
      "Sample card: Overseas shipments improve but pricing remains competitive. Demo seed only.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Scale and battery integration are strengths; monitor overseas tariff and pricing headlines.",
    priceLabel: "HK$312.00",
    priceDirection: "+2.0%",
    logoInitials: "BY",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 9,
    companyName: "Samsung Electronics",
    companyNameZh: "三星電子",
    ticker: "005930.KS",
    exchange: "KRX",
    headline: "Samsung memory outlook improves on HBM supply tightness.",
    newsBody:
      "Tight HBM supply for AI servers is lifting memory pricing assumptions in this fictional industry update.",
    sourceName: "Demo Wire — Hardware Desk",
    summary:
      "Sample card: HBM demand tied to AI servers lifts memory pricing assumptions in this demo story.",
    ppaSignal: "BULLISH",
    ppaInsight:
      "Memory up-cycle narrative strengthens with AI servers; cyclicality still high.",
    priceLabel: "₩82,400",
    priceDirection: "+3.2%",
    logoInitials: "SE",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
  {
    dayIndex: 10,
    companyName: "Meta Platforms",
    ticker: "META",
    exchange: "NASDAQ",
    headline: "Meta ad revenue beats estimates while Reality Labs losses persist.",
    newsBody:
      "Advertising revenue exceeded demo estimates, but Reality Labs losses continued to weigh on consolidated margins.",
    sourceName: "Demo Wire — Digital Ads",
    summary:
      "Sample card: Core ads business remains the profit engine in this fictional earnings recap.",
    ppaSignal: "CAUTIOUS",
    ppaInsight:
      "Ad recovery is supportive but metaverse spend is a drag; weigh efficiency vs reinvestment.",
    priceLabel: "$612.50",
    priceDirection: "+0.5%",
    userPrompt: DEMO_DEFAULT_USER_PROMPT,
  },
];
