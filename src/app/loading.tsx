import { MorphLoader } from "@/components/ui/morph-loader";

/** Route-transition screen. Same mark as the first-load curtain, no wordmark. */
export default function Loading() {
  return (
    <section className="bloom relative flex min-h-[80svh] items-center justify-center px-[var(--gutter)]">
      <div
        className="relative"
        style={{ animation: "severrir-fade-in 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <MorphLoader />
      </div>
    </section>
  );
}
