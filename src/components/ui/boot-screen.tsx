"use client";

import { useEffect } from "react";
import { MorphLoader } from "./morph-loader";

const STORAGE_KEY = "severrir:booted";

/**
 * First-visit curtain.
 *
 * The markup here is server-rendered and hidden by default; the inline script in
 * the root layout decides before first paint whether to reveal it by setting
 * data-booting on <html>. That ordering is the whole point — the previous
 * version started hidden and flipped itself on in an effect, so the curtain
 * dropped over content the visitor could already see and made a fast page feel
 * slow. No script means no attribute, so a JS-less visitor simply gets the page.
 *
 * It lifts as soon as fonts settle, with no artificial floor, and is gated to
 * once per visitor rather than once per tab.
 */
export function BootScreen() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-booting")) return;

    let lifted = false;
    const lift = () => {
      if (lifted) return;
      lifted = true;
      root.setAttribute("data-booting", "out");
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* Private mode: the curtain simply shows again next visit. */
      }
      window.setTimeout(() => root.removeAttribute("data-booting"), 650);
    };

    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(lift).catch(lift);
    // Never hold the page hostage if fonts.ready never settles.
    const bail = window.setTimeout(lift, 2000);
    return () => window.clearTimeout(bail);
  }, []);

  return (
    <div className="boot-curtain" aria-hidden="true">
      <div className="bloom absolute inset-0" />
      <div className="relative flex flex-col items-center">
        <MorphLoader label="Loading severrir" />
        <p className="mt-10 font-serif text-lg font-light tracking-[-0.02em] text-text">
          severrir
        </p>
      </div>
    </div>
  );
}
