"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useSound } from "@/lib/useSound";

/**
 * A champagne rim that travels around the button edge.
 *
 * The rim is one conic gradient whose start angle is a registered custom
 * property, so the browser interpolates a single value instead of rotating a
 * clipped pseudo-element. The inner face sits on top and masks all but a 1px
 * band, which is what makes it read as a lit edge rather than a spinning box.
 */
const SHELL =
  "group relative inline-flex isolate overflow-hidden rounded-md p-px " +
  "transition-[box-shadow] duration-300 ease-out hover:shadow-[0_0_34px_-4px_rgb(212_175_55_/_0.28)] " +
  "focus-within:shadow-[0_0_34px_-4px_rgb(212_175_55_/_0.28)]";

const FACE =
  "relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-[5px] " +
  "bg-[#0a1128] px-7 py-3.5 text-[0.9375rem] font-medium text-text " +
  "transition-colors duration-200 ease-out group-hover:bg-[#101e3f]";

function Rim() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-[-120%] motion-safe:animate-[severrir-spin_4.5s_linear_infinite]"
      style={{
        background:
          "conic-gradient(from var(--spin-angle), transparent 0deg, transparent 210deg, rgb(212 175 55 / 0.15) 260deg, #d4af37 320deg, #e5c158 340deg, transparent 360deg)",
      }}
    />
  );
}

/** A static gold hairline so the edge is still defined before the rim sweeps past. */
function Base() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-md"
      style={{ background: "rgb(212 175 55 / 0.22)" }}
    />
  );
}

export function SpinningBorderLink({
  href,
  children,
  className = "",
  ...rest
}: { href: string; children: ReactNode; className?: string } & Omit<
  ComponentProps<typeof Link>,
  "href" | "className" | "children"
>) {
  const sound = useSound();
  return (
    <Link href={href} className={`${SHELL} ${className}`} {...sound} {...rest}>
      <Base />
      <Rim />
      <span className={FACE}>{children}</span>
    </Link>
  );
}

export function SpinningBorderButton({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & ComponentProps<"button">) {
  const sound = useSound();
  return (
    <button
      className={`${SHELL} disabled:pointer-events-none disabled:opacity-45 ${className}`}
      {...sound}
      {...rest}
    >
      <Base />
      <Rim />
      <span className={FACE}>{children}</span>
    </button>
  );
}
