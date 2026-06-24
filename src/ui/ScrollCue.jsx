import { motion } from "framer-motion";

// Minimal "scroll down" affordance shown at the bottom of each beat. Clicking
// it smooth-scrolls to the next beat (via Lenis, passed as onClick), but it is
// purely a convenience — the user can free-scroll at any time.
export default function ScrollCue({ label = "Scroll", onClick }) {
  return (
    <motion.button
      type="button"
      className="scroll-cue"
      onClick={onClick}
      aria-label="Scroll to next section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      {label && <span className="scroll-cue__label">{label}</span>}
      <span className="scroll-cue__chevron" aria-hidden="true" />
    </motion.button>
  );
}
