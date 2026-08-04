import { useEffect, useRef, useState } from 'react';
import { TUNING } from '../sim/tuning';
import { onFrame, place, getWork } from '../runtime/game';
import type { Tool } from '../runtime/game';
import { paintBoard, boardPx, cellAt, CELL, GAP } from './paintBoard';

/**
 * The board is one canvas. React mounts it and then stays out of the way —
 * every repaint comes from the frame loop, not from a render.
 */
export function Board({ tool }: { tool: Tool }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hovered = useRef(-1);
  const [size] = useState(() => boardPx(TUNING));

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    // Match the backing store to the display's pixel density once, then draw
    // in CSS pixels for the rest of the canvas's life.
    const dpr = window.devicePixelRatio || 1;
    el.width = size * dpr;
    el.height = size * dpr;
    ctx.scale(dpr, dpr);

    return onFrame(work => paintBoard(ctx, work, TUNING, hovered.current));
  }, [size]);

  const toLocal = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return cellAt(e.clientX - r.left, e.clientY - r.top, TUNING);
  };

  return (
    <canvas
      ref={canvas}
      className="board"
      style={{ width: size, height: size }}
      onMouseMove={e => { hovered.current = toLocal(e); }}
      onMouseLeave={() => { hovered.current = -1; }}
      onClick={e => {
        const i = toLocal(e);
        if (i >= 0) place(i, tool);
      }}
      aria-label={`Athanor board, ${TUNING.grid.size} by ${TUNING.grid.size}`}
    />
  );
}

/** Exported so the layout can reserve the right width without measuring. */
export const BOARD_METRICS = { CELL, GAP };

/** Text description of the board, for the hint line. */
export function placementSummary(): { placed: boolean } {
  const w = getWork();
  return { placed: w.board.pit >= 0 && w.board.cucurbit >= 0 };
}
