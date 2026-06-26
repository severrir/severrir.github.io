import { useEffect, useState } from "react";
import { audio } from "@/audio/audioEngine.js";

function SpeakerOn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
function SpeakerOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

// Default OFF — autoplaying audio is hostile and browsers block it anyway. The
// click is the user gesture that unlocks the AudioContext. Preference persists.
export default function SoundToggle() {
  const [on, setOn] = useState(false);

  // Sound is ON by default. The browser blocks audio until a user gesture, so we
  // show the preference immediately and start the AudioContext (+ fire the
  // opening whoosh) on the very first interaction — click, key, or tap.
  useEffect(() => {
    const saved = localStorage.getItem("severrir-sound");
    const wantOn = saved === null ? true : saved === "on";
    if (saved === null) {
      try {
        localStorage.setItem("severrir-sound", "on");
      } catch {
        /* storage unavailable */
      }
    }
    if (!wantOn) return;
    setOn(true);
    const start = () => {
      audio.setEnabled(true);
      audio.intro(); // cinematic arrival whoosh (plays at most once)
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("touchstart", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    audio.setEnabled(next);
    try {
      localStorage.setItem("severrir-sound", next ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button
      className="nav__icon"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Enable ambient sound"}
      title={on ? "Sound on" : "Sound off"}
    >
      {on ? <SpeakerOn /> : <SpeakerOff />}
    </button>
  );
}
