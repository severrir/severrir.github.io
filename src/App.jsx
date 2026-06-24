import { useCallback, useEffect, useRef, useState } from "react";
import Scene from "@/scene/Scene.jsx";
import BoxLoader from "@/components/ui/box-loader.jsx";
import Nav from "@/ui/Nav.jsx";
import Hero from "@/ui/Hero.jsx";
import ProjectCard from "@/ui/ProjectCard.jsx";
import AboutSection from "@/ui/AboutSection.jsx";
import ContactSection from "@/ui/ContactSection.jsx";
import OnboardingHint from "@/ui/OnboardingHint.jsx";
import { projects } from "@/data/projects.js";

const MIN_LOADER_MS = 950;
const HARD_CAP_MS = 1700; // absolute ceiling: reveal even if shaders/scene are still compiling
const FADE_MS = 480;
const CARD_EXIT_MS = 320;
const HINT_INTENSIFY_MS = 5500; // grow louder, never fade out, until the visitor actually engages

function scrollToId(id) {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [hardCapped, setHardCapped] = useState(false);
  const [loaderState, setLoaderState] = useState("show"); // show | leaving | gone

  const [activeIndex, setActiveIndex] = useState(null);
  const [cardPhase, setCardPhase] = useState("in"); // in | out
  const [cardOrigin, setCardOrigin] = useState(null); // {x,y} screen px
  const [hintActive, setHintActive] = useState(false);
  const [hintIntense, setHintIntense] = useState(false);
  const exitTimer = useRef();
  const hintTimer = useRef();

  const ready = (sceneReady && minElapsed) || hardCapped;
  const revealed = loaderState !== "show";
  const overview = activeIndex === null;

  const dismissHint = useCallback(() => {
    clearTimeout(hintTimer.current);
    setHintActive(false);
    setHintIntense(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  // Absolute ceiling: never let slow shader/GL setup hold the loader past
  // this, even if the scene hasn't reported ready yet.
  useEffect(() => {
    const t = setTimeout(() => setHardCapped(true), HARD_CAP_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready) setLoaderState((s) => (s === "show" ? "leaving" : s));
  }, [ready]);

  useEffect(() => {
    if (loaderState === "leaving") {
      const t = setTimeout(() => setLoaderState("gone"), FADE_MS);
      return () => clearTimeout(t);
    }
  }, [loaderState]);

  // Onboarding cue: nudge first-time visitors that the scene is interactive.
  // It does NOT fade out on a fixed timer — it only goes away the instant the
  // visitor actually clicks or drags (see dismissHint / onInteract below). If
  // they still haven't engaged after a few seconds, it gets louder, not quieter.
  useEffect(() => {
    if (revealed) {
      setHintActive(true);
      hintTimer.current = setTimeout(() => setHintIntense(true), HINT_INTENSIFY_MS);
      return () => clearTimeout(hintTimer.current);
    }
  }, [revealed]);

  const selectProject = useCallback(
    (i, origin = null) => {
      dismissHint();
      clearTimeout(exitTimer.current);
      setCardOrigin(origin);
      setCardPhase("in");
      setActiveIndex(i);
    },
    [dismissHint]
  );

  const closeProject = useCallback(() => {
    setCardPhase("out");
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setActiveIndex(null), CARD_EXIT_MS);
  }, []);

  const goHome = useCallback(() => {
    setCardPhase("out");
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setActiveIndex(null), CARD_EXIT_MS);
    scrollToId("top-anchor");
  }, []);

  const jumpTo = useCallback((id) => {
    setCardPhase("out");
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setActiveIndex(null), CARD_EXIT_MS);
    // let the card start dissolving before the page scrolls
    requestAnimationFrame(() => scrollToId(id));
  }, []);

  const step = useCallback((dir) => {
    setCardOrigin(null); // keyboard paging grows from card center
    setCardPhase("in");
    setActiveIndex((i) => (i === null ? 0 : (i + dir + projects.length) % projects.length));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && activeIndex !== null) closeProject();
      if (activeIndex !== null) {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, closeProject, step]);

  return (
    <>
      <Scene
        activeIndex={activeIndex}
        onSelect={selectProject}
        onReady={() => setSceneReady(true)}
        hintActive={hintActive}
        hintIntense={hintIntense}
        onInteract={dismissHint}
      />

      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className={`ui-layer app-reveal ${revealed ? "is-revealed" : ""}`}>
        <span id="top-anchor" aria-hidden="true" />
        <Nav onHome={goHome} onJump={jumpTo} />

        <Hero visible={overview && revealed} onSelect={selectProject} activeIndex={activeIndex} />

        <OnboardingHint active={hintActive && overview} intense={hintIntense} />

        {activeIndex !== null && (
          <ProjectCard
            project={projects[activeIndex]}
            index={activeIndex}
            total={projects.length}
            origin={cardOrigin}
            phase={cardPhase}
            onClose={closeProject}
            onNext={() => step(1)}
            onPrev={() => step(-1)}
          />
        )}

        <AboutSection />
        <ContactSection />
      </div>

      {loaderState !== "gone" && (
        <div className={`loader-fade ${loaderState === "leaving" ? "is-leaving" : ""}`}>
          <BoxLoader />
        </div>
      )}
    </>
  );
}
