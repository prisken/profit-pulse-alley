/** Experts shown in the homepage Proof of Concept section. */

export type ExpertShowcase = {
  name: string;
  title: string;
  bio: string;
  headshotSrc: string;
  imageObjectPosition?: "center" | "top";
};

export const EXPERTS_SHOWCASE: ExpertShowcase[] = [
  {
    name: "Vicky Huang",
    title: "Co-founder, Zeppelin Hot Dog",
    bio: "First-hand experience securing growth funding and scaling a beloved Hong Kong brand from the ground up — the same operator mindset behind our fireside chats.",
    headshotSrc: "/vicky-headshot.png",
    imageObjectPosition: "center",
  },
  {
    name: "Marcy Chan",
    title: "Bestselling Author,《以「輪」擊石》",
    bio: "Practical strategies for building new-generation passive income streams — expertise that informs the disciplined decisions you practice in our investment simulations.",
    headshotSrc: "/marcy-chan-headshot.png",
    imageObjectPosition: "top",
  },
];

export const INVESTMENT_PHILOSOPHY =
  "Profit Pulse Ally helps ambitious founders and investors think in systems — balancing offense and defense, cash flow and compounding — so every move moves you closer to a zero-cost life. That same rigor powers the PPA Take in Market Pulse: expert-backed judgment you can test, refine, and apply before real capital is on the line.";
