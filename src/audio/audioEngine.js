// Procedural audio — synthesized with the Web Audio API (no asset files, works
// offline). One warm ambient space drone + a small kit of soft, musical UI
// one-shots routed through a short reverb so everything feels spacious and
// satisfying rather than beepy. Off by default; the AudioContext is only created
// on a user gesture (the sound toggle / first interaction), per autoplay policy.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.ambientGain = null;
    this.ambientNodes = [];
    this.enabled = false;
    this.noiseBuffer = null;
    this._introPlayed = false;
    this._introStartAt = Infinity; // earliest the swish may play (perf clock)
    this._introEndAt = 0; // latest it may play
  }

  // Open the entry window when the scene reveals: `startMs` delays the swish so
  // it lands *during* the visible fly-in (not at reveal, while the loader is
  // still fading), and `windowMs` bounds how late a first interaction can still
  // trigger it — past that, a first interaction just starts the ambient.
  armIntro(startMs = 1000, windowMs = 6000) {
    const t = performance.now();
    this._introStartAt = t + startMs;
    this._introEndAt = t + startMs + windowMs;
  }

  _ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(ctx.destination);

    // short plate-ish reverb on a shared send bus → space + polish
    const conv = ctx.createConvolver();
    conv.buffer = this._makeImpulse(1.6, 3.0);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    conv.connect(wet).connect(ctx.destination);
    this.reverb = conv;

    // soft pink-ish noise for whooshes / air
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    this.noiseBuffer = buf;

    // Keepalive: browsers can auto-suspend the context (tab backgrounded, idle).
    // Resume it whenever the user returns or interacts, so audio never stays
    // stuck/glitched and needs a manual toggle to recover.
    const resumeIfNeeded = () => {
      if (this.enabled && this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", resumeIfNeeded);
    window.addEventListener("pointerdown", resumeIfNeeded, { passive: true });
    window.addEventListener("keydown", resumeIfNeeded, { passive: true });

    return true;
  }

  _makeImpulse(dur, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * dur);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  setEnabled(on) {
    if (on) {
      if (!this._ensure()) return;
      this.enabled = true;
      // Kick the context into "running" synchronously inside the gesture by
      // playing a 1-sample silent buffer — the classic, reliable unlock that
      // avoids the "first sound is silent / context stuck suspended" race.
      try {
        const buf = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        src.start(0);
      } catch {
        /* ignore */
      }
      // Start the ambient ONLY once the context is actually running.
      const begin = () => {
        if (this.enabled) this._startAmbient();
      };
      if (this.ctx.state === "running") begin();
      else this.ctx.resume().then(begin).catch(begin);
    } else {
      this.enabled = false;
      this._stopAmbient();
    }
  }

  // Guard for every one-shot: bail if disabled, but if the context drifted to
  // suspended (tab backgrounded, autoplay), kick a resume so audio self-heals.
  _active() {
    if (!this.enabled || !this.ctx) return false;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    return true;
  }

  _startAmbient() {
    if (!this.ctx || this.ambientNodes.length) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const g = ctx.createGain();
    // Hold silent for a beat so the opening whoosh leads, then swell in slowly
    // (long, gentle ramp) instead of snapping on.
    g.gain.setValueAtTime(0.0001, now);
    g.gain.setValueAtTime(0.0001, now + 0.7);
    g.gain.linearRampToValueAtTime(0.42, now + 5.5);
    g.connect(this.master);
    this.ambientGain = g;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 560;
    lp.connect(g);

    // warm detuned drone (A1 / A2 / E3) — a soft suspended pad
    [55, 110, 164.81].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1) * 5;
      const og = ctx.createGain();
      og.gain.value = i === 0 ? 0.16 : 0.085;
      o.connect(og).connect(lp);
      o.start();
      this.ambientNodes.push(o, og);
    });

    // slow filter LFO for evolution
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 200;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    this.ambientNodes.push(lfo, lfoG);

    // faint filtered air
    const air = ctx.createBufferSource();
    air.buffer = this.noiseBuffer;
    air.loop = true;
    const airBp = ctx.createBiquadFilter();
    airBp.type = "bandpass";
    airBp.frequency.value = 480;
    airBp.Q.value = 0.6;
    const airG = ctx.createGain();
    airG.gain.value = 0.035;
    air.connect(airBp).connect(airG).connect(g);
    air.start();
    this.ambientNodes.push(air, airBp, airG);
  }

  _stopAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.6);
    const nodes = this.ambientNodes;
    setTimeout(() => {
      nodes.forEach((n) => {
        try {
          n.stop?.();
          n.disconnect?.();
        } catch {
          /* already stopped */
        }
      });
    }, 700);
    this.ambientNodes = [];
    this.ambientGain = null;
  }

  // ── voice helper ───────────────────────────────────────────────────────────
  // Plays `source` through an ADSR-ish gain into master (dry) + the reverb bus
  // (wet). Optional lowpass keeps tones soft. Returns the stop time.
  _play(source, { peak, attack, release, wet = 0.28, lp = null }) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    let node = source;
    if (lp) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = lp;
      node.connect(f);
      node = f;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
    node.connect(g).connect(this.master);
    if (wet > 0) {
      const w = ctx.createGain();
      w.gain.value = wet;
      g.connect(w).connect(this.reverb);
    }
    return now + attack + release;
  }

  // ── one-shots ────────────────────────────────────────────────────────────
  hover() {
    if (!this._active()) return;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    const now = this.ctx.currentTime;
    o.frequency.setValueAtTime(1280, now);
    o.frequency.exponentialRampToValueAtTime(960, now + 0.09);
    const end = this._play(o, { peak: 0.045, attack: 0.004, release: 0.11, wet: 0.2, lp: 2800 });
    o.start();
    o.stop(end + 0.03);
  }

  // a soft, satisfying two-note "confirm" (C5 + G5 pluck) over a warm sub thud
  select() {
    if (!this._active()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(62, now + 0.32);
    const e1 = this._play(sub, { peak: 0.17, attack: 0.006, release: 0.36, wet: 0.12, lp: 420 });
    sub.start();
    sub.stop(e1 + 0.03);

    [523.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const e = this._play(o, {
        peak: i ? 0.05 : 0.07,
        attack: 0.004,
        release: 0.55,
        wet: 0.45,
        lp: 5200,
      });
      o.start();
      o.stop(e + 0.03);
    });

    this.whoosh(0.09);
  }

  // soft descending close
  tick() {
    if (!this._active()) return;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    const now = this.ctx.currentTime;
    o.frequency.setValueAtTime(640, now);
    o.frequency.exponentialRampToValueAtTime(380, now + 0.16);
    const end = this._play(o, { peak: 0.05, attack: 0.004, release: 0.2, wet: 0.3, lp: 3200 });
    o.start();
    o.stop(end + 0.03);
  }

  // very soft UI click for buttons
  click() {
    if (!this._active()) return;
    const o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = 440;
    const end = this._play(o, { peak: 0.04, attack: 0.002, release: 0.07, wet: 0.18, lp: 3200 });
    o.start();
    o.stop(end + 0.02);
  }

  // Grand cinematic "arrival" for the opening fly-in: a layered swish (airy high
  // sweep over a low whoomph body) resolving into a warm chord swell, drenched
  // in reverb. Plays at most once per session.
  intro() {
    if (!this.enabled || !this.ctx || this._introPlayed) return;
    const t = performance.now();
    if (t < this._introStartAt || t > this._introEndAt) return; // outside entry window
    this._introPlayed = true;
    // play once the context is actually running so the swish doesn't glitch
    if (this.ctx.state === "running") this._playIntro();
    else this.ctx.resume().then(() => this._playIntro()).catch(() => {});
  }

  _playIntro() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // airy high swish — bandpass noise sweeping up then tailing off
    const sw = ctx.createBufferSource();
    sw.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.exponentialRampToValueAtTime(5200, now + 0.85);
    bp.frequency.exponentialRampToValueAtTime(900, now + 1.5);
    const swg = ctx.createGain();
    swg.gain.setValueAtTime(0.0001, now);
    swg.gain.linearRampToValueAtTime(0.17, now + 0.42);
    swg.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    sw.connect(bp).connect(swg).connect(this.master);
    const swW = ctx.createGain();
    swW.gain.value = 0.5;
    swg.connect(swW).connect(this.reverb);
    sw.start();
    sw.stop(now + 1.6);

    // low whoomph body — lowpassed noise rising for weight
    const lo = ctx.createBufferSource();
    lo.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(120, now);
    lp.frequency.exponentialRampToValueAtTime(720, now + 0.8);
    const log = ctx.createGain();
    log.gain.setValueAtTime(0.0001, now);
    log.gain.linearRampToValueAtTime(0.13, now + 0.5);
    log.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    lo.connect(lp).connect(log).connect(this.master);
    lo.start();
    lo.stop(now + 1.4);

    // warm arrival chord swell (C3 G3 C4), landing as the swish peaks
    [130.81, 196.0, 261.63].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, now + 0.3);
      og.gain.linearRampToValueAtTime(i === 0 ? 0.06 : 0.04, now + 1.0);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);
      o.connect(og).connect(this.master);
      const ww = ctx.createGain();
      ww.gain.value = 0.5;
      og.connect(ww).connect(this.reverb);
      o.start(now + 0.3);
      o.stop(now + 3.0);
    });
  }

  // Big satisfying boom for the sun explosion: a deep sub-drop + a filtered
  // noise blast + a bright transient crack, drenched in reverb.
  explode() {
    if (!this._active()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // sub drop
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.7);
    const e1 = this._play(sub, { peak: 0.32, attack: 0.005, release: 0.8, wet: 0.2, lp: 300 });
    sub.start();
    sub.stop(e1 + 0.05);

    // noise blast
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(4000, now);
    lp.frequency.exponentialRampToValueAtTime(300, now + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.34, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    src.connect(lp).connect(g).connect(this.master);
    const w = ctx.createGain();
    w.gain.value = 0.6;
    g.connect(w).connect(this.reverb);
    src.start();
    src.stop(now + 1.05);
  }

  // A soft, airy filtered-noise tick tied to scroll velocity — quiet enough to
  // texture the act of scrolling without ever becoming a beep machine. The
  // caller throttles how often this fires; `strength` (0–1) maps from velocity.
  scroll(strength = 0.5) {
    if (!this._active()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const s = Math.max(0.05, Math.min(strength, 1));
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.5;
    const f = 560 + s * 1500;
    bp.frequency.setValueAtTime(f * 0.7, now);
    bp.frequency.exponentialRampToValueAtTime(f, now + 0.08);
    const g = ctx.createGain();
    const peak = 0.01 + s * 0.026;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    src.connect(bp).connect(g).connect(this.master);
    const w = ctx.createGain();
    w.gain.value = 0.22;
    g.connect(w).connect(this.reverb);
    src.start();
    src.stop(now + 0.25);
  }

  whoosh(gain = 0.1) {
    if (!this._active()) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    const now = ctx.currentTime;
    bp.frequency.setValueAtTime(320, now);
    bp.frequency.exponentialRampToValueAtTime(2200, now + 0.28);
    bp.frequency.exponentialRampToValueAtTime(360, now + 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    src.connect(bp).connect(g).connect(this.master);
    const w = ctx.createGain();
    w.gain.value = 0.3;
    g.connect(w).connect(this.reverb);
    src.start();
    src.stop(now + 0.65);
  }
}

export const audio = new AudioEngine();
