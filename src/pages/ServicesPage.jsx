import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SceneBoundary from "@/scene/SceneBoundary.jsx";
import ServicesScene from "@/scene/ServicesScene.jsx";
import PageShell from "@/ui/PageShell.jsx";
import PageFooter from "@/ui/PageFooter.jsx";
import { CloseIcon, ArrowIcon } from "@/ui/icons.jsx";
import { services } from "@/data/services.js";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/services.css";

const EASE = [0.22, 1, 0.36, 1];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const selected = services.find((s) => s.id === selectedId) || null;
  const selectedIndex = services.findIndex((s) => s.id === selectedId);

  const select = useCallback((id) => {
    audio.select();
    setSelectedId(id);
  }, []);

  const close = useCallback(() => {
    audio.tick();
    setSelectedId(null);
  }, []);

  const step = useCallback((dir) => {
    audio.click();
    setSelectedId((cur) => {
      const i = services.findIndex((s) => s.id === cur);
      const start = i === -1 ? 0 : i;
      return services[(start + dir + services.length) % services.length].id;
    });
  }, []);

  const go = (path) => {
    audio.click();
    navigate(path);
  };

  return (
    <PageShell
      background={
        <SceneBoundary>
          <ServicesScene selectedId={selectedId} onSelect={select} onHover={() => {}} />
        </SceneBoundary>
      }
    >
      {/* ── Hero: the interactive constellation ─────────────────────────── */}
      <section className="svc-hero">
        <motion.div
          className="svc-hero__head"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        >
          <span className="page-eyebrow">02 / Services</span>
          <h1 className="page-title">Pick a world to explore.</h1>
          <p className="page-lede">
            Six disciplines, one toolkit. Each planet is a service — click one to see what
            it covers, or scan the full list below.
          </p>
          <span className="svc-hero__hint">
            <span className="svc-hero__hint-pulse" aria-hidden="true" />
            Click a planet · drag to rotate
          </span>
        </motion.div>

        <AnimatePresence>
          {selected && (
            <motion.aside
              key={selected.id}
              className="svc-detail"
              style={{ "--accent": selected.visual.rimColor }}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              <button className="svc-detail__close" onClick={close} aria-label="Close">
                <CloseIcon />
              </button>
              <span className="svc-detail__sys">
                SVC 0{selectedIndex + 1} <span className="card__sys-sep">//</span> {selected.id}
              </span>
              <h2 className="svc-detail__title">{selected.title}</h2>
              <p className="svc-detail__blurb">{selected.blurb}</p>
              <p className="svc-detail__desc">{selected.description}</p>
              <div className="svc-detail__tags">
                {selected.tags.map((t) => (
                  <span className="tag-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="svc-detail__nav">
                <button className="card__nav-btn" onClick={() => step(-1)} aria-label="Previous service">
                  <ArrowIcon size={14} /> Prev
                </button>
                <button className="card__nav-btn" onClick={() => step(1)} aria-label="Next service">
                  Next <ArrowIcon size={14} />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </section>

      {/* ── Full list for scanning ──────────────────────────────────────── */}
      <section className="svc-grid-section">
        <div className="svc-grid">
          {services.map((s, i) => (
            <motion.button
              key={s.id}
              type="button"
              className={`svc-card ${selectedId === s.id ? "is-active" : ""}`}
              style={{ "--accent": s.visual.rimColor }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: EASE, delay: (i % 3) * 0.06 }}
              onMouseEnter={() => audio.hover()}
              onClick={() => select(s.id)}
            >
              <span className="svc-card__dot" aria-hidden="true" />
              <span className="svc-card__num">0{i + 1}</span>
              <h3 className="svc-card__title">{s.title}</h3>
              <p className="svc-card__desc">{s.description}</p>
              <div className="svc-card__tags">
                {s.tags.map((t) => (
                  <span className="tag-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <section className="cta-band">
        <motion.div
          className="cta-band__inner"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="panel-bracket panel-bracket--tl" aria-hidden="true" />
          <span className="panel-bracket panel-bracket--tr" aria-hidden="true" />
          <span className="panel-bracket panel-bracket--bl" aria-hidden="true" />
          <span className="panel-bracket panel-bracket--br" aria-hidden="true" />
          <h2 className="cta-band__title">Know what you need built?</h2>
          <p className="cta-band__sub">See where it lands on pricing, or skip straight to booking.</p>
          <div className="cta-band__actions">
            <button className="btn btn-primary" onClick={() => go("/booking")} type="button">
              Book a Consultation
            </button>
            <button className="btn btn-ghost" onClick={() => go("/pricing")} type="button">
              View Pricing
            </button>
          </div>
        </motion.div>
      </section>

      <PageFooter />
    </PageShell>
  );
}
