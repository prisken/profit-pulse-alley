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
    <main className="min-h-dvh overflow-x-hidden bg-zinc-950 px-3 py-6 text-zinc-200 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl rounded-xl bg-zinc-900 p-4 sm:rounded-2xl sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <div className="prose prose-invert prose-sm mt-4 max-w-none break-words sm:prose-base sm:mt-6 [&_a]:break-words [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-amber-400 [&_a:focus-visible]:ring-offset-2 [&_a:focus-visible]:ring-offset-zinc-900 [&_h2]:text-lg [&_h2]:sm:text-2xl [&_h3]:text-base [&_h3]:sm:text-xl [&_li]:text-sm [&_li]:sm:text-base [&_p]:text-sm [&_p]:leading-relaxed [&_p]:sm:text-base">
          {children}
        </div>
      </div>
    </main>
  );
}
