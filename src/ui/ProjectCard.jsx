import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowIcon, CloseIcon, CodeIcon, GithubIcon, PlayIcon } from "@/ui/icons.jsx";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/projects.css";

const MiniPlanet = lazy(() => import("@/scene/MiniPlanet.jsx"));

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
  const closeButtonRef = useRef();

  const [shown, setShown] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");
  const [showVideo, setShowVideo] = useState(false);

  const embed = youTubeEmbed(project.demo);

  // Track if close handler is in flight to prevent rapid re-triggers
  const closeInFlight = useRef(false);

  // Calculate transform origin for card growth animation
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (el && origin) {
      const r = el.getBoundingClientRect();
      setTransformOrigin(`${origin.x - r.left}px ${origin.y - r.top}px`);
    } else {
      setTransformOrigin("50% 50%");
    }
  }, [origin, project.id]);

  // Handle visibility based on phase
  useLayoutEffect(() => {
    if (phase === "out") {
      setShown(false);
      closeInFlight.current = false;
      return;
    }
    // Defer visibility to next frame to ensure CSS animations work correctly
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [phase, project.id]);

  // Close video when project changes or card closes
  useEffect(() => {
    setShowVideo(false);
  }, [project.id, phase]);

  // CLOSE BUTTON: Single, direct handler with guard against re-entry
  // This is called BOTH by click and by keyboard (Escape key)
  const handleClose = () => {
    // Guard: if close is already in flight, ignore subsequent calls
    if (closeInFlight.current) {
      return;
    }
    closeInFlight.current = true;

    // Call parent's close handler — it drives the state update
    onClose();
  };

  // Attach close button handler directly to DOM element to ensure it always works
  // This runs once when the component mounts and properly cleans up
  useEffect(() => {
    const button = closeButtonRef.current;
    if (!button) return;

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    };

    // Use capture phase to ensure we catch the click before other handlers
    button.addEventListener("click", handleClick, { capture: true });
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    });

    return () => {
      button.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  // Keyboard shortcut: Escape to close (but only when card is shown and video is not open)
  useEffect(() => {
    if (!shown || showVideo) return;

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeydown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeydown, { capture: true });
    };
  }, [shown, showVideo]);

  // Video escape key: closes video first before closing card
  useEffect(() => {
    if (!showVideo) return;

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        setShowVideo(false);
      }
    };

    window.addEventListener("keydown", handleKeydown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeydown, { capture: true });
    };
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
          ref={closeButtonRef}
          className="card__close"
          aria-label="Close project"
          type="button"
          tabIndex={0}
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
              type="button"
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
          <button className="card__nav-btn" type="button" onClick={onPrev} aria-label="Previous project">
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
          <button className="card__nav-btn" type="button" onClick={onNext} aria-label="Next project">
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
                type="button"
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
