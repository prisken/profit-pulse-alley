/** Homepage client testimonials — replace with real member quotes when available. */

export type ClientTestimonial = {
  quote: string;
  name: string;
  role: string;
};

export const CLIENT_TESTIMONIALS: ClientTestimonial[] = [
  {
    quote:
      "The Fortify fireside chat wasn't theory — Vicky and Marcy walked through decisions they've actually made under pressure. I left with a clearer picture of how to defend my business while still investing for growth.",
    name: "Jason L.",
    role: "SaaS Founder, Hong Kong",
  },
  {
    quote:
      "Playing the 10-Day Investment Challenge forced me to articulate why I was backing each deal. Comparing my results on the leaderboard made the gaps in my process obvious — in a good way.",
    name: "Michelle Wong",
    role: "F&B Operator & Angel Investor",
  },
  {
    quote:
      "參加完活動後，我才明白「守業」和「增值」可以並行。社群裡有人真的在實踐被動收入策略，這種同路人交流比單看書有用得多。",
    name: "陳先生",
    role: "初創創辦人",
  },
];
