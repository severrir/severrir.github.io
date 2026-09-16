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
import { type Project } from "@/data/projects";
import { useProjects } from "@/lib/use-projects";
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
  /* The committed content from src/data/projects.ts until the dashboard's
     overrides arrive, so the section is never empty and the prerendered HTML
     still carries real copy. */
  const { projects } = useProjects();

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

      {/* stage draws the light the pile moves through; the cards sit above it. */}
      <div ref={container} className="stage relative">
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
  const dim = useTransform(progress, [start, 1], [0, 0.72]);

  const card = (
    <article className="card-lift group relative overflow-hidden rounded-lg">
      {/* Champagne hairline catching light along the top edge of the card. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
      />

      {/*
       * No gap and no padding on the grid itself. The demo is bled to the
       * card's own edges and takes its full height, so the card is one object
       * with two halves rather than a panel holding a picture at arm's length.
       * Only the type block is inset.
       */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]">
        <div className="flex min-w-0 flex-col justify-center p-7 sm:p-10 lg:py-14 lg:pl-12 lg:pr-10">
          {/* The card opens on the title, at display size. A repository path in
              monospace stood here — an eyebrow above the heading, which the
              heading never needed; the repository is one click below it. */}
          <h3 className="balance font-serif text-[length:var(--title)] font-light leading-[1.08] tracking-[-0.022em]">
            {project.title}
          </h3>

          {/* The one champagne mark on the card, and it does structural work:
              it closes the title and opens the description. */}
          <span
            aria-hidden="true"
            className="mt-6 block h-px w-16 bg-gradient-to-r from-gold/80 to-gold/0"
          />

          <p className="pretty mt-6 max-w-[42ch] text-[0.9375rem] font-light leading-relaxed text-text-2">
            {project.summary}
          </p>

          {/* A rule, not a gap. The description is the claim and the row below
              is what you do about it; separated, the column reads as two
              things instead of one run of text that happens to end in tags. */}
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-7">
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

        <div className="relative min-w-0">
          <VideoFacade
            youtubeId={project.youtubeId}
            title={project.title}
            githubUrl={project.githubUrl}
            priority={index === 0}
            fill
          />

          {/*
           * The seam. A bled image meeting a coloured panel on a hard vertical
           * line is the thing that makes a composite look pasted together; the
           * card's own colour running out over the image dissolves that line,
           * and the image appears to be lit by the same room as the card.
           */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, #101d40 0%, rgb(16 29 64 / 0.75) 7%, rgb(16 29 64 / 0) 26%)",
            }}
          />

          {/*
           * The same seam along the top edge, and it earns its place twice. It
           * keeps the image off the lit bevel, which it would otherwise butt
           * straight into — and in the stack only the top strip of each card
           * behind is visible, so without this the pile reads as a row of
           * bright coloured bands instead of layered cards.
           */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-24 lg:block"
            style={{
              background:
                "linear-gradient(to bottom, #17294f 0%, rgb(20 38 78 / 0.7) 30%, rgb(20 38 78 / 0) 100%)",
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b1530] to-transparent lg:hidden"
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
