/**
 * Frontend profanity gate for the booking form.
 *
 * Substring matching is wrong here — it rejects "class", "assassin" and
 * "Scunthorpe". This normalises common letter substitutions, then matches on
 * word boundaries so real project descriptions get through.
 */

const BLOCKED = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "piss",
  "slut",
  "whore",
  "faggot",
  "retard",
  "nigger",
  "nigga",
  "wanker",
  "twat",
];

const SUBSTITUTIONS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  $: "s",
  "7": "t",
  "8": "b",
};

function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/[013457!@$8]/g, (c) => SUBSTITUTIONS[c] ?? c)
    /* Collapse padding characters used to slip words past a filter. */
    .replace(/[^a-z\s]/g, "")
    .replace(/(.)\1{2,}/g, "$1$1");
}

/* String.raw is load-bearing: in a plain template literal `\b` is a backspace
   character, not a word boundary, and every pattern silently stops matching. */
const PATTERNS = BLOCKED.map(
  (word) =>
    new RegExp(String.raw`\b${word}(s|es|ed|ing|in|er|ers|y|ty|head)?\b`, "i"),
);

export function containsProfanity(text: string): boolean {
  const normalised = normalise(text);
  return PATTERNS.some((pattern) => pattern.test(normalised));
}

export const PROFANITY_MESSAGE = "Please keep the message professional.";
