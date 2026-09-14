"use client";

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { projects, type Project } from "@/data/projects";
import { GithubMark } from "../github-mark";
import { VideoFacade } from "../video-facade";
import { EASE, Section, SectionHeading } from "../ui";

/**
 * Stacking scroll cards with weighted inertia.
 *
 * Each card pins near the top; as the next arrives the one behind scales back
 * and dims, so the pile reads as receding depth. The scale is driven through a
 * spring rather than raw scroll, which is what gives it weight instead of the
 * card snapping to the scrollbar.
 */
export function StackingShowcase() {
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <Section id="work">
      <SectionHeading
        title="Systems already shipped"
        lede="Each repository solves one problem completely. The source is public — read it before commissioning anything."
      />

      <div ref={container} className="relative">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            index={index}
            total={projects.length}
            progress={scrollYProgress}
            reduced={Boolean(reduced)}
          />
        ))}
      </div>
    </Section>
  );
}

function ProjectCard({
  project,
  index,
  total,
  progress,
  reduced,
}: {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const start = index / total;
  const targetScale = 1 - (total - index) * 0.03;

  const scale = useTransform(progress, [start, 1], [1, targetScale]);
  /* Cards deeper in the pile also lose light, so depth is carried by value and
     not by size alone. */
  const dim = useTransform(progress, [start, 1], [0, 0.55]);

  const card = (
    <article className="specular specular-hover group relative overflow-hidden rounded-lg">
      {/* Champagne hairline catching light along the top edge of the card. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
      />

      <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col justify-center">
          <p className="truncate font-mono text-xs tracking-tight text-text-2">
            {project.repo}
          </p>

          <h3 className="mt-5 font-serif text-[length:var(--heading)] font-light leading-tight tracking-[-0.015em]">
            {project.title}
          </h3>

          <p className="pretty mt-5 max-w-[46ch] text-[0.9375rem] font-light leading-relaxed text-text-2">
            {project.summary}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-1.5 text-sm font-medium text-text transition-colors duration-200 hover:text-gold"
            >
              <GithubMark className="size-4" />
              Read the source
            </a>

            <ul className="flex flex-wrap gap-x-2 gap-y-2">
              {project.stack.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-rule px-2.5 py-0.5 text-[0.6875rem] text-text-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0">
          <VideoFacade
            youtubeId={project.youtubeId}
            title={project.title}
            githubUrl={project.githubUrl}
            priority={index === 0}
          />
        </div>
      </div>
    </article>
  );

  if (reduced) {
    return <div className="mb-6 last:mb-0">{card}</div>;
  }

  return (
    <div className="sticky top-24 flex min-h-[74svh] items-center justify-center">
      <motion.div
        style={{ scale, top: `${index * 18}px` }}
        transition={{ ease: EASE }}
        className="relative w-full origin-top"
      >
        {card}
        {/* Dimming veil, strongest on the cards furthest back. */}
        <motion.span
          aria-hidden="true"
          style={{ opacity: dim }}
          className="pointer-events-none absolute inset-0 rounded-lg bg-bg"
        />
      </motion.div>
    </div>
  );
}
