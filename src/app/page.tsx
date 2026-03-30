export default function Home() {
  return (
    <main className="relative flex flex-1 items-center overflow-hidden bg-zinc-950 text-zinc-50">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/hero-loop.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
      />

      <section className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-24">
        <div className="max-w-3xl space-y-5 sm:space-y-6">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            零成本人生 (Zero-Cost Life)
          </h1>
          <p className="text-pretty text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            以被動收入逐步覆蓋日常開支：你專注創造價值，被動現金流在背後守護
          </p>

          <div className="pt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <a
                href="/event"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
              >
                立即報名參加活動 -&gt;
              </a>
              <a
                href="/game"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/40 bg-white/0 px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
              >
                挑戰贏取免費門票
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
