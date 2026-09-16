import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser client for the static export.
 *
 * There is no Node server on GitHub Pages, so there are no cookies to keep in
 * sync between a server render and the page — which is exactly the problem
 * @supabase/ssr exists to solve. Plain createClient is the correct choice here,
 * and it keeps the session in localStorage where this bundle can reach it.
 *
 * The anon key below ships in the bundle and is meant to. It carries no
 * authority of its own: every table has row-level security on, and a request
 * made with this key can do only what supabase/schema.sql explicitly permits.
 */

/* Read as whole literal expressions — Next inlines these at build time by
   textual substitution, so a destructured or computed lookup finds nothing. */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False until the two environment variables are set. Everything downstream
 * checks this and falls back to the committed content, so the site builds,
 * deploys and reads correctly before the Supabase project exists — and keeps
 * working if it is ever paused or unreachable.
 */
export const supabaseConfigured = Boolean(url && anonKey);

export type ProjectOverride = {
  slug: string;
  title: string | null;
  summary: string | null;
  stack: string[] | null;
  github_url: string | null;
  youtube_id: string | null;
  sort_order: number | null;
  visible: boolean;
  updated_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  name: string;
  discord: string;
  email: string | null;
  tier: string;
  message: string;
  status: "open" | "handled";
  created_at: string;
};

export type VisitorStats = {
  total: number;
  last_7_days: number;
  excluded_devices: number;
};

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        /* The OAuth provider returns to /auth/callback/ with a code in the
           query string; this is what exchanges it for a session without a
           server in the middle. */
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

/** The function endpoint, derived rather than configured separately. */
export const trackEndpoint = url ? `${url}/functions/v1/track` : null;

export { url as supabaseUrl, anonKey as supabaseAnonKey };
