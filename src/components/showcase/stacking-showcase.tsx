"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { projects, type Project } from "@/data/projects";
import { GithubMark } from "../github-mark";
import { VideoFacade } from "../video-facade";
import { Section, SectionHeading } from "../ui";

/**
 * Stacking scroll cards with weighted inertia.
 *
 * Each card pins near the top; as the next arrives the one behind scales back
 * and dims, so the pile reads as receding depth. The scale is driven through a
 * spring rather than raw scroll, which is what gives it weight instead of the
 * card snapping to the scrollbar.
 */
/**
 * Stacking needs real vertical room. Below lg a card is heading, paragraph, tag
 * list and a 16:9 video stacked in one column — routinely taller than the 74svh
 * box the pile assumes, at which point the offsets push content under the fixed
 * header. It also puts five simultaneously backdrop-blurred layers on the GPUs
 * least able to afford them. Defaults to off so phones never see the broken
 * state even for a frame; the section sits below the fold, so desktop upgrades
 * long before it is scrolled to.
 */
function useStackable() {
  const [stackable, setStackable] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setStackable(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return stackable;
}

export function StackingShowcase() {
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const stackable = useStackable();

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
            reduced={Boolean(reduced) || !stackable}
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

  const rawScale = useTransform(progress, [start, 1], [1, targetScale]);
  /*
   * Damped rather than bound straight to the scrollbar. Raw scroll makes the
   * card track the wheel exactly, which reads mechanical; the spring gives the
   * pile the weight the section is going for.
   */
  const scale = useSpring(rawScale, { stiffness: 120, damping: 28, mass: 0.6 });
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
          <p className="flex min-w-0 items-center gap-2.5 font-mono text-xs tracking-tight text-text-2">
            <span aria-hidden="true" className="h-px w-5 shrink-0 bg-gold/45" />
            <span className="truncate">{project.repo}</span>
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
              className="inline-flex items-center gap-2 py-1.5 text-sm font-medium text-text underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:text-gold hover:decoration-gold/60"
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
