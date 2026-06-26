import { cn } from "@/lib/utils.js";
import "@/styles/loader.css";

// The six project planets, drawn straight from the scene palette, each on its
// own orbit and drifting at its own rate — a miniature of the real system.
const PLANETS = [
  { r: 26, size: 2.6, color: "#4a90d9", dur: "7s", delay: "-1s" },
  { r: 40, size: 3.4, color: "#e8453c", dur: "9s", delay: "-3.5s" },
  { r: 55, size: 4.4, color: "#d9a24a", dur: "11s", delay: "-2s" },
  { r: 69, size: 2.8, color: "#b45ee0", dur: "13s", delay: "-6s" },
  { r: 83, size: 3.2, color: "#a8e8f0", dur: "15s", delay: "-9s" },
  { r: 95, size: 3.6, color: "#5ee6e0", dur: "18s", delay: "-4s" },
];

// Loading screen — a living miniature solar system: the sun ignites at center,
// each orbit ring traces itself, then six planets settle onto their lanes and
// drift. Once the scene is ready it offers an Enter button (that click also
// unlocks audio so the entry swish can play). Cross-fades into the reveal.
export function BoxLoader({ className, ready, onEnter }) {
  return (
    <div className={cn("loader", className)} role="status" aria-live="polite">
      <div className="loader__stars" aria-hidden="true" />

      <div className="loader__system" aria-hidden="true">
        {/* tilted plane → the flat SVG reads as a solar system seen at an angle */}
        <div className="loader__plane">
          <svg viewBox="0 0 200 200" className="loader__svg">
            {/* orbit rings tracing themselves */}
            {PLANETS.map((p, i) => (
              <circle
                key={`ring-${i}`}
                className="loader__ring"
                cx="100"
                cy="100"
                r={p.r}
                pathLength="1"
                style={{ "--c": p.color, "--d": `${0.05 + i * 0.07}s` }}
              />
            ))}
            {/* planets riding their lanes (the tilt makes them sweep ellipses) */}
            {PLANETS.map((p, i) => (
              <g
                key={`planet-${i}`}
                className="loader__o"
                style={{ "--dur": p.dur, "--delay": p.delay }}
              >
                <circle
                  className="loader__p"
                  cx="100"
                  cy={100 - p.r}
                  r={p.size}
                  style={{ fill: p.color, "--c": p.color }}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* round sun on top, kept face-on so the tilt only affects the orbits */}
        <div className="loader__sun3d" />
      </div>

      <div className="loader__brand">
        <span className="loader__name">SEVERRIR</span>
        {ready ? (
          <button className="loader__enter-btn" type="button" onClick={onEnter}>
            Enter
          </button>
        ) : (
          <span className="loader__label">
            entering orbit
            <span className="loader__dots">
              <i />
              <i />
              <i />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export default BoxLoader;
