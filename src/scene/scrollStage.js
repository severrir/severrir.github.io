// Scroll → cinematic stage progress. Deliberately free of three.js so eager
// modules (App) can read scroll state without pulling the whole 3D library into
// the initial bundle — that's what lets the Scene chunk lazy-load.

// Above this scroll progress the scene becomes fully interactive (Beat 3):
// OrbitControls + planet clicks turn on, and the onboarding hint appears.
export const INTERACTIVE_AT = 0.93;

// Scroll progress 0→1 across the first two viewport-heights. Clamped, so once
// the user is at/under Beat 3 it stays 1 no matter how far they scroll below.
export function stageProgress() {
  if (typeof window === "undefined") return 0;
  const vh = window.innerHeight || 1;
  return Math.min(1, Math.max(0, window.scrollY / (vh * 2)));
}
