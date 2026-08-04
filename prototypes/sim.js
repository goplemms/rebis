/*
 * Rebis — simulation
 *
 * Pure logic. No DOM, no timers, no tuning values. Every function takes the
 * tuning table as an argument, which is what lets balance.js sweep modified
 * copies of it through the exact code the game runs.
 */
(function (global) {
  'use strict';

  // Chebyshev distance, clamped to the length of the transfer tables.
  function distance(a, b, C) {
    const n = C.grid.size;
    const ax = a % n, ay = (a / n) | 0;
    const bx = b % n, by = (b / n) | 0;
    const d = Math.max(Math.abs(ax - bx), Math.abs(ay - by));
    return Math.min(d, C.transfer.falloff.length - 1);
  }

  function createWork(C) {
    return {
      board: { pit: -1, cucurbit: -1 },
      lit: false,
      heat: 0,          // the flame itself
      local: 0,         // heat actually reaching the vessel
      strain: 0,
      wood: C.stores.wood,
      materia: C.stores.materia,
      distillate: 0,
      vapor: 0,
      elapsed: 0,
      over: null,       // null while the Work is running, else why it ended
    };
  }

  function canLight(S, C) {
    return !S.lit && !S.over &&
           S.board.pit >= 0 && S.board.cucurbit >= 0 &&
           S.wood >= C.fire.lightCost;
  }

  function light(S, C) {
    if (!canLight(S, C)) return false;
    S.wood -= C.fire.lightCost;
    S.heat = C.fire.lightHeat;
    S.lit = true;
    return true;
  }

  function canStoke(S, C) {
    return S.lit && !S.over && S.wood >= C.fire.stokeWood;
  }

  function stoke(S, C) {
    if (!canStoke(S, C)) return false;
    S.wood -= C.fire.stokeWood;
    S.heat = Math.min(C.fire.maxHeat, S.heat + C.fire.stokeHeat);
    return true;
  }

  function end(S, why) {
    S.over = why;
    S.lit = false;
  }

  function tick(S, C, dt) {
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
    if (S.board.pit >= 0 && S.board.cucurbit >= 0) {
      const d = distance(S.board.cucurbit, S.board.pit, C);
      const target = S.heat * C.transfer.falloff[d];
      const lag = C.transfer.lagSeconds[d];
      S.local = lag <= 0 ? target
                         : S.local + (target - S.local) * (1 - Math.exp(-dt / lag));
    } else {
      S.local = 0;
    }

    // ── refining ──────────────────────────────────────────────
    // Throughput rises with heat; the share that condenses falls off past the
    // pure limit. Squared, so the loss is gentle just over the line and brutal
    // well past it — which is what makes the peak sit above the line.
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

  const Sim = { createWork, tick, light, stoke, canLight, canStoke, distance };

  if (typeof module !== 'undefined' && module.exports) module.exports = Sim;
  else global.Sim = Sim;

})(typeof globalThis !== 'undefined' ? globalThis : this);
