import type { Metadata } from "next";
import { services } from "@/data/services";
import { ServiceRows } from "@/components/service-rows";
import { ActionLink, Reveal, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Backend, frontend, full stack, game design, UI design and script design for Roblox and beyond.",
};

export default function ServicesPage() {
  return (
    <>
      <Section className="pt-36 sm:pt-44">
        <Reveal>
          <h1 className="balance max-w-[18ch] font-serif text-[length:var(--display)] font-light leading-[1.03] tracking-[-0.025em]">
            Six disciplines, one person.
          </h1>
          <p className="pretty mt-8 max-w-[58ch] text-[length:var(--lead)] font-light leading-relaxed text-text-2">
            Most commissions need more than one of these at once. Owning all six
            means the server contract, the client feel and the interface get
            decided together instead of negotiated between three people.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="mt-16 grid gap-px border-t border-rule sm:grid-cols-3">
            {[
              ["Delivery", "1 day to 3 weeks"],
              ["Handover", "Documented and commented"],
              ["Minimum", "$25"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-rule py-6 sm:border-b-0 sm:pr-8">
                <dt className="text-xs text-text-2">{label}</dt>
                <dd className="tabular mt-2 font-serif text-[1.25rem] font-light leading-snug">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Section>

      <ServiceRows services={services} />

      <Section className="border-t border-rule">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <h2 className="balance max-w-[22ch] font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.02em]">
              Not sure which of these your project needs?
            </h2>
            <ActionLink href="/booking" className="shrink-0">
              Describe the project
            </ActionLink>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
