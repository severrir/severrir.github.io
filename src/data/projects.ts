/**
 * Which diagram a card draws.
 *
 * Each drawing illustrates one specific mechanism, so this is a choice and
 * never an automatic one: a broadphase grid under a datastore module would make
 * the card assert something untrue. A project that fits none of them takes
 * `module`, which routes only its own parts and claims nothing about them.
 */
export type SchematicKind =
  | "graph"
  | "grid"
  | "fanout"
  | "lattice"
  | "bands"
  | "module"
  | "none";

/** What each option draws, in the dashboard's own words. */
export const SCHEMATIC_CHOICES: { value: SchematicKind; label: string }[] = [
  { value: "module", label: "Module trace — routing, for anything" },
  { value: "graph", label: "Dependency graph resolving into a lifecycle" },
  { value: "grid", label: "Spatial grid with a live neighbourhood" },
  { value: "fanout", label: "One source driving several surfaces" },
  { value: "lattice", label: "Playable lattice on a fixed timestep" },
  { value: "bands", label: "Bands widening over a scrubbed timeline" },
  { value: "none", label: "No diagram" },
];

export type Project = {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  githubUrl: string;
  youtubeId: string;
  schematic?: SchematicKind;
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
    schematic: "graph",
  },
  {
    slug: "proximity-interaction-sys",
    title: "Proximity Interaction",
    summary:
      "Spatial interaction layer for NPCs, doors, pickups and prompts. Buckets interactables into a broadphase grid so the per-frame cost tracks what is near the player, not how much exists in the place.",
    stack: ["Luau", "Roblox", "Systems"],
    githubUrl: "https://github.com/severrir/proximity-interaction-sys",
    youtubeId: "V-_O7nl0Ii0",
    schematic: "grid",
  },
  {
    slug: "modular-ui-components",
    title: "Modular UI",
    summary:
      "Component library for Roblox interfaces. One theme table drives every surface, layout primitives handle scaling across device classes, and state lives outside the view so screens stay reusable.",
    stack: ["Luau", "Roblox", "Interface"],
    githubUrl: "https://github.com/severrir/modular-ui-components",
    youtubeId: "ScMzIvxBSi4",
    schematic: "fanout",
  },
  {
    slug: "snake-twist-pygame",
    title: "Snake, Twisted",
    summary:
      "Snake rebuilt in Pygame with altered collision and momentum rules. Written to test game feel with a fixed timestep and no engine doing the interpolation for you.",
    stack: ["Python", "Pygame", "Game design"],
    githubUrl: "https://github.com/severrir/snake-twist-pygame",
    youtubeId: "qN3OueBm9F4",
    schematic: "lattice",
  },
  {
    slug: "backend-matchmaking",
    title: "Matchmaking Service",
    summary:
      "Skill-based queueing that runs outside the game server. Widens rating bands as wait time grows, reserves slots atomically, and hands finished parties off without trusting the client.",
    stack: ["Backend", "Matchmaking", "Systems"],
    githubUrl: "https://github.com/severrir/backend-matchmaking",
    youtubeId: "9bZkp7q19f0",
    schematic: "bands",
  },
];
