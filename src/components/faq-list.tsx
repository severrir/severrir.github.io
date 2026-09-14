"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { faq } from "@/data/faq";
import { EASE, Section, SectionHeading } from "./ui";
import { useSound } from "@/lib/useSound";

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  const sound = useSound();
  const reduced = useReducedMotion();

  return (
    <Section id="faq">
      <SectionHeading title="Good questions, answered." />

      <div className="space-y-px">
        {faq.map((item, index) => {
          const expanded = open === index;
          const panelId = `faq-panel-${index}`;

          return (
            <div
              key={item.question}
              /* The border is always present and only changes colour, so
                 lighting an item cannot shift the rows below it. */
              className={`relative rounded-md border px-5 transition-[background-color,border-color] duration-500 ease-out sm:px-6 ${
                expanded
                  ? "border-edge-gold bg-surface shadow-[inset_0_1px_0_0_var(--edge-lip)] backdrop-blur-[12px]"
                  : "border-transparent border-b-rule"
              }`}
            >
              {expanded ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent sm:inset-x-6"
                />
              ) : null}

              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : index)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                  {...sound}
                >
                  <span
                    className={`text-[1.0625rem] font-light leading-snug transition-colors duration-200 ${
                      expanded ? "text-text" : "text-text-2 group-hover:text-text"
                    }`}
                  >
                    {item.question}
                  </span>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-[3px] border transition-colors duration-200 ${
                      expanded
                        ? "border-edge-gold-strong text-gold"
                        : "border-rule text-text-2 group-hover:border-rule-strong group-hover:text-text"
                    }`}
                  >
                    {expanded ? (
                      <Minus className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Plus className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    id={panelId}
                    key="panel"
                    /* The CSS reduced-motion block only clamps CSS durations —
                       framer-motion drives this through WAAPI, so it has to be
                       gated here too. */
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={reduced ? undefined : { height: "auto", opacity: 1 }}
                    exit={reduced ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="max-w-[62ch] pb-9 pr-10 text-[0.9375rem] font-light leading-relaxed text-text-2">
                      <p className="pretty">{item.answer}</p>

                      {item.options ? (
                        <ul className="mt-5 space-y-2">
                          {item.options.map((option) => (
                            <li key={option} className="flex gap-3">
                              <span
                                aria-hidden="true"
                                className="mt-[0.55rem] h-px w-3 shrink-0 bg-gold/40"
                              />
                              <span>{option}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {/* Numbered because the order is the answer. */}
                      {item.steps ? (
                        <ol className="mt-5 space-y-3">
                          {item.steps.map((step, stepIndex) => (
                            <li key={step} className="flex gap-4">
                              <span className="tabular mt-px shrink-0 font-mono text-xs text-text">
                                {String(stepIndex + 1).padStart(2, "0")}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
