"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { motion } from "framer-motion";
import { Check, CircleAlert } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { tiers } from "@/data/pricing";
import { containsProfanity, PROFANITY_MESSAGE } from "@/lib/profanity";
import { useAuth, discordHandleOf, displayNameOf } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { playSound, useSound } from "@/lib/useSound";
import { DiscordMark } from "./discord-mark";
import { EASE } from "./ui";
import { SpinningBorderButton } from "./ui/spinning-border-button";

const FIELD =
  "w-full rounded-md border border-rule bg-bg-2/60 px-4 py-3.5 text-[0.9375rem] font-light text-text " +
  "placeholder:text-text-2/55 transition-[border-color,box-shadow] duration-200 ease-out " +
  "hover:border-rule-strong focus:border-edge-gold-strong " +
  "focus:shadow-[0_0_25px_-5px_rgb(212_175_55_/_0.15)]";

/** Everything typed into the form, parked while the visitor is away at Discord. */
const DRAFT_KEY = "severrir:booking-draft";

type Draft = { name: string; email: string; tier: string; scope: string };

function Label({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: string;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2.5 flex items-baseline justify-between gap-3 text-sm text-text"
    >
      <span>
        {children}
        {optional ? null : <span className="ml-1 text-gold">*</span>}
      </span>
      {optional ? <span className="text-xs text-text-2">Optional</span> : null}
    </label>
  );
}

/**
 * The form is always the form.
 *
 * Writing the brief is the part someone came here to do, so nothing is hidden
 * behind sign-in — the fields, the sizes and the submit button are on the page
 * from the first paint. What sign-in gates is *sending*: the button asks for
 * Discord first, and only once an account is attached does it submit.
 *
 * There is deliberately no unauthenticated path to a sent request. The account
 * is what the reply goes to and what the request is filed against, so it is
 * required at the moment it starts to matter and not before.
 */
export function BookingForm() {
  const { user } = useAuth();
  return <CommissionForm user={user} />;
}

/**
 * Who the request is from — stated when it is known, asked for when it is not.
 *
 * This replaces the Discord username field entirely. Discord already told us
 * the handle when the account was connected, and a value it vouched for beats
 * one typed from memory — which is also why the shape validation that guarded
 * that field is gone rather than moved.
 */
function AccountStrip({ user }: { user: User | null }) {
  const { signOut, loading, unavailable } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const sound = useSound();

  const handle = discordHandleOf(user);
  const avatar =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  /* The signed-out strip holds the same 40px circle and two lines of text as
     the signed-in one, so returning from Discord changes the words in this row
     and moves nothing else on the page. */
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule pb-7">
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-edge-gold bg-bg-2 text-sm text-text-2">
        {user ? (
          avatar && !avatarFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element -- a 40px
               third-party avatar gains nothing from the optimizer, which is
               disabled under output:"export" anyway. */
            <img
              src={avatar}
              alt=""
              width={40}
              height={40}
              decoding="async"
              onError={() => setAvatarFailed(true)}
              className="size-full object-cover"
            />
          ) : (
            <span aria-hidden="true">
              {(displayNameOf(user)[0] ?? "?").toUpperCase()}
            </span>
          )
        ) : (
          <DiscordMark className="size-4" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        {user ? (
          <>
            <span className="block truncate font-mono text-sm text-text">{handle}</span>
            <span className="mt-0.5 block text-xs font-light text-text-2">
              The reply goes to this Discord account.
            </span>
          </>
        ) : (
          <>
            <span className="block text-sm text-text">
              {unavailable
                ? "Sign-in is being reconnected."
                : loading
                  ? "Checking your session."
                  : "Not signed in yet."}
            </span>
            <span className="mt-0.5 block text-xs font-light text-text-2">
              {unavailable
                ? "Message severrir on Discord in the meantime."
                : "Write the brief now — Discord is asked for when you send."}
            </span>
          </>
        )}
      </span>

      {user ? (
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm font-light text-text-2 underline decoration-rule-strong underline-offset-4 transition-colors duration-200 hover:text-text"
          {...sound}
        >
          Not you?
        </button>
      ) : null}

      {/* Formspree still delivers the ping to Discord, so the handle has to
          travel with the submission even though it is no longer a field. */}
      <input type="hidden" name="discord" value={handle} readOnly />
    </div>
  );
}

