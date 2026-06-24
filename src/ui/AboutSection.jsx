import { motion } from "framer-motion";
import { about } from "@/data/projects.js";
import "@/styles/sections.css";

// Beat 4a — the tech-stack panel. The bio narrative lives up in Beat 2 ("What
// I do"), so this beat focuses on the stack chips. Reveals as it scrolls in.
export default function AboutSection() {
  return (
    <section id="about-section" className="about-section">
      <motion.div
        className="about-section__inner"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="section-eyebrow">The Stack</span>
        <h2 className="about-section__title">What I reach for, day to day.</h2>
        <p className="about-section__bio">
          Systems developer, not an artist — I write the Luau, architecture and
          security underneath the games, not the models or builds.
        </p>

        <span className="section-eyebrow about-section__stack-label">Tech Stack</span>
        <div className="about-section__chips">
          {about.stack.map((s) => (
            <span className="tag-chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
