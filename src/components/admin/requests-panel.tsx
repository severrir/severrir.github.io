"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { supabase, type Booking } from "@/lib/supabase";
import { useSound } from "@/lib/useSound";
import { MorphLoader } from "../ui/morph-loader";
import { EASE } from "../ui";
import { AdminButton, EmptyState, PanelHeading, StatusLine } from "./primitives";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Everything sent through the booking form.
 *
 * Formspree still pings Discord the moment a request arrives, exactly as it did
 * before — this is the second copy, so a request is recoverable if that ping is
 * ever missed. Nothing here sends anything; the reply happens on Discord.
 */
export function RequestsPanel() {
  /* null means "still loading". With nothing to load from, the list is empty
     and settled rather than spinning forever. */
  const [requests, setRequests] = useState<Booking[] | null>(() => (supabase ? null : []));
  const [error, setError] = useState<string | null>(null);
  const [showHandled, setShowHandled] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: failure }) => {
        if (!active) return;
        if (failure) {
          setError(failure.message);
          return;
        }
        setRequests((data ?? []) as Booking[]);
      });

    return () => {
      active = false;
    };
  }, []);

  const setStatus = async (id: string, status: Booking["status"]) => {
    if (!supabase) return { error: "Not connected." };

    const { error: failure } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (failure) return { error: failure.message };

    setRequests((current) =>
      current ? current.map((row) => (row.id === id ? { ...row, status } : row)) : current,
    );
    return { error: null };
  };

  if (error) {
    return (
      <section>
        <PanelHeading title="Requests" />
        <p role="alert" className="text-sm font-light text-gold">
          The requests could not be loaded: {error}
        </p>
      </section>
    );
  }

  if (!requests) {
    return (
      <section>
        <PanelHeading title="Requests" />
        <div className="flex justify-center py-20">
          <MorphLoader label="Loading requests" />
        </div>
      </section>
    );
  }

  const open = requests.filter((row) => row.status === "open");
  const shown = showHandled ? requests : open;

  return (
    <section>
      <PanelHeading
        title="Requests"
        note="Everything sent through the booking form. Discord is still pinged the moment one arrives; this is the copy that does not depend on an inbox."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <p className="text-sm font-light text-text-2">
          {open.length === 0
            ? "Nothing waiting on a reply"
            : `${open.length} waiting on a reply`}
          {requests.length !== open.length ? ` · ${requests.length} in total` : ""}
        </p>
        {requests.length > open.length ? (
          <AdminButton onClick={() => setShowHandled((v) => !v)}>
            {showHandled ? "Show only open" : "Show handled too"}
          </AdminButton>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <EmptyState>
          {requests.length === 0
            ? "No requests yet. The first one sent through the booking form lands here."
            : "Every request has been handled. Switch the filter above to read the older ones."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {shown.map((request) => (
            <RequestRow key={request.id} request={request} onSetStatus={setStatus} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RequestRow({
  request,
  onSetStatus,
}: {
  request: Booking;
  onSetStatus: (id: string, status: Booking["status"]) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" | "error"; message: string } | null>(
    null,
  );
  const sound = useSound();
  const reduced = useReducedMotion();

  const handled = request.status === "handled";

  const toggle = async () => {
    setBusy(true);
    setStatus(null);
    const { error } = await onSetStatus(request.id, handled ? "open" : "handled");
    if (error) setStatus({ kind: "error", message: error });
    setBusy(false);
  };

  return (
    <li className="specular relative rounded-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`request-${request.id}`}
        className="flex w-full items-center gap-4 p-4 text-left"
        {...sound}
      >
        <span
          className={`mt-0.5 size-1.5 shrink-0 rounded-full ${
            handled ? "bg-text-2/40" : "bg-gold"
          }`}
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="truncate text-sm font-medium text-text">{request.name}</span>
            <span className="truncate font-mono text-xs text-text-2">{request.discord}</span>
          </span>
          <span className="mt-1.5 block truncate text-xs font-light text-text-2">
            {request.tier} · {DATE.format(new Date(request.created_at))}
            {handled ? " · handled" : ""}
          </span>
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-text-2 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`request-${request.id}`}
            initial={reduced ? undefined : { height: 0, opacity: 0 }}
            animate={reduced ? undefined : { height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-rule p-5">
              <p className="pretty whitespace-pre-wrap text-sm font-light leading-relaxed text-text">
                {request.message}
              </p>

              {request.email ? (
                <p className="mt-6 text-sm font-light text-text-2">
                  Also reachable at{" "}
                  <a
                    href={`mailto:${request.email}`}
                    className="text-text underline decoration-rule-strong transition-colors duration-200 hover:text-gold"
                  >
                    {request.email}
                  </a>
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule pt-6">
                <AdminButton tone={handled ? "quiet" : "primary"} onClick={toggle} disabled={busy}>
                  {busy
                    ? "Updating"
                    : handled
                      ? "Move back to open"
                      : "Mark handled"}
                </AdminButton>
                <StatusLine status={status} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
