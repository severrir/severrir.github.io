import * as THREE from "three";

// Re-export the THREE-free scroll helpers so existing importers of this module
// (CameraRig) keep working, while App imports them straight from scrollStage to
// avoid pulling three.js into the initial bundle.
export { INTERACTIVE_AT, stageProgress } from "@/scene/scrollStage.js";

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
    // Pulled back + raised vs. the rest of the path so the Beat-1 system reads
    // small and clearly secondary behind the SEVERRIR wordmark (the focal point).
    // The target is aimed high and to the right of origin so the sun renders in
    // the lower-left of the frame, clear of the centred wordmark (no more
    // muddy disc under the letters).
    pos: new THREE.Vector3(-3, 34, 112),
    target: new THREE.Vector3(11, 13, 0),
  },
  mini: {
    pos: new THREE.Vector3(27, 13, 60),
    target: new THREE.Vector3(-8, 0, 0),
  },
  overview: {
    // Framed so the six planets read as substantial systems (helped by the
    // persistent name labels) while keeping the sun small enough that the
    // god-rays stay a glow, not a screen-wide whiteout.
    pos: new THREE.Vector3(0, 19, 52),
    target: new THREE.Vector3(0, 0, 0),
  },
};

// A portrait phone has a much narrower *horizontal* FOV than a landscape
// monitor, so the same camera distance crops the wide, flat orbital system —
// the sun balloons and the outer planets fall off-screen. These mobile
// keyframes dolly the camera much further back (paired with a wider FOV and
// pushed-out fog in Scene.jsx) so all six orbits fit a tall narrow frame.
export const STAGE_MOBILE = {
  wide: {
    // Same lower-left framing of the sun as desktop so it clears the wordmark.
    pos: new THREE.Vector3(-3, 47, 172),
    target: new THREE.Vector3(8, 18, 0),
  },
  mini: {
    pos: new THREE.Vector3(20, 20, 120),
    target: new THREE.Vector3(-3, 0, 0),
  },
  overview: {
    // Much closer + a higher, more top-down angle than before so the flat disc
    // rounds out and fills the tall portrait frame instead of lying as a thin
    // horizontal sliver in a sea of black.
    pos: new THREE.Vector3(0, 45, 41),
    target: new THREE.Vector3(0, 0, 0),
  },
};

// Choose the keyframe set for the current viewport width. < 768px = phone.
export function stagesFor(width) {
  return width < 768 ? STAGE_MOBILE : STAGE;
}

function smooth(t) {
  return t * t * (3 - 2 * t); // smoothstep — eases both ends
}

// Fill outPos / outTarget by interpolating the keyframes for progress p.
// Writes into the passed vectors (no allocation) so it's safe per-frame.
// `stages` defaults to the desktop set but callers pass the mobile set on phones.
export function sampleStage(p, outPos, outTarget, stages = STAGE) {
  if (p <= 0.5) {
    const t = smooth(p / 0.5);
    outPos.lerpVectors(stages.wide.pos, stages.mini.pos, t);
    outTarget.lerpVectors(stages.wide.target, stages.mini.target, t);
  } else {
    const t = smooth((p - 0.5) / 0.5);
    outPos.lerpVectors(stages.mini.pos, stages.overview.pos, t);
    outTarget.lerpVectors(stages.mini.target, stages.overview.target, t);
  }
}
