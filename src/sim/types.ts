/** The board. Cells are indexed row-major; -1 means "not placed". */
export interface Board {
  pit: number;
  cucurbit: number;
}

/**
 * One Work, start to finish. Everything here must stay JSON-serializable —
 * no class instances, no Maps, no functions — so a save is `JSON.stringify`
 * and a migration is a plain object transform.
 */
export interface Work {
  board: Board;
  lit: boolean;
  /** The flame itself. */
  heat: number;
  /** Heat actually reaching the vessel, after falloff and lag. */
  local: number;
  strain: number;
  wood: number;
  materia: number;
  distillate: number;
  vapor: number;
  elapsed: number;
  /** null while running, otherwise why it ended. */
  over: string | null;
}

export interface Tuning {
  grid: { size: number };
  stores: { wood: number; materia: number };
  fire: {
    lightCost: number;
    lightHeat: number;
    stokeHeat: number;
    stokeWood: number;
    upkeepWood: number;
    decayPerSec: number;
    maxHeat: number;
  };
  transfer: {
    /** Index = Chebyshev distance from the pit. */
    falloff: number[];
    lagSeconds: number[];
  };
  refining: {
    ratePerHeat: number;
    pureLimit: number;
    vaporWidth: number;
  };
  vessel: {
    strainAbove: number;
    strainPerSec: number;
    reliefPerSec: number;
    crackAt: number;
  };
}
