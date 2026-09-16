"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useSound } from "@/lib/useSound";
import { GithubMark } from "./github-mark";

type Stage = "maxres" | "hq" | "unavailable";

const NEXT_STAGE: Record<Stage, Stage> = {
  maxres: "hq",
  hq: "unavailable",
  unavailable: "unavailable",
};

/**
 * Five live YouTube iframes would cost megabytes before anyone pressed play,
 * so this ships a thumbnail and swaps in the player on demand.
 *
 * Thumbnails are loaded unoptimized: they are already compressed JPEGs, and
 * routing them through the image optimizer only adds a hop that can time out.
 * If a video is ever pulled, the frame falls back to the module's own surface
 * rather than an empty rectangle.
 */
export function VideoFacade({
  youtubeId,
  title,
  githubUrl,
  priority = false,
}: {
  youtubeId: string;
  title: string;
  githubUrl: string;
  priority?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState<Stage>("maxres");
  const sound = useSound();

  const frame =
    "relative aspect-video w-full overflow-hidden rounded-md border border-rule bg-bg-2";

  if (playing) {
    return (
      <div className={frame}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={`${title} — demo`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  if (stage === "unavailable") {
    return (
      <div className={`${frame} flex flex-col justify-between p-5 sm:p-6`}>
        <p className="font-mono text-xs text-text-2">{title}</p>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-text transition-colors duration-200 hover:text-text"
          {...sound}
        >
          <GithubMark className="size-4" />
          No demo published — read the source
        </a>
      </div>
    );
  }

  return (
    <div className={frame}>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group absolute inset-0 size-full cursor-pointer"
        aria-label={`Play the ${title} demo`}
        {...sound}
      >
        {/*
         * A plain img rather than next/image: with images.unoptimized the
         * optimizer emits no srcset, so next/image silently drops the sizes
         * attribute and every device — a 360px phone included — downloads the
         * full 1280x720 maxresdefault. mqdefault and maxresdefault are both true
         * 16:9, so they pair cleanly in a srcset; hqdefault is 4:3 and is only
         * the fallback when maxres is missing, where object-cover crops it.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image
            emits no srcset under images.unoptimized, which is the whole reason
            this is a plain img; see the comment above. */}
        <img
          key={stage}
          src={`https://i.ytimg.com/vi/${youtubeId}/${
            stage === "maxres" ? "maxresdefault" : "hqdefault"
          }.jpg`}
          srcSet={
            stage === "maxres"
              ? `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg 1280w`
              : undefined
          }
          sizes="(min-width: 1024px) 52vw, 100vw"
          alt=""
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setStage((s) => NEXT_STAGE[s])}
          /*
           * Graded into the page rather than dropped onto it. A YouTube still
           * arrives at whatever saturation its uploader chose — a green jungle,
           * a red title card — and full-strength it is the only thing on the
           * page not made of obsidian and champagne. Pulled down and tinted
           * cobalt it becomes part of the card; the grade lifts on hover, so
           * the true frame is one gesture away and the change tells you the
           * thumbnail is a control.
           */
          className="absolute inset-0 size-full object-cover opacity-80 saturate-[0.28] transition-[opacity,transform,filter] duration-700 ease-out group-hover:scale-[1.015] group-hover:opacity-100 group-hover:saturate-100"
        />
        {/* The cobalt the grade is pulled toward, and the floor the label sits
            on so it stays legible over a bright frame. */}
        <span className="absolute inset-0 bg-[#16305F] mix-blend-color opacity-70 transition-opacity duration-700 ease-out group-hover:opacity-0" />
        <span className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/15 to-transparent" />
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2.5 rounded-md border border-rule-strong bg-bg/70 px-3.5 py-2 text-sm font-semibold text-text backdrop-blur-sm transition-colors duration-200 group-hover:border-edge-gold-strong group-hover:text-text">
          <Play className="size-3.5 fill-current" strokeWidth={0} aria-hidden="true" />
          Watch demo
        </span>
      </button>
    </div>
  );
}
