import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
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
import HudFrame from "@/ui/HudFrame.jsx";
import { projects } from "@/data/projects.js";
import { INTERACTIVE_AT, stageProgress } from "@/scene/scrollStage.js";
import { bindPointer } from "@/scene/sceneEnv.js";
import { audio } from "@/audio/audioEngine.js";

// Lazy-load the heavy Three.js scene so the hero text + loader paint from a tiny
// initial chunk; the ~1.2 MB 3D bundle streams in behind the loader.
const Scene = lazy(() => import("@/scene/Scene.jsx"));

// Deep-link: read ?project=<id> once on load so a shared link opens that card.
function initialDeepLink() {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("project");
  if (!id) return null;
  const i = projects.findIndex((p) => p.id === id);
  return i >= 0 ? i : null;
}

// Module-level (NOT sessionStorage): resets on every real page load/refresh, so
// a reload ALWAYS replays the full splash + camera fly-in + entry swish, exactly
// like the original site. It only stays true across in-app client-side
// navigation, so bouncing back to home from another page skips the loader.
let hasBooted = false;

const MIN_LOADER_MS = 950;
const HARD_CAP_MS = 1700; // absolute ceiling: reveal even if the scene is still compiling
const FADE_MS = 480;
const CARD_EXIT_MS = 320;
const HINT_INTENSIFY_MS = 5500;

