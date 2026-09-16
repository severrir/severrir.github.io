"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode, Ref } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { EASE } from "../ui";

/**
 * A working model of what each repository does.
 *
 * These began as drawings — a title, a paragraph and a link row left the cards
 * looking unfinished, and the hole wanted the artefact a scripter would sketch
 * before writing the module. Drawings are where they stopped being enough: a
 * picture of a broadphase grid asserts that the per-frame cost tracks what is
 * near the player, where a grid that buckets your own cursor demonstrates it.
 * So each one runs.
 *
 *   Core Framework        a signal resolves the dependency chain, and each
 *                         lifecycle phase lights as the signal reaches the tier
 *                         that completes it
 *   Proximity Interaction your pointer is the player and moves continuously;
 *                         the lit block is the bucket it falls in, and snaps.
 *                         That difference is the algorithm
 *   Modular UI            one change leaves the theme table and arrives at all
 *                         three device classes at once
 *   Snake, Twisted        a real game on a real fixed timestep, playing itself
 *                         until someone takes the keys off it
 *   Matchmaking Service   scrub the wait time and the band opens until it
 *                         contains two players
 *
 * One drawing language throughout: hairlines in the same cobalt the hero arcs
 * use, exactly one element in champagne — the thing the system is *for* — and
 * labels only where a part would otherwise be a guess. Nothing here claims
 * anything the card's own summary does not.
 *
 * Every live behaviour is gated on the drawing being on screen and on the
 * visitor not having asked for less motion. The entrance strokes draw
 * themselves with framer's pathLength, which under reduced motion would strand
 * each line at zero length — the [data-schematic] rule in globals.css pins them
 * complete instead. See the note on Reveal in ui.tsx for why that is CSS and
 * not a branch here.
 */

const STRUCTURE = "#3E5C76";
const LIT = "#D4AF37";
const VB_W = 420;
const VB_H = 132;

/* --- Shared state ---------------------------------------------------------
   Both hooks start false on the server and on the first client render, then
   correct themselves in an effect. Reading either synchronously during render
   would make the two trees disagree, and React 19 leaves that kind of mismatch
   unpatched — which is how this codebase previously stranded whole sections at
   opacity 0. */

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "64px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}

function useCalm() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return calm;
}

/** Whether there is a keyboard-and-cursor machine on the other end. */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return fine;
}

/* --- Entrance -------------------------------------------------------------
   `stroke` and `mark` carry variants, so nothing that uses them may also carry
   its own `animate` — an explicit animate target silently replaces the variant
   and the element never draws itself in. Anything that needs a repeating
   behaviour gets a separate overlay element on top of a static base. */

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

/** Anything with no length to draw — fills, dots, dashed guides, labels. */
const mark = {
  variants: { rest: { opacity: 0 }, in: { opacity: 1 } },
  transition: { duration: 0.7, ease: EASE },
} as const;

/**
 * A champagne packet travelling a wire.
 *
 * pathLength normalises the geometry to 1, so one dash length reads the same on
 * every path in the file however long the real curve is — no measuring, no
 * refs, no forced layout. The dash starts fully before the origin and ends
 * fully past the terminus, so the signal enters and leaves rather than blinking
 * into existence at each end.
 */
function Pulse({
  d,
  duration = 2.2,
  repeatDelay = 0.7,
  width = 2.2,
}: {
  d: string;
  duration?: number;
  repeatDelay?: number;
  width?: number;
}) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      stroke={LIT}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray="0.09 1"
      initial={{ strokeDashoffset: 0.09 }}
      animate={{ strokeDashoffset: -1 }}
      transition={{ duration, ease: "linear", repeat: Infinity, repeatDelay }}
    />
  );
}

/** A short champagne flash on an element that is otherwise part of the field. */
function Flash({
  d,
  delay,
  cycle,
  width = 1.6,
}: {
  d: string;
  delay: number;
  cycle: number;
  width?: number;
}) {
  const duration = 0.5;
  return (
    <motion.path
      d={d}
      stroke={LIT}
      strokeWidth={width}
      strokeLinecap="round"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        duration,
        times: [0, 0.25, 1],
        ease: EASE,
        repeat: Infinity,
        repeatDelay: cycle - duration,
        delay,
      }}
    />
  );
}

