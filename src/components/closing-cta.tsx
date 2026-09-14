import { Reveal, Section } from "./ui";
import { SpinningBorderLink } from "./ui/spinning-border-button";

/** The last thing on the page, so it gets the boldness the sections above
    deliberately go without: cobalt bloom behind a lit glass surface. */
export function ClosingCta() {
  return (
    <Section className="bloom relative border-t border-rule">
      <Reveal>
        <div className="specular relative overflow-hidden rounded-lg p-8 sm:p-12 lg:p-16">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
          />

          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
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
