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
import { useSpecular } from "@/lib/use-specular";
import { GithubMark } from "../github-mark";
import { VideoFacade } from "../video-facade";
import { Section, SectionHeading } from "../ui";
import { ProjectSchematic } from "./project-schematic";

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
  const trackSpecular = useSpecular<HTMLElement>();
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
    <article
      onPointerMove={trackSpecular}
      className="card-lift lume group relative overflow-hidden rounded-lg"
    >
      {/* The travelling highlight caught on the card's own edge. */}
      <span aria-hidden="true" className="lume-rim" />

      <div className="relative z-[1] grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col">
          {/* The card opens on the title. What stood here was a repository path
              in monospace — an eyebrow above the heading, which the heading
              never needed; the repository is one click away under it. */}
          <h3 className="font-serif text-[length:var(--heading)] font-light leading-tight tracking-[-0.015em]">
            {project.title}
          </h3>

          <p className="pretty mt-5 max-w-[46ch] text-[0.9375rem] font-light leading-relaxed text-text-2">
            {project.summary}
          </p>

          {/* The drawing takes the slack the column used to carry as air, and
              is the reason the copy sits at the top of the card rather than
              floating in the middle of it. */}
          <div className="mt-8 flex flex-1 items-center py-1">
            <ProjectSchematic slug={project.slug} />
          </div>

          {/* A rule, not a gap. The description is the claim and the row below
              is what you do about it; separated, the column reads as two
              things instead of one run of text that happens to end in tags. */}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-7">
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

        {/* The demo is set into the card rather than laid on top of it. The
            padding is the lip of the recess; without it the thumbnail meets
            the well's edge and the depth disappears. */}
        <div className="card-well min-w-0 self-start rounded-lg p-2">
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
    /*
     * Aligned to the top of its box, not centred in it. The box is 74svh
     * because that is the scroll distance each card gets, but a card centred in
     * it carries half that emptiness above itself — which, on the first card,
     * lands between the section heading and the pile as a hole with nothing in
     * it. Pinned to the top, the slack sits below each card instead, where the
     * next card rises through it.
     */
    /*
     * 74svh is the scroll distance each card gets, and every card but the last
     * needs it: the slack below a card is where the next one rises from. The
     * last card has nothing rising after it, so its slack was simply a
     * 300-pixel hole between the pile and the pricing section — the largest
     * piece of nothing on the page.
     */
    <div className="sticky top-24 flex min-h-[74svh] items-start justify-center last:min-h-fit">
      <motion.div
        style={{ scale, top: `${index * 24}px` }}
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