function Field({
  children,
  onPointerMove,
  onPointerLeave,
  svgRef,
}: {
  children: ReactNode;
  onPointerMove?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerLeave?: () => void;
  svgRef?: Ref<SVGSVGElement>;
}) {
  return (
    <motion.svg
      ref={svgRef}
      data-schematic
      aria-hidden="true"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full max-w-[26rem] overflow-visible"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...field}
    >
      {/*
       * A hit surface, because an svg root does not receive pointer events over
       * the parts of itself it has not painted. A grid of hairlines is almost
       * entirely unpainted, so the broadphase drawing answered the pointer only
       * when the cursor crossed a 1px line and looked broken everywhere else.
       * pointerEvents="all" makes the rect hit-testable without painting it.
       */}
      {onPointerMove ? (
        <rect x={0} y={0} width={VB_W} height={VB_H} fill="none" pointerEvents="all" />
      ) : null}
      {children}
    </motion.svg>
  );
}

function Label({
  x,
  y,
  children,
  anchor = "middle",
  lit = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
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

/**
 * The pointer's position in viewBox units. The svg's intrinsic ratio matches
 * its viewBox and the fit is `meet`, so the box is never letterboxed and one
 * uniform scale converts both axes.
 */
function toViewBox(event: ReactPointerEvent<SVGSVGElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const k = VB_W / box.width;
  return { x: (event.clientX - box.left) * k, y: (event.clientY - box.top) * k };
}

/* --- Core Framework ------------------------------------------------------- */

const CHAIN = "M87 58 L195 40 L225 40 L333 58";
/* The signal's travel plus its rest, so the phase flashes below can be placed
   on the same clock rather than drifting against it. */
const BOOT_CYCLE = 2.9;

function BootGraph() {
  const [hostRef, inView] = useInView<SVGSVGElement>();
  const calm = useCalm();
  const live = inView && !calm;

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
    <Field svgRef={hostRef}>
      {["M87 26 L195 40", "M87 58 L195 76", "M87 88 L195 76", "M225 76 L333 58"].map((d) => (
        <motion.path
          key={d}
          {...stroke}
          d={d}
          stroke={STRUCTURE}
          strokeOpacity={0.4}
          strokeWidth={1}
        />
      ))}

      <motion.path {...stroke} d={CHAIN} stroke={LIT} strokeOpacity={0.4} strokeWidth={1.2} />
      {live ? <Pulse d={CHAIN} duration={2.2} repeatDelay={0.7} /> : null}

      {node(72, 26)}
      {node(72, 58, true)}
      {node(72, 88)}
      {node(210, 40, true)}
      {node(210, 76)}
      {node(348, 58, true)}

      <motion.path
        {...stroke}
        d="M16 110 H404"
        stroke={STRUCTURE}
        strokeOpacity={0.5}
        strokeWidth={1}
      />
      {[72, 210, 348].map((x, i) => (
        <g key={x}>
          <motion.path
            {...stroke}
            d={`M${x} 105 V110`}
            stroke={STRUCTURE}
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          {/* Lit as the signal above arrives at the tier this phase completes,
              so the graph and the lifecycle are one event and not two loops. */}
          {live ? (
            <Flash d={`M${x} 102 V110`} delay={i * 1.1} cycle={BOOT_CYCLE} />
          ) : null}
        </g>
      ))}
      <Label x={72} y={126}>init</Label>
      <Label x={210} y={126}>start</Label>
      <Label x={348} y={126}>ready</Label>
    </Field>
  );
}

/* --- Proximity Interaction ------------------------------------------------ */

const COLS = 14;
const ROWS = 5;
const CW = 27;
const CH = 19;
const GX = 15;
const GY = 12;
const HOME = { col: 4, row: 2 };
const HOME_X = GX + (HOME.col + 0.5) * CW;
const HOME_Y = GY + (HOME.row + 0.5) * CH;

function BroadphaseGrid() {
  const [hostRef, inView] = useInView<SVGSVGElement>();
  const calm = useCalm();
  const live = inView && !calm;

  const [cell, setCell] = useState(HOME);

  /* The player's real position, not its bucket: a motion value, so following
     the pointer never costs a render, and a spring, so it has mass. */
  const px = useMotionValue(HOME_X);
  const py = useMotionValue(HOME_Y);
  const dotX = useSpring(px, { stiffness: 420, damping: 32, mass: 0.5 });
  const dotY = useSpring(py, { stiffness: 420, damping: 32, mass: 0.5 });

  const track = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!live) return;
      const { x, y } = toViewBox(event);
      px.set(x);
      py.set(y);
      /* Clamped one cell in from every edge so the 3x3 neighbourhood always has
         somewhere to be; a block hanging off the grid would read as a rendering
         fault rather than as a bucket. */
      const col = Math.min(COLS - 2, Math.max(1, Math.floor((x - GX) / CW)));
      const row = Math.min(ROWS - 2, Math.max(1, Math.floor((y - GY) / CH)));
      setCell((prev) => (prev.col === col && prev.row === row ? prev : { col, row }));
    },
    [live, px, py],
  );

  const rest = useCallback(() => {
    px.set(HOME_X);
    py.set(HOME_Y);
    setCell(HOME);
  }, [px, py]);

  return (
    <Field svgRef={hostRef} onPointerMove={track} onPointerLeave={rest}>
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <motion.path
          key={`v${i}`}
          {...stroke}
          d={`M${GX + i * CW} ${GY} V${GY + ROWS * CH}`}
          stroke={STRUCTURE}
          strokeOpacity={0.22}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: ROWS + 1 }, (_, j) => (
        <motion.path
          key={`h${j}`}
          {...stroke}
          d={`M${GX} ${GY + j * CH} H${GX + COLS * CW}`}
          stroke={STRUCTURE}
          strokeOpacity={0.22}
          strokeWidth={1}
        />
      ))}

      {/* The buckets this frame actually walks. Moved by transform rather than
          by x/y attributes, so the snap is composited and not a layout write. */}
      <motion.g
        animate={{ x: (cell.col - 1) * CW, y: (cell.row - 1) * CH }}
        transition={{ duration: 0.26, ease: EASE }}
      >
        <motion.rect
          {...mark}
          x={GX}
          y={GY}
          width={3 * CW}
          height={3 * CH}
          fill={LIT}
          fillOpacity={0.06}
        />
        <motion.rect
          {...stroke}
          x={GX}
          y={GY}
          width={3 * CW}
          height={3 * CH}
          stroke={LIT}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
      </motion.g>

      {/* `mark` rather than `stroke`: pathLength writes its own dash array, and
          would eat the dashes that make this read as a radius. */}
      <motion.circle
        {...mark}
        cx={dotX}
        cy={dotY}
        r={38}
        stroke={LIT}
        strokeOpacity={0.28}
        strokeWidth={1}
        strokeDasharray="3 5"
      />
      <motion.circle {...mark} cx={dotX} cy={dotY} r={3.5} fill={LIT} />

      <Label x={210} y={126}>buckets walked this frame</Label>
    </Field>
  );
}

