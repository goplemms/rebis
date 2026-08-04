# Rebis

An incremental game about the alchemical Great Work. Currently one step:
**the Athanor** — place a fire pit and a cucurbit, tend the flame, and turn a
finite pile of wood into as much distillate as you can.

```
npm install
npm run dev        # play it
npm run balance    # what the tuning does to the yield curve, headless
npm test           # sim rules + golden balance values
```

## Layout

```
src/sim/       pure simulation — no DOM, no timers, no React
src/runtime/   the one mutable Work, and the fixed-timestep loop
src/view/      React chrome + the canvas board
tools/         headless sweeps
prototypes/    the original single-file version, kept for reference
```

### The rules that keep this workable

**`src/sim/` imports from nothing else.** Not `view`, not `runtime`. Every
function takes the tuning table as an argument rather than importing it, so
`tools/balance.ts` can sweep modified copies of the numbers through the exact
code the game runs. A tuning change cannot be true in the page and false in
the balance report.

**The simulation never lives in React state.** It is a plain mutable object
advanced by a loop React knows nothing about. React renders *structure* — what
is unlocked, which pieces exist, whether the Work has ended. The loop writes
*numbers*, straight onto refs and the canvas. See `FlameBar.tsx` for the
pattern; it renders once and never again.

**The sim advances in fixed steps** (`STEP`, 20Hz), never in whatever time a
frame happened to take. Results must not depend on the player's refresh rate,
and offline catch-up has to reproduce live play exactly.

**All balance numbers live in `src/sim/tuning.ts`** and nowhere else.

## When the time comes

Three things are cheap now and painful later, so do them before they are
needed rather than after:

- **Save versioning.** `{ v: 1, ... }` plus a migration chain from the first
  save that ever exists. Work state is already JSON-serializable by
  construction — keep it that way: no class instances, no `Map`s, no functions.
- **Currency arithmetic behind helpers**, so swapping in `break_infinity.js`
  when numbers pass `2^53` is a one-file change.
- **A seeded RNG in the save file** the moment randomness enters, or offline
  progress will diverge from live play.

## Open design question

Placement does not yet pay for itself. Sitting the vessel directly on the fire
is simply the best play — distance 1 costs about 15% of yield, distance 2 about
44%, and all the further placements buy is thermal lag, which is comfort rather
than reward. Either lag needs to be worth something concrete, or distance needs
an upside of its own. `npm run balance` prints the current spread.
