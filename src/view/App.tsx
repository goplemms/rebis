import { useState, useSyncExternalStore } from 'react';
import { TUNING } from '../sim/tuning';
import { distance, isPlaced, falloffAt, lagAt } from '../sim/sim';
import { getWork, getStructureVersion, onStructure, newWork } from '../runtime/game';
import type { Tool } from '../runtime/game';
import { Board } from './Board';
import { FlameBar } from './FlameBar';

const TOOLS: ReadonlyArray<{ id: Tool; label: string }> = [
  { id: 'pit', label: 'Fire pit' },
  { id: 'cucurbit', label: 'Cucurbit' },
  { id: 'clear', label: 'Clear' },
];

/** One line under the board. Only ever changes on a structural change. */
function hint(): string {
  const w = getWork();
  if (w.over) return w.over;
  if (!isPlaced(w)) return 'Place a fire pit and a cucurbit.';
  if (!w.lit) {
    const d = distance(w.board.cucurbit, w.board.pit, TUNING);
    return `Distance ${d} — the vessel sees ${Math.round(falloffAt(d, TUNING) * 100)}% ` +
           `of the flame, smoothed over ${lagAt(d, TUNING)}s.`;
  }
  return 'Click the bar or press space.';
}

export function App() {
  const [tool, setTool] = useState<Tool>('pit');

  // Re-renders only when the game's *shape* changes — a piece placed, the
  // fire lit, the Work ending. Never on a tick.
  useSyncExternalStore(onStructure, getStructureVersion, getStructureVersion);
  const over = getWork().over;

  return (
    <div className="wrap">
      <h1>Athanor</h1>

      <div className="tools">
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={tool === t.id ? 'sel' : ''}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Board tool={tool} />
      <FlameBar />

      <div className="foot">
        <span className={over ? 'over' : 'em'}>{hint()}</span>
        <button className="reset" onClick={newWork}>new work</button>
      </div>
    </div>
  );
}
