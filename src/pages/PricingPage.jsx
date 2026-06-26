import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SceneBoundary from "@/scene/SceneBoundary.jsx";
import AmbientScene from "@/scene/AmbientScene.jsx";
import PageShell from "@/ui/PageShell.jsx";
import PageFooter from "@/ui/PageFooter.jsx";
import { tiers, faqs } from "@/data/pricing.js";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/pricing.css";

const EASE = [0.22, 1, 0.36, 1];

function FaqItem({ q, a, open, onToggle, index }) {
  return (
    <motion.div
      className={`faq-item ${open ? "is-open" : ""}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.04 }}
    >
      <button className="faq-item__q" onClick={onToggle} aria-expanded={open}>
        <span>{q}</span>
        <span className={`faq-item__chevron ${open ? "is-open" : ""}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="faq-item__a-wrap"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {Array.isArray(a) ? (
              <ol className="faq-item__list">
                {a.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            ) : (
              <p className="faq-item__a">{a}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const go = (path) => {
    audio.click();
    navigate(path);
  };

  return (
    <PageShell
      background={
        <SceneBoundary>
          <AmbientScene />
        </SceneBoundary>
      }
    >
      <section className="pricing-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        >
          <span className="page-eyebrow">03 / Pricing</span>
          <h1 className="page-title">Priced to scope, not to guesswork.</h1>
          <p className="page-lede">
            Three starting points. Every quote is scoped to the actual work — the minimum
            order is $25, and there's no charge for a consultation.
          </p>
        </motion.div>
      </section>

      <section className="tiers">
        {tiers.map((t, i) => (
          <motion.div
            key={t.id}
            className={`tier ${t.featured ? "is-featured" : ""}`}
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
            onMouseEnter={() => audio.hover()}
          >
            {t.featured && <span className="tier__badge">Most picked</span>}
            <span className="panel-bracket panel-bracket--tl" aria-hidden="true" />
            <span className="panel-bracket panel-bracket--tr" aria-hidden="true" />
            <span className="panel-bracket panel-bracket--bl" aria-hidden="true" />
            <span className="panel-bracket panel-bracket--br" aria-hidden="true" />

            <span className="tier__eyebrow">{t.eyebrow}</span>
            <h2 className="tier__name">{t.name}</h2>
            <div className="tier__price">
              <span className="tier__price-num">{t.price}</span>
              <span className="tier__price-note">{t.priceNote}</span>
            </div>
            <p className="tier__summary">{t.summary}</p>
            <ul className="tier__features">
              {t.features.map((f) => (
                <li key={f}>
                  <span className="tier__check" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`btn ${t.featured ? "btn-primary" : "btn-ghost"} tier__cta`}
              onClick={() => go("/booking")}
              type="button"
            >
              {t.cta}
            </button>
          </motion.div>
        ))}
      </section>

      <section className="faq">
        <motion.div
          className="faq__head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="page-eyebrow">FAQ</span>
          <h2 className="faq__title">Good questions, answered.</h2>
        </motion.div>
        <div className="faq__list">
          {faqs.map((f, i) => (
            <FaqItem
              key={f.q}
              q={f.q}
              a={f.a}
              index={i}
              open={openFaq === i}
              onToggle={() => {
                audio.click();
                setOpenFaq((cur) => (cur === i ? -1 : i));
              }}
            />
          ))}
        </div>
      </section>

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
          <h2 className="cta-band__title">Ready?</h2>
          <p className="cta-band__sub">Tell me what you're building — I'll reach out on Discord or email.</p>
          <div className="cta-band__actions">
            <button className="btn btn-primary" onClick={() => go("/booking")} type="button">
              Book a Consultation
            </button>
            <button className="btn btn-ghost" onClick={() => go("/services")} type="button">
              See Services
            </button>
          </div>
        </motion.div>
      </section>

      <PageFooter />
    </PageShell>
  );
}
