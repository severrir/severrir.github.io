"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "../ui";

/**
 * A technical drawing of what each repository actually does.
 *
 * The cards carried a title, a paragraph and a link row inside a box tall
 * enough for three times that, and the hole was doing nothing but making the
 * card look unfinished. Filling it with more prose would have been worse: the
 * summary already says the thing once. So the space gets the one artefact this
 * subject earns — the diagram a scripter would sketch before writing the
 * module. Each drawing illustrates its own summary sentence and asserts
 * nothing the summary does not already claim.
 *
 * One drawing language across all five: hairlines in the same cobalt the hero
 * arcs use, exactly one element in champagne — the thing the system is *for* —
 * and labels only where a part of the drawing would otherwise be a guess.
 *
 * The lines draw themselves once, when the card arrives. Under reduced motion
 * framer's pathLength would strand every stroke at zero length, so the rule for
 * [data-schematic] in globals.css pins them complete instead; see the note on
 * Reveal in ui.tsx for why that is CSS rather than a branch here.
 */

const STRUCTURE = "#3E5C76";
const LIT = "#D4AF37";

const field = {
  initial: "rest",
  whileInView: "in",
  viewport: { once: true, margin: "0px 0px -8% 0px" },
  variants: { rest: {}, in: { transition: { staggerChildren: 0.03, delayChildren: 0.08 } } },
} as const;

/** A stroke that draws itself from its start point. */
const stroke = {
  variants: { rest: { pathLength: 0, opacity: 0 }, in: { pathLength: 1, opacity: 1 } },
  transition: { duration: 0.9, ease: EASE },
} as const;

/** Anything that has no length to draw — fills, dots, labels. */
const mark = {
  variants: { rest: { opacity: 0 }, in: { opacity: 1 } },
  transition: { duration: 0.7, ease: EASE },
} as const;

function Field({ children }: { children: ReactNode }) {
  return (
    <motion.svg
      data-schematic
      aria-hidden="true"
      viewBox="0 0 420 132"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full max-w-[26rem] overflow-visible"
      {...field}
    >
      {children}
    </motion.svg>
  );
}

function Label({ x, y, children, anchor = "middle", lit = false }: {
  x: number;
  y: number;
  children: string;
  anchor?: "start" | "middle" | "end";
  lit?: boolean;
}) {
  return (
    <motion.text
      {...mark}
      x={x}
      y={y}
      textAnchor={anchor}
      className="font-mono"
      fontSize="8.5"
      letterSpacing="0.06em"
      fill={lit ? LIT : "#94A3B8"}
      fillOpacity={lit ? 0.9 : 0.65}
    >
      {children}
    </motion.text>
  );
}

/* --- Core Framework -------------------------------------------------------
   "Resolves dependencies at boot, orders lifecycle across the server/client
   boundary." Drawn as the graph it resolves, above the lifecycle it resolves
   into. The champagne chain is one resolution path through the graph. */
function BootGraph() {
  const node = (cx: number, cy: number, lit = false) => (
    <motion.rect
      key={`${cx}-${cy}`}
      {...stroke}
      x={cx - 15}
      y={cy - 7.5}
      width={30}
      height={15}
      rx={2}
      stroke={lit ? LIT : STRUCTURE}
      strokeOpacity={lit ? 0.85 : 0.6}
      strokeWidth={1}
    />
  );

  return (
    <Field>
      {/* dependency edges */}
      {[
        "M87 26 L195 40",
        "M87 58 L195 76",
        "M87 88 L195 76",
        "M225 76 L333 58",
      ].map((d) => (
        <motion.path
          key={d}
          {...stroke}
          d={d}
          stroke={STRUCTURE}
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      ))}

      {/* the resolved chain */}
      {["M87 58 L195 40", "M225 40 L333 58"].map((d) => (
        <motion.path key={d} {...stroke} d={d} stroke={LIT} strokeOpacity={0.75} strokeWidth={1.2} />
      ))}

      {node(72, 26)}
      {node(72, 58, true)}
      {node(72, 88)}
      {node(210, 40, true)}
      {node(210, 76)}
      {node(348, 58, true)}

      {/* the lifecycle the graph is resolved into */}
      <motion.path
        {...stroke}
        d="M16 110 H404"
        stroke={STRUCTURE}
        strokeOpacity={0.5}
        strokeWidth={1}
      />
      {[72, 210, 348].map((x) => (
        <motion.path
          key={x}
          {...stroke}
          d={`M${x} 105 V110`}
          stroke={STRUCTURE}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
      ))}
      <Label x={72} y={126}>init</Label>
      <Label x={210} y={126}>start</Label>
      <Label x={348} y={126}>ready</Label>
    </Field>
  );
}

