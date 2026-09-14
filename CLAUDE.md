@AGENTS.md

# severrir — Portfolio Website

Portfolio site for "severrir", a Roblox/game scripter and full-stack developer. Built as a premium, Apple-product-page-grade showcase: vast negative space, restrained motion, technical and confident copy.

## Tech stack

- Next.js (App Router) + TypeScript (strict mode)
- Tailwind CSS
- Framer Motion (animation)
- @formspree/react (contact form, endpoint `xgojkepa`)
- Howler (UI sound effects)
- lucide-react (all icons — no emoji, ever)

## Design tokens (chosen)

**Palette** — deep obsidian and midnight cobalt with champagne gold as the one accent:
- `--bg` `#030712` (deep obsidian, base)
- `--bg-2` `#0A1128` (midnight cobalt)
- `--surface` `rgba(16,30,63,0.45)` over `backdrop-blur` (glass card fill)
- `--gold` `#D4AF37` (champagne gold — interactive highlights, active states, focus)
- `--gold-hover` `#E5C158`
- `--text` `#F8FAFC`, `--text-2` `#94A3B8`
- `--edge-gold` `rgba(212,175,55,0.22)` plus an inner top lip `rgba(255,255,255,0.1)`

Contrast on `--bg`: text 19.2:1, muted 7.9:1, gold 9.6:1 — all pass AA.

Champagne gold is antique and desaturated; that is the point. **Never substitute a saturated
yellow/amber (`#FFC300`, `#FCA311`) — the client rejected that as "neon garbage".** Do not
introduce a second accent hue.

**Atmosphere is part of the system, not decoration:** a fixed SVG grain overlay at `opacity
0.035` (`.grain`), a top-centre cobalt radial bloom (`.bloom`), and specular bevelled edges on
cards and CTAs (`.specular`, `.specular-hover`). Flat fills on a ground this dark will band and read
as plastic without the grain.

**Type**
- IBM Plex Serif — display only (hero, section headings, wordmark, prices). The high-contrast serif carries the luxury register.
- IBM Plex Sans — body and UI text. Weights 300/400 for body, 500/600 for UI. Chosen deliberately over Geist/Inter, which read as the default AI-generated face.
- IBM Plex Mono — used narrowly and only where it is *meaningful*: code snippets, terminal motifs, version/build labels. Not a generic label font — it exists because the subject is a scripter.
- No tracked-out ALL CAPS eyebrows. No "LABEL — fragment" em-dash constructions. No trailing `→` on links/buttons.

**Layout**
- Whitespace-first: `py-24`/`py-32` between sections, generous side margins.
- Hero is an ambient field: faint concentric arcs with one lit champagne limb, parallaxing against the pointer, behind centred serif display type. Not a generic gradient hero.
- Numbered markers (01/02/03) only where content is an actual sequence (e.g. a process/timeline). Do not use them decoratively on cards.
- Cards/sections: specular glass surfaces (1px gold hairline + inner top lip), `rounded-md`/`rounded-lg` only — never generic large-radius "template" rounding, never soft grey drop shadows as a crutch.

## Anti-slop rules (strict)

- No emojis anywhere.
- No glowing neon text, no rainbow gradients, no heavy drop shadows.
- No bouncy, fast, or chaotic animation. All Framer Motion transitions use smooth cubic-bezier easing, e.g. `transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}`. Things glide into place — never bounce or snap.
- Banned words: "Elevate", "Delve", "Cutting-edge", "Next-level", "Unlock your potential", "Digital landscape" (and their close synonyms).
- No generic rounded "template" buttons — sharp or `rounded-md` only.
- Avoid default AI-slop tells: tracked-out ALL CAPS eyebrows above every heading, middle-dot meta strings, em-dash "WORD — fragment" labels, tinted-near-black standing in for real black, arbitrary monospace on data labels, trailing `→` on CTAs.

## Copywriting tone

Punchy, confident, highly technical. Write like a senior developer talking to another senior developer.

- Bad: "Welcome to my portfolio, I create amazing Roblox experiences!"
- Good: "Robust modular systems. Clean Luau architecture. Built for scale."

Say what something does in plain, specific terms. No selling adjectives standing in for substance.

## Sound design

Centralized Howler utility (`lib/audio.ts` or similar). Volumes stay low (~0.2–0.4).
- Hover (buttons/cards): subtle, low-pitch tick / soft paper-glide.
- Click: muted mechanical "thock" / clean pop.
- Form success: soft chime.
Never loud, never grating.

## Contact form

Formspree endpoint: `https://formspree.io/f/xgojkepa`. Must run a frontend profanity filter on the `message` field before allowing submit; on a hit, block submission and show "Please keep the message professional."
