import { useEffect, useState } from "react";

// ── Reduced motion ────────────────────────────────────────────────────────
// Single source of truth for prefers-reduced-motion, live-updated. Several 3D
// systems (orbits, auto-rotate, bloom pulse, parallax, idle drift) read this so
// the whole scene can freeze for vestibular-sensitive users — not just the CSS.
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

// ── Pointer parallax ──────────────────────────────────────────────────────
// A module-level, allocation-free pointer store updated outside React so the
// per-frame CameraRig can read it without re-rendering. x/y are normalised to
// roughly [-1, 1] from the viewport centre; tx/ty are the smoothed values the
// rig actually applies (so the lean eases instead of snapping).
export const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };

// Wall-clock of the last user interaction, so the camera can start an ambient
// auto-orbit only after a stretch of true idle (see CameraRig IDLE_MS).
export const activity = { last: typeof performance !== "undefined" ? performance.now() : 0 };
export function bumpActivity() {
  activity.last = typeof performance !== "undefined" ? performance.now() : Date.now();
}

// Set while a finger is pressed on a touch device, so orbital motion can pause
// and the small, fast-moving planets become easy to tap.
export const interaction = { touchPaused: false };

// Global camera-shake impulse (0..~1.5), decayed by <CameraShake>. Anything can
// punch it (e.g. the sun explosion) for a screen-shake without touching the rig.
export const camShake = { amp: 0 };
export function shake(amp = 1) {
  camShake.amp = Math.max(camShake.amp, amp);
}

let bound = false;
export function bindPointer() {
  if (bound || typeof window === "undefined") return;
  bound = true;

  const onMove = (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    pointer.x = (e.clientX / w) * 2 - 1;
    pointer.y = (e.clientY / h) * 2 - 1;
    pointer.active = true;
    bumpActivity();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerout", () => (pointer.active = false), { passive: true });
  window.addEventListener("pointerdown", bumpActivity, { passive: true });
  window.addEventListener("keydown", bumpActivity, { passive: true });
  window.addEventListener("wheel", bumpActivity, { passive: true });
  window.addEventListener("scroll", bumpActivity, { passive: true });

  // Pause orbits while a finger is down (touch only) so planets are tappable.
  const onDown = (e) => {
    if (e.pointerType === "touch") interaction.touchPaused = true;
  };
  const onUp = (e) => {
    if (e.pointerType === "touch") interaction.touchPaused = false;
  };
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });

  // Device tilt → parallax on mobile (no cursor). Gated behind a one-time
  // gesture isn't required for the generic `deviceorientation` read.
  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.gamma == null || e.beta == null) return;
      pointer.x = Math.max(-1, Math.min(1, e.gamma / 35)); // left/right tilt
      pointer.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35)); // front/back tilt
      pointer.active = true;
    },
    { passive: true }
  );
}