/* --- Modular UI ----------------------------------------------------------- */

const WIRES = [
  "M62 66 C 150 66, 176 27, 246 27",
  "M62 66 H246",
  "M62 66 C 150 66, 176 104, 246 104",
];
const FANOUT_CYCLE = 1.9;

function ThemeFanout() {
  const [hostRef, inView] = useInView<SVGSVGElement>();
  const calm = useCalm();
  const live = inView && !calm;

  const frames = [
    { x: 246, y: 10, w: 158, h: 34 },
    { x: 246, y: 52, w: 112, h: 30 },
    { x: 246, y: 90, w: 66, h: 28 },
  ];

  return (
    <Field svgRef={hostRef}>
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
        <g key={y}>
          <motion.path
            {...stroke}
            d={`M24 ${y} H54`}
            stroke={LIT}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          {/* The change happens here first. */}
          {live ? <Flash d={`M24 ${y} H54`} delay={0} cycle={FANOUT_CYCLE} width={1.2} /> : null}
        </g>
      ))}
      <Label x={39} y={114} lit>theme</Label>

      {WIRES.map((d) => (
        <motion.path key={d} {...stroke} d={d} stroke={LIT} strokeOpacity={0.35} strokeWidth={1} />
      ))}
      {/* All three at once, with no stagger: one table driving every surface is
          the claim, and a stagger would be drawing a cascade instead. */}
      {live
        ? WIRES.map((d) => (
            <Pulse key={`p${d}`} d={d} duration={0.9} repeatDelay={FANOUT_CYCLE - 0.9} width={2} />
          ))
        : null}

      {frames.map((f) => {
        const rules = [
          `M${f.x + 8} ${f.y + 11} H${f.x + f.w - 8}`,
          `M${f.x + 8} ${f.y + f.h - 9} H${f.x + f.w * 0.58}`,
        ];
        return (
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
            {rules.map((d) => (
              <g key={d}>
                <motion.path
                  {...stroke}
                  d={d}
                  stroke={STRUCTURE}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                />
                {/* And arrives here, as the packet reaches the far end. */}
                {live ? <Flash d={d} delay={0.8} cycle={FANOUT_CYCLE} width={1.2} /> : null}
              </g>
            ))}
          </motion.g>
        );
      })}
    </Field>
  );
}

