import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center bg-zinc-950 text-zinc-50">
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            零成本人生 (Zero-Cost Life)
          </h1>
          <p className="text-pretty text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            以被動收入逐步覆蓋日常開支，讓生活成本「由系統支付」：你專注創造價值，現金流負責
            維持與擴張。
          </p>

          <div className="pt-2">
            <Link
              href="/event"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Join Our First Event -&gt;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
