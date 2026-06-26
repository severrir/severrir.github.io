import "@/styles/hud.css";

// Mission-control framing over the whole viewport: corner brackets, a thin
// status line, faint scanlines, and cinematic letterbox bars that slide in
// during the opening fly-in and whenever a project card is open. Purely
// decorative — pointer-events: none so it never blocks the scene or UI.
export default function HudFrame({ letterbox, statusRight }) {
  return (
    <div className="hud" aria-hidden="true">
      <div className="hud__scanlines" />

      <span className="hud__corner hud__corner--tl" />
      <span className="hud__corner hud__corner--tr" />
      <span className="hud__corner hud__corner--bl" />
      <span className="hud__corner hud__corner--br" />

      <div className="hud__status">
        <span className="hud__dot" />
        SYS.SEVERRIR <span className="hud__sep">//</span> 6 PROJECTS ONLINE
      </div>
      <div className="hud__status hud__status--right">{statusRight || "OVERVIEW"}</div>

      <div className={`hud__bars ${letterbox ? "is-on" : ""}`}>
        <span className="hud__bar hud__bar--top" />
        <span className="hud__bar hud__bar--bottom" />
      </div>
    </div>
  );
}
