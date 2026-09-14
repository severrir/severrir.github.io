"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ActionLink, EASE } from "../ui";
import { SpinningBorderLink } from "../ui/spinning-border-button";
import { AmbientField } from "./ambient-field";

/* One orchestrated entrance, staggered down the column. */
const rise = (i: number) => ({
  initial: { opacity: 0, y: 22, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1.05, ease: EASE, delay: 0.15 + i * 0.11 },
});

export function AmbientHero() {
  const reduced = useReducedMotion();
  const step = (i: number) => (reduced ? {} : rise(i));

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-[var(--gutter)] pb-20 pt-28 sm:pb-28 sm:pt-32">
      <AmbientField />

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <motion.p {...step(0)} className="flex justify-center">
          <span className="specular inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[0.8125rem] text-text-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-gold opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
            </span>
            Commissions open
          </span>
        </motion.p>

        <motion.h1
          {...step(1)}
          className="balance mx-auto mt-9 max-w-[17ch] font-serif text-[length:var(--display)] font-light leading-[1.02] tracking-[-0.025em]"
        >
          Systems engineered to outlive the build.
        </motion.h1>

        <motion.p
          {...step(2)}
          className="pretty mx-auto mt-8 max-w-[56ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2"
        >
          Backend architecture, gameplay systems and interface work, delivered as
          modules your team can read, extend and maintain long after handover.
        </motion.p>

        <motion.div
          {...step(3)}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <SpinningBorderLink href="/booking">Start a project</SpinningBorderLink>
          <ActionLink href="/#work" variant="quiet" className="px-5 py-3.5">
            See the work
          </ActionLink>
        </motion.div>
      </div>

      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 1 }}
        className="absolute bottom-10 left-1/2 hidden h-12 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/45 to-transparent sm:block"
      />
    </section>
  );
}
