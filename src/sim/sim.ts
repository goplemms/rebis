import type { Tuning, Work } from './types';

/*
 * Rebis — simulation
 *
 * Pure. No DOM, no timers, no React, and no constants of its own — every
 * function takes the tuning table as an argument, which is what lets
 * tools/balance.ts sweep modified copies of it through the exact code the
 * game runs. A tuning change can never be true in the page and false in the
 * balance report.
 *
 * Nothing in this directory may import from ../view or ../runtime.
 */

/**
 * Fixed simulation step. The sim only ever advances in exactly this much
 * time, so results do not depend on the player's refresh rate and a headless
 * sweep reproduces live play exactly.
 */
export const STEP = 1 / 20;

/** Chebyshev distance, clamped to the length of the transfer tables. */
export function distance(a: number, b: number, C: Tuning): number {
  const n = C.grid.size;
  const d = Math.max(Math.abs((a % n) - (b % n)),
                     Math.abs(((a / n) | 0) - ((b / n) | 0)));
  return Math.min(d, C.transfer.falloff.length - 1);
}

/** falloff/lag lookups, safe against a short table. */
export function falloffAt(d: number, C: Tuning): number {
  return C.transfer.falloff[d] ?? 0;
}
export function lagAt(d: number, C: Tuning): number {
  return C.transfer.lagSeconds[d] ?? 0;
}

export function createWork(C: Tuning): Work {
  return {
    board: { pit: -1, cucurbit: -1 },
    lit: false,
    heat: 0,
    local: 0,
    strain: 0,
    wood: C.stores.wood,
    materia: C.stores.materia,
    distillate: 0,
    vapor: 0,
    elapsed: 0,
    over: null,
  };
}

export const isPlaced = (S: Work): boolean =>
  S.board.pit >= 0 && S.board.cucurbit >= 0;

export function canLight(S: Work, C: Tuning): boolean {
  return !S.lit && !S.over && isPlaced(S) && S.wood >= C.fire.lightCost;
}

export function light(S: Work, C: Tuning): boolean {
  if (!canLight(S, C)) return false;
  S.wood -= C.fire.lightCost;
  S.heat = C.fire.lightHeat;
  S.lit = true;
  return true;
}

export function canStoke(S: Work, C: Tuning): boolean {
  return S.lit && !S.over && S.wood >= C.fire.stokeWood;
}

export function stoke(S: Work, C: Tuning): boolean {
  if (!canStoke(S, C)) return false;
  S.wood -= C.fire.stokeWood;
  S.heat = Math.min(C.fire.maxHeat, S.heat + C.fire.stokeHeat);
  return true;
}

function end(S: Work, why: string): void {
  S.over = why;
  S.lit = false;
}

/**
 * Advance one step. `dt` is expected to be the fixed timestep — see
 * runtime/game.ts. Calling this with whatever a frame happened to take
 * makes results depend on the player's refresh rate.
 */
export function tick(S: Work, C: Tuning, dt: number): Work {
  if (S.over) return S;
  S.elapsed += dt;

  // ── the fire ──────────────────────────────────────────────
  if (S.lit) {
    S.wood -= C.fire.upkeepWood * dt;
    S.heat -= S.heat * C.fire.decayPerSec * dt;
    if (S.wood <= 0) { S.wood = 0; S.lit = false; S.heat = 0; }
    if (S.heat < 0.5) { S.heat = 0; S.lit = false; }
  } else {
    S.heat = 0;
  }

  // ── heat reaching the vessel ──────────────────────────────
  if (isPlaced(S)) {
    const d = distance(S.board.cucurbit, S.board.pit, C);
    const target = S.heat * falloffAt(d, C);
    const lag = lagAt(d, C);
    S.local = lag <= 0
      ? target
      : S.local + (target - S.local) * (1 - Math.exp(-dt / lag));
  } else {
    S.local = 0;
  }

  // ── refining ──────────────────────────────────────────────
  // Throughput rises with heat; the share that condenses falls off past the
  // pure limit. Squared, so the loss is gentle just over the line and brutal
  // well past it — which is what makes peak yield sit above the line.
  if (S.materia > 0 && S.local > 1) {
    const consumed = Math.min(S.materia, C.refining.ratePerHeat * S.local * dt);
    const over = Math.max(0, S.local - C.refining.pureLimit) / C.refining.vaporWidth;
    const vaporFraction = Math.min(1, over * over);
    S.materia -= consumed;
    S.distillate += consumed * (1 - vaporFraction);
    S.vapor += consumed * vaporFraction;
  }

  // ── strain ────────────────────────────────────────────────
  const excess = S.local - C.vessel.strainAbove;
  if (excess > 0) S.strain += excess * C.vessel.strainPerSec * dt;
  else S.strain = Math.max(0, S.strain - C.vessel.reliefPerSec * dt);

  // ── endings ───────────────────────────────────────────────
  if (S.strain >= C.vessel.crackAt) {
    end(S, 'The cucurbit cracked. Everything left in it is lost.');
  } else if (S.materia <= 1e-3) {
    end(S, 'All the materia is spent.');
  } else if (!S.lit && S.wood < C.fire.lightCost) {
    end(S, 'The wood is gone and the fire is out.');
  }

  return S;
}
