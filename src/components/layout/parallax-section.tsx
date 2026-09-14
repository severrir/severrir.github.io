"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Structural lines that drift against the scroll behind a section.
 *
 * Two layers at different rates: vertical column rules moving slowly, a single
 * champagne hairline moving faster. The rate difference is the whole effect —
 * one layer alone just looks like a slow scroll.
 */
export function ParallaxSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const slow = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const fast = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {!reduced ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y: slow }}
            className="absolute inset-x-0 -inset-y-[10%] mx-auto max-w-6xl px-[var(--gutter)]"
          >
            <div className="grid h-full grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-full border-l border-rule/35" />
              ))}
            </div>
          </motion.div>

          <motion.span
            style={{ y: fast, opacity: fade }}
            className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent"
          />
        </div>
      ) : null}

      <div className="relative">{children}</div>
    </div>
  );
}