/* --- Proximity Interaction ------------------------------------------------
   "Buckets interactables into a broadphase grid so the per-frame cost tracks
   what is near the player." The lit block is the only thing the frame pays
   for; everything outside it is the saving. */
function BroadphaseGrid() {
  const x0 = 15;
  const y0 = 12;
  const cw = 27;
  const ch = 19;
  const px = x0 + 4.5 * cw;
  const py = y0 + 2.5 * ch;

  return (
    <Field>
      {Array.from({ length: 15 }, (_, i) => (
        <motion.path
          key={`v${i}`}
          {...stroke}
          d={`M${x0 + i * cw} ${y0} V${y0 + 5 * ch}`}
          stroke={STRUCTURE}
          strokeOpacity={0.22}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 6 }, (_, j) => (
        <motion.path
          key={`h${j}`}
          {...stroke}
          d={`M${x0} ${y0 + j * ch} H${x0 + 14 * cw}`}
          stroke={STRUCTURE}
          strokeOpacity={0.22}
          strokeWidth={1}
        />
      ))}

      {/* the buckets actually walked this frame */}
      <motion.rect
        {...mark}
        x={x0 + 3 * cw}
        y={y0 + ch}
        width={3 * cw}
        height={3 * ch}
        fill={LIT}
        fillOpacity={0.06}
      />
      <motion.rect
        {...stroke}
        x={x0 + 3 * cw}
        y={y0 + ch}
        width={3 * cw}
        height={3 * ch}
        stroke={LIT}
        strokeOpacity={0.6}
        strokeWidth={1}
      />

      <motion.circle
        {...stroke}
        cx={px}
        cy={py}
        r={38}
        stroke={LIT}
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeDasharray="3 5"
      />
      <motion.circle {...mark} cx={px} cy={py} r={3.5} fill={LIT} />

      <Label x={px} y={126}>
        buckets walked this frame
      </Label>
    </Field>
  );
}

/* --- Modular UI -----------------------------------------------------------
   "One theme table drives every surface, layout primitives handle scaling
   across device classes." One source on the left, three device classes on the
   right, and the champagne is the table everything is reading from. */
