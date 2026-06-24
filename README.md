# SEVERRIR — Solar System Portfolio

A cinematic 3D portfolio for Roblox systems developer **SEVERRIR**. The site is a
real Three.js solar system: a glowing sun anchors the hero, and six orbiting
planets each represent one project. Click a planet (or use the "Systems" dock) to
fly the camera in and open a project card.

## Stack

- **React + Vite** — app shell and build
- **Tailwind CSS** — utility layer (shadcn-compatible config + `cn` helper)
- **Three.js** via **@react-three/fiber** + **@react-three/drei** — the 3D scene
- **@react-three/postprocessing** — sun bloom + vignette

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to /dist
npm run preview  # preview the build
```

## Structure

```
src/
  main.jsx                  # entry
  App.jsx                   # top-level state: loading / reveal / active project / about
  index.css                 # globals, design tokens, reveal + loader-fade
  components/ui/box-loader.jsx  # full-screen 3D box loader (shadcn "Box Loader" style)
  scene/                    # 3D: Scene, Sun, Planet, Starfield, Orbits, CameraRig
  data/projects.js          # single source of truth (projects, about, links)
  ui/                       # HTML overlay: Nav, Hero, ProjectCard, AboutPanel, Footer, icons
  styles/                   # CSS split by section: nav, hero, projects, about, footer, loader
```

## Notes

- The loading screen (`components/ui/box-loader.jsx`) is a bespoke "first frame
  of the solar system" animation — the sun ignites, a single orbit ring traces
  itself, and a planet settles onto its lane — using the scene's own palette. It
  is self-contained (no `npx shadcn add` step, which needs interactive init + a
  live registry fetch) and cross-fades into the 3D reveal.
- **Mobile / perf**: star count, device pixel ratio, bloom intensity and MSAA all
  degrade on small screens. The orbit "Systems" dock provides large tap targets so
  planets don't need pixel-perfect taps on touch.
- **Accessibility**: respects `prefers-reduced-motion`, keyboard support (Esc to
  exit, ←/→ to page through projects), visible focus rings, SVG icons (no emoji).
```
