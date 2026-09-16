import type { Metadata } from "next";
import { AuthCallback } from "@/components/auth/auth-callback";

export const metadata: Metadata = {
  title: "Signing in",
  // A waypoint in an auth round trip, not a page anyone should land on from a
  // search result.
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <section className="bloom relative flex min-h-[88svh] items-center justify-center px-[var(--gutter)] py-32">
      <div className="relative w-full">
        <AuthCallback />
      </div>
    </section>
  );
}
