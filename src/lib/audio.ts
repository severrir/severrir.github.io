import { Howl } from "howler";

export type SoundName = "hover" | "click" | "success";

const SOURCES: Record<SoundName, string> = {
  hover: "/sounds/hover.wav",
  click: "/sounds/click.wav",
  success: "/sounds/success.wav",
};

/* Mixed low and deliberately uneven: hover must sit under click. */
const VOLUMES: Record<SoundName, number> = {
  hover: 0.18,
  click: 0.3,
  success: 0.35,
};

const STORAGE_KEY = "severrir:sound";

const cache = new Map<SoundName, Howl>();
const listeners = new Set<(muted: boolean) => void>();

let muted = false;
/* Browsers block audio before a gesture, and an unexpected hover tick is
   startling. Nothing plays until the visitor has actually touched the page. */
let armed = false;
let lastHover = 0;

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "muted";
  } catch {
    return false;
  }
}

export function initAudio() {
  if (typeof window === "undefined") return;
  muted = readStored();
  emit();

  const arm = () => {
    armed = true;
    window.removeEventListener("pointerdown", arm, { capture: true });
    window.removeEventListener("keydown", arm, { capture: true });
  };
  /*
   * Capture phase, so arming beats React's delegated handlers. On the bubble
   * phase a component's own onPointerDown ran first and playSound bailed on
   * !armed, which made the very first click on the page silent every time.
   */
  window.addEventListener("pointerdown", arm, { once: true, capture: true });
  window.addEventListener("keydown", arm, { once: true, capture: true });
}

function getHowl(name: SoundName): Howl {
  let howl = cache.get(name);
  if (!howl) {
    howl = new Howl({
      src: [SOURCES[name]],
      volume: VOLUMES[name],
      preload: name !== "success",
    });
    cache.set(name, howl);
  }
  return howl;
}

export function playSound(name: SoundName) {
  if (muted || !armed || typeof window === "undefined") return;

  /* Sweeping a cursor across a list of rows must not machine-gun. */
  if (name === "hover") {
    const now = performance.now();
    if (now - lastHover < 90) return;
    lastHover = now;
  }

  try {
    getHowl(name).play();
  } catch {
    /* An unavailable audio device is never worth breaking the page over. */
  }
}

function emit() {
  listeners.forEach((fn) => fn(muted));
}

export function toggleMuted(): boolean {
  muted = !muted;
  /* Toggling is itself a gesture — confirm audibly when switching on. */
  armed = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "muted" : "on");
  } catch {
    /* Private mode: the preference just will not persist. */
  }
  emit();
  if (!muted) playSound("click");
  return muted;
}

export function isMuted() {
  return muted;
}

export function subscribeMuted(fn: (muted: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
