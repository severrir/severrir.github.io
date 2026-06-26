// Pricing tiers + FAQ.
//
// IMPORTANT: the FAQ answers below are canonical and must be rendered verbatim.
// Do not paraphrase them in the UI.

export const tiers = [
  {
    id: "starter",
    name: "Starter",
    eyebrow: "Single feature",
    price: "$25–$50",
    priceNote: "per job",
    summary: "One focused script or feature, done cleanly and dropped straight in.",
    features: [
      "A single feature or script",
      "1–3 day delivery",
      "1 revision round",
      "Clean, commented Luau",
    ],
    cta: "Start small",
    featured: false,
  },
  {
    id: "system",
    name: "System",
    eyebrow: "Full modular system",
    price: "$75–$150",
    priceNote: "per system",
    summary: "A complete modular system — the kind already shown across the homepage.",
    features: [
      "A full modular system",
      "3–7 day delivery",
      "2 revision rounds",
      "Basic documentation included",
      "Demo walkthrough before handoff",
    ],
    cta: "Build a system",
    featured: true,
  },
  {
    id: "fullbuild",
    name: "Full Build",
    eyebrow: "Multi-system / integration",
    price: "$200–$500+",
    priceNote: "scoped to project",
    summary: "Several systems built into one cohesive game, end to end.",
    features: [
      "Multiple systems, one build",
      "1–3 week delivery",
      "Ongoing communication",
      "Priority revisions",
      "Milestone-based delivery",
    ],
    cta: "Plan a build",
    featured: false,
  },
  {
    id: "custom",
    name: "Ongoing",
    eyebrow: "Collaboration / retainer",
    price: "Custom",
    priceNote: "after consultation",
    summary: "Full project collaboration or ongoing retainer work, priced to fit.",
    features: [
      "Full project collaboration",
      "Retainer / ongoing work",
      "Priced after a consultation",
      "Direct work inside your Studio",
    ],
    cta: "Let's talk",
    featured: false,
  },
];

// Verbatim FAQ — answers must match exactly.
export const faqs = [
  {
    q: "Are commissions open?",
    a: "Yes",
  },
  {
    q: "Do you need upfront payment?",
    a: "For smaller projects, yes; otherwise based on completion milestones.",
  },
  {
    q: "What payment methods do you accept?",
    a: "PayPal (primary), Bitcoin, Ethereum, direct bank transfer (for EU clients), and Robux.",
  },
  {
    q: "How will I get my files?",
    // Two delivery paths, rendered as an ordered list in the UI.
    a: [
      "You place an order request, the work is completed and showcased to you first, payment is confirmed, then the files are delivered.",
      "Alternatively, direct collaboration — I work within your own project / Studio.",
    ],
  },
  {
    q: "What is the minimum order amount?",
    a: "$25.",
  },
];
