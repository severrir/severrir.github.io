import "@/styles/onboarding.css";

// A loud, hard-to-miss cue so a first-time visitor instantly understands the
// scene is interactive. It never fades out on a timer — only the visitor's
// own first click/drag dismisses it. If they sit idle too long it gets MORE
// noticeable (stronger pulse), not less.
export default function OnboardingHint({ active, intense }) {
  return (
    <div
      className={`onboard-hint ${active ? "is-active" : ""} ${intense ? "is-intense" : ""}`}
      aria-hidden={!active}
    >
      <span className="onboard-hint__pulse" aria-hidden="true" />
      <span className="onboard-hint__text">Click a planet to explore — drag to look around</span>
    </div>
  );
}
