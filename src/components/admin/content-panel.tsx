"use client";

import { useCallback, useEffect, useState } from "react";
import { projects as committedProjects, type Project } from "@/data/projects";
import { supabase, type ProjectOverride } from "@/lib/supabase";
import { playSound } from "@/lib/useSound";
import { Plus } from "lucide-react";
import { MorphLoader } from "../ui/morph-loader";
import { AdminButton, PanelHeading } from "./primitives";
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
  /** True when the row is a card that exists only in the database. */
  added: boolean;
  draft: Draft;
  saving: boolean;
  status: Status;
};

/**
 * The stand-in base for an added card. Every committed field is empty, which is
 * exactly right: there is nothing to fall back to, so the editor's placeholders
 * ask for values rather than offering them, and a blank field is an error
 * rather than a default.
 */
function stubBase(slug: string): Project {
  return {
    slug,
    title: "Untitled card",
    summary: "",
    stack: [],
    githubUrl: "",
    youtubeId: "",
  };
}

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
  const committed = new Set(committedProjects.map((project) => project.slug));

  const fromRepo = committedProjects.map((base, index) => {
    const override = bySlug.get(base.slug) ?? null;
    return {
      base,
      override,
      added: false,
      order: override?.sort_order ?? index,
      index,
    };
  });

  /* Rows with no committed counterpart are cards added from here. They sort
     after the repository's own by default, and are listed even when they are
     still blank — an unfinished card has to be reachable to be finished. */
  const fromDatabase = overrides
    .filter((override) => !committed.has(override.slug))
    .map((override, offset) => {
      const index = committedProjects.length + offset;
      return {
        base: stubBase(override.slug),
        override,
        added: true,
        order: override.sort_order ?? index,
        index,
      };
    });

  return [...fromRepo, ...fromDatabase]
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ base, override, added }) => ({
      base,
      override,
      added,
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
  const [addStatus, setAddStatus] = useState<Status>(null);
  const [adding, setAdding] = useState(false);

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

    const problem = validateDraft(row.draft, row.added);
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
      schematic: orNull(row.draft.schematic),
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

  /*
   * Deleting the row is the same call for both kinds of card and means two
   * different things, which is why the list is rebuilt differently afterwards.
   * For a committed card the row was only ever a set of edits, so removing it
   * leaves the card standing as the repository wrote it. For an added card the
   * row *was* the card, so removing it removes the card from the list too.
   */
  const onReset = async (slug: string) => {
    if (!supabase || !rows) return;

    const row = rows.find((entry) => entry.base.slug === slug);
    if (!row) return;

    patchRow(slug, { saving: true, status: null });
    const { error } = await supabase.from("project_overrides").delete().eq("slug", slug);

    if (error) {
      patchRow(slug, { saving: false, status: { kind: "error", message: error.message } });
      return;
    }

    playSound("success");

    if (row.added) {
      setRows((current) => current?.filter((entry) => entry.base.slug !== slug) ?? current);
      return;
    }

    patchRow(slug, {
      saving: false,
      override: null,
      draft: draftFrom(null),
      status: { kind: "saved", message: "Reset. This card shows what the repository says." },
    });
  };

  /*
   * A new card is written to the database immediately rather than held as a
   * local draft, so it has a slug — the primary key everything else here is
   * addressed by — before anything can be typed into it. It starts hidden,
   * because an empty card that appeared on the homepage the moment it was
   * created would be a worse default than one that has to be published.
   */
  const onAdd = async () => {
    if (!supabase || !rows) return;

    setAddStatus(null);
    setAdding(true);

    const slug = `card-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("project_overrides")
      .insert({ slug, visible: false, sort_order: rows.length })
      .select()
      .single();

    setAdding(false);

    if (error) {
      setAddStatus({ kind: "error", message: `Could not add a card: ${error.message}` });
      return;
    }

    playSound("success");
    const override = data as ProjectOverride;
    setRows((current) => [
      ...(current ?? []),
      {
        base: stubBase(slug),
        override,
        added: true,
        draft: draftFrom(override),
        saving: false,
        status: {
          kind: "saved",
          message: "Card created, and hidden until you fill it in and show it.",
        },
      },
    ]);
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
            added={row.added}
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

      {/* Below the list rather than above it: the cards are what this panel is
          for, and adding one is the rarer act. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule pt-5">
        <AdminButton onClick={() => void onAdd()} disabled={adding || !supabase}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          {adding ? "Adding a card" : "Add a card"}
        </AdminButton>
        <p className="text-sm font-light text-text-2">
          New cards start hidden. Fill in the title, description, repository and
          video, then show it.
        </p>
      </div>

      {addStatus ? (
        <p
          role={addStatus.kind === "error" ? "alert" : "status"}
          className={`mt-4 text-sm font-light ${
            addStatus.kind === "error" ? "text-gold" : "text-text-2"
          }`}
        >
          {addStatus.message}
        </p>
      ) : null}

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
