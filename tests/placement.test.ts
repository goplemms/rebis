import { describe, it, expect, beforeEach } from 'vitest';
import { TUNING } from '../src/sim/tuning';
import { distance } from '../src/sim/sim';
import { place, poke, newWork, getWork } from '../src/runtime/game';

const mid = Math.floor(TUNING.grid.size / 2) * TUNING.grid.size
          + Math.floor(TUNING.grid.size / 2);

describe('placement', () => {
  beforeEach(newWork);

  it('lets the vessel share a cell with the pit', () => {
    // Distance 0 is the placement the balance curve is built around. A board
    // model that allowed one piece per cell made it unreachable in play.
    place(mid, 'pit');
    place(mid, 'cucurbit');
    const b = getWork().board;
    expect(b.pit).toBe(mid);
    expect(b.cucurbit).toBe(mid);
    expect(distance(b.cucurbit, b.pit, TUNING)).toBe(0);
  });

  it('moves a piece without disturbing the other', () => {
    place(mid, 'pit');
    place(mid, 'cucurbit');
    place(mid + 1, 'cucurbit');
    expect(getWork().board.pit).toBe(mid);
    expect(getWork().board.cucurbit).toBe(mid + 1);
  });

  it('clears both when they share a cell', () => {
    place(mid, 'pit');
    place(mid, 'cucurbit');
    place(mid, 'clear');
    expect(getWork().board).toEqual({ pit: -1, cucurbit: -1 });
  });

  it('refuses to rearrange once the fire is lit', () => {
    place(mid, 'pit');
    place(mid, 'cucurbit');
    poke();                             // lights it
    expect(getWork().lit).toBe(true);
    place(0, 'pit');
    expect(getWork().board.pit).toBe(mid);
  });

  it('will not light until both pieces are down', () => {
    place(mid, 'pit');
    poke();
    expect(getWork().lit).toBe(false);
  });
});
