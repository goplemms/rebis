import { useEffect, useRef } from 'react';
import { TUNING } from '../sim/tuning';
import { onFrame, poke } from '../runtime/game';
import { flameNeededFor } from './paintBoard';

/**
 * The whole control, and the demonstration of the pattern: React renders this
 * once, and from then on the frame loop writes styles onto the refs directly.
 * No state, no re-renders, no reconciliation at 60fps.
 */
export function FlameBar() {
  const flame = useRef<HTMLDivElement>(null);
  const vessel = useRef<HTMLDivElement>(null);
  const pure = useRef<HTMLDivElement>(null);
  const strain = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLDivElement>(null);

  useEffect(() => onFrame(w => {
    const max = TUNING.fire.maxHeat;
    const pct = (v: number) => `${(v / max) * 100}%`;

    if (flame.current) flame.current.style.width = pct(w.heat);

    const placed = w.board.pit >= 0 && w.board.cucurbit >= 0;
    if (vessel.current) {
      vessel.current.style.left = pct(w.local);
      vessel.current.style.opacity = placed ? '1' : '0';
    }

    // Thresholds are in vessel-heat units, so they divide back through the
    // placement's falloff to land where the FLAME has to be. Move the vessel
    // and the ticks slide — that is the placement tradeoff, on one bar.
    for (const [ref, level] of [
      [pure, TUNING.refining.pureLimit],
      [strain, TUNING.vessel.strainAbove],
    ] as const) {
      const needed = flameNeededFor(level, w, TUNING);
      if (!ref.current) continue;
      ref.current.style.opacity = needed < 0 ? '0' : '1';
      if (needed >= 0) ref.current.style.left = pct(needed);
    }

    if (cap.current) {
      const text = !placed || w.over ? '' : w.lit ? 'Stoke' : 'Light the fire';
      if (cap.current.textContent !== text) cap.current.textContent = text;
      cap.current.style.color = w.lit ? 'var(--parchment)' : 'var(--gold)';
    }
  }), []);

  return (
    <div
      className="bar"
      onMouseDown={poke}
      role="button"
      tabIndex={0}
      aria-label="Stoke the flame"
      onKeyDown={e => { if (e.key === 'Enter') poke(); }}
    >
      <div className="flame" ref={flame} />
      <div className="tick pure" ref={pure} />
      <div className="tick strain" ref={strain} />
      <div className="vessel" ref={vessel} />
      <div className="cap" ref={cap} />
    </div>
  );
}
