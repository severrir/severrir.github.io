import { motion } from "framer-motion";
import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import "@/styles/sections.css";

export default function ContactSection() {
  return (
    <section id="contact-section" className="contact-section">
      <motion.div
        className="contact-section__inner"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="section-eyebrow">Contact</span>
        <h2 className="contact-section__title">Let's build something that ships.</h2>
        <p className="contact-section__sub">
          Open to Roblox systems work — anticheat, combat, NPC AI, or
          backend architecture. Code and demos are public.
        </p>

        <div className="contact-section__cta">
          <a className="btn btn-primary" href={links.github} target="_blank" rel="noreferrer">
            <GithubIcon /> GitHub
          </a>
          <a className="btn btn-ghost" href={links.youtube} target="_blank" rel="noreferrer">
            <YoutubeIcon /> YouTube
          </a>
        </div>

        <span className="contact-section__credit">© 2026 SEVERRIR — Roblox Systems Developer</span>
      </motion.div>
    </section>
  );
}
