"use client";

import { useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth, displayNameOf } from "@/lib/auth-context";
import { ActionLink } from "../ui";
import { MorphLoader } from "../ui/morph-loader";
import { SignInPanel } from "../auth/sign-in-panel";
import { ContentPanel } from "./content-panel";
import { RequestsPanel } from "./requests-panel";
import { VisitorsPanel } from "./visitors-panel";
import { useSound } from "@/lib/useSound";

/**
 * The dashboard, and the gate in front of it.
 *
 * The gate is presentation only. This file decides what is drawn; it decides
 * nothing about what can be read or written. Anyone can download this page —
 * it is a static file on GitHub Pages — and forcing it open shows an empty
 * shell, because every query behind it is refused by the policies in
 * supabase/schema.sql unless the caller is in the admins table.
 */

const SECTIONS = [
  { id: "visitors", label: "Visitors" },
  { id: "cards", label: "Cards" },
  { id: "requests", label: "Requests" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** A centred message in the same frame the sign-in panel uses. */
function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="specular mx-auto max-w-3xl rounded-lg p-7 sm:p-12">
      <span className="grid size-12 place-items-center rounded-full border border-edge-gold-strong">
        <ShieldAlert className="size-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="balance mt-8 max-w-[24ch] font-serif text-[length:var(--heading)] font-light leading-[1.15] tracking-[-0.02em]">
        {title}
      </h1>
      <p className="pretty mt-5 max-w-[56ch] font-light leading-relaxed text-text-2">
        {children}
      </p>
      {action ? <div className="mt-10">{action}</div> : null}
    </div>
  );
}

export function AdminShell() {
  const { loading, adminResolved, user, isAdmin, adminError, unavailable } = useAuth();
  const [section, setSection] = useState<SectionId>("visitors");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const sound = useSound();

  if (unavailable) {
    return (
      <Notice
        title="The dashboard is not connected yet."
        action={
          <ActionLink href="/" variant="glass">
            Back to the site
          </ActionLink>
        }
      >
        Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then
        redeploy. SETUP.md in the repository has the full sequence.
      </Notice>
    );
  }

  if (loading || !adminResolved) {
    return (
      <div className="flex flex-col items-center py-24">
        <MorphLoader label="Checking access" />
        <p className="mt-10 text-sm font-light text-text-2">Checking access</p>
      </div>
    );
  }

  if (!user) return <SignInPanel returnTo="/admin" />;

  /*
   * A failed lookup and a negative one are different facts and get different
   * screens. Told apart, "the query was refused" is a sentence someone can act
   * on; collapsed together, it reads as a verdict about the account and sends
   * whoever is holding it looking in the wrong place.
   */
  if (adminError) {
    return (
      <Notice
        title="Could not check whether this account is the owner."
        action={
          <ActionLink href="/" variant="glass">
            Back to the site
          </ActionLink>
        }
      >
        The database refused or could not answer the question, so the dashboard
        is not opening on a guess. Signed in as {displayNameOf(user)}, account{" "}
        <span className="font-mono text-text">{user.id}</span>. The database
        said: <span className="font-mono text-text">{adminError}</span>
      </Notice>
    );
  }

  if (!isAdmin) {
    return (
      <Notice
        title="This account cannot open the dashboard."
        action={
          <ActionLink href="/" variant="glass">
            Back to the site
          </ActionLink>
        }
      >
        You are signed in as {displayNameOf(user)}, account{" "}
        <span className="font-mono text-text">{user.id}</span>, which is not in
        the admins table. Nothing here is readable from it. If this should be
        your dashboard, add that id to the admins table and reload.
      </Notice>
    );
  }

  /* Arrow keys move between tabs, which is what a tablist is expected to do and
     the only way to reach the other sections without a mouse. */
  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 :
                  event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;

    event.preventDefault();
    const next = (index + delta + SECTIONS.length) % SECTIONS.length;
    setSection(SECTIONS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <header className="mb-12 border-b border-rule pb-8 sm:mb-16">
        <h1 className="font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.025em]">
          Dashboard
        </h1>
        <p className="mt-3 text-sm font-light text-text-2">
          Signed in as {displayNameOf(user)}. Changes here are live for everyone
          as soon as they save.
        </p>
      </header>

      <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          aria-orientation="horizontal"
          className="-mx-[var(--gutter)] flex gap-1 overflow-x-auto border-b border-rule px-[var(--gutter)] lg:mx-0 lg:sticky lg:top-28 lg:h-fit lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l lg:px-0 lg:pl-0"
        >
          {SECTIONS.map((item, index) => {
            const active = item.id === section;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={active}
                aria-controls={`panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setSection(item.id)}
                onKeyDown={(e) => onTabKey(e, index)}
                className={`shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 ease-out lg:px-0 lg:pl-4 lg:text-left ${
                  active
                    ? "text-text lg:-ml-px lg:border-l lg:border-gold"
                    : "text-text-2 hover:text-text lg:-ml-px lg:border-l lg:border-transparent"
                }`}
                {...sound}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${section}`}
          aria-labelledby={`tab-${section}`}
          tabIndex={0}
          className="min-w-0 focus-visible:outline-none"
        >
          {section === "visitors" ? <VisitorsPanel /> : null}
          {section === "cards" ? <ContentPanel /> : null}
          {section === "requests" ? <RequestsPanel /> : null}
        </div>
      </div>
    </div>
  );
}
