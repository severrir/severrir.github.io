import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import "@/styles/sections.css";

export default function ContactSection() {
  return (
    <section id="contact-section" className="contact-section">
      <div className="contact-section__inner">
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
      </div>
    </section>
  );
}
