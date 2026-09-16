"use client";

import { useCallback, useEffect, useState } from "react";
import { projects as committedProjects, type Project } from "@/data/projects";
import { supabase, type ProjectOverride } from "@/lib/supabase";
import { playSound } from "@/lib/useSound";
import { MorphLoader } from "../ui/morph-loader";
import { PanelHeading } from "./primitives";
import {
  ProjectRowEditor,
  draftFrom,
  validateDraft,
  type Draft,
} from "./project-row-editor";

type Status = { kind: "saved" | "error"; message: string } | null;

type Row = {
  base: Project;
  override: ProjectOverride | null;
  draft: Draft;
  saving: boolean;
  status: Status;
};

function isDirty(row: Row): boolean {
  const saved = draftFrom(row.override);
  return (Object.keys(saved) as (keyof Draft)[]).some((key) => row.draft[key] !== saved[key]);
}

/** Empty means "fall back to what is committed in the repo", which is null here. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildRows(overrides: ProjectOverride[]): Row[] {
  const bySlug = new Map(overrides.map((row) => [row.slug, row]));

  return committedProjects
    .map((base, index) => {
      const override = bySlug.get(base.slug) ?? null;
      return { base, override, order: override?.sort_order ?? index, index };
    })
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ base, override }) => ({
      base,
      override,
      draft: draftFrom(override),
      saving: false,
      status: null,
    }));
}

export function ContentPanel() {
  /* null means "still loading". With nothing to load from, the committed
     projects are the whole list and there is no loading state to show. */
  const [rows, setRows] = useState<Row[] | null>(() => (supabase ? null : buildRows([])));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<Status>(null);

  const patchRow = useCallback((slug: string, patch: Partial<Row>) => {
    setRows((current) =>
      current
        ? current.map((row) => (row.base.slug === slug ? { ...row, ...patch } : row))
        : current,
    );
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase
      .from("project_overrides")
      .select("*")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLoadError(error.message);
          return;
        }
        setRows(buildRows((data ?? []) as ProjectOverride[]));
      });

    return () => {
      active = false;
    };
  }, []);

  const onSave = async (slug: string) => {
    if (!supabase || !rows) return;

    const index = rows.findIndex((row) => row.base.slug === slug);
    const row = rows[index];
    if (!row) return;

    const problem = validateDraft(row.draft);
    if (problem) {
      patchRow(slug, { status: { kind: "error", message: problem } });
      return;
    }

    patchRow(slug, { saving: true, status: null });

    const payload = {
      slug,
      title: orNull(row.draft.title),
      summary: orNull(row.draft.summary),
      stack: row.draft.stack.trim()
        ? row.draft.stack.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      github_url: orNull(row.draft.githubUrl),
      youtube_id: orNull(row.draft.youtubeId),
      visible: row.draft.visible,
      // Keep the position this row is currently shown in, so a first save does
      // not silently send the card back to its committed slot.
      sort_order: index,
    };

    const { data, error } = await supabase
      .from("project_overrides")
      .upsert(payload, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      patchRow(slug, { saving: false, status: { kind: "error", message: error.message } });
      return;
    }

    playSound("success");
    patchRow(slug, {
      saving: false,
      override: data as ProjectOverride,
      draft: draftFrom(data as ProjectOverride),
      status: { kind: "saved", message: "Saved. The site shows this on the next load." },
    });
  };

  const onReset = async (slug: string) => {
    if (!supabase) return;

    patchRow(slug, { saving: true, status: null });
    const { error } = await supabase.from("project_overrides").delete().eq("slug", slug);

    if (error) {
      patchRow(slug, { saving: false, status: { kind: "error", message: error.message } });
      return;
    }

    patchRow(slug, {
      saving: false,
      override: null,
      draft: draftFrom(null),
      status: { kind: "saved", message: "Reset. This card shows what the repository says." },
    });
  };

  const onMove = async (slug: string, direction: -1 | 1) => {
    if (!rows) return;

    const from = rows.findIndex((row) => row.base.slug === slug);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= rows.length) return;

    const next = [...rows];
    [next[from], next[to]] = [next[to], next[from]];
    setRows(next);
    setOrderStatus(null);

    if (!supabase) return;

    /*
     * Every position is written, not just the two that swapped. A card that has
     * never been edited has no row and therefore no sort_order, so writing only
     * the pair would leave the rest to fall back on their committed index and
     * the order would come apart after the second move.
     */
    const { error } = await supabase
      .from("project_overrides")
      .upsert(
        next.map((row, index) => ({ slug: row.base.slug, sort_order: index })),
        { onConflict: "slug" },
      );

    if (error) {
      setOrderStatus({ kind: "error", message: `Order not saved: ${error.message}` });
      return;
    }

    setOrderStatus({ kind: "saved", message: "Order saved." });
    setRows((current) =>
      current
        ? current.map((row, index) => ({
            ...row,
            override: row.override ? { ...row.override, sort_order: index } : row.override,
          }))
        : current,
    );
  };

  if (loadError) {
    return (
      <section>
        <PanelHeading title="Cards" />
        <p role="alert" className="text-sm font-light text-gold">
          The cards could not be loaded: {loadError}
        </p>
      </section>
    );
  }

  if (!rows) {
    return (
      <section>
        <PanelHeading title="Cards" />
        <div className="flex justify-center py-20">
          <MorphLoader label="Loading cards" />
        </div>
      </section>
    );
  }

  return (
    <section>
      <PanelHeading
        title="Cards"
        note="The showcase on the homepage. Edits here take effect on the next page load — no deploy. Leave a field blank to keep whatever the repository says, which is shown as the placeholder."
      />

      <ul className="space-y-3">
        {rows.map((row, index) => (
          <ProjectRowEditor
            key={row.base.slug}
            base={row.base}
            draft={row.draft}
            dirty={isDirty(row)}
            saving={row.saving}
            status={row.status}
            isFirst={index === 0}
            isLast={index === rows.length - 1}
            hasOverride={Boolean(row.override)}
            onChange={(patch) =>
              patchRow(row.base.slug, {
                draft: { ...row.draft, ...patch },
                status: null,
              })
            }
            onSave={() => void onSave(row.base.slug)}
            onRevert={() =>
              patchRow(row.base.slug, { draft: draftFrom(row.override), status: null })
            }
            onReset={() => void onReset(row.base.slug)}
            onMove={(direction) => void onMove(row.base.slug, direction)}
          />
        ))}
      </ul>

      {orderStatus ? (
        <p
          role={orderStatus.kind === "error" ? "alert" : "status"}
          className={`mt-5 text-sm font-light ${
            orderStatus.kind === "error" ? "text-gold" : "text-text-2"
          }`}
        >
          {orderStatus.message}
        </p>
      ) : null}
    </section>
  );
}
