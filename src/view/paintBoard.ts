import { distance } from '../sim/sim';
import type { Tuning, Work } from '../sim/types';

/** Board geometry, shared by the painter and the hit test. */
export const CELL = 62;
export const GAP = 4;
export const boardPx = (C: Tuning) => C.grid.size * CELL + (C.grid.size - 1) * GAP;

const cellOrigin = (i: number, C: Tuning) => ({
  x: (i % C.grid.size) * (CELL + GAP),
  y: ((i / C.grid.size) | 0) * (CELL + GAP),
});

/** Pixel → cell index, or -1 when the click landed in a gap. */
export function cellAt(px: number, py: number, C: Tuning): number {
  const span = CELL + GAP;
  const col = Math.floor(px / span);
  const row = Math.floor(py / span);
  if (col < 0 || row < 0 || col >= C.grid.size || row >= C.grid.size) return -1;
  if (px - col * span > CELL || py - row * span > CELL) return -1;
  return row * C.grid.size + col;
}

const COLORS = {
  cell: '#191412',
  line: '#3a2e26',
  ember: '224, 112, 58',
  dim: '#7a6a5c',
  reading: '#c9b89a',
  gold: '#d4a95a',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number,
                   w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function paintBoard(
  ctx: CanvasRenderingContext2D,
  S: Work,
  C: Tuning,
  hovered: number,
): void {
  const size = boardPx(C);
  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < C.grid.size * C.grid.size; i++) {
    const { x, y } = cellOrigin(i, C);
    const isPit = i === S.board.pit;
    const isCuc = i === S.board.cucurbit;

    ctx.fillStyle = COLORS.cell;
    roundRect(ctx, x + 0.5, y + 0.5, CELL - 1, CELL - 1, 3);
    ctx.fill();

    // Heat reads as glow on the piece's own cell rather than as a gauge.
    const heat = isPit ? S.heat : isCuc ? S.local : 0;
    if (heat > 0.5) {
      const alpha = (heat / C.fire.maxHeat) * 0.85;
      const g = ctx.createRadialGradient(x + CELL / 2, y + CELL / 2, 0,
                                         x + CELL / 2, y + CELL / 2, CELL * 0.6);
      g.addColorStop(0, `rgba(${COLORS.ember},${alpha.toFixed(3)})`);
      g.addColorStop(1, `rgba(${COLORS.ember},0)`);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Border. The vessel reddens as it strains, so a crack is telegraphed.
    let border = COLORS.line;
    if (isCuc && S.strain > 0.02) {
      const t = Math.min(1, S.strain / C.vessel.crackAt);
      border = `rgba(192,57,43,${(0.3 + t * 0.7).toFixed(2)})`;
    } else if (i === hovered && !S.lit && !S.over) {
      border = COLORS.gold;
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, CELL - 1, CELL - 1, 3);
    ctx.stroke();

    if (!isPit && !isCuc) continue;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const emoji = (px: number) =>
      `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;

    if (isPit && isCuc) {
      // Both in one cell: the vessel sits on the fire. Stacked, so the
      // arrangement reads as what it is.
      ctx.font = emoji(18);
      ctx.fillText('⚗️', x + CELL / 2, y + 20);
      ctx.fillText('🔥', x + CELL / 2, y + 37);
    } else {
      ctx.font = emoji(26);
      ctx.fillText(isPit ? '🔥' : '⚗️', x + CELL / 2, y + CELL / 2 - 3);
    }

    if (heat > 0.5) {
      // Sits over the glow, so it needs a dark backing to stay readable.
      ctx.font = '10px Georgia, serif';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(10,7,6,.85)';
      ctx.strokeText(heat.toFixed(0), x + CELL / 2, y + CELL - 2);
      ctx.fillStyle = COLORS.reading;
      ctx.fillText(heat.toFixed(0), x + CELL / 2, y + CELL - 2);
    }
  }
}

/** Where the flame has to sit for the vessel to reach `level`. -1 if it can't. */
export function flameNeededFor(level: number, S: Work, C: Tuning): number {
  if (S.board.pit < 0 || S.board.cucurbit < 0) return -1;
  const d = distance(S.board.cucurbit, S.board.pit, C);
  const falloff = C.transfer.falloff[d] ?? 0;
  if (falloff <= 0) return -1;
  const needed = level / falloff;
  return needed <= C.fire.maxHeat ? needed : -1;
}