function CommissionForm({ user }: { user: User | null }) {
  const [state, handleSubmit] = useForm("xgojkepa");
  const { loading, unavailable, signInWithDiscord } = useAuth();
  const sound = useSound();

  const accountHandle = discordHandleOf(user);

  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [emailEdited, setEmailEdited] = useState(false);
  const [tier, setTier] = useState("system");
  const [scope, setScope] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  /* Kept apart from `blocked`, which belongs to the brief. A refusal from
     Discord has nothing to do with what was typed and belongs beside the
     button that asked for it. */
  const [signInError, setSignInError] = useState<string | null>(null);

  /* Until either field is touched it shows what Discord already knows, which is
     a derived value rather than state copied in an effect — so it fills itself
     in the moment the account lands, including on the way back from OAuth. */
  const nameValue = nameEdited || name ? name : displayNameOf(user);
  const emailValue = emailEdited || email ? email : (user?.email ?? "");

  /*
   * Everything the database record needs, captured at the moment of submit.
   * Reading it back out of state when Formspree confirms would record whatever
   * the form happens to hold then, which is not necessarily what was sent.
   */
  const submitted = useRef({
    userId: "",
    name: "",
    email: "",
    discord: "",
    tier: "",
    message: "",
  });

  /*
   * Read ?tier= off the URL after mount rather than with useSearchParams.
   * useSearchParams opts the whole route out of prerendering, and under
   * output:"export" that means /booking ships as an empty skeleton with no form
   * in the HTML at all. Reading it here keeps the form statically rendered and
   * still honours the deep link from the pricing table.
   *
   * The parked draft is restored in the same pass, because signing in means
   * leaving the page: a brief that did not survive the round trip would be
   * retyped, and most people would simply not bother a second time.
   */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tier");

    let draft: Partial<Draft> = {};
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}") as Partial<Draft>;
    } catch {
      // A corrupt or unreadable draft is nothing to report — the form simply
      // starts empty, which is where it would have started anyway.
    }

    /* Reading location and sessionStorage is exactly the "sync from an external
       system" case the rule exempts: neither exists at prerender time, so this
       cannot be lifted into the initial state without a hydration mismatch. */
    /* eslint-disable react-hooks/set-state-in-effect */
    if (typeof draft.name === "string" && draft.name) setName(draft.name);
    if (typeof draft.email === "string" && draft.email) setEmail(draft.email);
    if (typeof draft.scope === "string" && draft.scope) setScope(draft.scope);

    /* The deep link is the more recent intent of the two, so it wins over a
       size chosen before the visitor last left the page. */
    const restoredTier =
      requested && tiers.some((t) => t.id === requested)
        ? requested
        : typeof draft.tier === "string" && tiers.some((t) => t.id === draft.tier)
          ? draft.tier
          : null;
    if (restoredTier) setTier(restoredTier);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!state.succeeded) return;
    playSound("success");

    /* The brief has been sent; a restored copy of it on the next visit would be
       a stale draft of something already delivered. */
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Nothing to do, and nothing the visitor needs to hear about.
    }

    /*
     * The request has already reached Discord through Formspree by this point.
     * This is the second, independent copy — the one the dashboard reads. If it
     * fails there is nothing useful to tell the visitor, because from their
     * side the request genuinely did go through.
     */
    const record = submitted.current;
    if (!supabase || !record.userId) return;

    void supabase
      .from("bookings")
      .insert({
        user_id: record.userId,
        name: record.name,
        discord: record.discord,
        email: record.email || null,
        tier: record.tier,
        message: record.message,
      })
      .then(({ error }) => {
        if (error) console.error("Could not record the request:", error.message);
      });
  }, [state.succeeded]);

  if (state.succeeded) {
    return (
      <motion.div
        data-reveal
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: EASE }}
        role="status"
        className="panel relative mx-auto max-w-2xl rounded-lg p-10 text-center sm:p-14"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-edge-gold-strong">
          <Check className="size-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="pretty mx-auto mt-8 max-w-[44ch] font-serif text-[length:var(--lead)] font-light leading-relaxed text-text">
          Request sent successfully. I have been pinged on Discord and will get
          back to you shortly.
        </p>
        <p className="mt-5 text-sm font-light text-text-2">
          Expect a reply on Discord as{" "}
          <span className="font-mono text-text">{accountHandle}</span>.
        </p>
      </motion.div>
    );
  }

  /** Park the brief where the return trip can find it. */
  const stashDraft = () => {
    try {
      const draft: Draft = { name: nameValue, email: emailValue, tier, scope };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Private browsing can refuse storage. Sign-in still works; only the
      // convenience of coming back to a filled form is lost.
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    /*
     * Required fields and the profanity gate are checked before sign-in rather
     * than after: sending someone to Discord and back only to tell them the
     * brief was empty wastes the one step in this flow that leaves the site.
     */
    if (containsProfanity(scope)) {
      event.preventDefault();
      setBlocked(PROFANITY_MESSAGE);
      document.getElementById("scope")?.focus();
      return;
    }
    setBlocked(null);

    /* No account, no send — the whole point of the gate. The browser has
       already enforced the required fields by the time submit fires, so what
       is stashed here is a brief worth coming back to. */
    if (!user) {
      event.preventDefault();
      if (unavailable || loading || signingIn) return;

      setSigningIn(true);
      setSignInError(null);
      stashDraft();
      void signInWithDiscord(
        window.location.pathname + window.location.search,
      ).then(({ error }) => {
        if (error) {
          setSignInError(error);
          setSigningIn(false);
        }
        // On success the browser leaves for Discord, so signingIn stays true
        // and the button does not flicker back on the way out.
      });
      return;
    }

    submitted.current = {
      userId: user.id,
      name: nameValue.trim() || displayNameOf(user) || "Unnamed",
      email: emailValue.trim(),
      discord: accountHandle,
      tier,
      message: scope,
    };

    handleSubmit(event);
  };

  const sendLabel = state.submitting
    ? "Sending request"
    : user
      ? "Send request"
      : signingIn
        ? "Opening Discord"
        : "Sign in with Discord to send";

  return (
    <form onSubmit={onSubmit} className="panel lume relative mx-auto max-w-3xl space-y-8 rounded-lg p-6 sm:p-12">
      <AccountStrip user={user} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">What should I call you?</Label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            value={nameValue}
            onChange={(e) => {
              setNameEdited(true);
              setName(e.target.value);
            }}
            placeholder="Sam"
            className={FIELD}
          />
        </div>

        <div>
          <Label htmlFor="email" optional>
            Email
          </Label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            value={emailValue}
            onChange={(e) => {
              setEmailEdited(true);
              setEmail(e.target.value);
            }}
            placeholder="sam@studio.com"
            className={FIELD}
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
            className="mt-2 block text-sm text-gold"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm text-text">Rough size</legend>
        {/* One shared pill slides between segments rather than four borders
            cross-fading, so the champagne rim travels with the selection. */}
        <div className="specular relative grid grid-cols-2 gap-1 rounded-lg p-1.5 sm:flex sm:flex-wrap sm:rounded-full">
          {tiers.map((option) => {
            const active = option.id === tier;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTier(option.id)}
                aria-pressed={active}
                /* Square-cornered in the phone grid: a stadium pill inside a
                   2×2 block turns the whole control into a lozenge with
                   corners nothing sits in. */
                className="relative rounded-md px-3 py-2.5 sm:min-w-[7rem] sm:flex-1 sm:rounded-full"
                {...sound}
              >
                {active ? (
                  <motion.span
                    layoutId="booking-tier-pill"
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 rounded-md border border-edge-gold-strong bg-gradient-to-b from-white/[0.14] to-white/[0.02] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.18)] sm:rounded-full"
                  />
                ) : null}
                <span className="relative block text-center">
                  <span
                    className={`block text-[0.8125rem] font-medium transition-colors duration-200 ${
                      active ? "text-text" : "text-text-2"
                    }`}
                  >
                    {option.name}
                  </span>
                  <span
                    className={`tabular mt-0.5 block text-[0.6875rem] transition-colors duration-200 ${
                      active ? "text-gold" : "text-text-2/70"
                    }`}
                  >
                    {option.price}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="tier" value={tier} />
      </fieldset>

      <div>
        <Label htmlFor="scope">The project, and what you need built</Label>
        <textarea
          id="scope"
          name="message"
          required
          rows={8}
          maxLength={5000}
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            if (blocked) setBlocked(null);
          }}
          aria-invalid={blocked ? true : undefined}
          aria-describedby={blocked ? "scope-error" : undefined}
          placeholder="Round-based shooter. I need matchmaking that keeps parties together, plus a shop interface that reads from the same inventory the server owns."
          className={`${FIELD} min-h-[10rem] resize-y ${blocked ? "border-edge-gold-strong" : ""}`}
        />
        {blocked ? (
          <p
            id="scope-error"
            role="alert"
            className="mt-2.5 flex items-center gap-2 text-sm text-gold"
          >
            <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {blocked}
          </p>
        ) : null}
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
          className="mt-2 block text-sm text-gold"
        />
      </div>

      {signInError ? (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm font-light text-gold"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {signInError} Nothing was sent, and the brief above is still here.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-6 border-t border-rule pt-8">
        <SpinningBorderButton
          type="submit"
          disabled={state.submitting || signingIn || (!user && (loading || unavailable))}
        >
          {!user && !state.submitting ? <DiscordMark className="size-4" /> : null}
          {sendLabel}
        </SpinningBorderButton>
        <p className="max-w-[34ch] text-sm font-light text-text-2">
          {user
            ? "No payment is taken here."
            : unavailable
              ? "Sign-in is being reconnected. Message severrir on Discord and the brief reaches me the same way."
              : "Discord gives me your username and nothing else. No password is created here and no payment is taken."}
        </p>
      </div>

      {/*
       * Without JavaScript none of the above can send: sign-in, the profanity
       * gate and the submit itself all run in this bundle. Say so, and give the
       * route that does work, rather than leaving a form that silently does
       * nothing when pressed.
       */}
      <noscript>
        <p className="border-t border-rule pt-8 text-sm font-light text-text-2">
          Sending a request needs JavaScript, because it signs you in with
          Discord first. With it switched off, message me directly on Discord as{" "}
          <span className="font-mono text-text">severrir</span> — same reply,
          same day.
        </p>
      </noscript>

      <ValidationError errors={state.errors} className="block text-sm text-gold" />
    </form>
  );
}
