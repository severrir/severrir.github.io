"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
import { useSound } from "@/lib/useSound";

export const EASE = [0.16, 1, 0.3, 1] as const;

type Variant = "primary" | "glass" | "quiet";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md text-[0.9375rem] font-medium " +
  "transition-[background-color,border-color,color,box-shadow,opacity] duration-200 ease-out " +
  "disabled:opacity-45 disabled:pointer-events-none select-none";

const VARIANTS: Record<Variant, string> = {
  /* Champagne fill, obsidian label. 9.6:1. */
  primary:
    "bg-gold text-bg px-7 py-3.5 hover:bg-gold-hover " +
    "hover:shadow-[0_0_34px_-4px_rgb(212_175_55_/_0.28)]",
  /* Bevelled glass with a gold hairline that lights on hover. */
  glass: "specular specular-hover text-text px-7 py-3.5",
  quiet: "text-text-2 hover:text-text",
};

type LinkRest = Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

export function ActionLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: { href: string; variant?: Variant; className?: string; children: ReactNode } & LinkRest) {
  const sound = useSound();
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...sound}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...sound} {...rest}>
      {children}
    </Link>
  );
}

export function ActionButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: { variant?: Variant; className?: string; children: ReactNode } & ComponentProps<"button">) {
  const sound = useSound();
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...sound} {...rest}>
      {children}
    </button>
  );
}

/** Owns the vertical rhythm, so no two sections fight over their gap. */
export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`relative px-[var(--gutter)] py-24 sm:py-32 ${className}`}>
      {/*
       * The anchor is a zero-height marker at the content edge rather than the
       * id sitting on the section box. With the id on the box, html's
       * scroll-padding-top stacks on top of this section's own py-24/sm:py-32
       * and every nav jump lands ~200px above the heading. Offset 2rem above the
       * heading so it arrives with air under the header, not jammed against it.
       */}
      {id ? (
        <span
          id={id}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-16 block h-0 w-0 sm:top-24"
        />
      ) : null}
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/**
 * Scroll reveal. Deliberately small — 16px and a fade, never a slide-in from
 * off-screen. Anything larger turns a long page into a slideshow.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  /*
   * Reduced motion is honoured in CSS, not here, and that is deliberate.
   *
   * Branching on useReducedMotion() rendered a motion.div on the server — which
   * writes inline opacity:0 — and a plain div on the client, because the server
   * cannot read a media query. React 19 reports that mismatch as "this won't be
   * patched up" and leaves the server's opacity:0 on the element forever, so
   * every heading and paragraph on the site stayed invisible for anyone who
   * prefers reduced motion.
   *
   * With no hook, server and client render the identical element and there is
   * no mismatch to strand. The [data-reveal] rule in globals.css then pins opacity
   * and transform for those visitors, and an !important declaration in a
   * stylesheet outranks the inline style framer writes.
   */
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** No eyebrow above it — the heading carries its own weight. */
export function SectionHeading({
  title,
  lede,
  center = false,
}: {
  title: string;
  lede?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={`mb-14 sm:mb-20 ${center ? "text-center" : ""}`}>
      <h2
        className={`balance font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.02em] ${
          center ? "mx-auto max-w-[20ch]" : ""
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={`pretty mt-5 max-w-[54ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2 ${
            center ? "mx-auto" : ""
          }`}
        >
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}