/* --- Matchmaking Service --------------------------------------------------
   The band is drawn whole and revealed left to right, because revealing it *is*
   widening it: the funnel's half-width at any x is the tolerance at that wait.
   Scrub with the pointer and the pair lights the moment the band contains both
   of them. */

const CANDIDATES: [number, number][] = [
  [120, 24],
  [152, 54],
  [196, 96],
  [232, 34],
  [258, 74],
  [330, 18],
  [352, 96],
];
const PAIR_X = 292;
const BAND_START = 24;

function WideningBands() {
  const [hostRef, inView] = useInView<SVGSVGElement>();
  const calm = useCalm();
  const live = inView && !calm;

  /** How far the clock has run, in viewBox units along the x axis. */
  const [wait, setWait] = useState(VB_W);
  const matched = wait >= PAIR_X;

  /* On arrival the clock runs once by itself, so the drawing has shown what it
     does before anyone thinks to point at it. The first animation frame is what
     sets the opening value — assigning it in the effect body would be a render
     the effect itself triggers. */
  useEffect(() => {
    if (!live) return;
    let frame = 0;
    let started = 0;
    const step = (now: number) => {
      if (!started) started = now;
      const t = Math.min(1, (now - started) / 2200);
      setWait(BAND_START + t * (VB_W - BAND_START));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [live]);

  const scrub = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!live) return;
      setWait(Math.max(BAND_START, Math.min(VB_W, toViewBox(event).x)));
    },
    [live],
  );

  const release = useCallback(() => {
    if (live) setWait(VB_W);
  }, [live]);

  return (
    <Field svgRef={hostRef} onPointerMove={scrub} onPointerLeave={release}>
      <defs>
        <clipPath id="severrir-band-clip">
          <rect x={0} y={0} width={wait} height={VB_H} />
        </clipPath>
      </defs>

      <g clipPath="url(#severrir-band-clip)">
        <motion.path
          {...mark}
          d="M24 62 C 120 62, 200 40, 396 22 L396 102 C 200 84, 120 62, 24 62 Z"
          fill={STRUCTURE}
          fillOpacity={0.12}
        />
        {["M24 62 C 120 62, 200 40, 396 22", "M24 62 C 120 62, 200 84, 396 102"].map((d) => (
          <motion.path
            key={d}
            {...stroke}
            d={d}
            stroke={STRUCTURE}
            strokeOpacity={0.75}
            strokeWidth={1}
          />
        ))}
      </g>

      <motion.path
        {...stroke}
        d="M24 12 V112 H400"
        stroke={STRUCTURE}
        strokeOpacity={0.4}
        strokeWidth={1}
      />

      {CANDIDATES.map(([cx, cy]) => (
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

      {/* The clock hand. */}
      {live && wait < VB_W ? (
        <line
          x1={wait}
          y1={14}
          x2={wait}
          y2={110}
          stroke={LIT}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
      ) : null}

      {/* The pair the widened band finally contains. */}
      <motion.path
        {...mark}
        d={`M${PAIR_X} 46 V84`}
        stroke={LIT}
        strokeWidth={1}
        strokeOpacity={matched ? 0.7 : 0}
        style={{ transition: "stroke-opacity 0.3s" }}
      />
      {[46, 84].map((cy) => (
        <motion.circle
          key={cy}
          {...mark}
          cx={PAIR_X}
          cy={cy}
          r={matched ? 3.5 : 2.5}
          fill={matched ? LIT : STRUCTURE}
          fillOpacity={matched ? 1 : 0.75}
        />
      ))}

      <Label x={212} y={128} lit={matched}>
        {matched ? "party reserved" : "wait time"}
      </Label>
    </Field>
  );
}

/* --- Snake, Twisted -------------------------------------------------------
   "Written to test game feel with a fixed timestep and no engine doing the
   interpolation for you." So it runs on a fixed timestep with no engine doing
   the interpolation, and it plays itself until someone takes the keys off it —
   the only way a card in a portfolio demonstrates game feel rather than
   describing it. */

const S_COLS = 20;
const S_ROWS = 5;
const S_CW = 19;
const S_CH = 16;
const S_X0 = 25.5;
const S_Y0 = 22;
const TICK_MS = 140;

type Cell = { c: number; r: number };
type Dir = { c: number; r: number };
type Game = { body: Cell[]; food: Cell; score: number; dead: boolean };

const DIRS: Record<string, Dir> = {
  ArrowUp: { c: 0, r: -1 },
  ArrowDown: { c: 0, r: 1 },
  ArrowLeft: { c: -1, r: 0 },
  ArrowRight: { c: 1, r: 0 },
  w: { c: 0, r: -1 },
  s: { c: 0, r: 1 },
  a: { c: -1, r: 0 },
  d: { c: 1, r: 0 },
};

const START: Cell[] = [
  { c: 5, r: 2 },
  { c: 4, r: 2 },
  { c: 3, r: 2 },
];

const sx = (c: number) => S_X0 + c * S_CW;
const sy = (r: number) => S_Y0 + r * S_CH;
const same = (a: Cell, b: Cell) => a.c === b.c && a.r === b.r;
const onBoard = (cell: Cell) =>
  cell.c >= 0 && cell.c < S_COLS && cell.r >= 0 && cell.r < S_ROWS;

/**
 * A scan from a pseudo-random offset rather than a retry loop. On a hundred-cell
 * board a retry loop is fine right up until the snake is long, and then it is
 * the one thing here that can stall a frame.
 */
function placeFood(body: Cell[]): Cell {
  const total = S_COLS * S_ROWS;
  const start = Math.floor(Math.random() * total);
  for (let i = 0; i < total; i++) {
    const n = (start + i) % total;
    const cell = { c: n % S_COLS, r: Math.floor(n / S_COLS) };
    if (!body.some((seg) => same(seg, cell))) return cell;
  }
  return { c: 0, r: 0 };
}

function freshGame(): Game {
  return { body: START, food: placeFood(START), score: 0, dead: false };
}

/** Greedy pursuit that will not reverse into itself or walk into its own body. */
function autopilot(body: Cell[], food: Cell, dir: Dir): Dir {
  const head = body[0];
  const dc = food.c - head.c;
  const dr = food.r - head.r;
  const wants: Dir[] = [];
  if (Math.abs(dc) >= Math.abs(dr)) {
    if (dc) wants.push({ c: Math.sign(dc), r: 0 });
    if (dr) wants.push({ c: 0, r: Math.sign(dr) });
  } else {
    if (dr) wants.push({ c: 0, r: Math.sign(dr) });
    if (dc) wants.push({ c: Math.sign(dc), r: 0 });
  }
  const options = [
    ...wants,
    dir,
    { c: 1, r: 0 },
    { c: 0, r: 1 },
    { c: -1, r: 0 },
    { c: 0, r: -1 },
  ];

  for (const next of options) {
    if (next.c === -dir.c && next.r === -dir.r) continue;
    const cell = { c: head.c + next.c, r: head.r + next.r };
    if (!onBoard(cell)) continue;
    /* The tail vacates on this same tick, so it is not an obstacle. */
    if (body.slice(0, -1).some((seg) => same(seg, cell))) continue;
    return next;
  }
  return dir;
}

function FixedStepLattice() {
  const [hostRef, inView] = useInView<HTMLDivElement>();
  const calm = useCalm();
  const fine = useFinePointer();
  const live = inView && !calm;

  const [game, setGame] = useState<Game>(() => ({
    body: START,
    /* A fixed opening position rather than a random one: placeFood would make
       the server's markup and the client's first render disagree. */
    food: { c: 14, r: 0 },
    score: 0,
    dead: false,
  }));
  const [manual, setManual] = useState(false);

  /*
   * Heading lives in a ref beside the state. Two arrow presses inside one
   * 140ms tick would otherwise both read the same value, and up-then-left
   * pressed quickly would lose the first of them.
   */
  const heading = useRef<Dir>({ c: 1, r: 0 });
  const queued = useRef<Dir | null>(null);

  useEffect(() => {
    if (!live || game.dead) return;
    const id = window.setInterval(() => {
      setGame((prev) => {
        if (prev.dead) return prev;

        let dir = heading.current;
        const next = queued.current;
        queued.current = null;
        if (next && !(next.c === -dir.c && next.r === -dir.r)) dir = next;
        if (!manual) dir = autopilot(prev.body, prev.food, dir);
        heading.current = dir;

        const head = { c: prev.body[0].c + dir.c, r: prev.body[0].r + dir.r };
        /* Death is recorded in state, not acted on here. Scheduling the restart
           inside the updater would fire it twice under StrictMode's double
           invoke, and would make this function something other than a pure
           transition. */
        if (!onBoard(head) || prev.body.slice(0, -1).some((seg) => same(seg, head))) {
          return { ...prev, dead: true };
        }

        const ate = same(head, prev.food);
        const body = [head, ...prev.body];
        if (!ate) body.pop();

        return {
          body,
          food: ate ? placeFood(body) : prev.food,
          score: ate ? prev.score + 1 : prev.score,
          dead: false,
        };
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [live, manual, game.dead]);

  /* The board clears a beat after the collision, so the crash is visible. */
  useEffect(() => {
    if (!game.dead) return;
    const id = window.setTimeout(() => {
      heading.current = { c: 1, r: 0 };
      queued.current = null;
      setGame(freshGame());
    }, 550);
    return () => window.clearTimeout(id);
  }, [game.dead]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = DIRS[event.key];
    if (!next) return;
    /* Swallowed only once this element has focus, which it only has because
       someone clicked it or tabbed to it. Arrow keys scroll the page as normal
       everywhere else, including while the pointer is merely over the card. */
    event.preventDefault();
    queued.current = next;
    if (!manual) setManual(true);
  };

  if (calm) return <StaticLattice hostRef={hostRef} />;

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      role="group"
      aria-label="Snake running on a fixed timestep. Focus this and use the arrow keys to play."
      onKeyDown={onKeyDown}
      onBlur={() => setManual(false)}
      className="w-full max-w-[26rem] rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      <Field>
        <Lattice />

        {game.body.map((seg, i) => (
          <rect
            key={`${seg.c}-${seg.r}-${i}`}
            x={sx(seg.c) - 6.5}
            y={sy(seg.r) - 5}
            width={13}
            height={10}
            rx={2}
            fill={i === 0 ? LIT : STRUCTURE}
            /* The body falls away behind the head, so the direction of travel is
               legible even in a still frame. */
            fillOpacity={
              game.dead ? 0.25 : i === 0 ? 1 : Math.max(0.18, 0.7 - i * 0.045)
            }
          />
        ))}

        <circle cx={sx(game.food.c)} cy={sy(game.food.r)} r={3.5} fill={LIT} fillOpacity={0.85} />

        <Ruler />
        <Label x={18} y={126} anchor="start">
          {/* No keys to offer on a touch device, so it does not offer them. */}
          {manual ? "fixed step · yours" : fine ? "fixed step · click to play" : "fixed step"}
        </Label>
        <Label x={392} y={126} anchor="end" lit={game.score > 0}>
          {String(game.score)}
        </Label>
      </Field>
    </div>
  );
}

function Lattice() {
  return (
    <>
      {Array.from({ length: S_COLS }, (_, c) =>
        Array.from({ length: S_ROWS }, (_, r) => (
          <motion.circle
            {...mark}
            key={`${c}-${r}`}
            cx={sx(c)}
            cy={sy(r)}
            r={1.1}
            fill={STRUCTURE}
            fillOpacity={0.4}
          />
        )),
      )}
    </>
  );
}

/** Evenly spaced, which is the whole claim the label makes. */
function Ruler() {
  return (
    <>
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
    </>
  );
}

/** What the card shows when the visitor has asked for less motion. */
function StaticLattice({ hostRef }: { hostRef: Ref<HTMLDivElement> }) {
  return (
    <div ref={hostRef} className="w-full max-w-[26rem]">
      <Field>
        <Lattice />
        <motion.path
          {...stroke}
          d="M63 70 V38 H139 V22 H215 V70 H291 V38 H348"
          stroke={STRUCTURE}
          strokeOpacity={0.85}
          strokeWidth={1.6}
          strokeLinecap="square"
        />
        <motion.rect {...mark} x={342} y={33} width={13} height={10} rx={2} fill={LIT} />
        <motion.circle {...mark} cx={386} cy={22} r={3.5} fill={LIT} fillOpacity={0.85} />
        <Ruler />
        <Label x={18} y={126} anchor="start">fixed step</Label>
      </Field>
    </div>
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
