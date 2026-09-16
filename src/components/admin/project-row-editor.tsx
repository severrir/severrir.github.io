"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { SCHEMATIC_CHOICES, type Project, type SchematicKind } from "@/data/projects";
import type { ProjectOverride } from "@/lib/supabase";
import { useSound } from "@/lib/useSound";
import { EASE } from "../ui";
import { VideoFacade } from "../video-facade";
import { ADMIN_FIELD, AdminButton, FieldLabel, StatusLine } from "./primitives";

/** Matches the summary_length constraint in supabase/schema.sql. */
const SUMMARY_MAX = 400;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export type Draft = {
  title: string;
  summary: string;
  stack: string;
  githubUrl: string;
  youtubeId: string;
  /** "" means the card keeps whatever the repository says. */
  schematic: SchematicKind | "";
  visible: boolean;
};

/**
 * An empty field means "use the value committed in src/data/projects.ts", which
 * is shown as the placeholder. That keeps the code the default and this the
 * exception, rather than copying every value into the database on first save.
 */
export function draftFrom(override: ProjectOverride | null): Draft {
  return {
    title: override?.title ?? "",
    summary: override?.summary ?? "",
    stack: override?.stack?.join(", ") ?? "",
    githubUrl: override?.github_url ?? "",
    youtubeId: override?.youtube_id ?? "",
    schematic: (override?.schematic as SchematicKind) ?? "",
    visible: override?.visible ?? true,
  };
}

/**
 * `added` is a card with no committed counterpart. An empty field on an
 * override means "keep what the repository says"; on an added card it means
 * the card has no title, or no video, and the showcase would refuse to render
 * it — so the same blank that is the default in one case is an error in the
 * other.
 */
export function validateDraft(draft: Draft, added = false): string | null {
  if (added) {
    if (!draft.title.trim()) return "An added card needs a title.";
    if (!draft.summary.trim()) return "An added card needs a description.";
    if (!draft.githubUrl.trim()) return "An added card needs a repository link.";
    if (!draft.youtubeId.trim()) return "An added card needs a demo video.";
  }
  if (draft.summary.length > SUMMARY_MAX) {
    return `The description is ${draft.summary.length} characters. The limit is ${SUMMARY_MAX}.`;
  }
  if (draft.youtubeId && !YOUTUBE_ID.test(draft.youtubeId)) {
    return "A YouTube ID is 11 characters, like LXb3EKWsInQ. Paste the ID, not the whole link.";
  }
  if (draft.githubUrl && !draft.githubUrl.startsWith("https://github.com/")) {
    return "The repository link must start with https://github.com/";
  }
  if (draft.stack.split(",").filter((s) => s.trim()).length > 6) {
    return "Six tags is the most a card can carry without wrapping badly.";
  }
  return null;
}

/**
 * Pull the ID out of whatever someone pastes — a watch link, a share link, an
 * embed URL, or the bare ID. Typing out the ID by hand is the step most likely
 * to go wrong, so it should not be required.
 */
export function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  if (YOUTUBE_ID.test(trimmed)) return trimmed;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return trimmed;
}

