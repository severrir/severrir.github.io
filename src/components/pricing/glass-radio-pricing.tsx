"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { tiers } from "@/data/pricing";
import { EASE, Section, SectionHeading } from "../ui";
import { SpinningBorderLink } from "../ui/spinning-border-button";
import { useSound } from "@/lib/useSound";

/**
 * A glass segmented selector over one detail panel.
 *
 * The selected pill is a single shared element that slides between segments
 * (layoutId), so the champagne rim travels rather than cross-fading. Comparing
 * tiers is still possible — the panel carries the full inclusion list — but the
 * page only ever shows one price at a time, which reads calmer than four
 * columns competing.
 */
export function GlassRadioPricing() {
  const [active, setActive] = useState(tiers[0].id);
  const reduced = useReducedMotion();
  const sound = useSound();

  const tier = tiers.find((t) => t.id === active) ?? tiers[0];

  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /*
   * Arrow keys move between options and wrap at both ends, which is what a
   * radiogroup is expected to do. Selection follows focus, matching how the
   * pill already behaves on click.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const index = tiers.findIndex((t) => t.id === active);
    const next = tiers[(index + step + tiers.length) % tiers.length];

    setActive(next.id);
    optionRefs.current[next.id]?.focus();
  };

  return (
    <Section id="pricing">
      <SectionHeading
        title="Priced by what gets built"
        lede="Not by the hour. Pick the size that matches the job — the minimum order is $25."
        center
      />

      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Commission tier"
          onKeyDown={onKeyDown}
          /*
           * Four segments in one row leaves ~78px each at 360px, which wraps or
           * clips every label. Two-up on phones, single row from sm.
           */
          className="specular grid w-full max-w-2xl grid-cols-2 gap-1 rounded-lg p-1.5 sm:flex sm:rounded-full"
        >
          {tiers.map((option) => {
            const selected = option.id === active;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                /*
                 * Roving tabindex: a radiogroup should be one tab stop, with
                 * arrows moving between options. All four were in the tab order.
                 */
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  optionRefs.current[option.id] = el;
                }}
                onClick={() => setActive(option.id)}
                className="relative rounded-md px-2 py-3 text-center sm:flex-1 sm:rounded-full"
                {...sound}
              >
                {selected ? (
                  <motion.span
                    layoutId={reduced ? undefined : "tier-pill"}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 rounded-md border border-edge-gold-strong sm:rounded-full bg-gradient-to-b from-white/[0.14] to-white/[0.02] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.18),0_0_25px_-5px_rgb(212_175_55_/_0.3)]"
                  />
                ) : null}
                <span
                  className={`relative block text-[0.8125rem] font-medium transition-colors duration-200 sm:text-sm ${
                    selected ? "text-text" : "text-text-2 hover:text-text"
                  }`}
                >
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={tier.id}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="specular rounded-lg p-8 sm:p-12"
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="tabular font-serif text-[length:var(--title)] font-light leading-none tracking-[-0.03em]">
                  {tier.price}
                </p>
                <p className="mt-3 text-sm text-text-2">{tier.unit}</p>
              </div>
              {tier.badge ? (
                <span className="rounded-full border border-edge-gold-strong px-3 py-1 text-xs font-medium text-gold">
                  {tier.badge}
                </span>
              ) : null}
            </div>

            <p className="pretty mt-8 max-w-[52ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2">
              {tier.summary}
            </p>

            <ul className="mt-9 grid gap-x-10 gap-y-4 border-t border-rule pt-9 sm:grid-cols-2">
              {tier.includes.map((item) => (
                <li key={item} className="flex gap-3 text-[0.9375rem] font-light leading-snug">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-gold"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="text-text-2">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <SpinningBorderLink href={`/booking?tier=${tier.id}`}>
                {tier.cta}
              </SpinningBorderLink>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
