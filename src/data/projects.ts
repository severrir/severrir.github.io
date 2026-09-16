export type Project = {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  githubUrl: string;
  youtubeId: string;
};

export const projects: Project[] = [
  {
    slug: "roblox-core-framework",
    title: "Core Framework",
    summary:
      "Service and controller runtime for Roblox. Resolves dependencies at boot, orders lifecycle across the server/client boundary, and fails loudly when a module lies about what it needs.",
    stack: ["Luau", "Roblox", "Architecture"],
    githubUrl: "https://github.com/severrir/roblox-core-framework",
    youtubeId: "LXb3EKWsInQ",
  },
  {
    slug: "proximity-interaction-sys",
    title: "Proximity Interaction",
    summary:
      "Spatial interaction layer for NPCs, doors, pickups and prompts. Buckets interactables into a broadphase grid so the per-frame cost tracks what is near the player, not how much exists in the place.",
    stack: ["Luau", "Roblox", "Systems"],
    githubUrl: "https://github.com/severrir/proximity-interaction-sys",
    youtubeId: "V-_O7nl0Ii0",
  },
  {
    slug: "modular-ui-components",
    title: "Modular UI",
    summary:
      "Component library for Roblox interfaces. One theme table drives every surface, layout primitives handle scaling across device classes, and state lives outside the view so screens stay reusable.",
    stack: ["Luau", "Roblox", "Interface"],
    githubUrl: "https://github.com/severrir/modular-ui-components",
    youtubeId: "ScMzIvxBSi4",
  },
  {
    slug: "snake-twist-pygame",
    title: "Snake, Twisted",
    summary:
      "Snake rebuilt in Pygame with altered collision and momentum rules. Written to test game feel with a fixed timestep and no engine doing the interpolation for you.",
    stack: ["Python", "Pygame", "Game design"],
    githubUrl: "https://github.com/severrir/snake-twist-pygame",
    youtubeId: "qN3OueBm9F4",
  },
  {
    slug: "backend-matchmaking",
    title: "Matchmaking Service",
    summary:
      "Skill-based queueing that runs outside the game server. Widens rating bands as wait time grows, reserves slots atomically, and hands finished parties off without trusting the client.",
    stack: ["Backend", "Matchmaking", "Systems"],
    githubUrl: "https://github.com/severrir/backend-matchmaking",
    youtubeId: "9bZkp7q19f0",
  },
];