function ThemeFanout() {
  const frames = [
    { x: 246, y: 10, w: 158, h: 34 },
    { x: 246, y: 52, w: 112, h: 30 },
    { x: 246, y: 90, w: 66, h: 28 },
  ];

  return (
    <Field>
      <motion.rect
        {...stroke}
        x={16}
        y={34}
        width={46}
        height={64}
        rx={3}
        stroke={LIT}
        strokeOpacity={0.8}
        strokeWidth={1}
      />
      {[48, 62, 76, 90].map((y) => (
        <motion.path
          key={y}
          {...stroke}
          d={`M24 ${y} H54`}
          stroke={LIT}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      <Label x={39} y={114} lit>
        theme
      </Label>

      {["M62 66 C 150 66, 176 27, 246 27", "M62 66 H246", "M62 66 C 150 66, 176 104, 246 104"].map(
        (d) => (
          <motion.path
            key={d}
            {...stroke}
            d={d}
            stroke={LIT}
            strokeOpacity={0.45}
            strokeWidth={1}
          />
        ),
      )}

      {frames.map((f) => (
        <motion.g key={f.x + f.y}>
          <motion.rect
            {...stroke}
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx={3}
            stroke={STRUCTURE}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
          <motion.path
            {...stroke}
            d={`M${f.x + 8} ${f.y + 11} H${f.x + f.w - 8}`}
            stroke={STRUCTURE}
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          <motion.path
            {...stroke}
            d={`M${f.x + 8} ${f.y + f.h - 9} H${f.x + f.w * 0.58}`}
            stroke={STRUCTURE}
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        </motion.g>
      ))}
    </Field>
  );
}

/* --- Snake, Twisted -------------------------------------------------------
   "Written to test game feel with a fixed timestep." The lattice is the board,
   the ruler underneath is the timestep — evenly spaced, which is the whole
   claim. */
function FixedStepLattice() {
  return (
    <Field>
      {Array.from({ length: 18 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => (
          <motion.circle
            {...mark}
            key={`${i}-${j}`}
            cx={18 + i * 22}
            cy={20 + j * 24}
            r={1.1}
            fill={STRUCTURE}
            fillOpacity={0.5}
          />
        )),
      )}

      <motion.path
        {...stroke}
        d="M40 68 V44 H106 V20 H172 V68 H238 V44 H304"
        stroke={STRUCTURE}
        strokeOpacity={0.85}
        strokeWidth={1.6}
        strokeLinecap="square"
      />
      <motion.rect {...mark} x={300} y={40} width={8} height={8} fill={LIT} />
      <motion.circle {...mark} cx={370} cy={20} r={3.5} fill={LIT} fillOpacity={0.85} />

      <motion.path
        {...stroke}
        d="M18 110 H392"
        stroke={STRUCTURE}
        strokeOpacity={0.45}
        strokeWidth={1}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <motion.path
          key={i}
          {...stroke}
          d={`M${18 + i * 34} 105 V110`}
          stroke={STRUCTURE}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
      ))}
      <Label x={18} y={126} anchor="start">
        fixed step
      </Label>
    </Field>
  );
}

/* --- Matchmaking Service --------------------------------------------------
   "Widens rating bands as wait time grows, reserves slots atomically." The
   band opens left to right; the champagne pair is the moment two players fall
   inside the same one. */
function WideningBands() {
  return (
    <Field>
      <motion.path
        {...mark}
        d="M24 62 C 120 62, 200 40, 396 22 L396 102 C 200 84, 120 62, 24 62 Z"
        fill={STRUCTURE}
        fillOpacity={0.1}
      />
      {["M24 62 C 120 62, 200 40, 396 22", "M24 62 C 120 62, 200 84, 396 102"].map((d) => (
        <motion.path
          key={d}
          {...stroke}
          d={d}
          stroke={STRUCTURE}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
      ))}

      <motion.path
        {...stroke}
        d="M24 12 V112 H400"
        stroke={STRUCTURE}
        strokeOpacity={0.4}
        strokeWidth={1}
      />

      {[
        [120, 24],
        [152, 54],
        [196, 96],
        [232, 34],
        [258, 74],
        [330, 18],
        [352, 96],
      ].map(([cx, cy]) => (
        <motion.circle
          {...mark}
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={2.5}
          fill={STRUCTURE}
          fillOpacity={0.75}
        />
      ))}

      {/* the pair the widened band finally contains */}
      <motion.path
        {...stroke}
        d="M292 46 V84"
        stroke={LIT}
        strokeOpacity={0.7}
        strokeWidth={1}
      />
      <motion.circle {...mark} cx={292} cy={46} r={3.5} fill={LIT} />
      <motion.circle {...mark} cx={292} cy={84} r={3.5} fill={LIT} />

      <Label x={212} y={128}>
        wait time
      </Label>
    </Field>
  );
}

const SCHEMATICS: Record<string, () => ReactNode> = {
  "roblox-core-framework": BootGraph,
  "proximity-interaction-sys": BroadphaseGrid,
  "modular-ui-components": ThemeFanout,
  "snake-twist-pygame": FixedStepLattice,
  "backend-matchmaking": WideningBands,
};

/**
 * Renders nothing for a project without a drawing — a row added from the
 * dashboard gets the card without a schematic rather than a placeholder box,
 * which is the honest empty state here.
 */
export function ProjectSchematic({ slug }: { slug: string }) {
  const Drawing = SCHEMATICS[slug];
  if (!Drawing) return null;
  return <Drawing />;
}
