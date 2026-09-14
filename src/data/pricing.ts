export type Tier = {
  id: "job" | "system" | "build" | "ongoing";
  name: string;
  price: string;
  unit: string;
  summary: string;
  includes: string[];
  cta: string;
  badge?: string;
};

export const tiers: Tier[] = [
  {
    id: "job",
    name: "Single job",
    price: "$25–$50",
    unit: "per job",
    summary:
      "One focused script or feature, done cleanly and dropped straight in.",
    includes: [
      "A single feature or script",
      "1–3 day delivery",
      "1 revision round",
      "Clean, commented Luau",
    ],
    cta: "Start small",
    badge: "Most picked",
  },
  {
    id: "system",
    name: "System",
    price: "$75–$150",
    unit: "per system",
    summary:
      "A complete modular system — the kind already shown across the homepage.",
    includes: [
      "A full modular system",
      "3–7 day delivery",
      "2 revision rounds",
      "Basic documentation included",
      "Demo walkthrough before handoff",
    ],
    cta: "Build a system",
  },
  {
    id: "build",
    name: "Full Build",
    price: "$200–$500+",
    unit: "scoped to project",
    summary: "Several systems built into one cohesive game, end to end.",
    includes: [
      "Multiple systems, one build",
      "1–3 week delivery",
      "Ongoing communication",
      "Priority revisions",
      "Milestone-based delivery",
    ],
    cta: "Plan a build",
  },
  {
    id: "ongoing",
    name: "Ongoing",
    price: "Custom",
    unit: "after consultation",
    summary:
      "Full project collaboration or ongoing retainer work, priced to fit.",
    includes: [
      "Full project collaboration",
      "Retainer / ongoing work",
      "Priced after a consultation",
      "Direct work inside your Studio",
    ],
    cta: "Let's talk potential deals",
  },
];

export const tierIds = tiers.map((t) => t.id);
