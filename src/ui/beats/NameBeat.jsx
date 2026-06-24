import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollCue from "@/ui/ScrollCue.jsx";
import "@/styles/beats.css";

const NAME = "SEVERRIR";
const EASE = [0.22, 1, 0.36, 1];

// Beat 1 — name only, overlaid on the wide cinematic shot of the system.
// The wordmark settles in letter-by-letter (rise + de-blur), then the whole
// block parallaxes and fades as the user scrolls toward Beat 2.
export default function NameBeat({ visible, onNext }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section ref={ref} id="beat-name" className="beat beat--name" aria-label="Intro">
      <motion.div className="beat-name__inner" style={{ opacity, y, scale }}>
        <motion.span
          className="beat-name__eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        >
          Roblox Systems Developer
        </motion.span>

        <h1 className="beat-name__title" aria-label={NAME}>
          {NAME.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="beat-name__char"
              aria-hidden="true"
              initial={{ opacity: 0, y: 30, filter: "blur(14px)" }}
              animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
              transition={{ duration: 0.85, delay: 0.3 + i * 0.06, ease: EASE }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="beat-name__tagline"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1, ease: EASE }}
        >
          Luau · modular game systems · anticheat · combat · NPC AI
        </motion.p>
      </motion.div>

      <ScrollCue label="Scroll" onClick={onNext} />
    </section>
  );
}
