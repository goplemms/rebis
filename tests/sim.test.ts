import { describe, it, expect } from 'vitest';
import { TUNING } from '../src/sim/tuning';
import {
  createWork, tick, light, stoke, distance, isPlaced, STEP,
} from '../src/sim/sim';
import type { Work } from '../src/sim/types';

const C = TUNING;

function placed(d = 0): Work {
  const S = createWork(C);
  const mid = Math.floor(C.grid.size / 2);
  S.board.pit = mid * C.grid.size + mid;
  S.board.cucurbit = S.board.pit + d;
  return S;
}

/** Run a whole Work holding the vessel at `target`, as balance.ts does. */
function hold(target: number, d = 0): Work {
  const S = placed(d);
  light(S, C);
  const flameWanted = target / (C.transfer.falloff[d] ?? 1);
  while (!S.over && S.elapsed < 900) {
    if (S.heat <= flameWanted - C.fire.stokeHeat) stoke(S, C);
    tick(S, C, STEP);
  }
  return S;
}

describe('geometry', () => {
  it('measures Chebyshev distance', () => {
    expect(distance(0, 0, C)).toBe(0);
    expect(distance(0, 1, C)).toBe(1);
    expect(distance(0, C.grid.size + 1, C)).toBe(1);   // diagonal
    expect(distance(0, 2, C)).toBe(2);
  });

  it('clamps beyond the transfer table', () => {
    expect(distance(0, C.grid.size - 1, C))
      .toBeLessThanOrEqual(C.transfer.falloff.length - 1);
  });
});

describe('rules', () => {
  it('will not light without both pieces placed', () => {
    const S = createWork(C);
    expect(isPlaced(S)).toBe(false);
    expect(light(S, C)).toBe(false);
    S.board.pit = 0;
    expect(light(S, C)).toBe(false);
  });

  it('spends wood to light and to stoke', () => {
    const S = placed();
    light(S, C);
    expect(S.wood).toBe(C.stores.wood - C.fire.lightCost);
    stoke(S, C);
    expect(S.wood).toBe(C.stores.wood - C.fire.lightCost - C.fire.stokeWood);
  });

  it('lets an untended fire die without ending the Work', () => {
    // Letting it go out is a choice, not a loss: with wood still in hand the
    // player can always relight, so `over` stays null indefinitely.
    const S = placed();
    light(S, C);
    for (let i = 0; i < 20_000 && S.lit; i++) tick(S, C, STEP);   // never stoked
    expect(S.lit).toBe(false);
    expect(S.over).toBeNull();
    expect(S.wood).toBeGreaterThan(C.fire.lightCost);
    expect(light(S, C)).toBe(true);
  });

  it('ends the Work once the wood is spent and the fire is out', () => {
    const S = placed();
    light(S, C);
    while (!S.over && S.elapsed < 900) {
      stoke(S, C);                          // burn it down as fast as possible
      tick(S, C, STEP);
    }
    expect(S.over).not.toBeNull();
  });

  it('condenses everything below the pure limit', () => {
    const S = hold(C.refining.pureLimit - 5);
    expect(S.vapor).toBe(0);
    expect(S.distillate).toBeGreaterThan(0);
  });

  it('cracks the vessel when held far past the strain threshold', () => {
    const S = hold(C.fire.maxHeat - 2);
    expect(S.over).toMatch(/cracked/);
  });
});

describe('balance', () => {
  // Golden values. These are allowed to change — but only on purpose. If a
  // tuning edit moves them, update the numbers here in the same commit so the
  // diff records what the change did to the curve.
  it('peaks above the pure limit, on the fire', () => {
    const line = hold(C.refining.pureLimit).distillate;
    const peak = hold(59).distillate;
    expect(peak).toBeGreaterThan(line);
    expect(peak).toBeCloseTo(67.7, 1);
    expect(line).toBeCloseTo(64.0, 1);
  });

  it('still favours sitting on the fire', () => {
    // If this ever flips, the placement decision has started paying for
    // itself and the design question in the notes is answered.
    expect(hold(58, 1).distillate).toBeLessThan(hold(59, 0).distillate);
  });

  it('is deterministic', () => {
    expect(hold(59).distillate).toBe(hold(59).distillate);
  });
});
