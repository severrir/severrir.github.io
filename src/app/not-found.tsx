import type { Metadata } from "next";
import { NotFoundTrace } from "@/components/not-found-trace";
import { ActionLink } from "@/components/ui";
import { SpinningBorderLink } from "@/components/ui/spinning-border-button";

export const metadata: Metadata = {
  title: "Route not found",
};

export default function NotFound() {
  return (
    <section className="bloom relative flex min-h-[88svh] items-center justify-center px-[var(--gutter)] py-32">
      <div className="relative mx-auto w-full max-w-2xl text-center">
        <p className="font-serif text-[clamp(4rem,14vw,8rem)] font-light leading-none tracking-[-0.03em] text-text-2/25">
          404
        </p>

        <h1 className="balance mt-6 font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.02em]">
          This route was never required.
        </h1>
        <p className="pretty mx-auto mt-5 max-w-[46ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2">
          Nothing is registered at that path. Either the link is wrong or the
          page has moved.
        </p>

        <div className="mt-10">
          <NotFoundTrace />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <SpinningBorderLink href="/">Back to the work</SpinningBorderLink>
          <ActionLink href="/booking" variant="quiet" className="px-5 py-3.5">
            Start a project
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
