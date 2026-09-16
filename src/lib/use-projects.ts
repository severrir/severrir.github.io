"use client";

import { useEffect, useState } from "react";
import { projects as committedProjects, type Project } from "@/data/projects";
import { supabase, type ProjectOverride } from "./supabase";

/**
 * Showcase content, editable without a deploy.
 *
 * src/data/projects.ts stays the source of truth that renders at build time, so
 * the exported HTML carries real copy for anyone who arrives before JavaScript
 * does — and for crawlers, which is the whole reason this site is statically
 * exported. A row in project_overrides then wins at runtime.
 *
 * If the fetch fails, the project is paused, or Supabase was never configured,
 * the committed content simply stands. The showcase is never empty.
 */

/** A null column means "not edited", so it must not erase the committed value. */
function applyOverride(base: Project, override: ProjectOverride): Project {
  const githubUrl = override.github_url ?? base.githubUrl;

  return {
    ...base,
    title: override.title ?? base.title,
    summary: override.summary ?? base.summary,
    stack: override.stack?.length ? override.stack : base.stack,
    githubUrl,
    // repo is the label printed under the card, so it has to follow the URL it
    // describes rather than keep pointing at the old repository.
    repo: githubUrl.replace(/^https:\/\/github\.com\//, ""),
    youtubeId: override.youtube_id ?? base.youtubeId,
  };
}

export function mergeProjects(
  base: Project[],
  overrides: ProjectOverride[],
): Project[] {
  const bySlug = new Map(overrides.map((row) => [row.slug, row]));

  return base
    .map((project, index) => {
      const override = bySlug.get(project.slug);
      return {
        project: override ? applyOverride(project, override) : project,
        visible: override ? override.visible : true,
        // Cards without an explicit position keep the order they are written
        // in, which is what makes a partial reorder behave predictably.
        order: override?.sort_order ?? index,
        index,
      };
    })
    .filter((entry) => entry.visible)
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map((entry) => entry.project);
}

export function useProjects(): { projects: Project[]; loaded: boolean } {
  const [projects, setProjects] = useState<Project[]>(committedProjects);
  /* With no Supabase project configured the committed content is already the
     final answer, so this starts settled rather than being corrected on the
     first commit. The value is a build-time constant, so it is identical on the
     server and on the client and cannot cause a hydration mismatch. */
  const [loaded, setLoaded] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase
      .from("project_overrides")
      .select("*")
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) {
          setProjects(mergeProjects(committedProjects, data as ProjectOverride[]));
        }
        setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return { projects, loaded };
}
