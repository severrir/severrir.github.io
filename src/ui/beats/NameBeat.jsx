import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollCue from "@/ui/ScrollCue.jsx";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/beats.css";

// The hero planet is its own small canvas — lazy so it never blocks the loader.
const HeroPlanet = lazy(() => import("@/ui/HeroPlanet.jsx"));

const NAME = "SEVERRIR";
const EASE = [0.22, 1, 0.36, 1];

// Beat 1 — name + the standout "Book a Consultation" CTA, overlaid on the wide
// cinematic shot of the system. The wordmark sits just left of centre to make
// room for a small interactive planet on the right; both parallax and fade as
// the user scrolls toward Beat 2.
export default function NameBeat({ visible, onNext, onBook }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const planetOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const planetY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  // Mount the second (hero-planet) canvas a beat AFTER the entrance reveals, so
  // its shader compile never competes with the camera fly-in — keeping the
  // entrance smooth. It then fades in via CSS (heroPlanetIn).
  const [showPlanet, setShowPlanet] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setShowPlanet(true), 850);
    return () => clearTimeout(t);
  }, [visible]);

  const book = () => {
    audio.click();
    onBook?.();
  };

  return (
    <section ref={ref} id="beat-name" className="beat beat--name" aria-label="Intro">
      <motion.div className="beat-name__inner" style={{ opacity, y, scale }}>
        <motion.span
          className="beat-name__eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.7, delay: visible ? 0.1 : 0, ease: EASE }}
        >
          Roblox Systems Developer
        </motion.span>

        <h1 className="beat-name__title" aria-label={NAME}>
          {NAME.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="beat-name__char"
              aria-hidden="true"
              style={{ "--i": i }}
              initial={{ opacity: 0, y: 44, filter: "blur(18px)" }}
              animate={
                visible
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0, y: 44, filter: "blur(18px)" }
              }
              transition={{ duration: 0.95, delay: visible ? 0.25 + i * 0.085 : 0, ease: EASE }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="beat-name__tagline"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: visible ? 1 : 0, ease: EASE }}
        >
          Luau · modular game systems · anticheat · combat · NPC AI
        </motion.p>

        <motion.div
          className="beat-name__cta"
          initial={{ opacity: 0, y: 14 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.8, delay: visible ? 1.15 : 0, ease: EASE }}
        >
          <button className="btn btn-primary" type="button" onClick={book}>
            Book a Consultation
          </button>
          <button className="btn btn-ghost" type="button" onClick={onNext}>
            Explore the work
          </button>
        </motion.div>
      </motion.div>

      <motion.div className="beat-name__planet" style={{ opacity: planetOpacity, y: planetY }}>
        {showPlanet && (
          <Suspense fallback={null}>
            <HeroPlanet />
          </Suspense>
        )}
      </motion.div>

      <ScrollCue label="Scroll" onClick={onNext} />
    </section>
  );
}
