"use client";

import type { ReactNode } from "react";
import { CircleAlert, Check } from "lucide-react";
import { useSound } from "@/lib/useSound";

/**
 * The dashboard is the one Operate surface on this site: it is a tool, read by
 * the person who wrote it, and scanning it quickly matters more than it making
 * an impression. So the parts here are flatter and denser than the public
 * pages — same palette, same glass, less air.
 */

export const ADMIN_FIELD =
  "w-full rounded-md border border-rule bg-bg-2/60 px-3.5 py-2.5 text-sm font-light text-text " +
  "placeholder:text-text-2/45 transition-[border-color,box-shadow] duration-200 ease-out " +
  "hover:border-rule-strong focus:border-edge-gold-strong " +
  "focus:shadow-[0_0_25px_-5px_rgb(212_175_55_/_0.15)]";

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between gap-3">
      <span className="text-sm text-text">{children}</span>
      {hint ? <span className="text-xs font-light text-text-2">{hint}</span> : null}
    </label>
  );
}

/** A section heading inside the dashboard. Smaller than the public pages'. */
export function PanelHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-2xl font-light tracking-[-0.02em]">{title}</h2>
      {note ? (
        <p className="pretty mt-2.5 max-w-[62ch] text-sm font-light leading-relaxed text-text-2">
          {note}
        </p>
      ) : null}
    </div>
  );
}

type ButtonTone = "primary" | "quiet" | "danger";

const TONES: Record<ButtonTone, string> = {
  primary:
    "border-edge-gold-strong bg-white/[0.04] text-text hover:bg-white/[0.08] hover:border-gold",
  quiet: "border-rule text-text-2 hover:border-rule-strong hover:text-text",
  /* Destructive actions get the same champagne as everything else. A red would
     be a second hue on a page built around one, and the confirmation step is
     what actually protects the action. */
  danger: "border-rule text-text-2 hover:border-edge-gold-strong hover:text-gold",
};

export function AdminButton({
  tone = "quiet",
  className = "",
  children,
  ...rest
}: {
  tone?: ButtonTone;
  className?: string;
  children: ReactNode;
} & React.ComponentProps<"button">) {
  const sound = useSound();
  return (
    <button
      className={
        "inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm " +
        "font-medium transition-[background-color,border-color,color] duration-200 ease-out " +
        "disabled:pointer-events-none disabled:opacity-40 " +
        `${TONES[tone]} ${className}`
      }
      {...sound}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Inline result of the last action on a row. Never a floating toast — the
    confirmation belongs next to the thing that changed. */
export function StatusLine({
  status,
}: {
  status: { kind: "saved" | "error"; message: string } | null;
}) {
  if (!status) return null;

  return (
    <p
      role={status.kind === "error" ? "alert" : "status"}
      className={`flex items-center gap-2 text-sm font-light ${
        status.kind === "error" ? "text-gold" : "text-text-2"
      }`}
    >
      {status.kind === "error" ? (
        <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Check className="size-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden="true" />
      )}
      {status.message}
    </p>
  );
}

/** Shown when a panel has nothing to list. States the fact, then what would
    change it. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-rule px-6 py-14 text-center">
      <p className="pretty mx-auto max-w-[44ch] text-sm font-light leading-relaxed text-text-2">
        {children}
      </p>
    </div>
  );
}
