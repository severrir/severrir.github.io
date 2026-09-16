import { supabaseAnonKey, trackEndpoint } from "./supabase";

/** One call per browser session, not per page view — the count is of people. */
const SESSION_KEY = "severrir:counted";

/**
 * Tell the edge function this browser is here. Everything that identifies the
 * visitor is read server-side from the request; nothing identifying is sent
 * from the page, and nothing comes back that the page displays.
 *
 * Fails silently on purpose. A counter that cannot count is not a reason for a
 * visitor to see anything go wrong.
 */
export async function trackVisit(): Promise<void> {
  if (!trackEndpoint || !supabaseAnonKey) return;

  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    /* Written before the request rather than after, so a slow network cannot
       produce two calls from one page if the visitor navigates immediately. */
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage refused (private window). Counting once per load is still
    // harmless — the hash deduplicates on the server either way.
  }

  try {
    await fetch(trackEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: "{}",
      // Survives the request outliving the page on a quick bounce.
      keepalive: true,
    });
  } catch {
    // Offline, blocked by an extension, or the project is paused. Not the
    // visitor's problem.
  }
}

/**
 * Retire the calling device from the count. Requires an admin access token;
 * the function verifies it against the admins table before writing, so a
 * forged call from anywhere else is refused.
 */
export async function excludeThisDevice(
  accessToken: string,
): Promise<{ error: string | null }> {
  if (!trackEndpoint || !supabaseAnonKey) {
    return { error: "Visitor tracking is not configured." };
  }

  try {
    const response = await fetch(trackEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ exclude: true }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      return { error: detail?.error ?? `Request failed (${response.status})` };
    }

    return { error: null };
  } catch {
    return { error: "Could not reach the server. Check your connection." };
  }
}
