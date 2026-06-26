import { useEffect, useRef } from "react";
import Lenis from "lenis";
import PageNav from "@/ui/PageNav.jsx";
import "@/styles/pages.css";

// Shared frame for the subpages: the fixed background scene, the atmosphere /
// grain overlays (same cinematic layering as the homepage), the header, and a
// Lenis smooth-scroll instance scoped to this page. Content is laid into the
// same pointer-events-none `ui-layer` pattern the homepage uses, so the 3D
// background behind the hero stays draggable/clickable while controls opt in.
export default function PageShell({ background, children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: !reduce, syncTouch: false });
    lenisRef.current = lenis;
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <>
      {background}
      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <PageNav />
      <div className="ui-layer page">{children}</div>
    </>
  );
}
