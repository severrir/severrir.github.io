export type Service = {
  id: string;
  name: string;
  icon: "Server" | "MonitorSmartphone" | "Layers" | "Gamepad2" | "PanelsTopLeft" | "Braces";
  /** One sentence on what this actually means in practice. */
  premise: string;
  /** Concrete, checkable deliverables. */
  deliverables: string[];
  /** Other service ids this one usually ships alongside. */
  pairsWith: string[];
};

export const services: Service[] = [
  {
    id: "backend",
    name: "Backend",
    icon: "Server",
    premise:
      "Server-authoritative logic that holds up when the player count does, and assumes the client is lying.",
    deliverables: [
      "Matchmaking and queueing",
      "Datastore schemas and migrations",
      "Session handoff and reconnection",
      "Rate limiting and exploit validation",
    ],
    pairsWith: ["full-stack", "script-design"],
  },
  {
    id: "frontend",
    name: "Frontend",
    icon: "MonitorSmartphone",
    premise:
      "The half the player actually feels. Input, camera and replication tuned until the latency stops being visible.",
    deliverables: [
      "Client controllers and input handling",
      "Camera rigs and character feel",
      "Replication smoothing and prediction",
      "Device-class scaling",
    ],
    pairsWith: ["ui-design", "game-design"],
  },
  {
    id: "full-stack",
    name: "Full stack",
    icon: "Layers",
    premise:
      "One person across the boundary, so there is no gap between what the server knows and what the client shows.",
    deliverables: [
      "End-to-end feature ownership",
      "Remote contracts and shared types",
      "External services alongside in-engine code",
      "Deployment and release process",
    ],
    pairsWith: ["backend", "frontend"],
  },
  {
    id: "game-design",
    name: "Game design",
    icon: "Gamepad2",
    premise:
      "The loop before the code. Systems designed to be tuned after launch rather than rebuilt.",
    deliverables: [
      "Core loop and progression",
      "Economy and reward tuning",
      "Difficulty curves and pacing",
      "Playtest iteration",
    ],
    pairsWith: ["frontend", "ui-design"],
  },
  {
    id: "ui-design",
    name: "UI design",
    icon: "PanelsTopLeft",
    premise:
      "Interfaces built as a system, not a pile of screens, so the tenth menu costs less than the first.",
    deliverables: [
      "Screen flows and information hierarchy",
      "Reusable component systems",
      "Responsive scaling across devices",
      "Transitions and interface feedback",
    ],
    pairsWith: ["frontend", "game-design"],
  },
  {
    id: "script-design",
    name: "Script design",
    icon: "Braces",
    premise:
      "Architecture as the deliverable. The part that decides whether the codebase is still workable in six months.",
    deliverables: [
      "Module boundaries and dependency graphs",
      "Naming and code conventions",
      "Refactoring inherited codebases",
      "Code review and handover",
    ],
    pairsWith: ["backend", "full-stack"],
  },
];
