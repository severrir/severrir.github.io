import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { about } from "@/data/projects.js";
import ScrollCue from "@/ui/ScrollCue.jsx";
import "@/styles/beats.css";

// Beat 2 — who SEVERRIR is / what he builds. The camera frames the spinning
// system to the right (see cameraStages 'mini'); this copy sits on the left.
export default function WhatIDoBeat({ onNext }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.22, 0.78, 1], [0, 1, 1, 0]);
  const x = useTransform(scrollYProgress, [0, 0.3], [-48, 0]);

  return (
    <section ref={ref} id="beat-what" className="beat beat--what" aria-label="What I do">
      <motion.div className="beat-what__inner" style={{ opacity, x }}>
        <span className="section-eyebrow">What I do</span>
        <h2 className="beat-what__title">I build the systems games run on.</h2>
        <p className="beat-what__bio">{about.bio}</p>
        <ScrollCue label="Enter the system" onClick={onNext} />
      </motion.div>
    </section>
  );
}
