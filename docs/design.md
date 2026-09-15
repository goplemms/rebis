# Rebis — design

A living document. Sections marked **[open]** are unresolved; everything else is
a decision we can revise but shouldn't silently drift from.

---

## The shape

You are an alchemist pursuing the Great Work. You tend fires, distil materia,
and assemble the components for an Elixir of Life. Drinking one buys you another
lifetime — longer and more capable than the last — and a lifetime is the unit of
progression. Each elixir is a prestige tier.

Two things are true at once, and the design lives in the tension:

- **Moment to moment** it is tactile. You are tending a flame, holding a
  temperature just past the line where it starts costing you.
- **Across lifetimes** it is a workshop that grows — more equipment, longer
  component chains, eventually several workshops feeding each other.

The first must survive the second. See *The automation rule*.

---

## The core loop

A **Work** is one batch. Place a fire pit and a cucurbit, light it, tend the
heat, and convert a finite pile of wood into distillate.

Refining throughput rises with heat while purity falls off past the **pure
limit**, so peak yield sits deliberately *past* the line drawn on the gauge.
The player is always tempted hotter and always punished for greed. Past a second
threshold the vessel strains and eventually cracks.

This is the rebis in miniature — two opposed failure modes, one narrow band
between them — and everything else should be a variation on it rather than a
replacement for it.

Current numbers: peak at local heat 59 against a limit of 50, worth about +5.8%
over playing it safe. `npm run balance` prints the live curve.

---

## Progression

```
Work  →  a batch. minutes.
Life  →  many Works. ends when you drink an elixir.
Elixir → prestige. each one is more powerful than the last.
```

**Elixir tiers.** The four stages of the magnum opus are the bespoke ones, each
reframing something structural:

| Stage | Colour | What it changes |
|---|---|---|
| Nigredo | blackening | the base game — adjacency and heat |
| Albedo | whitening | separation; the two principles become independently controllable |
| Citrinitas | yellowing | **[open]** — the act that should reframe hardest |
| Rubedo | reddening | the rebis itself; endgame |

Past rubedo, elixirs scale generically — refining the same stone to higher
purity. This is the standard fix for "bespoke tiers don't scale, generic tiers
are boring": a handful of designed ones, then a track.

**Lifetimes and branching.** If an elixir buys a lifetime, time is the meta
currency and "what did you spend this life on" is the branching structure. This
is how we get non-linear routes (A→B→C and C→B→A equally valid) without
railroading: no life is a prerequisite for another, and gates ask for *how many*
Paths you have advanced, never *which*. **[open]** — whether lifetimes are
literally a time budget or just a narrative frame.

---

## The workshop

A grid. Equipment accumulates: pits, vessels, and eventually the modules that
produce intermediate components.

**Placement must arbitrate something.** With one fire and one vessel, distance
is pure loss — moving away costs heat and buys only thermal lag, which is
comfort rather than reward. No tuning value fixes this, because the geometry has
nothing to referee. Placement becomes a real decision the moment **two vessels
share one fire and want different temperatures**: then distance is the
instrument for drawing different heat out of a single flame.

This is the next thing to build, and the first genuine strategic decision in
the game.

**Component chains.** Modules produce components that feed the production of
later components, Factorio-style, climbing toward elixir ingredients.

> **The rule that protects the core:** every new component tier must introduce a
> new property of heat or a new failure mode. A tier that is only a bigger
> number with identical tending should not exist.

Without this, intermediate goods pull the player up into logistics and the
tactile layer dies — which is what happens to hand-crafting in Factorio. With
it, climbing the chain means meeting new tending problems.

---

## The automation rule

**Automation buys the safe play, never the optimal one.**

A bellows holds a steady temperature — the sub-line, zero-vapour result. Riding
the edge requires the player. Idle play should land around 95% of optimal;
active play beats it; neither is wrong.

This single principle does a lot of work:

- it is how the game is genuinely idle without ever being scripted (the thing
  disliked about Antimatter's automator)
- it makes attention a resource with a measurable exchange rate
- the gap between safe and optimal is one tunable number

Automation should also cost **space** — homunculi and mechanisms occupy cells —
so automating is a spatial tradeoff rather than a menu purchase.

---

## Multiple workshops

**[open in timing — this is late, probably Act III. Noted now so the design
leaves a seam for it, not so we build toward it.]**

Several workshops, each with its own layout, importing between them.

The mechanism that makes this more than bookkeeping: **workshops you are not
standing in run on automation only** — the safe play — while the one you are in
gets your attention and the better numbers. Imports are how unattended shops
feed the attended one.

That makes "which workshop deserves me right now?" a real decision, spatially
expressed, and identical in kind at three workshops or thirty. It is also the
main idle mechanism: the game keeps working while you are away, at safe
efficiency, exactly as the automation rule says it should.

**[open]** Why would a second workshop exist at all? Candidates: different
ambient conditions that change the physics (a cold mountain shop, a damp
cellar), different materia available, or simply parallelism. The first is the
most interesting because it makes each shop's layout genuinely different.

---

## Open questions

1. **Does tending survive to the late game, or get automated away?** Currently
   assumed: it survives, per the automation rule. This is the assumption most
   worth challenging, because everything else rests on it.
2. **What survives the end of a single Work?** Nothing does yet. Distillate is a
   score, not a currency.
3. **Citrinitas** — the act that should reframe hardest, and the least designed.
4. **Are lifetimes a literal time budget?**
5. **Why does a second workshop exist?**

---

## Decided, and worth not drifting from

- Peak yield sits past the visible line. The player learns to cross it.
- Two failure modes, not one — stagnation and destruction, never a single wall.
- Automation buys the floor, attention buys the ceiling.
- Every component tier earns its place with a new tending problem.
- No scripting, ever. Automation is placed equipment, not written logic.
