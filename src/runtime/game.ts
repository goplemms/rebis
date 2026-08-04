import { TUNING } from '../sim/tuning';
import { createWork, tick, light, stoke, canLight, canStoke, STEP } from '../sim/sim';
import type { Work } from '../sim/types';

/*
 * Rebis — runtime
 *
 * Owns the one mutable Work and the loop that advances it. Deliberately has
 * no React in it: putting the simulation in component state would mean
 * re-rendering the tree twenty times a second, and the whole project would
 * turn into a fight with the renderer.
 *
 * Two ways out of here:
 *
 *   onFrame(fn)      called every animation frame. For values that change
 *                    constantly — write them straight to the DOM or canvas.
 *   onStructure(fn)  called only when something React cares about changes:
 *                    a piece placed, the fire lit, the Work ending. This is
 *                    what drives actual re-renders, and it is rare.
 */

/** Never advance more than this much at once, e.g. after a backgrounded tab. */
const MAX_CATCHUP = 0.25;

let work: Work = createWork(TUNING);
export const getWork = (): Work => work;

// ── subscriptions ───────────────────────────────────────────
type FrameFn = (w: Work) => void;
const frameSubs = new Set<FrameFn>();
export function onFrame(fn: FrameFn): () => void {
  frameSubs.add(fn);
  return () => { frameSubs.delete(fn); };
}

const structureSubs = new Set<() => void>();
let structureVersion = 0;
export const getStructureVersion = (): number => structureVersion;
export function onStructure(fn: () => void): () => void {
  structureSubs.add(fn);
  return () => { structureSubs.delete(fn); };
}
function structureChanged(): void {
  structureVersion++;
  for (const fn of structureSubs) fn();
}

// ── actions ─────────────────────────────────────────────────
export type Tool = 'pit' | 'cucurbit' | 'clear';

/**
 * Each piece has its own slot, so the two may share a cell — that is the
 * vessel sitting directly ON the fire, distance 0, and it is the placement
 * the whole balance curve is built around. Treating a cell as holding one
 * thing made distance 0 unreachable.
 */
export function place(index: number, tool: Tool): void {
  if (work.over || work.lit) return;   // nothing is rearranged once it burns
  const b = work.board;
  if (tool === 'clear') {
    if (index === b.pit) b.pit = -1;
    if (index === b.cucurbit) b.cucurbit = -1;
  } else if (tool === 'pit') {
    b.pit = index;
  } else {
    b.cucurbit = index;
  }
  structureChanged();
}

/** The bar's single control: lights the fire on first press, then stokes. */
export function poke(): void {
  if (work.over) return;
  if (!work.lit) {
    if (light(work, TUNING)) structureChanged();
  } else {
    // Stoking alone changes no structure — the frame loop paints the result,
    // so this deliberately does not re-render anything.
    stoke(work, TUNING);
  }
}

export function newWork(): void {
  work = createWork(TUNING);
  structureChanged();
}

export const lightable = (): boolean => canLight(work, TUNING);
export const stokeable = (): boolean => canStoke(work, TUNING);

// ── the loop ────────────────────────────────────────────────
// Started at module scope, not in an effect: React's StrictMode invokes
// effects twice in development, which would otherwise run the game at
// double speed only when developing it.
let accumulator = 0;
let last = 0;

function frame(now: number): void {
  if (last === 0) last = now;
  accumulator += Math.min(MAX_CATCHUP, (now - last) / 1000);
  last = now;

  const wasOver = work.over;
  const wasLit = work.lit;
  while (accumulator >= STEP) {
    tick(work, TUNING, STEP);
    accumulator -= STEP;
  }

  for (const fn of frameSubs) fn(work);

  // The Work can end, or the fire go out, without anyone touching a control.
  if (work.over !== wasOver || work.lit !== wasLit) structureChanged();

  requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') requestAnimationFrame(frame);
