import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollCue from "@/ui/ScrollCue.jsx";
import "@/styles/beats.css";

// Beat 3 — the full interactive solar system. This overlay is deliberately
// near-empty (and pointer-transparent) so the planets behind it stay clickable;
// the onboarding hint handles the "click a planet" cue. It only frames the beat
// and offers a way onward to the About/Contact beats.
export default function SystemBeat({ onNext }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} id="beat-system" className="beat beat--system" aria-label="The work">
      <motion.div className="beat-system__head" style={{ opacity }}>
        <span className="section-eyebrow">The Work</span>
        <p className="beat-system__hint">Six systems in orbit — click a planet to fly in.</p>
      </motion.div>

      <ScrollCue label="More" onClick={onNext} />
    </section>
  );
}
