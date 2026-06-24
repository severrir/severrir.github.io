import { links, projects } from "@/data/projects.js";
import { GithubIcon, YoutubeIcon } from "@/ui/icons.jsx";
import "@/styles/hero.css";

// Hero sits over the sun on the overview state. The "systems dock" below it
// lets visitors select any planet by name — essential on mobile where the
// orbiting spheres are small tap targets.
export default function Hero({ visible, onSelect, activeIndex }) {
  return (
    <section className={`hero ${visible ? "is-visible" : "is-hidden"}`} aria-hidden={!visible}>
      <div className="hero__center">
        <span className="hero__eyebrow">Roblox Systems Developer</span>
        <h1 className="hero__title">SEVERRIR</h1>
        <p className="hero__tagline">
          I write Luau and build modular, production-grade game systems —
          anticheat, combat, NPC state machines and AI integration.
          <br />
          Every project below is a planet. Pick one to fly in.
        </p>

        <div className="hero__cta">
          <a className="btn btn-primary" href={links.github} target="_blank" rel="noreferrer">
            <GithubIcon /> GitHub
          </a>
          <a className="btn btn-ghost" href={links.youtube} target="_blank" rel="noreferrer">
            <YoutubeIcon /> YouTube
          </a>
        </div>
      </div>

      <div className="hero__dock" role="group" aria-label="Select a project">
        <span className="hero__dock-label">Systems</span>
        <div className="hero__dock-row">
          {projects.map((p, i) => (
            <button
              key={p.id}
              className={`hero__dock-chip ${activeIndex === i ? "is-active" : ""}`}
              onClick={() => onSelect(i)}
              style={{ "--chip": p.visual.rimColor }}
            >
              <span className="hero__dock-orb" style={{ background: p.visual.rimColor }} />
              {p.title}
            </button>
          ))}
        </div>

        <a className="hero__more" href="#about-section">
          More about SEVERRIR
          <span className="hero__more-chevron" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
