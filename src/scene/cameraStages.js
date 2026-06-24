import * as THREE from "three";

// Single source of truth for the scroll-driven cinematic camera path.
// Both the in-scene CameraRig (per-frame, no React) and App (to gate
// interactivity) derive their state from these, so they never disagree.

// Three keyframes the camera flies through as the user scrolls the first
// two viewport-heights:
//   wide     (Beat 1) — far, high, the whole system small & cinematic
//   mini     (Beat 2) — system framed to the right; bio copy sits on the left
//   overview (Beat 3) — the existing interactive overview pose
export const STAGE = {
  wide: {
    pos: new THREE.Vector3(0, 26, 92),
    target: new THREE.Vector3(0, 0, 0),
  },
  mini: {
    pos: new THREE.Vector3(27, 13, 60),
    target: new THREE.Vector3(-8, 0, 0),
  },
  overview: {
    pos: new THREE.Vector3(0, 17, 46),
    target: new THREE.Vector3(0, 0, 0),
  },
};

// Above this scroll progress the scene becomes fully interactive (Beat 3):
// OrbitControls + planet clicks turn on, and the onboarding hint appears.
export const INTERACTIVE_AT = 0.93;

// Scroll progress 0→1 across the first two viewport-heights. Clamped, so once
// the user is at/under Beat 3 it stays 1 no matter how far they scroll into the
// About/Contact beats below.
export function stageProgress() {
  if (typeof window === "undefined") return 0;
  const vh = window.innerHeight || 1;
  return Math.min(1, Math.max(0, window.scrollY / (vh * 2)));
}

function smooth(t) {
  return t * t * (3 - 2 * t); // smoothstep — eases both ends
}

// Fill outPos / outTarget by interpolating the keyframes for progress p.
// Writes into the passed vectors (no allocation) so it's safe per-frame.
export function sampleStage(p, outPos, outTarget) {
  if (p <= 0.5) {
    const t = smooth(p / 0.5);
    outPos.lerpVectors(STAGE.wide.pos, STAGE.mini.pos, t);
    outTarget.lerpVectors(STAGE.wide.target, STAGE.mini.target, t);
  } else {
    const t = smooth((p - 0.5) / 0.5);
    outPos.lerpVectors(STAGE.mini.pos, STAGE.overview.pos, t);
    outTarget.lerpVectors(STAGE.mini.target, STAGE.overview.target, t);
  }
}
