/**
 * Discord username validation.
 *
 * A static site cannot prove a Discord account exists. Discord retired username
 * lookup with the discriminator migration; the only public endpoint is
 * GET /users/{id}, which takes a numeric snowflake and requires a bot token.
 * A bot token cannot ship in a client bundle, and output:"export" leaves no
 * server to hide one behind. So this validates *shape*, strictly, against the
 * rules Discord itself enforces at signup — which is what actually stops
 * "asdasd asd", "idk lol", pasted emoji and empty-ish junk from reaching the
 * inbox.
 */

export const DISCORD_MESSAGE =
  "That is not a valid Discord username. Use your handle, for example severrir or severrir.dev";

/** Names Discord reserves and will never assign to a user. */
const RESERVED = new Set(["everyone", "here", "discordtag", "discord", "system"]);

/**
 * Current-era handles: 2–32 chars, lowercase letters, digits, underscore and
 * period only. Discord additionally rejects consecutive periods.
 */
const HANDLE = /^[a-z0-9_.]{2,32}$/;

/**
 * Legacy tags (Name#1234) still identify plenty of long-standing accounts, so
 * they stay acceptable rather than being rejected as malformed.
 */
const LEGACY = /^.{2,32}#\d{4}$/;

/**
 * Normalise what people actually paste: surrounding space, a leading @ copied
 * from a mention, and uppercase from muscle memory or autocapitalise on phones.
 */
export function normalizeDiscord(raw: string): string {
  const trimmed = raw.trim().replace(/^@+/, "");
  // Legacy tags are case-sensitive in their name half, so only lowercase handles.
  return trimmed.includes("#") ? trimmed : trimmed.toLowerCase();
}

export function isValidDiscord(raw: string): boolean {
  const value = normalizeDiscord(raw);
  if (!value) return false;

  if (value.includes("#")) return LEGACY.test(value);

  if (!HANDLE.test(value)) return false;
  if (value.includes("..")) return false;
  // A handle made only of periods passes the character class but is not a name.
  if (/^\.+$/.test(value)) return false;
  if (value.startsWith(".") || value.endsWith(".")) return false;
  if (RESERVED.has(value)) return false;

  return true;
}
