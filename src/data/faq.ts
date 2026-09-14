export type FaqItem = {
  question: string;
  answer: string;
  /** Rendered as an ordered list when the answer is genuinely a sequence. */
  steps?: string[];
  /** Rendered as an unordered list of discrete options. */
  options?: string[];
};

export const faq: FaqItem[] = [
  {
    question: "Are commissions open?",
    answer: "Yes.",
  },
  {
    question: "Do you need upfront payment?",
    answer:
      "For smaller projects, yes. Larger work is paid against completion milestones.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "PayPal is the primary method.",
    options: [
      "PayPal",
      "Bitcoin",
      "Ethereum",
      "Direct bank transfer, for EU clients",
      "Robux",
    ],
  },
  {
    question: "How will I get my files?",
    answer:
      "Either through the delivery sequence below, or by direct collaboration where I work inside your own project or Studio.",
    steps: [
      "You place an order request",
      "The work is completed and showcased to you",
      "Payment is confirmed",
      "The files are delivered",
    ],
  },
  {
    question: "What is the minimum order amount?",
    answer: "$25.",
  },
];
