import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex flex-1 items-center overflow-hidden bg-zinc-950 text-zinc-50">
      <Image
        src="/hero.png"
        alt=""
        fill
        priority
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
      />

      <section className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-24">
        <div className="max-w-3xl space-y-5 sm:space-y-6">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            【城堡攻防戰】現已開打！
          </h1>
          <p className="text-pretty text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            一百萬資金，證明你的投資眼光。獲取4月27日《我兩樣都要》活動門票！
          </p>

          <div className="pt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <a
                href="/game"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
              >
                立即參賽!
              </a>
              <a
                href="/event"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/40 bg-white/0 px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
              >
                了解活動詳情
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
