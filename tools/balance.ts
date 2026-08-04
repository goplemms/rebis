import { TUNING } from '../src/sim/tuning';
import { createWork, tick, light, stoke, canLight, STEP } from '../src/sim/sim';
import type { Tuning, Work } from '../src/sim/types';

/*
 * Rebis — headless balance sweep
 *
 *     npm run balance
 *
 * Runs the real simulation at the real timestep, so the curve below is always
 * what the game actually does with the current tuning. A perfect player is
 * approximated as: pick a target heat, stoke whenever you drop a full stoke
 * below it, never overshoot.
 */

const MAX_SECONDS = 900;
const C: Tuning = TUNING;

/** Place the pit centrally and the vessel `d` cells along the same row. */
function placed(d: number): Work {
  const S = createWork(C);
  const mid = Math.floor(C.grid.size / 2);
  S.board.pit = mid * C.grid.size + mid;
  S.board.cucurbit = S.board.pit + d;
  return S;
}

interface Row {
  target: number;
  distillate: number;
  vapor: number;
  materiaLeft: number;
  seconds: number;
  ending: string;
}

/** Hold vessel heat at `target` for a whole Work. */
function run(target: number, d: number): Row {
  const S = placed(d);
  light(S, C);
  const flameWanted = target / (C.transfer.falloff[d] ?? 1);

  while (!S.over && S.elapsed < MAX_SECONDS) {
    if (S.heat <= flameWanted - C.fire.stokeHeat) stoke(S, C);
    else if (!S.lit && canLight(S, C)) light(S, C);
    tick(S, C, STEP);
  }

  return {
    target,
    distillate: S.distillate,
    vapor: S.vapor,
    materiaLeft: S.materia,
    seconds: S.elapsed,
    ending: S.over ?? 'ran out of patience',
  };
}

function sweep(d: number): Row {
  const falloff = C.transfer.falloff[d] ?? 0;
  const ceiling = C.fire.maxHeat * falloff;
  const rows: Row[] = [];
  for (let t = 20; t <= ceiling - 1; t++) rows.push(run(t, d));
  if (rows.length === 0) throw new Error(`distance ${d} can never be heated`);

  const best = rows.reduce((a, b) => (b.distillate > a.distillate ? b : a));
  const atLine = rows.reduce((a, b) =>
    Math.abs(b.target - C.refining.pureLimit) < Math.abs(a.target - C.refining.pureLimit) ? b : a);

  console.log(`\n── vessel ${d} cell${d === 1 ? '' : 's'} from the pit ` +
              `(${Math.round(falloff * 100)}% of the flame, ` +
              `${C.transfer.lagSeconds[d]}s lag) ──`);
  console.log('  hold   distillate   vapour   materia left   secs   ending');
  for (const r of rows) {
    if (r.target % 5 !== 0) continue;
    console.log(
      `  ${String(r.target).padStart(4)}` +
      `${r.distillate.toFixed(1).padStart(13)}` +
      `${r.vapor.toFixed(1).padStart(9)}` +
      `${r.materiaLeft.toFixed(1).padStart(15)}` +
      `${r.seconds.toFixed(0).padStart(7)}   ` +
      r.ending.replace(/\..*$/, '') + (r === best ? ' ←' : ''));
  }

  const gain = (best.distillate / atLine.distillate - 1) * 100;
  const side = best.target > C.refining.pureLimit ? 'above' : 'below';
  console.log(`\n  peak at ${best.target} → ${best.distillate.toFixed(1)} distillate`);
  console.log(`  the gauge's line is at ${C.refining.pureLimit}; the peak sits ${side} it, ` +
              `worth ${gain >= 0 ? '+' : ''}${gain.toFixed(1)}% over holding at the line`);
  return best;
}

console.log(`Rebis — yield against the temperature you hold. (step ${STEP}s)`);

const bests = [0, 1, 2].map(sweep);

console.log('\n── placement ──');
const baseline = bests[0]!.distillate;
bests.forEach((b, d) => {
  const rel = ((b.distillate / baseline - 1) * 100).toFixed(1);
  console.log(`  distance ${d}: best ${b.distillate.toFixed(1)} (hold ${b.target})  ` +
              (d === 0 ? 'baseline' : `${rel}% vs sitting on the fire`));
});
console.log();