export function ProjectRowEditor({
  base,
  draft,
  dirty,
  saving,
  status,
  isFirst,
  isLast,
  hasOverride,
  added = false,
  onChange,
  onSave,
  onRevert,
  onReset,
  onMove,
}: {
  base: Project;
  draft: Draft;
  dirty: boolean;
  saving: boolean;
  status: { kind: "saved" | "error"; message: string } | null;
  isFirst: boolean;
  isLast: boolean;
  hasOverride: boolean;
  /** True when this row is a card that exists only in the database. */
  added?: boolean;
  onChange: (next: Partial<Draft>) => void;
  onSave: () => void;
  onRevert: () => void;
  onReset: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const sound = useSound();
  const reduced = useReducedMotion();

  const fieldId = (name: string) => `${base.slug}-${name}`;
  /* On an override the placeholder is the committed value, which is what the
     blank field will fall back to. An added card has no such value, so the
     placeholder states what the field wants instead of sitting empty. */
  const hint = (committed: string, want: string) => (added ? want : committed);
  const shownTitle = draft.title || base.title;
  const previewId = draft.youtubeId || base.youtubeId;
  const remaining = SUMMARY_MAX - draft.summary.length;

  return (
    <li className="specular relative rounded-md">
      <div className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
        {/*
         * Move buttons rather than drag: they work from the keyboard, they
         * work on a phone, they need no library, and the order they produce is
         * never ambiguous.
         */}
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            aria-label={`Move ${shownTitle} up`}
            className="grid size-7 place-items-center rounded-sm text-text-2 transition-colors duration-200 hover:text-gold disabled:pointer-events-none disabled:opacity-25"
            {...sound}
          >
            <ChevronUp className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            aria-label={`Move ${shownTitle} down`}
            className="grid size-7 place-items-center rounded-sm text-text-2 transition-colors duration-200 hover:text-gold disabled:pointer-events-none disabled:opacity-25"
            {...sound}
          >
            <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${base.slug}-panel`}
          className="min-w-0 flex-1 text-left"
          {...sound}
        >
          <span className="flex items-center gap-2.5">
            <span className="truncate text-sm font-medium text-text">{shownTitle}</span>
            {dirty ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-gold"
                title="Unsaved changes"
                aria-label="Unsaved changes"
              />
            ) : null}
          </span>
          <span className="mt-1 block truncate font-mono text-xs text-text-2">
            {base.slug}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ visible: !draft.visible })}
          aria-pressed={!draft.visible}
          aria-label={
            draft.visible ? `Hide ${shownTitle} from the site` : `Show ${shownTitle} on the site`
          }
          className={`grid size-9 shrink-0 place-items-center rounded-md border transition-colors duration-200 ${
            draft.visible
              ? "border-rule text-text-2 hover:border-rule-strong hover:text-text"
              : "border-edge-gold-strong text-gold"
          }`}
          {...sound}
        >
          {draft.visible ? (
            <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-hidden="true"
          tabIndex={-1}
          className="grid size-9 shrink-0 place-items-center rounded-md text-text-2 transition-colors duration-200 hover:text-text"
        >
          <ChevronDown
            className={`size-4 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
            strokeWidth={1.5}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${base.slug}-panel`}
            initial={reduced ? undefined : { height: 0, opacity: 0 }}
            animate={reduced ? undefined : { height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="grid gap-8 border-t border-rule p-5 sm:p-6 lg:grid-cols-[1fr_22rem]">
              <div className="space-y-6">
                <div>
                  <FieldLabel htmlFor={fieldId("title")} hint="Blank uses the committed title">
                    Title
                  </FieldLabel>
                  <input
                    id={fieldId("title")}
                    value={draft.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder={hint(base.title, "Core Framework")}
                    maxLength={80}
                    className={ADMIN_FIELD}
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor={fieldId("summary")}
                    hint={`${remaining} left`}
                  >
                    Description
                  </FieldLabel>
                  <textarea
                    id={fieldId("summary")}
                    value={draft.summary}
                    onChange={(e) => onChange({ summary: e.target.value })}
                    placeholder={hint(base.summary, "What it does, in one or two sentences.")}
                    rows={6}
                    maxLength={SUMMARY_MAX}
                    aria-describedby={fieldId("summary-note")}
                    className={`${ADMIN_FIELD} resize-y leading-relaxed ${
                      remaining < 0 ? "border-edge-gold-strong" : ""
                    }`}
                  />
                  <p id={fieldId("summary-note")} className="mt-2 text-xs font-light text-text-2">
                    Card height drives the stacking on the homepage, so this is
                    capped at {SUMMARY_MAX} characters.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor={fieldId("stack")} hint="Comma separated">
                      Tags
                    </FieldLabel>
                    <input
                      id={fieldId("stack")}
                      value={draft.stack}
                      onChange={(e) => onChange({ stack: e.target.value })}
                      placeholder={hint(base.stack.join(", "), "Luau, Roblox, Systems")}
                      className={ADMIN_FIELD}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor={fieldId("github")}>Repository</FieldLabel>
                    <input
                      id={fieldId("github")}
                      value={draft.githubUrl}
                      onChange={(e) => onChange({ githubUrl: e.target.value })}
                      placeholder={hint(base.githubUrl, "https://github.com/severrir/repo-name")}
                      inputMode="url"
                      className={ADMIN_FIELD}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel htmlFor={fieldId("youtube")} hint="ID or full link">
                    Demo video
                  </FieldLabel>
                  <input
                    id={fieldId("youtube")}
                    value={draft.youtubeId}
                    onChange={(e) => onChange({ youtubeId: e.target.value })}
                    onBlur={(e) => onChange({ youtubeId: extractYoutubeId(e.target.value) })}
                    placeholder={hint(base.youtubeId, "Paste a YouTube link")}
                    spellCheck={false}
                    className={`${ADMIN_FIELD} font-mono`}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor={fieldId("schematic")}>Diagram</FieldLabel>
                  {/*
                   * Chosen, never inferred. Each diagram draws one named
                   * mechanism, so handing a new card whichever one happened to
                   * be next would make it describe a system it is not. The
                   * module trace is the answer when none of them fits: it routes
                   * the card's own parts and claims nothing about them.
                   */}
                  <select
                    id={fieldId("schematic")}
                    value={draft.schematic}
                    onChange={(e) =>
                      onChange({ schematic: e.target.value as SchematicKind | "" })
                    }
                    className={ADMIN_FIELD}
                  >
                    <option value="">
                      {added ? "Module trace (default)" : "Unchanged"}
                    </option>
                    {SCHEMATIC_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/*
                 * The real component from the homepage, not a mock. Pasting an
                 * ID that does not exist shows the same fallback a visitor
                 * would get, which is the only way to find out before shipping.
                 */}
                <VideoFacade
                  key={previewId}
                  youtubeId={previewId}
                  title={`${shownTitle} preview`}
                  githubUrl={draft.githubUrl || base.githubUrl}
                />
                <p className="text-xs font-light text-text-2">
                  Live preview. If the thumbnail does not load, the video is
                  private, deleted, or the ID is wrong.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-rule p-5 sm:p-6">
              <AdminButton tone="primary" onClick={onSave} disabled={saving || !dirty}>
                {saving ? "Saving" : "Save changes"}
              </AdminButton>

              {dirty ? (
                <AdminButton onClick={onRevert} disabled={saving}>
                  Discard
                </AdminButton>
              ) : null}

              {/*
                * The same button in two different jobs, because the two rows
                * are different things. A committed card cannot be deleted from
                * here — it lives in the repository — so the destructive action
                * available to it is clearing its edits. An added card exists
                * only in this table, so deleting the row deletes the card, and
                * the wording says so rather than talking about "committed"
                * values that were never there.
                */}
              {added ? (
                confirmingReset ? (
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-light text-text-2">
                      Delete this card for good?
                    </span>
                    <AdminButton
                      tone="danger"
                      onClick={() => {
                        setConfirmingReset(false);
                        onReset();
                      }}
                    >
                      Delete card
                    </AdminButton>
                    <AdminButton onClick={() => setConfirmingReset(false)}>Keep</AdminButton>
                  </span>
                ) : (
                  <AdminButton tone="danger" onClick={() => setConfirmingReset(true)}>
                    Delete card
                  </AdminButton>
                )
              ) : hasOverride ? (
                confirmingReset ? (
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-light text-text-2">
                      Clear every edit to this card?
                    </span>
                    <AdminButton
                      tone="danger"
                      onClick={() => {
                        setConfirmingReset(false);
                        onReset();
                      }}
                    >
                      Reset to committed
                    </AdminButton>
                    <AdminButton onClick={() => setConfirmingReset(false)}>Keep</AdminButton>
                  </span>
                ) : (
                  <AdminButton tone="danger" onClick={() => setConfirmingReset(true)}>
                    Reset to committed
                  </AdminButton>
                )
              ) : null}

              <StatusLine status={status} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
