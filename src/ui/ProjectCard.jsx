import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowIcon, CloseIcon, CodeIcon, GithubIcon, PlayIcon } from "@/ui/icons.jsx";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/projects.css";

// Lazy so the card's mini 3D canvas (and three.js) stay out of the initial
// bundle; by the time a card can open, the main Scene chunk has already loaded.
const MiniPlanet = lazy(() => import("@/scene/MiniPlanet.jsx"));

// Turn a YouTube watch/share URL into an autoplay embed URL for the lightbox.
function youTubeEmbed(url) {
  if (!url) return null;
  let id = null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else id = u.searchParams.get("v");
  } catch {
    /* not a parseable URL */
  }
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}

export default function ProjectCard({ project, index, total, origin, phase, onClose, onNext, onPrev }) {
  const cardRef = useRef();
  const closeRef = useRef();
  const [shown, setShown] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");
  const [showVideo, setShowVideo] = useState(false);
  const embed = youTubeEmbed(project.demo);
  const isClosing = useRef(false);

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

  // Close the video when switching projects or closing the card.
  useEffect(() => setShowVideo(false), [project.id, phase]);

  // Reset close flag when card opens/changes
  useEffect(() => {
    if (phase === "in") {
      isClosing.current = false;
    }
  }, [phase, project.id]);

  // Direct close button handler to ensure it always works
  const handleDirectClose = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosing.current) return; // prevent multiple rapid clicks
    isClosing.current = true;
    onClose();
    // Failsafe: reset flag after 1 second in case close handler doesn't complete
    setTimeout(() => { if (phase === "in") isClosing.current = false; }, 1000);
  }, [onClose, phase]);

  // While the video is open, Esc closes it first (capture phase) instead of the
  // whole card, so one tap backs out one level at a time.
  useEffect(() => {
    if (!showVideo) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setShowVideo(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [showVideo]);

  const accent = project.visual.rimColor;

  return (
    <aside
      ref={cardRef}
      className={`card ${shown ? "is-shown" : ""}`}
      style={{ "--accent": accent, transformOrigin }}
      aria-label={`${project.title} details`}
    >
      <span className="panel-bracket panel-bracket--tl" aria-hidden="true" />
      <span className="panel-bracket panel-bracket--tr" aria-hidden="true" />
      <span className="panel-bracket panel-bracket--bl" aria-hidden="true" />
      <span className="panel-bracket panel-bracket--br" aria-hidden="true" />

      <div className="card__stage">
        <Suspense fallback={null}>
          <MiniPlanet visual={project.visual} />
        </Suspense>
        <div className="card__stage-fade" />
        <span className="card__index">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          ref={closeRef}
          className="card__close"
          onClick={handleDirectClose}
          onPointerDown={handleDirectClose}
          aria-label="Close project"
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="card__body">
        <div className="card__meta">
          <span className="card__blurb">{project.blurb}</span>
          <span className="card__sys">
            SYS 0{index + 1} <span className="card__sys-sep">//</span> {project.id}
          </span>
        </div>
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
          {embed ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                audio.click();
                setShowVideo(true);
              }}
            >
              <PlayIcon /> Watch Demo
            </button>
          ) : (
            <a className="btn btn-primary" href={project.demo} target="_blank" rel="noreferrer">
              <PlayIcon /> Watch Demo
            </a>
          )}
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

      {showVideo &&
        embed &&
        createPortal(
          <div
            className="card__video"
            role="dialog"
            aria-label={`${project.title} demo video`}
            onClick={() => setShowVideo(false)}
          >
            <div className="card__video-stage" onClick={(e) => e.stopPropagation()}>
              <button
                className="card__video-close"
                onClick={() => setShowVideo(false)}
                aria-label="Close video"
              >
                <CloseIcon />
              </button>
              <span className="card__video-tag">
                <span className="card__video-tag-dot" aria-hidden="true" />
                DEMO FEED <span className="card__sys-sep">//</span> {project.id.toUpperCase()}
              </span>
              <div className="card__video-frame">
                <iframe
                  src={embed}
                  title={`${project.title} demo`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <span className="panel-bracket panel-bracket--tl" aria-hidden="true" />
              <span className="panel-bracket panel-bracket--tr" aria-hidden="true" />
              <span className="panel-bracket panel-bracket--bl" aria-hidden="true" />
              <span className="panel-bracket panel-bracket--br" aria-hidden="true" />
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
