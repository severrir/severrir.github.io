"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CircleAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DiscordMark } from "../discord-mark";
import { EASE } from "../ui";
import { SpinningBorderButton } from "../ui/spinning-border-button";

/**
 * The gate in front of the dashboard.
 *
 * The booking form no longer uses it — there the brief is written first and
 * Discord is asked for at the moment of sending. This is the other case: a page
 * with nothing on it at all until it knows who is asking.
 *
 * The mark is monochrome and the button is the site's own primary treatment.
 * A blurple Discord button would put a second saturated accent on a page built
 * around exactly one.
 */

const FRAME = "panel relative mx-auto max-w-3xl rounded-lg p-7 sm:p-12";

export function SignInPanel({ returnTo = "/booking" }: { returnTo?: string }) {
  const { signInWithDiscord, unavailable } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setPending(true);
    setError(null);
    const { error: failure } = await signInWithDiscord(returnTo);
    if (failure) {
      setError(failure);
      setPending(false);
    }
    // On success the browser leaves for Discord, so pending stays true and the
    // button does not flicker back to its resting label on the way out.
  };

  const content = (
    <div className={FRAME}>
      <h2 className="balance max-w-[24ch] font-serif text-[length:var(--heading)] font-light leading-[1.15] tracking-[-0.02em]">
        {unavailable
          ? "Message me on Discord."
          : "Requests come from a Discord account."}
      </h2>

      {/* When sign-in cannot run there is no form to describe, so the panel
          stops explaining a door that will not open and gives the route that
          does work instead. */}
      <p className="pretty mt-5 max-w-[56ch] font-light leading-relaxed text-text-2">
        {unavailable ? (
          <>
            The request form is being reconnected. Commissions are still open —
            send me the project and what needs building, and you get
            feasibility, timeline and price back the same way.
          </>
        ) : (
          <>
            Sign in with Discord and the form opens. It confirms where the reply
            should go, keeps your request attached to you rather than to an
            inbox, and means neither of us has to check a username was typed
            correctly.
          </>
        )}
      </p>

      {unavailable ? (
        <p className="mt-8 font-mono text-[length:var(--lead)] text-text">severrir</p>
      ) : (
        <div className="mt-10">
          <SpinningBorderButton type="button" onClick={onSignIn} disabled={pending}>
            <DiscordMark className="size-4" />
            {pending ? "Opening Discord" : "Continue with Discord"}
          </SpinningBorderButton>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 text-sm font-light text-gold"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {/* Rhymes with the form's own footer rule, so the two panels read as the
          same object in two states rather than two designs. */}
      <p className="mt-10 border-t border-rule pt-8 text-sm font-light text-text-2">
        {unavailable
          ? "No payment is taken here, and nothing is agreed until you have a price."
          : "Discord gives me your username and nothing else. No password is created here and no payment is taken."}
      </p>
    </div>
  );

  /* data-reveal rather than a reduced-motion branch: branching changes the
     element between server and client and strands framer's inline opacity:0.
     See the note on Reveal in components/ui.tsx. */
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: EASE }}
    >
      {content}
    </motion.div>
  );
}
