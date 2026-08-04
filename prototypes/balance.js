/*
 * Rebis — headless balance sweep
 *
 *     node prototypes/balance.js
 *
 * Runs the real simulation, not a copy of it, so the curve below is always
 * what the game actually does with the current tuning. A perfect player is
 * approximated as: pick a target heat, stoke whenever you drop a full stoke
 * below it, never overshoot.
 */
const C = require('./tuning.js');
const Sim = require('./sim.js');

const DT = 0.05;
const MAX_SECONDS = 900;

// Place the pit and the vessel `d` cells apart on the board.
function placeAt(S, d, C) {
  const n = C.grid.size;
  const pit = Math.floor(n / 2) * n + Math.floor(n / 2);
  S.board.pit = pit;
  S.board.cucurbit = pit + d;   // same row, d columns over
  return S;
}

// Hold local heat at `target` for a whole Work and report the outcome.
function run(target, d) {
  const S = placeAt(Sim.createWork(C), d, C);
  Sim.light(S, C);

  while (!S.over && S.elapsed < MAX_SECONDS) {
    // Aim the flame so the vessel settles on `target`.
    const flameWanted = target / C.transfer.falloff[d];
    if (S.heat <= flameWanted - C.fire.stokeHeat) Sim.stoke(S, C);
    else if (!S.lit && Sim.canLight(S, C)) Sim.light(S, C);
    Sim.tick(S, C, DT);
  }

  return {
    target,
    distillate: S.distillate,
    vapor: S.vapor,
    materiaLeft: S.materia,
    seconds: S.elapsed,
    ending: S.over || 'ran out of patience',
  };
}

function sweep(d) {
  const max = C.fire.maxHeat * C.transfer.falloff[d];
  const rows = [];
  for (let t = 20; t <= max - 1; t += 1) rows.push(run(t, d));

  const best = rows.reduce((a, b) => (b.distillate > a.distillate ? b : a));
  const atLimit = rows.reduce((a, b) =>
    Math.abs(b.target - C.refining.pureLimit) < Math.abs(a.target - C.refining.pureLimit) ? b : a);

  console.log(`\n── vessel ${d} cell${d === 1 ? '' : 's'} from the pit ` +
              `(${(C.transfer.falloff[d] * 100) | 0}% of the flame, ` +
              `${C.transfer.lagSeconds[d]}s lag) ──`);
  console.log('  hold   distillate   vapour   materia left   secs   ending');
  for (const r of rows) {
    if (r.target % 5 !== 0) continue;
    const star = r === best ? ' ←' : '';
    console.log(
      `  ${String(r.target).padStart(4)}` +
      `${r.distillate.toFixed(1).padStart(13)}` +
      `${r.vapor.toFixed(1).padStart(9)}` +
      `${r.materiaLeft.toFixed(1).padStart(15)}` +
      `${r.seconds.toFixed(0).padStart(7)}   ` +
      r.ending.replace(/\..*$/, '') + star);
  }

  const gain = ((best.distillate / atLimit.distillate - 1) * 100);
  const side = best.target > C.refining.pureLimit ? 'above' : 'below';
  console.log(`\n  peak at ${best.target} → ${best.distillate.toFixed(1)} distillate`);
  console.log(`  the gauge's line is at ${C.refining.pureLimit}; the peak sits ${side} it, ` +
              `worth ${gain >= 0 ? '+' : ''}${gain.toFixed(1)}% over holding at the line`);
  return best;
}

console.log('Rebis — yield against the temperature you hold.');
const bests = [0, 1, 2].map(sweep);

console.log('\n── placement ──');
bests.forEach((b, d) => {
  const rel = ((b.distillate / bests[0].distillate - 1) * 100).toFixed(1);
  console.log(`  distance ${d}: best ${b.distillate.toFixed(1)} ` +
              `(hold ${b.target})  ${d === 0 ? 'baseline' : rel + '% vs sitting on the fire'}`);
});
console.log();
