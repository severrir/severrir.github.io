import { NavLink, Link } from "react-router-dom";
import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import SoundToggle from "@/ui/SoundToggle.jsx";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/nav.css";

// Shared header for the subpages (Services / Pricing / Booking). Mirrors the
// homepage nav so the site feels like one piece; "Work" returns to the
// homepage solar system, Book is the standout CTA.
export default function PageNav() {
  const click = () => audio.click();
  return (
    <header className="nav nav--page">
      <Link className="nav__brand" to="/" aria-label="SEVERRIR — home" onClick={click}>
        <span className="nav__brand-dot" aria-hidden="true" />
        SEVERRIR
      </Link>

      <nav className="nav__links" aria-label="Primary">
        <NavLink className="nav__link nav__link--btn nav__link--hide-sm" to="/" onClick={click}>
          Work
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav__link nav__link--btn ${isActive ? "is-active" : ""}`}
          to="/services"
          onClick={click}
        >
          Services
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav__link nav__link--btn ${isActive ? "is-active" : ""}`}
          to="/pricing"
          onClick={click}
        >
          Pricing
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav__link nav__cta ${isActive ? "is-active" : ""}`}
          to="/booking"
          onClick={click}
        >
          Book
        </NavLink>
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
