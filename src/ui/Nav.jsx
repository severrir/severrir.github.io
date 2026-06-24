import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import "@/styles/nav.css";

export default function Nav({ onHome, onJump }) {
  return (
    <header className="nav">
      <button className="nav__brand" onClick={onHome} aria-label="SEVERRIR — back to overview">
        <span className="nav__brand-dot" aria-hidden="true" />
        SEVERRIR
      </button>

      <nav className="nav__links" aria-label="Primary">
        <button className="nav__link nav__link--btn" onClick={() => onJump("about-section")}>
          About
        </button>
        <button className="nav__link nav__link--btn" onClick={() => onJump("contact-section")}>
          Contact
        </button>
        <a
          className="nav__icon"
          href={links.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <GithubIcon />
        </a>
        <a
          className="nav__icon"
          href={links.youtube}
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
        >
          <YoutubeIcon />
        </a>
      </nav>
    </header>
  );
}
