"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const VIEW_W = 1600;
const VIEW_H = 900;
/* Every arc is struck from one focal point below the fold, so the field reads
   as a single gravitational sweep rather than unrelated lines. */
const FOCUS_X = 1180;
const FOCUS_Y = 1420;
const LIMB_INDEX = 7;

/**
 * The atmosphere behind the hero: a family of faint contour arcs with one lit
 * champagne limb running through them.
 *
 * The whole field parallaxes a few pixels against the pointer on a heavy
 * spring, which is what sells depth — the arcs and the lit limb drift at
 * different rates, so the plane separates.
 *
 * strokeDashoffset is a repaint, not a composited property, so the arc count is
 * the cost: it is halved on coarse pointers, and the whole field is paused once
 * the hero leaves the viewport rather than animating forever behind the page.
 */
export function AmbientField() {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [coarse, setCoarse] = useState(false);

  /* Pause when the hero is off-screen — the arcs used to keep repainting for the
     whole page lifetime, long after nobody could see them. */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "96px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 42, damping: 26, mass: 1.1 });
  const sy = useSpring(py, { stiffness: 42, damping: 26, mass: 1.1 });

  const fieldX = useTransform(sx, [-1, 1], [18, -18]);
  const fieldY = useTransform(sy, [-1, 1], [12, -12]);
  const limbX = useTransform(sx, [-1, 1], [-30, 30]);
  const limbY = useTransform(sy, [-1, 1], [-20, 20]);

  /*
   * Where the lens sits, in viewBox units.
   *
   * The field is drawn at 150% of the hero and centred under a `slice` fit, so
   * the viewport only ever sees its middle — the pointer's -1..1 maps onto that
   * window, not onto the whole viewBox. The exact crop shifts a little with the
   * hero's aspect ratio; an ambient highlight does not need the last twenty
   * pixels of accuracy, and chasing them would cost a resize observer.
   *
   * It runs on the raw pointer values rather than the spring: the arcs drift
   * behind on the spring, and the lens sitting exactly under the cursor while
   * they lag is what separates the two planes.
   */
  const lensX = useTransform(px, [-1, 1], [VIEW_W * 0.19, VIEW_W * 0.81]);
  const lensY = useTransform(py, [-1, 1], [VIEW_H * 0.17, VIEW_H * 0.83]);

  useEffect(() => {
    // Touch fires pointermove only while a finger is down, so the parallax just
    // lurches; not worth the listener.
    if (reduced || coarse) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduced, coarse]);

  const arcs = useMemo(
    () =>
      Array.from({ length: coarse ? 15 : 30 }, (_, i) => {
        const r = 320 + i * (coarse ? 128 : 64);
        return {
          id: i,
          d: `M ${FOCUS_X - r} ${FOCUS_Y} A ${r} ${r} 0 0 1 ${FOCUS_X + r} ${FOCUS_Y}`,
          opacity: 0.09 + (i % 7) * 0.034,
          width: i % 6 === 0 ? 1.1 : 0.6,
          duration: 34 + (i % 9) * 6,
          length: Math.PI * r,
        };
      }),
    [coarse],
  );

  const limb = arcs[LIMB_INDEX];

  /* Off-screen behaves exactly like reduced motion: static geometry, no loops. */
  const still = reduced || !active;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Cobalt bloom spilling from the top edge. */}
      <div className="bloom absolute inset-0" />

      <motion.svg
        style={still ? undefined : { x: fieldX, y: fieldY }}
        className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {arcs.map((arc) =>
          still ? (
            <path
              key={arc.id}
              d={arc.d}
              stroke="#3E5C76"
              strokeWidth={arc.width}
              strokeOpacity={arc.opacity}
            />
          ) : (
            <motion.path
              key={arc.id}
              d={arc.d}
              stroke="#3E5C76"
              strokeWidth={arc.width}
              strokeOpacity={arc.opacity}
              strokeDasharray={`${arc.length * 0.18} ${arc.length}`}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -(arc.length * 1.18) }}
              transition={{ duration: arc.duration, ease: "linear", repeat: Infinity }}
            />
          ),
        )}

        {/*
         * The lens.
         *
         * The same arcs again, struck brighter, and visible only through a soft
         * circular mask that tracks the pointer. Moving over the field lights
         * the contours you are actually over, the way a raking light picks out
         * a surface — the page's whole vocabulary is specular, and this is that
         * idea at page scale rather than card scale.
         *
         * Free to run: one moving <circle> in a mask, no per-arc work, and it
         * is not rendered at all when the hero is off-screen or the pointer is
         * coarse.
         */}
        {!still && !coarse ? (
          <>
            <defs>
              <radialGradient id="lens-fade">
                <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <stop offset="55%" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="lens-mask">
                <motion.circle cx={lensX} cy={lensY} r={340} fill="url(#lens-fade)" />
              </mask>
            </defs>
            <g mask="url(#lens-mask)">
              {arcs.map((arc) => (
                <path
                  key={`lens-${arc.id}`}
                  d={arc.d}
                  stroke="#7FA0C4"
                  strokeWidth={arc.width * 1.3}
                  strokeOpacity={Math.min(0.5, arc.opacity * 5)}
                />
              ))}
            </g>
          </>
        ) : null}
      </motion.svg>

      {/* The lit limb: one arc carrying the champagne highlight and its bloom. */}
      <motion.svg
        style={still ? undefined : { x: limbX, y: limbY }}
        className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="limb-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
            <stop offset="42%" stopColor="#D4AF37" stopOpacity="0.75" />
            <stop offset="62%" stopColor="#E5C158" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
          <filter id="limb-bloom" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* Bloom pass under the crisp stroke. */}
        <path
          d={limb.d}
          stroke="url(#limb-grad)"
          strokeWidth={9}
          strokeOpacity={0.5}
          filter="url(#limb-bloom)"
        />
        <path d={limb.d} stroke="url(#limb-grad)" strokeWidth={1.3} />
      </motion.svg>

      {/* Settle the field back into the page so it never competes with type. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_52%_46%_at_50%_46%,var(--bg)_0%,transparent_76%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}
