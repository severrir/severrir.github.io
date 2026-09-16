"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, type VisitorStats } from "@/lib/supabase";
import { excludeThisDevice } from "@/lib/analytics";
import { AdminButton, PanelHeading, StatusLine } from "./primitives";

/**
 * The count, and nothing built around it.
 *
 * This is where the dashboard spends its one piece of boldness: a single serif
 * numeral in open space. No stat card, no trend line, no row of tiles beside it
 * — the number is the content, and surrounding it with chrome would only make
 * it look like it needed some.
 */
export function VisitorsPanel() {
  const { session } = useAuth();
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [excluding, setExcluding] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" | "error"; message: string } | null>(
    null,
  );

  /* Bumped to re-read the count after a device is excluded. A token rather
     than a callback so the fetch lives entirely inside the effect that owns
     it, and cancellation is handled in one place. */
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase
      .rpc("visitor_stats")
      .single()
      .then(({ data, error: failure }) => {
        if (!active) return;
        if (failure) {
          setError(failure.message);
          return;
        }
        setError(null);
        setStats(data as VisitorStats);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const onExclude = async () => {
    const token = session?.access_token;
    if (!token) return;

    setExcluding(true);
    setStatus(null);

    const { error: failure } = await excludeThisDevice(token);

    if (failure) {
      setStatus({ kind: "error", message: failure });
    } else {
      setStatus({
        kind: "saved",
        message: "This device no longer counts, including any earlier visits from it.",
      });
      setReloadToken((token) => token + 1);
    }
    setExcluding(false);
  };

  const total = stats?.total ?? 0;

  return (
    <section>
      <PanelHeading
        title="Visitors"
        note="Individual people, not page views. Someone who comes back ten times is counted once. A household sharing one connection counts once; the same person on a laptop and a phone counts twice."
      />

      {error ? (
        <p role="alert" className="text-sm font-light text-gold">
          The count could not be read: {error}
        </p>
      ) : (
        <>
          <div className="py-6">
            {stats ? (
              <p className="tabular font-serif text-[clamp(3.5rem,12vw,7rem)] font-light leading-[0.9] tracking-[-0.03em]">
                {total.toLocaleString()}
              </p>
            ) : (
              /* A dash at display size reads as a stray rule rather than as a
                 missing number, so the slot holds its own height with a plain
                 placeholder instead. */
              <div
                role="status"
                aria-label="Reading the count"
                className="h-[clamp(3.15rem,10.8vw,6.3rem)] w-[6ch] max-w-full rounded-sm bg-white/[0.05]"
              />
            )}
            <p className="mt-5 text-[length:var(--lead)] font-light text-text-2">
              {total === 1 ? "person has visited" : "people have visited"}
            </p>
          </div>

          <dl className="mt-10 grid gap-x-10 gap-y-5 border-t border-rule pt-8 sm:grid-cols-2">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm font-light text-text-2">First seen in the last 7 days</dt>
              <dd className="tabular font-mono text-sm text-text">
                {stats ? stats.last_7_days.toLocaleString() : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm font-light text-text-2">Your devices, not counted</dt>
              <dd className="tabular font-mono text-sm text-text">
                {stats ? stats.excluded_devices.toLocaleString() : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule pt-8">
            <AdminButton onClick={onExclude} disabled={excluding || !session}>
              {excluding ? "Excluding this device" : "Stop counting this device"}
            </AdminButton>
            <StatusLine status={status} />
          </div>

          <p className="pretty mt-6 max-w-[62ch] text-sm font-light leading-relaxed text-text-2">
            Signing in already stops your visits being counted. Press this once
            on each device you browse from anyway — it retires visits made before
            you signed in, which are otherwise already in the number.
          </p>
        </>
      )}
    </section>
  );
}
