import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/booking-form";
import { Reveal, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Booking",
  description:
    "Send a commission request. Describe the project and what needs building, and get an honest answer on feasibility, timeline and price.",
};

/* Numbered because the order is the commitment being made. */
const SEQUENCE = [
  "You send this request",
  "The work is completed and showcased to you",
  "Payment is confirmed",
  "The files are delivered",
];

function FormFallback() {
  return (
    <div
      className="specular mx-auto h-[36rem] max-w-3xl animate-pulse rounded-lg"
      aria-hidden="true"
    />
  );
}

export default function BookingPage() {
  return (
    <>
      <Section className="bloom relative pt-36 sm:pt-44">
        <Reveal className="relative text-center">
          <h1 className="balance mx-auto max-w-[16ch] font-serif text-[length:var(--display)] font-light leading-[1.02] tracking-[-0.025em]">
            Start a project.
          </h1>
          <p className="pretty mx-auto mt-8 max-w-[54ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2">
            Tell me what the project is and what needs building. You get
            feasibility, timeline and price back before anything is agreed.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <ol className="mx-auto mt-16 grid max-w-3xl gap-x-6 gap-y-6 sm:grid-cols-4">
            {SEQUENCE.map((step, index) => (
              <li key={step} className="border-t border-rule pt-4">
                <span className="tabular font-mono text-xs text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-light leading-relaxed text-text-2">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      <Section className="!pt-4">
        <Suspense fallback={<FormFallback />}>
          <BookingForm />
        </Suspense>
      </Section>
    </>
  );
}
