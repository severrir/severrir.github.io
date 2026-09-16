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
import { EASE } from "./ui";
import { SpinningBorderButton } from "./ui/spinning-border-button";
import { SignInPanel, SignInPanelSkeleton } from "./auth/sign-in-panel";

const FIELD =
  "w-full rounded-md border border-rule bg-bg-2/60 px-4 py-3.5 text-[0.9375rem] font-light text-text " +
  "placeholder:text-text-2/55 transition-[border-color,box-shadow] duration-200 ease-out " +
  "hover:border-rule-strong focus:border-edge-gold-strong " +
  "focus:shadow-[0_0_25px_-5px_rgb(212_175_55_/_0.15)]";

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
 * Sending a commission request requires an account, with no way round it.
 *
 * Three things can occupy the form's frame: a placeholder while the session is
 * read, the sign-in panel, or the form. All three are the same width on the
 * same surface, so the page does not rearrange itself underneath anyone.
 *
 * There is deliberately no unauthenticated path. Before Supabase is configured
 * the sign-in panel says so and points at Discord, so there is still a way to
 * reach severrir — but the form itself never opens without an account.
 */
export function BookingForm() {
  const { loading, user } = useAuth();

  if (loading) return <SignInPanelSkeleton />;
  if (!user) return <SignInPanel returnTo="/booking" />;
  return <CommissionForm user={user} />;
}

/**
 * Who the request is from, stated rather than asked for.
 *
 * This replaces the Discord username field entirely. Discord already told us
 * the handle when the account was connected, and a value it vouched for beats
 * one typed from memory — which is also why the shape validation that guarded
 * that field is gone rather than moved.
 */
function AccountStrip({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const sound = useSound();

  const handle = discordHandleOf(user);
  const avatar =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule pb-7">
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-edge-gold bg-bg-2 text-sm text-text-2">
        {avatar && !avatarFailed ? (
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
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm text-text">{handle}</span>
        <span className="mt-0.5 block text-xs font-light text-text-2">
          The reply goes to this Discord account.
        </span>
      </span>

      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm font-light text-text-2 underline decoration-rule-strong underline-offset-4 transition-colors duration-200 hover:text-text"
        {...sound}
      >
        Not you?
      </button>

      {/* Formspree still delivers the ping to Discord, so the handle has to
          travel with the submission even though it is no longer a field. */}
      <input type="hidden" name="discord" value={handle} readOnly />
    </div>
  );
}

function CommissionForm({ user }: { user: User }) {
  const [state, handleSubmit] = useForm("xgojkepa");
  const sound = useSound();

  const accountHandle = discordHandleOf(user);

  const [tier, setTier] = useState("system");
  const [scope, setScope] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);

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
   */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tier");
    // Reading location is exactly the "sync from an external system" case the
    // rule exempts: the URL does not exist at prerender time, so this cannot be
    // lifted into the initial state without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requested && tiers.some((t) => t.id === requested)) setTier(requested);
  }, []);

  useEffect(() => {
    if (!state.succeeded) return;
    playSound("success");

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
        className="specular mx-auto max-w-2xl rounded-lg p-10 text-center sm:p-14"
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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (containsProfanity(scope)) {
      event.preventDefault();
      setBlocked(PROFANITY_MESSAGE);
      document.getElementById("scope")?.focus();
      return;
    }
    setBlocked(null);

    const form = event.currentTarget;
    const typedName = (form.elements.namedItem("name") as HTMLInputElement)?.value ?? "";

    submitted.current = {
      userId: user.id,
      name: typedName.trim() || displayNameOf(user) || "Unnamed",
      email: (form.elements.namedItem("email") as HTMLInputElement)?.value ?? "",
      discord: accountHandle,
      tier,
      message: scope,
    };

    handleSubmit(event);
  };

  return (
    <form onSubmit={onSubmit} className="specular mx-auto max-w-3xl space-y-8 rounded-lg p-7 sm:p-12">
      <AccountStrip user={user} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">What should I call you?</Label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            defaultValue={displayNameOf(user)}
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
            defaultValue={user.email ?? ""}
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
        <div className="specular flex flex-wrap gap-1 rounded-full p-1.5">
          {tiers.map((option) => {
            const active = option.id === tier;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTier(option.id)}
                aria-pressed={active}
                className="relative min-w-[7rem] flex-1 rounded-full px-3 py-2.5"
                {...sound}
              >
                {active ? (
                  <motion.span
                    layoutId="booking-tier-pill"
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 rounded-full border border-edge-gold-strong bg-gradient-to-b from-white/[0.14] to-white/[0.02] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.18)]"
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

      <div className="flex flex-wrap items-center gap-6 border-t border-rule pt-8">
        <SpinningBorderButton type="submit" disabled={state.submitting}>
          {state.submitting ? "Sending request" : "Send request"}
        </SpinningBorderButton>
        <p className="text-sm font-light text-text-2">No payment is taken here.</p>
      </div>

      <ValidationError errors={state.errors} className="block text-sm text-gold" />
    </form>
  );
}
