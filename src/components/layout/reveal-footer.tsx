"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/projects";
import { GithubMark } from "../github-mark";
import { useSound } from "@/lib/useSound";

const YEAR = new Date().getFullYear();

const PAGES = [
  { href: "/#work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/booking", label: "Booking" },
];

/**
 * The footer is fixed behind the page and revealed as the content scrolls off
 * it, rather than scrolling up into view.
 *
 * That needs the content above to reserve exactly the footer's height, so the
 * height is measured and mirrored as padding on the page wrapper — a hard-coded
 * value would either clip the footer or leave a gap at some breakpoint.
 */
export function RevealFooter() {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);
  /**
   * A fixed element taller than the viewport has its top clipped off-screen
   * for good — on a phone the footer is ~980px against an ~844px viewport, so
   * the wordmark would be permanently unreachable. Below that threshold the
   * footer falls back to normal flow and simply scrolls into view.
   */
  const [canReveal, setCanReveal] = useState(false);
  const sound = useSound();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const h = el.offsetHeight;
      const fits = h <= window.innerHeight - 8;
      setCanReveal(fits);
      setHeight(fits ? h : 0);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <>
      {/* Spacer in normal flow so the fixed footer has room to be revealed. */}
      <div aria-hidden="true" style={{ height }} />

      <footer
        ref={ref}
        className={`z-0 border-t border-rule bg-bg px-[var(--gutter)] py-16 sm:py-20 ${
          canReveal ? "fixed inset-x-0 bottom-0" : "relative"
        }`}
      >
        <div className="bloom pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <p className="font-serif text-lg font-light tracking-[-0.02em]">severrir</p>
              <p className="pretty mt-4 max-w-[34ch] text-sm font-light leading-relaxed text-text-2">
                Systems architecture and full-stack development, delivered
                documented enough to hand to someone else.
              </p>
              <a
                href="https://github.com/severrir"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 py-2 text-sm text-text-2 transition-colors duration-200 hover:text-gold"
                {...sound}
              >
                <GithubMark className="size-4" />
                github.com/severrir
              </a>
            </div>

            <nav aria-label="Pages">
              <h2 className="text-sm font-medium">Pages</h2>
              <ul className="mt-4 space-y-0.5">
                {PAGES.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-block py-2 text-sm font-light text-text-2 transition-colors duration-200 hover:text-text"
                      {...sound}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Repositories">
              <h2 className="text-sm font-medium">Repositories</h2>
              <ul className="mt-4 space-y-0.5">
                {projects.map((project) => (
                  <li key={project.slug}>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-2 font-mono text-[0.8125rem] font-light text-text-2 transition-colors duration-200 hover:text-gold"
                      {...sound}
                    >
                      {project.slug}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t border-rule pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-light text-text-2">
              &copy; {YEAR} severrir. Commissions open.
            </p>
            <p className="tabular font-mono text-xs text-text-2">
              build {YEAR}.1 &nbsp;|&nbsp; next 16
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
