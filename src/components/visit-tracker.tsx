"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { trackVisit } from "@/lib/analytics";

/**
 * Registers the browser with the visitor count once per session.
 *
 * Renders nothing and blocks nothing — it is mounted in the root layout purely
 * so the call happens on any entry point, including a deep link straight to
 * /booking.
 *
 * The owner is never counted. Waiting for adminResolved rather than reading
 * isAdmin directly matters: the admin lookup is a round trip, and firing on the
 * first render would count severrir's own visit in the window before the answer
 * arrives — which is exactly the number he asked not to be in.
 */
export function VisitTracker() {
  const { loading, isAdmin, adminResolved } = useAuth();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || loading || !adminResolved || isAdmin) return;
    fired.current = true;
    void trackVisit();
  }, [loading, adminResolved, isAdmin]);

  return null;
}
