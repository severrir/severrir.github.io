/**
 * Discord handle normalisation.
 *
 * This file used to validate a hand-typed username, strictly, against the rules
 * Discord enforces at signup — because a static site cannot prove an account
 * exists and the only public lookup endpoint needs a bot token that cannot ship
 * in a client bundle.
 *
 * None of that is needed any more. Booking requires a connected Discord
 * account, so the handle arrives from Discord itself rather than from memory,
 * and a value the provider vouches for cannot be checked any harder by a
 * regular expression. What remains is tidying the shape of what OAuth returns.
 */

/**
 * Normalise what the provider returns: surrounding space, a leading @ from a
 * mention, and uppercase from a legacy account.
 */
export function normalizeDiscord(raw: string): string {
  const trimmed = raw.trim().replace(/^@+/, "");
  // Legacy tags (Name#1234) are case-sensitive in their name half, so only
  // current-era handles get lowercased.
  return trimmed.includes("#") ? trimmed : trimmed.toLowerCase();
}
