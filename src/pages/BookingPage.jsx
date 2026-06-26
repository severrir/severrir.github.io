import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SceneBoundary from "@/scene/SceneBoundary.jsx";
import AmbientScene from "@/scene/AmbientScene.jsx";
import PageShell from "@/ui/PageShell.jsx";
import PageFooter from "@/ui/PageFooter.jsx";
import { submitBooking } from "@/lib/booking.js";
import { audio } from "@/audio/audioEngine.js";
import "@/styles/booking.css";

const EASE = [0.22, 1, 0.36, 1];

export default function BookingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", discord: "", email: "", commission: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const nameOk = form.name.trim().length > 0;
  const discordOk = form.discord.trim().length > 0;
  const emailOk = form.email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const valid = nameOk && discordOk && emailOk;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || status === "submitting") {
      if (!valid) audio.tick();
      return;
    }
    setStatus("submitting");
    setError("");
    audio.click();
    try {
      await submitBooking(form);
      audio.select();
      setStatus("success");
    } catch (err) {
      audio.tick();
      setError(err?.message || "Couldn't send that. Try again, or message me on Discord.");
      setStatus("error");
    }
  };

  const reset = () => {
    audio.click();
    setForm({ name: "", discord: "", email: "", commission: "" });
    setTouched(false);
    setStatus("idle");
    setError("");
  };

  return (
    <PageShell
      background={
        <SceneBoundary>
          <AmbientScene />
        </SceneBoundary>
      }
    >
      <section className="booking">
        <motion.div
          className="booking__inner"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        >
          <span className="panel-bracket panel-bracket--tl" aria-hidden="true" />
          <span className="panel-bracket panel-bracket--tr" aria-hidden="true" />
          <span className="panel-bracket panel-bracket--bl" aria-hidden="true" />
          <span className="panel-bracket panel-bracket--br" aria-hidden="true" />

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                className="booking__success"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <span className="booking__success-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h1 className="booking__success-title">Got it.</h1>
                <p className="booking__success-text">
                  I'll reach out on Discord or email shortly. In the meantime, your request
                  is logged and on my radar.
                </p>
                <div className="booking__success-actions">
                  <button className="btn btn-ghost" onClick={() => { audio.click(); navigate("/"); }} type="button">
                    Back to Work
                  </button>
                  <button className="btn btn-ghost" onClick={reset} type="button">
                    Send another
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <span className="page-eyebrow">04 / Booking</span>
                <h1 className="booking__title">Book a consultation.</h1>
                <p className="booking__lede">
                  Tell me who you are and where to find you. Consultations are free —
                  I'll follow up to scope the work and discuss rates.
                </p>
                <p className="booking__commission">
                  <strong>Pricing:</strong> Project commissions range from <strong>$500–$5000+</strong> depending on scope, complexity, and timeline.
                  Retainer and revenue-share arrangements also available for ongoing partnerships.
                </p>

                <form className="booking__form" onSubmit={onSubmit} noValidate>
                  <label className="field">
                    <span className="field__label">
                      Name <span className="field__req">*</span>
                    </span>
                    <input
                      className={`field__input ${touched && !nameOk ? "is-invalid" : ""}`}
                      type="text"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="What should I call you?"
                      autoComplete="name"
                    />
                    {touched && !nameOk && <span className="field__error">Name is required.</span>}
                  </label>

                  <label className="field">
                    <span className="field__label">
                      Discord username <span className="field__req">*</span>
                    </span>
                    <input
                      className={`field__input ${touched && !discordOk ? "is-invalid" : ""}`}
                      type="text"
                      value={form.discord}
                      onChange={set("discord")}
                      placeholder="yourname"
                      autoComplete="off"
                    />
                    {touched && !discordOk && (
                      <span className="field__error">Discord username is required.</span>
                    )}
                  </label>

                  <label className="field">
                    <span className="field__label">
                      Email <span className="field__opt">optional</span>
                    </span>
                    <input
                      className={`field__input ${touched && !emailOk ? "is-invalid" : ""}`}
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                    {touched && !emailOk && (
                      <span className="field__error">That email doesn't look right.</span>
                    )}
                  </label>

                  <label className="field">
                    <span className="field__label">
                      What do you need? <span className="field__opt">optional</span>
                    </span>
                    <textarea
                      className="field__input field__textarea"
                      value={form.commission}
                      onChange={set("commission")}
                      placeholder="Describe your project, what you need built, timeline, budget range, or any specific requirements..."
                      rows="5"
                    />
                  </label>

                  {status === "error" && (
                    <motion.p
                      className="booking__form-error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    className="btn btn-primary booking__submit"
                    type="submit"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? "Sending…" : "Send request"}
                  </button>
                  <p className="booking__fineprint">
                    Prefer Discord? Message <strong>severrir</strong> directly.
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <PageFooter />
    </PageShell>
  );
}
