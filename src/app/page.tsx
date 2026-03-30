export default function Home() {
  return (
    <main className="relative flex flex-1 items-center overflow-hidden bg-zinc-950 text-zinc-50">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/hero-loop.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
      />

      <section className="relative mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            零成本人生 (Zero-Cost Life)
          </h1>
          <p className="text-pretty text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            以被動收入逐步覆蓋日常開支：你專注創造價值，被動現金流在背後守護
          </p>

          <div className="pt-2">
            <a
              href="https://www.instagram.com/profitpulseally?igsh=MWY5NWV6dHYzemoxaA%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Follow us
            </a>

            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.instagram.com/profitpulseally?igsh=MWY5NWV6dHYzemoxaA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Profit Pulse Ally on Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="7" y="7" width="10" height="10" rx="3" />
                  <path d="M16.2 7.8h.01" />
                  <circle cx="12" cy="12" r="2.7" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61582209732918"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Profit Pulse Ally on Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 8h2V5h-2a4 4 0 0 0-4 4v2H8v3h2v5h3v-5h2.5l.5-3H13V9a1 1 0 0 1 1-1z" />
                </svg>
              </a>
              <a
                href="https://www.threads.com/@profitpulseally?igshid=NTc4MTIwNjQ2YQ=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Profit Pulse Ally on Threads"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {/* Simple Threads-like @ loop mark (placeholder) */}
                  <path d="M8.2 12c0-2.4 1.7-4.2 4.1-4.2 2.5 0 4.2 1.8 4.2 4.2 0 2.9-2.1 4.9-5.1 4.9-3.1 0-5.4-2.2-5.4-5.4 0-3.9 3.1-7 7.3-7 3.3 0 6.2 1.8 7.2 4.9" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
