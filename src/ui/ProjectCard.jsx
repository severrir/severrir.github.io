import { useLayoutEffect, useRef, useState } from "react";
import MiniPlanet from "@/scene/MiniPlanet.jsx";
import { ArrowIcon, CloseIcon, CodeIcon, GithubIcon, PlayIcon } from "@/ui/icons.jsx";
import "@/styles/projects.css";

export default function ProjectCard({ project, index, total, origin, phase, onClose, onNext, onPrev }) {
  const cardRef = useRef();
  const [shown, setShown] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");

  // Grow out of (and collapse back toward) the planet's on-screen position.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (el && origin) {
      const r = el.getBoundingClientRect();
      setTransformOrigin(`${origin.x - r.left}px ${origin.y - r.top}px`);
    } else {
      setTransformOrigin("50% 50%");
    }
  }, [origin, project.id]);

  useLayoutEffect(() => {
    if (phase === "out") {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [phase, project.id]);

  const accent = project.visual.rimColor;

  return (
    <aside
      ref={cardRef}
      className={`card ${shown ? "is-shown" : ""}`}
      style={{ "--accent": accent, transformOrigin }}
      aria-label={`${project.title} details`}
    >
      <div className="card__stage">
        <MiniPlanet visual={project.visual} />
        <div className="card__stage-fade" />
        <span className="card__index">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button className="card__close" onClick={onClose} aria-label="Close project">
          <CloseIcon />
        </button>
      </div>

      <div className="card__body">
        <span className="card__blurb">{project.blurb}</span>
        <h2 className="card__title">{project.title}</h2>

        <div className="card__tags">
          {project.tags.map((t) => (
            <span className="tag-chip" key={t}>
              {t}
            </span>
          ))}
        </div>

        <p className="card__desc">{project.description}</p>

        <div className="card__actions">
          <a className="btn btn-primary" href={project.demo} target="_blank" rel="noreferrer">
            <PlayIcon /> Watch Demo
          </a>
          {project.repo && (
            <a className="btn btn-ghost" href={project.repo} target="_blank" rel="noreferrer">
              <CodeIcon /> View Code
            </a>
          )}
        </div>

        <div className="card__nav">
          <button className="card__nav-btn" onClick={onPrev} aria-label="Previous project">
            <ArrowIcon size={14} /> Prev
          </button>
          {project.repo ? (
            <a
              className="card__repo-link"
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub repository"
            >
              <GithubIcon size={15} /> Repo
            </a>
          ) : (
            <span className="card__repo-link is-muted">No public repo</span>
          )}
          <button className="card__nav-btn" onClick={onNext} aria-label="Next project">
            Next <ArrowIcon size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
