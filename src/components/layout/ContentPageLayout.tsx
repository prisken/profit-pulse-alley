import type { ReactNode } from "react";

type ContentPageLayoutProps = Readonly<{
  title: string;
  children: ReactNode;
}>;

export default function ContentPageLayout({
  title,
  children,
}: ContentPageLayoutProps) {
  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-10 text-zinc-200 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl rounded-2xl bg-zinc-900 p-6 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <div className="prose prose-invert mt-6 max-w-none">{children}</div>
      </div>
    </main>
  );
}
