import { lazy, Suspense, useEffect, useRef } from "react";
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
  enter: { opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } },
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

  // Soft warp whoosh on every client-side navigation (after the first paint).
  // No-op until audio is unlocked, so it never violates autoplay policy.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    audio.whoosh(0.085);
    // Reset scroll to the top of the incoming page.
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {/* Hyperspace streak that flashes across during a route change. Fixed and
          standalone — it never wraps page content, so it can't affect layout. */}
      <div className="warp-veil" key={location.pathname} aria-hidden="true" />

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
