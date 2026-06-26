import { useState } from "react";
import { motion } from "framer-motion";
import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import "@/styles/sections.css";

export default function ContactSection({ onBook }) {
  const [copied, setCopied] = useState(false);
  const copyDiscord = () => {
    navigator.clipboard?.writeText(links.discord).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {}
    );
  };
  return (
    <section id="contact-section" className="contact-section">
      <motion.div
        className="contact-section__inner"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="panel-bracket panel-bracket--tl" aria-hidden="true" />
        <span className="panel-bracket panel-bracket--tr" aria-hidden="true" />
        <span className="panel-bracket panel-bracket--bl" aria-hidden="true" />
        <span className="panel-bracket panel-bracket--br" aria-hidden="true" />
        <span className="contact-section__signal">
          <span className="contact-section__sig-dot" aria-hidden="true" />
          Transmission open
        </span>
        <h2 className="contact-section__title">Let's build something that ships.</h2>
        <p className="contact-section__sub">
          Open to Roblox systems work — anticheat, combat, NPC AI, or
          backend architecture. Code and demos are public.
        </p>

        <div className="contact-section__cta">
          <button className="btn btn-primary" onClick={onBook} type="button">
            Book a Consultation
          </button>
          <a className="btn btn-ghost" href={links.github} target="_blank" rel="noreferrer">
            <GithubIcon /> GitHub
          </a>
          <a className="btn btn-ghost" href={links.youtube} target="_blank" rel="noreferrer">
            <YoutubeIcon /> YouTube
          </a>
          <button className="btn btn-ghost" onClick={copyDiscord} type="button">
            {copied ? "Copied!" : `Discord · ${links.discord}`}
          </button>
        </div>

        <span className="contact-section__credit">© 2026 SEVERRIR — Roblox Systems Developer</span>
      </motion.div>
    </section>
  );
}
