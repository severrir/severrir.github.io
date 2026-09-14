"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "../ui";

/**
 * Three shapes orbiting a shared centre, each morphing circle to squircle a
 * beat out of phase with the next.
 *
 * The morph is a border-radius interpolation on a rotating wrapper, so the
 * shape appears to tumble and soften at once. One is champagne; the others stay
 * bone, so the cluster has a focal point instead of reading as a plain spinner.
 */
const ORBIT = 15;
const SHAPES = [
  { size: 13, color: "#F8FAFC", delay: 0 },
  { size: 17, color: "#D4AF37", delay: 0.22 },
  { size: 11, color: "#94A3B8", delay: 0.44 },
];

export function MorphLoader({ label = "Loading" }: { label?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative size-[70px]"
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      {SHAPES.map((shape, i) => {
        const angle = (i / SHAPES.length) * Math.PI * 2;
        const x = Math.cos(angle) * ORBIT;
        const y = Math.sin(angle) * ORBIT;

        if (reduced) {
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                width: shape.size,
                height: shape.size,
                background: shape.color,
                borderRadius: 4,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            />
          );
        }

        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: shape.size,
              height: shape.size,
              background: shape.color,
              marginLeft: -shape.size / 2,
              marginTop: -shape.size / 2,
            }}
            animate={{
              x: [x, -y, -x, y, x],
              y: [y, x, -y, -x, y],
              borderRadius: ["50%", "22%", "50%", "22%", "50%"],
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 0.82, 1, 0.82, 1],
            }}
            transition={{
              duration: 2.6,
              ease: EASE,
              repeat: Infinity,
              delay: shape.delay,
            }}
          />
        );
      })}
    </div>
  );
}
