"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * Writes the pointer's position on a surface as `--mx` / `--my`, which the
 * `.lume` rules in globals.css use to place the travelling highlight.
 *
 * Written straight to the element's style rather than through React state:
 * this fires on every pointermove, and a re-render per frame to move a
 * gradient is the wrong trade. One rAF coalesces bursts of events into a
 * single write, and the element comes from the event itself, so no component
 * has to hold a ref for it.
 *
 * Returns no handler at all on a coarse pointer. There is nothing to follow on
 * a phone, the CSS is hover-gated anyway, and a listener that can never produce
 * a visible result is just battery.
 */
export function useSpecular<T extends HTMLElement = HTMLElement>() {
  const frame = useRef(0);
  const next = useRef({ x: 50, y: 50 });
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const track = useCallback((event: ReactPointerEvent<T>) => {
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    next.current = {
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      el.style.setProperty("--mx", `${next.current.x.toFixed(2)}%`);
      el.style.setProperty("--my", `${next.current.y.toFixed(2)}%`);
    });
  }, []);

  return fine ? track : undefined;
}
