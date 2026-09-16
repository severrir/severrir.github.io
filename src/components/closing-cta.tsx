"use client";

import { useSpecular } from "@/lib/use-specular";
import { Reveal, Section } from "./ui";
import { SpinningBorderLink } from "./ui/spinning-border-button";

/** The last thing on the page, so it gets the boldness the sections above
    deliberately go without: cobalt bloom behind a lit glass surface, and the
    only surface on the page whose highlight follows the pointer across its
    whole width. */
export function ClosingCta() {
  const trackSpecular = useSpecular<HTMLDivElement>();

  return (
    <Section className="bloom relative border-t border-rule">
      <Reveal>
        <div
          onPointerMove={trackSpecular}
          className="panel lume relative overflow-hidden rounded-lg p-7 sm:p-12 lg:p-16"
        >
          <span aria-hidden="true" className="lume-rim" />

          <div className="relative z-[1] flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <h2 className="balance max-w-[18ch] font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.02em]">
                Tell me what you need built.
              </h2>
              <p className="pretty mt-5 max-w-[48ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2">
                Send the idea and a rough scope. You get an honest answer on
                feasibility, timeline and price before any money changes hands.
              </p>
            </div>
            <SpinningBorderLink href="/booking" className="shrink-0">
              Start a project
            </SpinningBorderLink>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
