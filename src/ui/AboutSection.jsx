import { about } from "@/data/projects.js";
import "@/styles/sections.css";

// A real, scrollable section — not a popup — so the site reads as a full
// portfolio with substance behind the 3D centerpiece, not just a demo.
export default function AboutSection() {
  return (
    <section id="about-section" className="about-section">
      <div className="about-section__inner">
        <span className="section-eyebrow">About</span>
        <h2 className="about-section__title">Systems developer, not an artist.</h2>
        <p className="about-section__bio">{about.bio}</p>

        <span className="section-eyebrow about-section__stack-label">Tech Stack</span>
        <div className="about-section__chips">
          {about.stack.map((s) => (
            <span className="tag-chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
