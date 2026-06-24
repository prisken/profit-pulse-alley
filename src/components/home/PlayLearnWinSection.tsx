import { BrainCircuit, Swords, Trophy } from "lucide-react";

const cards = [
  {
    icon: Swords,
    heading: "Daily Challenge",
    text: "Test your market predictions daily and climb the leaderboard.",
    accent: "emerald",
  },
  {
    icon: BrainCircuit,
    heading: "Expert Fireside Chats",
    text: "Join live discussions with business owners and industry leaders.",
    accent: "amber",
  },
  {
    icon: Trophy,
    heading: "Win Real Prizes",
    text: "Top players in each 'Market Pulse' cycle win exclusive rewards.",
    accent: "violet",
  },
] as const;

const accentStyles = {
  emerald:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
} as const;

export default function PlayLearnWinSection() {
  return (
    <section
      className="border-t border-white/10 bg-zinc-950 px-3 py-6 sm:px-6 sm:py-14 md:py-16"
      aria-labelledby="play-learn-win-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id="play-learn-win-heading"
          className="text-center text-xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Play. Learn. Win.
        </h2>

        <ul className="mt-4 grid gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {cards.map(({ icon: Icon, heading, text, accent }) => (
            <li key={heading}>
              <article className="flex h-full gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:flex-col sm:rounded-2xl sm:p-7">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border sm:h-12 sm:w-12 sm:rounded-xl ${accentStyles[accent]}`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white sm:mt-5 sm:text-xl">
                    {heading}
                  </h3>
                  <p className="mt-0.5 text-xs leading-snug text-zinc-400 sm:mt-2 sm:text-base sm:leading-relaxed">
                    {text}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
