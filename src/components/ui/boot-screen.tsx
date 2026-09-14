"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "../ui";
import { MorphLoader } from "./morph-loader";

const MIN_VISIBLE_MS = 900;
const SESSION_KEY = "severrir:booted";

/**
 * First-load curtain. Holds the morph mark over the shell until fonts and the
 * first paint have settled, then lifts.
 *
 * It shows once per tab: a curtain on every client-side navigation would be
 * theatre, and it would make the site feel slower than it is. If JavaScript
 * never runs, the curtain never mounts and the page is simply there.
 */
export function BootScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let booted = false;
    try {
      booted = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* Private mode: fall through and just show it. */
    }
    if (booted) return;

    setVisible(true);
    document.body.style.overflow = "hidden";

    const start = performance.now();
    const finish = () => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - start));
      window.setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = "";
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* Nothing to persist to; the curtain just shows again next load. */
        }
      }, remaining);
    };

    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(finish).catch(finish);

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.75, ease: EASE }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg"
        >
          <div className="bloom absolute inset-0" />
          <div className="relative flex flex-col items-center">
            <MorphLoader label="Loading severrir" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              className="mt-10 font-serif text-lg font-light tracking-[-0.02em] text-text"
            >
              severrir
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
