/*
 * Rebis — tuning
 *
 * Every number the game balances on lives here and nowhere else. Edit, reload
 * the page, play. To see what a change did to the yield curve without playing:
 *
 *     node prototypes/balance.js
 *
 * Data only — no logic. Kept as .js rather than .json so the page can load it
 * straight off disk without a web server, and so numbers can carry comments.
 */
const TUNING = {

  grid: {
    size: 5,
  },

  // What you get at the start of a Work. Wood is the binding constraint:
  // at the optimum you run out of it with materia still in the vessel.
  stores: {
    wood: 50,
    materia: 100,
  },

  fire: {
    lightCost: 2,        // wood spent lighting it
    lightHeat: 20,       // heat it starts at
    stokeHeat: 8,        // heat gained per stoke
    stokeWood: 1,        // wood spent per stoke
    upkeepWood: 0.30,    // wood/sec just to stay lit
    decayPerSec: 0.06,   // heat lost per sec, as a FRACTION of current heat,
                         // so hot fires cost more to hold than cool ones
    maxHeat: 100,
  },

  // How the flame reaches the vessel. Index = Chebyshev distance from the pit,
  // so index 0 is the vessel sitting directly on the fire.
  //
  // falloff caps how much heat arrives; lag smooths how fast it gets there.
  // Together these are the placement decision: on the fire is responsive and
  // high-ceilinged but twitchy, further out is gentle but capped.
  transfer: {
    falloff:    [1.00, 0.85, 0.60, 0.30, 0.10],
    lagSeconds: [0,    3,    8,    14,   20  ],
  },

  // Throughput climbs with heat while purity falls off past pureLimit, which
  // is what puts peak yield DELIBERATELY past the line drawn on the gauge.
  // Currently peaks around local heat 60 against a limit of 50.
  refining: {
    ratePerHeat: 0.02,   // materia consumed per sec, per point of local heat
    pureLimit: 50,       // below this, everything condenses
    vaporWidth: 40,      // how fast vapour takes over past the limit (squared)
  },

  // The wall past the greed zone. At local heat 90 this cracks in ~10s.
  vessel: {
    strainAbove: 85,     // local heat at which strain starts accruing
    strainPerSec: 2.0,   // per point of excess heat
    reliefPerSec: 6.0,   // strain shed per sec when below the threshold
    crackAt: 100,
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = TUNING;
