import { Link } from "react-router-dom";
import { links } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import { audio } from "@/audio/audioEngine.js";

// Shared subpage footer — quiet, consistent across Services / Pricing / Booking.
export default function PageFooter() {
  return (
    <footer className="page-footer">
      <div className="page-footer__nav">
        <Link className="page-footer__link" to="/" onClick={() => audio.click()}>
          Work
        </Link>
        <Link className="page-footer__link" to="/services" onClick={() => audio.click()}>
          Services
        </Link>
        <Link className="page-footer__link" to="/pricing" onClick={() => audio.click()}>
          Pricing
        </Link>
        <Link className="page-footer__link" to="/booking" onClick={() => audio.click()}>
          Book
        </Link>
      </div>
      <div className="page-footer__icons">
        <a href={links.github} target="_blank" rel="noreferrer" className="nav__icon" aria-label="GitHub">
          <GithubIcon />
        </a>
        <a href={links.youtube} target="_blank" rel="noreferrer" className="nav__icon" aria-label="YouTube">
          <YoutubeIcon />
        </a>
      </div>
      <span className="page-footer__credit">© 2026 SEVERRIR — Roblox Systems Developer</span>
    </footer>
  );
}
