export default function WorkshopPyramidLoading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-mp-obsidian px-4 py-12 text-white">
      <div
        className="w-full max-w-md text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-emerald-500/25" />
        <div className="mx-auto mt-8 h-10 w-56 animate-pulse rounded-xl bg-white/10" />
        <div className="mx-auto mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-white/8" />
        <div className="mx-auto mt-8 h-40 w-full animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        <p className="mt-5 text-sm text-zinc-500">Loading workshop…</p>
      </div>
    </main>
  );
}
