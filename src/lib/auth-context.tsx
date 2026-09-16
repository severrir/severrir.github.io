"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { normalizeDiscord } from "./discord";

/** Where the OAuth round trip should land the visitor back. */
const RETURN_KEY = "severrir:auth-return";

type AuthState = {
  /** True until the first session lookup settles. Nothing should render a
      signed-out state before this clears, or the page flashes a login panel at
      someone who is already signed in. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  /** True once the admin lookup has settled for the current session. Anything
      that must not act on a half-known identity waits for this, not isAdmin. */
  adminResolved: boolean;
  /** Why the admin lookup returned no, when the reason was a failure rather
      than a verdict. Null both when the account is the owner and when it
      plainly is not. */
  adminError: string | null;
  /** Set when Supabase has not been configured yet. */
  unavailable: boolean;
  signInWithDiscord: (returnTo?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Supabase's auth errors are written for whoever configured the project, not
 * for whoever is trying to send a commission request. The two below are the
 * ones a visitor can actually provoke — a provider that was never switched on,
 * and a redirect URL that does not match — and both mean the same thing from
 * their side: this is broken here, not something you did. Anything unrecognised
 * is passed through rather than flattened, because a message I have not seen
 * before is more useful verbatim than replaced with a shrug.
 */
function readableAuthError(message: string): string {
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return "Discord sign-in is not switched on for this site yet.";
  }
  if (/redirect|invalid request.*url/i.test(message)) {
    return "Discord could not return you to this page.";
  }
  return message;
}

/**
 * Discord's handle arrives under a different key depending on how the account
 * was set up, so read them in order of how close each is to the @handle the
 * owner would actually type into a Discord search.
 */
export function discordHandleOf(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  const candidate =
    meta.user_name ??
    meta.preferred_username ??
    meta.name ??
    meta.full_name ??
    meta.custom_claims?.global_name ??
    "";
  return typeof candidate === "string" ? normalizeDiscord(candidate) : "";
}

/** The name to greet someone by — display name first, handle as the fallback. */
export function displayNameOf(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  const candidate =
    meta.custom_claims?.global_name ?? meta.full_name ?? meta.name ?? "";
  return (typeof candidate === "string" && candidate) || discordHandleOf(user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  /*
   * The answer is stored against the account it was asked about rather than as
   * a loose boolean. Both flags below are then derived, which means a stale
   * "yes" from a previous account can never be read as current — and the effect
   * that performs the lookup never has to write state up front to clear one.
   */
  const [adminCheck, setAdminCheck] = useState<{
    userId: string;
    isAdmin: boolean;
    /* Why the answer is no. A refused or unreachable query is not the same
       fact as "this account is not the owner", and collapsing the two makes a
       broken lookup look like a settled verdict — which is exactly the shape
       of failure nobody can debug from the page. */
    error: string | null;
  } | null>(null);

  /* Guards a late-resolving admin lookup from writing state for a user who has
     already signed out. */
  const latestUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    /*
     * onAuthStateChange fires immediately with the restored session, so it
     * covers the initial read as well as every later change — including the
     * code-for-session exchange that happens on /auth/callback/. Subscribing is
     * enough; a separate getSession() call would only race it.
     */
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });

    /*
     * A floor under the loading state. Reading the stored session is local and
     * effectively instant, but a paused project, a misconfigured key or a
     * blocked request could leave the subscription silent — and a permanent
     * placeholder where the booking form should be is a worse failure than
     * showing the sign-in panel to someone who was already signed in. They can
     * still sign in; nothing is lost.
     */
    const floor = setTimeout(() => {
      if (active) setLoading(false);
    }, 6000);

    return () => {
      active = false;
      clearTimeout(floor);
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  /* Signed out is a settled answer, not a pending one. */
  const adminResolved = userId === null || adminCheck?.userId === userId;
  const isAdmin = adminCheck?.userId === userId && adminCheck.isAdmin;
  const adminError =
    (adminCheck?.userId === userId && adminCheck.error) || null;

  useEffect(() => {
    latestUserId.current = userId;

    if (!supabase || !userId) return;

    /*
     * Cosmetic only. This decides whether the dashboard link and the dashboard
     * shell are drawn; it decides nothing about what data is reachable. Anyone
     * can force this to true in a console and will still be refused by every
     * policy in schema.sql, because the check that counts runs in Postgres.
     */
    supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (latestUserId.current !== userId) return;
        setAdminCheck({
          userId,
          isAdmin: Boolean(data),
          error: error ? error.message : null,
        });
      });
  }, [userId]);

  const signInWithDiscord = useCallback(async (returnTo?: string) => {
    if (!supabase) {
      return { error: "Sign-in is not available yet. Try again shortly." };
    }

    try {
      sessionStorage.setItem(RETURN_KEY, returnTo ?? window.location.pathname);
    } catch {
      // Private browsing can refuse storage; the callback then falls back to
      // the booking page, which is where nearly everyone is headed anyway.
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        // Must be absolute, and must match a Redirect URL configured in
        // Supabase. trailingSlash:true means the exported route has the slash.
        redirectTo: `${window.location.origin}/auth/callback/`,
        scopes: "identify email",
      },
    });

    return { error: error ? readableAuthError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setAdminCheck(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      isAdmin,
      adminResolved,
      adminError,
      unavailable: !supabaseConfigured,
      signInWithDiscord,
      signOut,
    }),
    [loading, session, isAdmin, adminResolved, adminError, signInWithDiscord, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

/** Read and clear the path stashed before the OAuth redirect. */
export function takeAuthReturnPath(): string {
  try {
    const stored = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    // Only ever a same-site path, so a tampered value cannot send anyone off-site.
    if (stored && stored.startsWith("/") && !stored.startsWith("//")) return stored;
  } catch {
    // Fall through to the default.
  }
  /* Trailing slash because trailingSlash:true is what the exported routes are
     named, and this value can end up in the address bar on a hard reload. */
  return "/booking/";
}
