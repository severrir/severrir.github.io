"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, ValidationError } from "@formspree/react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleAlert } from "lucide-react";
import { tiers } from "@/data/pricing";
import { containsProfanity, PROFANITY_MESSAGE } from "@/lib/profanity";
import { playSound, useSound } from "@/lib/useSound";
import { EASE } from "./ui";
import { SpinningBorderButton } from "./ui/spinning-border-button";

const FIELD =
  "w-full rounded-md border border-rule bg-bg-2/60 px-4 py-3.5 text-[0.9375rem] font-light text-text " +
  "placeholder:text-text-2/55 transition-[border-color,box-shadow] duration-200 ease-out " +
  "hover:border-rule-strong focus:border-edge-gold-strong focus:outline-none " +
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

export function BookingForm() {
  const [state, handleSubmit] = useForm("xgojkepa");
  const searchParams = useSearchParams();
  const sound = useSound();
  const reduced = useReducedMotion();

  const initialTier = useMemo(() => {
    const requested = searchParams.get("tier");
    return tiers.some((t) => t.id === requested) ? (requested as string) : "system";
  }, [searchParams]);

  const [tier, setTier] = useState(initialTier);
  const [discord, setDiscord] = useState("");
  const [scope, setScope] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => setTier(initialTier), [initialTier]);

  useEffect(() => {
    if (state.succeeded) playSound("success");
  }, [state.succeeded]);

  if (state.succeeded) {
    return (
      <motion.div
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
          Expect a reply on Discord as {discord.trim() || "the username you gave"}.
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
    handleSubmit(event);
  };

  return (
    <form onSubmit={onSubmit} className="specular mx-auto max-w-3xl space-y-8 rounded-lg p-7 sm:p-12">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">What should I call you?</Label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Sam"
            className={FIELD}
          />
        </div>

        <div>
          <Label htmlFor="discord">Discord username</Label>
          <input
            id="discord"
            name="discord"
            required
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="sam.dev"
            className={FIELD}
          />
        </div>
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
                    layoutId={reduced ? undefined : "booking-tier-pill"}
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
