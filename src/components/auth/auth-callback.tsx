"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { useAuth, takeAuthReturnPath } from "@/lib/auth-context";
import { ActionLink } from "../ui";
import { MorphLoader } from "../ui/morph-loader";
import { SpinningBorderLink } from "../ui/spinning-border-button";

/**
 * Where Discord returns the visitor.
 *
 * The client is configured with detectSessionInUrl, so the code in the query
 * string is exchanged for a session as soon as this page loads. There is
 * nothing to do here but wait for that to land and then move on — which is why
 * this is a waypoint and not a screen anyone should stop to read.
 */

/* Long enough to cover a slow exchange, short enough that a silent failure does
   not leave someone watching a loader forever. */
const GIVE_UP_AFTER = 10_000;

export function AuthCallback() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const [failure, setFailure] = useState<string | null>(null);

  /* Discord reports a refusal in the query string rather than by failing the
     redirect, so it has to be read before anything waits on a session that is
     never coming. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error_description") ?? params.get("error");
    /* Reading location is the "sync from an external system" case the rule
       exempts: the query string does not exist at prerender time, so this
       cannot be lifted into initial state without a hydration mismatch. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (error) setFailure(error.replace(/\+/g, " "));
  }, []);

  useEffect(() => {
    if (!session) return;
    // replace, not push: the callback URL still carries the auth code and must
    // never be somewhere the back button can return to.
    router.replace(takeAuthReturnPath());
  }, [session, router]);

  useEffect(() => {
    if (failure || session) return;
    const timer = setTimeout(() => {
      setFailure("Sign-in timed out before Discord answered.");
    }, GIVE_UP_AFTER);
    return () => clearTimeout(timer);
  }, [failure, session]);

  if (failure) {
    return (
      <div className="mx-auto w-full max-w-2xl text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-edge-gold-strong">
          <CircleAlert className="size-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
        </span>

        <h1 className="balance mt-8 font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.02em]">
          Sign-in did not complete.
        </h1>
        <p className="pretty mx-auto mt-5 max-w-[46ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2">
          {failure} Nothing was sent and no account was created. Try again, or
          reach me on Discord as severrir.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <SpinningBorderLink href="/booking">Try again</SpinningBorderLink>
          <ActionLink href="/" variant="quiet" className="px-5 py-3.5">
            Back to the work
          </ActionLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
      <MorphLoader label="Completing sign-in" />
      <p className="mt-10 text-[length:var(--lead)] font-light text-text-2">
        {loading ? "Completing sign-in" : "Taking you back"}
      </p>
    </div>
  );
}
