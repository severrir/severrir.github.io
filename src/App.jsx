import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import Scene from "@/scene/Scene.jsx";
import SceneBoundary from "@/scene/SceneBoundary.jsx";
import BoxLoader from "@/components/ui/box-loader.jsx";
import Nav from "@/ui/Nav.jsx";
import NameBeat from "@/ui/beats/NameBeat.jsx";
import WhatIDoBeat from "@/ui/beats/WhatIDoBeat.jsx";
import SystemBeat from "@/ui/beats/SystemBeat.jsx";
import ProjectCard from "@/ui/ProjectCard.jsx";
import AboutSection from "@/ui/AboutSection.jsx";
import ContactSection from "@/ui/ContactSection.jsx";
import OnboardingHint from "@/ui/OnboardingHint.jsx";
import { projects } from "@/data/projects.js";
import { INTERACTIVE_AT, stageProgress } from "@/scene/cameraStages.js";

const MIN_LOADER_MS = 950;
const HARD_CAP_MS = 1700; // absolute ceiling: reveal even if the scene is still compiling
const FADE_MS = 480;
const CARD_EXIT_MS = 320;
const HINT_INTENSIFY_MS = 5500;

export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [hardCapped, setHardCapped] = useState(false);
  const [loaderState, setLoaderState] = useState("show"); // show | leaving | gone

  const [activeIndex, setActiveIndex] = useState(null);
  const [cardPhase, setCardPhase] = useState("in"); // in | out
  const [cardOrigin, setCardOrigin] = useState(null);
  const [interactive, setInteractive] = useState(false); // true once Beat 3 is reached
  const [hintActive, setHintActive] = useState(false);
  const [hintIntense, setHintIntense] = useState(false);

  const lenisRef = useRef(null);
  const exitTimer = useRef();
  const hintTimer = useRef();
  const hintEngaged = useRef(false);

  const ready = (sceneReady && minElapsed) || hardCapped;
  const revealed = loaderState !== "show";
  const overview = activeIndex === null;

  // ── Smooth scroll (Lenis) ───────────────────────────────────────────────
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: !reduce,
      syncTouch: false,
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;

    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Flip interactivity when scroll crosses into / out of Beat 3. Only touches
    // React state on an actual boundary change — never every scroll frame.
    const onScroll = () => {
      const next = stageProgress() >= INTERACTIVE_AT;
      setInteractive((cur) => (cur !== next ? next : cur));
    };
    lenis.on("scroll", onScroll);
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (typeof target === "number") lenis.scrollTo(target);
    else {
      const el = typeof target === "string" ? document.getElementById(target) : target;
      if (el) lenis.scrollTo(el);
    }
  }, []);

  // ── Loader timing ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);
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

  // ── Onboarding hint (Beat 3 only) ───────────────────────────────────────
  const dismissHint = useCallback(() => {
    clearTimeout(hintTimer.current);
    hintEngaged.current = true;
    setHintActive(false);
    setHintIntense(false);
  }, []);

  useEffect(() => {
    if (revealed && interactive && overview && !hintEngaged.current) {
      setHintActive(true);
      hintTimer.current = setTimeout(() => setHintIntense(true), HINT_INTENSIFY_MS);
      return () => clearTimeout(hintTimer.current);
    }
    setHintActive(false);
    setHintIntense(false);
  }, [revealed, interactive, overview]);

  // ── Project selection ───────────────────────────────────────────────────
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

  // Lock scroll while a card is open so Beat 3 stays put during exploration.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (activeIndex !== null) lenis.stop();
    else lenis.start();
  }, [activeIndex]);

  const goHome = useCallback(() => {
    setCardPhase("out");
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setActiveIndex(null), CARD_EXIT_MS);
    requestAnimationFrame(() => {
      lenisRef.current?.start();
      scrollTo(0);
    });
  }, [scrollTo]);

  const jumpTo = useCallback(
    (id) => {
      setCardPhase("out");
      clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => setActiveIndex(null), CARD_EXIT_MS);
      requestAnimationFrame(() => {
        lenisRef.current?.start();
        scrollTo(id);
      });
    },
    [scrollTo]
  );

  const step = useCallback((dir) => {
    setCardOrigin(null);
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
      <SceneBoundary>
        <Scene
          activeIndex={activeIndex}
          onSelect={selectProject}
          onReady={() => setSceneReady(true)}
          hintActive={hintActive}
          hintIntense={hintIntense}
          onInteract={dismissHint}
          interactive={interactive}
        />
      </SceneBoundary>

      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className={`ui-layer app-reveal ${revealed ? "is-revealed" : ""}`}>
        <span id="top-anchor" aria-hidden="true" />
        <Nav onHome={goHome} onJump={jumpTo} />

        <NameBeat visible={revealed} onNext={() => jumpTo("beat-what")} />
        <WhatIDoBeat onNext={() => jumpTo("beat-system")} />
        <SystemBeat onNext={() => jumpTo("about-section")} />

        <OnboardingHint active={hintActive && overview && interactive} intense={hintIntense} />

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
