// The six service offerings, each rendered as its own planet in the Services
// scene (see scene/ServicesScene.jsx). `visual` reuses the same GLSL planet
// shader vocabulary as the project planets (scene/planetShader.js) so the two
// pages clearly belong to one visual universe — different arrangement, same
// materials, lighting and motion language.

export const services = [
  {
    id: "frontend",
    title: "Frontend Development",
    blurb: "Interfaces that respond",
    description:
      "Responsive, fast interfaces built to spec — component architecture, state management, and the interactions that make a product feel alive in the browser.",
    tags: ["Components", "State", "Responsive", "Interaction"],
    visual: {
      pattern: "circuit",
      colorA: "#07201f",
      colorB: "#146b78",
      colorC: "#5ee6e0",
      rimColor: "#5ee6e0",
      rimStrength: 0.6,
      rimPower: 3.0,
      size: 1.1,
    },
  },
  {
    id: "backend",
    title: "Backend Development",
    blurb: "The layer underneath",
    description:
      "Servers, APIs, data models, and the security layer beneath them — built modular so the system scales without rotting as it grows.",
    tags: ["APIs", "Data", "Security", "Architecture"],
    visual: {
      pattern: "shield",
      colorA: "#0d1a2b",
      colorB: "#2a4a6b",
      colorC: "#cfe4ff",
      rimColor: "#4a90d9",
      rimStrength: 0.95,
      rimPower: 2.0,
      size: 1.2,
      moon: true,
    },
  },
  {
    id: "ui",
    title: "UI Development",
    blurb: "Polish you can feel",
    description:
      "Pixel-accurate implementation of designs — layout, motion, and the small details that separate polished from passable.",
    tags: ["Layout", "Motion", "Detail", "Accessibility"],
    visual: {
      pattern: "ice",
      colorA: "#16384a",
      colorB: "#a8e8f0",
      colorC: "#ffffff",
      rimColor: "#a8e8f0",
      rimStrength: 0.75,
      rimPower: 2.2,
      size: 1.0,
    },
  },
  {
    id: "fullstack",
    title: "Full-Stack Development",
    blurb: "End to end",
    description:
      "End-to-end ownership: I carry a feature from data model to deployed interface, so nothing falls through the cracks between layers.",
    tags: ["Full-Stack", "Systems", "Deployment", "Ownership"],
    visual: {
      pattern: "bands",
      colorA: "#2b1e08",
      colorB: "#9a6f24",
      colorC: "#ffe6a8",
      rimColor: "#d9a24a",
      rimStrength: 0.6,
      rimPower: 3.0,
      size: 1.45,
      rings: true,
    },
  },
  {
    id: "pm",
    title: "Project Management",
    blurb: "Always know where it stands",
    description:
      "Scoping, milestones, and clear updates. You always know what's shipping, what's next, and exactly where the work stands.",
    tags: ["Scoping", "Milestones", "Updates", "Delivery"],
    visual: {
      pattern: "marble",
      colorA: "#2a0e3a",
      colorB: "#b45ee0",
      colorC: "#e05eaf",
      rimColor: "#b45ee0",
      rimStrength: 0.75,
      rimPower: 2.4,
      size: 1.05,
    },
  },
  {
    id: "gamedesign",
    title: "Game Design",
    blurb: "Loops that hold attention",
    description:
      "Systems and mechanics that hold attention — progression, combat, NPC behaviour, and the loops that keep players coming back.",
    tags: ["Mechanics", "Progression", "Combat", "NPC AI"],
    visual: {
      pattern: "lava",
      colorA: "#2b0e0a",
      colorB: "#7a2218",
      colorC: "#ff8a3d",
      rimColor: "#e8453c",
      rimStrength: 0.7,
      rimPower: 3.0,
      size: 1.1,
      trail: true,
    },
  },
];
