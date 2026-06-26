import { motion, useScroll } from "framer-motion";
import { Link } from "react-router-dom";
import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import SoundToggle from "@/ui/SoundToggle.jsx";
import "@/styles/nav.css";

// Homepage header. About/Contact scroll to their sections on this page; Services
// and Pricing are real routes; Book is the standout CTA, matching the hero.
export default function Nav({ onHome, onJump }) {
  const { scrollYProgress } = useScroll();
  return (
    <header className="nav">
      <motion.span
        className="nav__progress"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />
      <button className="nav__brand" onClick={onHome} aria-label="SEVERRIR — back to overview">
        <span className="nav__brand-dot" aria-hidden="true" />
        SEVERRIR
      </button>

      <nav className="nav__links" aria-label="Primary">
        <button className="nav__link nav__link--btn nav__link--hide-sm" onClick={() => onJump("about-section")}>
          About
        </button>
        <Link className="nav__link nav__link--btn" to="/services">
          Services
        </Link>
        <Link className="nav__link nav__link--btn" to="/pricing">
          Pricing
        </Link>
        <button className="nav__link nav__link--btn nav__link--hide-sm" onClick={() => onJump("contact-section")}>
          Contact
        </button>
        <Link className="nav__link nav__cta" to="/booking">
          Book
        </Link>
        <a
          className="nav__icon nav__link--hide-sm"
          href={links.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <GithubIcon />
        </a>
        <a
          className="nav__icon nav__link--hide-sm"
          href={links.youtube}
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
        >
          <YoutubeIcon />
        </a>
        <SoundToggle />
      </nav>
    </header>
  );
}
