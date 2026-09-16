"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { EASE } from "./ui";
import { SpinningBorderLink } from "./ui/spinning-border-button";
import { SoundToggle } from "./sound-toggle";
import { GithubMark } from "./github-mark";
import { AccountChip } from "./auth/account-chip";
import { useSound } from "@/lib/useSound";

const NAV = [
  { href: "/#work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sound = useSound();
  const reduced = useReducedMotion();

  const onWordmark = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    e.preventDefault();
    /* A stale #work in the URL re-anchors the browser to that section, so the
       hash has to go before the scroll, not after. */
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Dismiss the mobile menu when navigation actually happens. The route is an
  // external system here, not derived state, so an effect is the right shape.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ease-out ${
        open
          ? "border-b border-rule bg-bg"
          : scrolled
            ? "border-b border-rule bg-bg/80 backdrop-blur-xl"
            : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-[var(--gutter)] sm:h-20">
        <Link
          href="/"
          className="py-2 font-serif text-lg font-light tracking-[-0.02em] text-text"
          {...sound}
          onClick={onWordmark}
        >
          severrir
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-light text-text-2 transition-colors duration-200 hover:text-text"
              {...sound}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SoundToggle />
          {/* Sits beside the sound toggle on every breakpoint: knowing whether
              you are signed in is not a thing to hide behind a menu button. */}
          <AccountChip />
          {/* The wrapper does the hiding: `hidden` on the link itself loses to
              the base `inline-flex` at equal specificity. */}
          <span className="hidden md:block">
            <SpinningBorderLink href="/booking" className="text-sm">
              Start a project
            </SpinningBorderLink>
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-md text-text md:hidden"
            {...sound}
          >
            {open ? (
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden border-t border-rule bg-bg md:hidden"
          >
            {/*
             * A full sheet, not a dropdown. At two-thirds height the panel
             * ended mid-page and the hero headline carried on underneath it,
             * sliced through the middle of its own letterforms — which read as
             * a rendering fault rather than as a menu over a page.
             *
             * The labels are set in the display serif at the size the page uses
             * for a section heading. A phone menu is the whole screen for as
             * long as it is open; there is no reason for it to whisper.
             */}
            <nav
              className="flex min-h-[calc(100svh-4rem)] flex-col px-[var(--gutter)] pb-10 pt-2"
              aria-label="Primary"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-rule py-5 font-serif text-[1.75rem] font-light leading-tight tracking-[-0.02em] text-text transition-colors duration-200 active:text-gold"
                  {...sound}
                >
                  {item.label}
                </Link>
              ))}

              <span className="mt-9 block [&>a]:w-full">
                <SpinningBorderLink href="/booking">Start a project</SpinningBorderLink>
              </span>

              <a
                href="https://github.com/severrir"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 pt-12 text-sm font-light text-text-2"
                {...sound}
              >
                <GithubMark className="size-4" />
                github.com/severrir
              </a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
