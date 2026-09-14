"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Braces,
  Gamepad2,
  Layers,
  MonitorSmartphone,
  PanelsTopLeft,
  Server,
} from "lucide-react";
import type { Service } from "@/data/services";
import { EASE, Section } from "./ui";
import { useSound } from "@/lib/useSound";

const ICONS = {
  Server,
  MonitorSmartphone,
  Layers,
  Gamepad2,
  PanelsTopLeft,
  Braces,
} as const;

export function ServiceRows({ services }: { services: Service[] }) {
  const reduced = useReducedMotion();
  const sound = useSound();
  const nameById = new Map(services.map((s) => [s.id, s.name]));

  /* One orchestrated reveal for the whole list. Six independently triggered
     rows turn a scroll into a slideshow. */
  const listMotion = reduced
    ? {}
    : {
        initial: "rest",
        whileInView: "in",
        viewport: { once: true, margin: "0px 0px -12% 0px" },
        variants: { rest: {}, in: { transition: { staggerChildren: 0.07 } } },
      };

  const rowMotion = reduced
    ? {}
    : {
        variants: { rest: { opacity: 0, y: 18 }, in: { opacity: 1, y: 0 } },
        transition: { duration: 0.85, ease: EASE },
      };

  return (
    <Section className="!pt-0">
      <motion.div className="border-b border-rule" {...listMotion}>
        {services.map((service) => {
          const Icon = ICONS[service.icon];
          return (
            <motion.article
              key={service.id}
              id={service.id}
              {...rowMotion}
              onPointerEnter={sound.onPointerEnter}
              className="group relative grid scroll-mt-24 gap-6 border-t border-rule py-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-14 lg:py-16"
            >
              {/* The row's own top border, relit in champagne. Same motif the
                  project cards use, so a hover reads as the same gesture. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold/[0.04] to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              />

              <div className="relative flex items-start gap-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-md border border-rule bg-surface shadow-[inset_0_1px_0_0_var(--edge-lip)] backdrop-blur-[12px] transition-colors duration-500 ease-out group-hover:border-edge-gold-strong">
                  <Icon
                    className="size-[1.125rem] text-text-2 transition-colors duration-500 ease-out group-hover:text-gold"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <h2 className="mt-1 font-serif text-[length:var(--heading)] font-light leading-tight tracking-[-0.015em]">
                  {service.name}
                </h2>
              </div>

              <div className="relative">
                <p className="pretty max-w-[58ch] text-[1.0625rem] font-light leading-relaxed text-text">
                  {service.premise}
                </p>

                <ul className="mt-8 grid gap-x-12 gap-y-0 sm:grid-cols-2">
                  {service.deliverables.map((item) => (
                    <li
                      key={item}
                      className="border-t border-rule py-3.5 text-sm font-light text-text-2 transition-colors duration-500 ease-out group-hover:border-rule-strong"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs font-light text-text-2">
                  <span className="text-text-2/70">Usually paired with</span>
                  {service.pairsWith.map((id) => (
                    <span
                      key={id}
                      className="rounded-full border border-rule px-2.5 py-0.5 text-[0.6875rem] transition-colors duration-500 ease-out group-hover:border-rule-strong"
                    >
                      {nameById.get(id)}
                    </span>
                  ))}
                </p>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </Section>
  );
}
