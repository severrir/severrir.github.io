// Single source of truth for the 6 planets / projects.
// `visual` drives the GLSL planet shader (see scene/planetShader.js) so each
// planet's surface pattern hints at its project. `orbit` drives its lane.
//
// IMPORTANT: title / tags / description below are the canonical project copy
// and must be rendered verbatim — do not paraphrase in the UI.

export const projects = [
  {
    id: "anticheat",
    title: "Anticheat System",
    blurb: "Server-side security",
    tags: ["Knit", "Anticheat", "OOP", "Security", "Luau"],
    description:
      "Server-side anticheat: speed-hack detection via HRP velocity streaks, teleport exploit checks via position delta, fake score validation (3-gate), Discord webhook kick alerts, modular OOP.",
    repo: "https://github.com/severrir/my-Roblox-Scripts/tree/main/anticheat-system",
    demo: "https://www.youtube.com/watch?v=LmxRo0vUUK4",
    visual: {
      // steel-blue — server-side security
      pattern: "shield",
      colorA: "#0d1a2b",
      colorB: "#2a4a6b",
      colorC: "#cfe4ff",
      rimColor: "#4a90d9",
      rimStrength: 0.95,
      rimPower: 2.0,
      size: 1.15,
      moon: true,
    },
    orbit: { radius: 9, speed: 0.16, tilt: 0.05, angle: 0.2 },
  },
  {
    id: "combat",
    title: "Advanced Combat System",
    blurb: "Modular combat framework",
    tags: ["Combat", "Hit Detection", "PvP", "Framework"],
    description:
      "Modular combat framework: hit detection, combo chains, status effects, flexible weapon API.",
    repo: "https://github.com/severrir/my-Roblox-Scripts/tree/main/AdvancedCombatSystem",
    demo: "https://youtu.be/xZhXqt4oelI",
    visual: {
      // molten red — combat
      pattern: "lava",
      colorA: "#2b0e0a",
      colorB: "#7a2218",
      colorC: "#ff8a3d",
      rimColor: "#e8453c",
      rimStrength: 0.7,
      rimPower: 3.0,
      size: 1.05,
      trail: true,
    },
    orbit: { radius: 13, speed: 0.125, tilt: -0.08, angle: 1.7 },
  },
  {
    id: "simulator",
    title: "Modular Simulator System",
    blurb: "Scalable service architecture",
    tags: ["Simulator", "Modular Architecture", "OOP", "Luau"],
    description:
      "Scalable simulator: dynamic progression, rebirth mechanics, clean service-based structure.",
    repo: null,
    demo: "https://www.youtube.com/watch?v=iLEGyrfyi-s",
    visual: {
      // amber / gold bands — modular simulator
      pattern: "bands",
      colorA: "#2b1e08",
      colorB: "#9a6f24",
      colorC: "#ffe6a8",
      rimColor: "#d9a24a",
      rimStrength: 0.6,
      rimPower: 3.0,
      size: 1.5,
      rings: true,
    },
    orbit: { radius: 17.5, speed: 0.1, tilt: 0.12, angle: 3.1 },
  },
  {
    id: "brainrot",
    title: "Brainrot Game",
    blurb: "Chaos on clean architecture",
    tags: ["Brainrot", "Gameplay", "Chaos", "Luau"],
    description: "Chaotic gameplay built on clean architecture.",
    repo: null,
    demo: "https://www.youtube.com/watch?v=-c3id0JE0ac",
    visual: {
      // multi-hue swirl: violet + magenta — brainrot
      pattern: "marble",
      colorA: "#2a0e3a",
      colorB: "#b45ee0",
      colorC: "#e05eaf",
      rimColor: "#b45ee0",
      rimStrength: 0.75,
      rimPower: 2.4,
      size: 0.95,
    },
    orbit: { radius: 21.5, speed: 0.085, tilt: -0.14, angle: 4.4 },
  },
  {
    id: "penguins",
    title: "Penguin Game",
    blurb: "State-machine NPCs",
    tags: ["Penguins", "NPC States", "Animation", "Open Source"],
    description:
      "State-machine driven penguin NPCs, crowd logic, smooth animation.",
    repo: "https://github.com/severrir/my-Roblox-Scripts/tree/main/Penguins",
    demo: "https://youtu.be/xQqHYoE1Qes",
    visual: {
      // ice white-blue — penguin game
      pattern: "ice",
      colorA: "#16384a",
      colorB: "#a8e8f0",
      colorC: "#ffffff",
      rimColor: "#a8e8f0",
      rimStrength: 0.75,
      rimPower: 2.2,
      size: 1.05,
    },
    orbit: { radius: 26, speed: 0.07, tilt: 0.09, angle: 5.6 },
  },
  {
    id: "ai-chatbot",
    title: "Real AI Chatbot in Roblox",
    blurb: "GPT-powered NPCs",
    tags: ["ChatGPT", "OpenAI", "LLM Integration", "Open Source"],
    description:
      "GPT-powered NPCs that hold real conversations and remember context.",
    repo: "https://github.com/severrir/my-Roblox-Scripts/tree/main/Roblox-Ai",
    demo: "https://youtu.be/yY0Q00cqy5g",
    visual: {
      // circuit cyan — flagship, ties to the main accent
      pattern: "circuit",
      colorA: "#07201f",
      colorB: "#146b78",
      colorC: "#5ee6e0",
      rimColor: "#5ee6e0",
      rimStrength: 0.6,
      rimPower: 3.0,
      size: 1.2,
      trail: true,
    },
    orbit: { radius: 30.5, speed: 0.058, tilt: -0.06, angle: 0.9 },
  },
];

export const about = {
  bio: "SEVERRIR is a Roblox systems developer and scripter. Writes Luau code, builds modular game systems, scripts gameplay mechanics, and creates scalable backend architecture for production games. Work spans server-side security, combat systems, NPC state machines, AI integration, and anticheat engineering. Does not do 3D design, building, or art — writes code.",
  stack: [
    "Luau",
    "Knit Framework",
    "OOP Architecture",
    "Server Security",
    "Roblox Studio",
    "Remote Events",
    "DataStore",
    "Gameplay Systems",
    "State Machines",
    "Anticheat Systems",
    "AI Integration",
    "Modular Architecture",
  ],
};

export const links = {
  github: "https://github.com/severrir",
  youtube: "https://www.youtube.com/@severrir",
};
