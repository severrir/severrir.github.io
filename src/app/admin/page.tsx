import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Site content, commission requests and visitor numbers.",
  // Never a search result. The page holds no data of its own, but there is no
  // reason for it to be indexed or previewed as part of the portfolio.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    /* No bloom, unlike every public page: this is a tool, and the atmosphere
       that sets the mood on the way in only gets in the way of reading. */
    <section className="relative px-[var(--gutter)] pb-32 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <AdminShell />
      </div>
    </section>
  );
}
