import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Events | Profit Pulse Ally",
  description:
    "Actionable insights and networking for ambitious founders and investors.",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaPrimary =
  `inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 ${focusRing}`;

export default function EventsHubPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Profit Pulse Ally Events
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-foreground/75 sm:text-base">
          Actionable insights and networking for ambitious founders and
          investors.
        </p>
      </header>

      <section
        id="upcoming-events"
        className="mt-10 border-t border-foreground/10 pt-10"
        aria-labelledby="upcoming-events-heading"
      >
        <h2
          id="upcoming-events-heading"
          className="text-lg font-semibold text-foreground sm:text-xl"
        >
          Upcoming Events
        </h2>
        <article className="mt-5 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background shadow-sm sm:mt-6">
          <div className="relative aspect-[16/9] w-full bg-white">
            <Image
              src="/images/fortify-event-poster.png"
              alt="Fortify Your Future / 守業增值創未來 — event poster"
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, 1024px"
              priority
            />
          </div>
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-bold text-foreground sm:text-xl">
              Fortify Your Future / 守業增值創未來
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 sm:text-base">
              Featuring Zeppelin Hot Dog co-founder Vicky Huang and bestselling
              author Marcy Chan. Learn the playbook for growth, wealth, and
              legacy.
            </p>
            <Link
              href="/events/fortify-your-future"
              className={`${ctaPrimary} mt-4 w-full sm:w-auto`}
            >
              View Details &amp; Register
            </Link>
          </div>
        </article>
      </section>

      <section
        id="past-events"
        className="mt-10 border-t border-foreground/10 pt-10"
        aria-labelledby="past-events-heading"
      >
        <h2
          id="past-events-heading"
          className="text-lg font-semibold text-foreground sm:text-xl"
        >
          Past Events / 過往活動
        </h2>
        <ul className="mt-4 space-y-3 text-sm sm:text-base">
          <li>
            <Link
              href="/events/wo-leung-yiu-dou-yiu"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:text-foreground/80 hover:underline"
            >
              <strong>《我兩樣都要》線下戰略會議</strong>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
