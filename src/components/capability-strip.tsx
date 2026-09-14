"use client";

import Link from "next/link";
import { services } from "@/data/services";
import { useSound } from "@/lib/useSound";

/**
 * A quiet bridge between the hero and the work: the six disciplines as one
 * line of type, each linking to its own row on the services page. No icons,
 * no cards — it exists to set scope in two seconds and then get out of the way.
 *
 * Deliberately has no entrance animation. It sits directly under the hero,
 * which already owns the page's one orchestrated moment.
 */
export function CapabilityStrip() {
  const sound = useSound();

  return (
    <section className="border-y border-rule px-[var(--gutter)] py-10">
      <div className="mx-auto w-full max-w-6xl">
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 sm:gap-x-12">
          {services.map((service) => (
            <li key={service.id}>
              <Link
                href={`/services#${service.id}`}
                className="group relative block py-2 text-sm font-light text-text-2 transition-colors duration-200 hover:text-text"
                {...sound}
              >
                {service.name}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold/70 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
