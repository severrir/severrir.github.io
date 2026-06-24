import { cn } from "@/lib/utils.js";
import "@/styles/loader.css";

// Loading screen — the first frame of the solar system itself: the sun quietly
// ignites at center while a single thin orbit ring traces itself and a planet
// settles onto its lane. Palette is drawn straight from the scene (deep teal
// space, teal-white sun, mint planet). Cross-fades into the reveal.
export function BoxLoader({ className }) {
  return (
    <div className={cn("loader", className)} role="status" aria-live="polite">
      <div className="loader__stars" aria-hidden="true" />

      <div className="loader__system" aria-hidden="true">
        <svg viewBox="0 0 200 200" className="loader__svg">
          <defs>
            <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#eafffd" />
              <stop offset="45%" stopColor="#3aafa9" />
              <stop offset="100%" stopColor="#2b7a78" />
            </radialGradient>
            <filter id="sunGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* orbit ring tracing itself */}
          <circle className="loader__orbit-ring" cx="100" cy="100" r="70" />

          {/* the sun igniting */}
          <circle className="loader__sun-halo" cx="100" cy="100" r="26" />
          <circle className="loader__sun" cx="100" cy="100" r="14" filter="url(#sunGlow)" />

          {/* planet riding the lane */}
          <g className="loader__orbit">
            <circle className="loader__planet" cx="100" cy="30" r="4.5" />
          </g>
        </svg>
      </div>

      <div className="loader__brand">
        <span className="loader__name">SEVERRIR</span>
        <span className="loader__label">
          entering orbit
          <span className="loader__dots">
            <i />
            <i />
            <i />
          </span>
        </span>
      </div>
    </div>
  );
}

export default BoxLoader;