export default function HomePage() {
  const navigate = useNavigate();
  const skipLoader = useRef(hasBooted);

  const [sceneReady, setSceneReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [hardCapped, setHardCapped] = useState(false);
  const [loaderState, setLoaderState] = useState(skipLoader.current ? "gone" : "show"); // show | leaving | gone
  const [entered, setEntered] = useState(skipLoader.current); // Enter button pressed

  const [activeIndex, setActiveIndex] = useState(null);
  const [cardPhase, setCardPhase] = useState("in"); // in | out
  const [cardOrigin, setCardOrigin] = useState(null);
  const [interactive, setInteractive] = useState(false); // true once Beat 3 is reached
  const [hintActive, setHintActive] = useState(false);
  const [hintIntense, setHintIntense] = useState(false);
  const [singularity, setSingularity] = useState(false); // sun → black-hole cinematic
  const singularityLock = useRef(false);
  // Gate the hero's letter-by-letter animation until the loader is fully gone,
  // so the entrance text actually animates in clear view (otherwise it plays
  // hidden behind the fading loader and looks like nothing happened on first
  // load). On in-app return to home there's no loader, so it plays immediately.
  const [heroReady, setHeroReady] = useState(skipLoader.current);

  const lenisRef = useRef(null);
  const exitTimer = useRef();
  const hintTimer = useRef();
  const hintEngaged = useRef(false);
  const lastScrollSnd = useRef(0); // throttle for the scroll whoosh
  const letterboxRetracted = useRef(false); // bars recede on the first scroll

  // Pointer / device-tilt parallax + idle tracking for the 3D scene.
  useEffect(() => bindPointer(), []);

  // Always open at the top — never let the browser restore a mid-page scroll on
  // reload, which would skip the loader/fly-in and land mid-experience.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  const deepLink = useRef(initialDeepLink());
  const [bootCinematic, setBootCinematic] = useState(false);

  const ready = (sceneReady && minElapsed) || hardCapped;
  const revealed = loaderState !== "show";
  const overview = activeIndex === null;

  // Cinematic letterbox bars frame the hero the instant the scene reveals, then
  // glide away on their own once the camera fly-in has played (or earlier on the
  // visitor's first scroll — see the Lenis handler below).
  useEffect(() => {
    if (!revealed) return;
    setBootCinematic(true);
  }, [revealed]);

  // Auto-retract the letterbox after the entrance plays out — no scroll needed.
  useEffect(() => {
    if (loaderState !== "gone") return;
    const t = setTimeout(() => {
      if (!letterboxRetracted.current) {
        letterboxRetracted.current = true;
        setBootCinematic(false);
      }
    }, 3200);
    return () => clearTimeout(t);
  }, [loaderState]);

  // Trigger the hero text/planet entrance once the loader is gone.
  useEffect(() => {
    if (loaderState !== "gone") return;
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, [loaderState]);

  // Fire the entry swish the moment the loading screen is fully gone — i.e. when
  // the camera fly-in becomes visible. Auto-plays if audio is already unlocked;
  // otherwise the first interaction within the window triggers it.
  useEffect(() => {
    if (loaderState !== "gone") return;
    audio.armIntro(150, 6000);
    const swish = setTimeout(() => audio.intro(), 200);
    return () => clearTimeout(swish);
  }, [loaderState]);

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

    // Per-scroll work: flip interactivity at the Beat 3 boundary (state only
    // changes on an actual crossing), retract the cinematic letterbox on the
    // first real scroll, and emit a soft velocity-mapped scroll whoosh.
    const onScroll = () => {
      const next = stageProgress() >= INTERACTIVE_AT;
      setInteractive((cur) => (cur !== next ? next : cur));

      if (!letterboxRetracted.current && lenis.scroll > 6) {
        letterboxRetracted.current = true;
        setBootCinematic(false);
      }

      const v = Math.abs(lenis.velocity || 0);
      if (v > 1.5) {
        const now = performance.now();
        if (now - lastScrollSnd.current > 110) {
          lastScrollSnd.current = now;
          audio.scroll(Math.min(v / 42, 1));
        }
      }
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
  // Hold on the loading screen until the visitor presses Enter — that click is
  // the gesture that unlocks audio, so the entry swish can play with the fly-in.
  useEffect(() => {
    if (ready && entered) setLoaderState((s) => (s === "show" ? "leaving" : s));
  }, [ready, entered]);
  useEffect(() => {
    if (loaderState === "leaving") {
      const t = setTimeout(() => setLoaderState("gone"), FADE_MS);
      return () => clearTimeout(t);
    }
  }, [loaderState]);

  const handleEnter = useCallback(() => {
    if (typeof localStorage === "undefined" || localStorage.getItem("severrir-sound") !== "off") {
      audio.setEnabled(true); // unlock audio via this gesture
    }
    hasBooted = true; // remember within this page session (cleared on reload)
    setEntered(true);
  }, []);

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
      audio.select();
      clearTimeout(exitTimer.current);
      setCardOrigin(origin);
      setCardPhase("in");
      setActiveIndex(i);
    },
    [dismissHint]
  );

  const closeProject = useCallback(() => {
    audio.tick();
    setCardPhase("out");
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setActiveIndex(null), CARD_EXIT_MS);
  }, []);

  // Lock scroll while a card is open so Beat 3 stays put during exploration.
  // Lenis.stop() handles the smooth-scroll loop, but we also guard the raw
  // wheel/touch events so nothing leaks through to the page behind the card —
  // while still letting the card's own body scroll its overflow content.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (activeIndex === null) {
      lenis.start();
      return;
    }
    lenis.stop();
    const block = (e) => {
      if (e.target.closest && (e.target.closest(".card__body") || e.target.closest(".card__close"))) return;
      e.preventDefault();
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
    };
  }, [activeIndex]);

  // Keep the URL in sync with the open card so any project is directly shareable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeIndex !== null) url.searchParams.set("project", projects[activeIndex].id);
    else url.searchParams.delete("project");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [activeIndex]);

  // Open the deep-linked project once the scene is revealed: jump to the
  // interactive overview first so closing the card returns there cleanly.
  useEffect(() => {
    if (!revealed || deepLink.current == null) return;
    const i = deepLink.current;
    deepLink.current = null;
    const vh = window.innerHeight || 1;
    // Jump straight to the interactive overview (no animated scroll, which the
    // card's scroll-lock would interrupt and leave us stranded on the hero),
    // then open the card so closing it returns to the system.
    lenisRef.current?.scrollTo(Math.round(vh * 1.95), { immediate: true });
    const t = setTimeout(() => selectProject(i), 400);
    return () => clearTimeout(t);
  }, [revealed, selectProject]);

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
      audio.whoosh();
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
    audio.click();
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

  const bookConsult = useCallback(() => {
    audio.whoosh();
    navigate("/booking");
  }, [navigate]);

  // Sun easter egg: third click detonates the star into a black hole that pulls
  // the whole site into the singularity, then we "fall through" back to the very
  // start — scrolled to the top, card closed, everything normal again.
  const triggerBlackHole = useCallback(() => {
    if (singularityLock.current) return;
    singularityLock.current = true;
    setSingularity(true);
    // pull the whole living site into the core (scene, text, atmosphere, grain)
    document.body.classList.add("is-collapsing");
    audio.explode();
    // at peak black, teleport to the start
    setTimeout(() => {
      setActiveIndex(null);
      letterboxRetracted.current = true;
      setBootCinematic(false);
      lenisRef.current?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      audio.whoosh(0.14);
    }, 2050);
    // restore the page from its crushed state while the core still fills the
    // frame in full black — so the snap back to normal is never visible
    setTimeout(() => {
      document.body.classList.remove("is-collapsing");
    }, 2150);
    // clear the overlay once we've fallen back through
    setTimeout(() => {
      setSingularity(false);
      singularityLock.current = false;
    }, 3100);
  }, []);

  // Safety: never leave the page stuck in its collapsed state if HomePage
  // unmounts mid-animation (e.g. a route change fires during the easter egg).
  useEffect(() => () => document.body.classList.remove("is-collapsing"), []);

  return (
    <>
      <SceneBoundary>
        <Suspense fallback={null}>
          <Scene
            activeIndex={activeIndex}
            onSelect={selectProject}
            onReady={() => setSceneReady(true)}
            onInteract={dismissHint}
            interactive={interactive}
            playIntro={revealed}
            onBlackHole={triggerBlackHole}
          />
        </Suspense>
      </SceneBoundary>

      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <HudFrame
        letterbox={bootCinematic}
        statusRight={activeIndex !== null ? projects[activeIndex].id.toUpperCase() : "OVERVIEW"}
      />

      <div
        className="ui-layer app-reveal"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.55s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <span id="top-anchor" aria-hidden="true" />
        <Nav onHome={goHome} onJump={jumpTo} />

        {/* visible flips to true once the loader is fully gone, so the hero's
            letter-by-letter entrance animates in clear view (NameBeat holds the
            letters hidden until then). */}
        <NameBeat visible={heroReady} onNext={() => jumpTo("beat-what")} onBook={bookConsult} />
        <WhatIDoBeat onNext={() => jumpTo("beat-system")} />
        <SystemBeat onNext={() => jumpTo("about-section")} />

        <OnboardingHint active={hintActive && overview && interactive} intense={hintIntense} />

        <AboutSection />
        <ContactSection onBook={bookConsult} />
      </div>

      {/* Black-hole singularity overlay — the whole frame is pulled into a
          spinning vortex, collapses to black, then we fall back to the start. */}
      {singularity && (
        <div className="singularity" aria-hidden="true">
          <div className="singularity__vortex" />
          <div className="singularity__ring" />
          <div className="singularity__core" />
        </div>
      )}

      {/* Rendered OUTSIDE .app-reveal: that wrapper has a transform, which would
          make it the containing block for the card's position:fixed and pin the
          card to the (tall) document rather than the viewport — pushing the
          mobile bottom-sheet off-screen. As a top-level sibling it is correctly
          viewport-fixed, exactly like the loader below. */}
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

      {loaderState !== "gone" && (
        <div className={`loader-fade ${loaderState === "leaving" ? "is-leaving" : ""}`}>
          <BoxLoader ready={ready && !entered} onEnter={handleEnter} />
        </div>
      )}
    </>
  );
}
