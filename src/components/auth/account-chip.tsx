"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, SlidersHorizontal } from "lucide-react";
import { useAuth, discordHandleOf, displayNameOf } from "@/lib/auth-context";
import { useSound } from "@/lib/useSound";
import { EASE } from "../ui";

/**
 * Signed-in state in the header.
 *
 * The header already carries a wordmark, four nav items, the sound toggle and
 * the primary CTA, so this is a single 32px avatar rather than a name and a
 * button. Everything else lives in a small popover that is only opened
 * deliberately.
 */
export function AccountChip() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const sound = useSound();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!user) return null;

  const handle = discordHandleOf(user);
  const name = displayNameOf(user) || handle || "your account";
  const avatar = typeof user.user_metadata?.avatar_url === "string"
    ? user.user_metadata.avatar_url
    : null;

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${name}`}
        className="grid size-8 place-items-center overflow-hidden rounded-full border border-edge-gold bg-bg-2 text-xs font-medium text-text-2 transition-colors duration-200 hover:border-edge-gold-strong hover:text-text"
        {...sound}
      >
        {avatar && !avatarFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element -- a 32px
             third-party avatar gains nothing from the optimizer, which is
             disabled under output:"export" anyway. */
          <img
            src={avatar}
            alt=""
            width={32}
            height={32}
            decoding="async"
            onError={() => setAvatarFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{(name[0] ?? "?").toUpperCase()}</span>
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={reduced ? undefined : { opacity: 0, y: -6 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="specular absolute right-0 top-[calc(100%+0.75rem)] w-60 rounded-md p-2"
          >
            <p className="truncate px-3 pb-2 pt-1.5 text-sm text-text">{name}</p>
            {handle ? (
              <p className="truncate border-b border-rule px-3 pb-3 font-mono text-xs text-text-2">
                {handle}
              </p>
            ) : null}

            {isAdmin ? (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-light text-text-2 transition-colors duration-200 hover:bg-white/[0.04] hover:text-text"
                {...sound}
              >
                <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Dashboard
              </Link>
            ) : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="mt-0.5 flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm font-light text-text-2 transition-colors duration-200 hover:bg-white/[0.04] hover:text-text"
              {...sound}
            >
              <LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Sign out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
