import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import HomePage from "@/pages/HomePage.jsx";
import { audio } from "@/audio/audioEngine.js";

// Subpages are lazy: the homepage's heavy 3D scene chunk stays the priority on
// first paint, and each subpage's own scene streams in only when visited.
const ServicesPage = lazy(() => import("@/pages/ServicesPage.jsx"));
const PricingPage = lazy(() => import("@/pages/PricingPage.jsx"));
const BookingPage = lazy(() => import("@/pages/BookingPage.jsx"));

// Cinematic page transition: a through-black opacity crossfade with mode="wait",
// so the outgoing page (and its WebGL context) fully unmounts before the next
// one mounts — no two heavy scenes alive at once. We deliberately animate
// OPACITY only, never transform/filter: a transformed ancestor would become the
// containing block for the homepage's position:fixed scene canvas and break it.
const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.54, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.06 } },
  exit: { opacity: 0, transition: { duration: 0.36, ease: [0.55, 0.085, 0.68, 0.53] } },
};

function Page({ children }) {
  return (
    <motion.div
      className="page-frame"
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const firstRender = useRef(true);
  // Counts real navigations (not the first paint). Drives the warp veil so it
  // NEVER flashes on initial load / reload — the homepage's own loader owns the
  // entrance, exactly like the original site. The veil only plays when moving
  // between pages.
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Trigger nav transition effect
    setNavKey((k) => k + 1);
    audio.whoosh(0.085);
    // Reset scroll to the top of the incoming page
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <>
      {/* Hyperspace streak that flashes across during a route change only. Fixed
          and standalone — it never wraps page content, so it can't affect
          layout, and it is absent on first load. */}
      {navKey > 0 && <div className="warp-veil" key={navKey} aria-hidden="true" />}

      <AnimatePresence mode="wait" initial={false}>
        <Page key={location.pathname}>
          <Suspense fallback={<div className="route-fallback" aria-hidden="true" />}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </Page>
      </AnimatePresence>
    </>
  );
}
