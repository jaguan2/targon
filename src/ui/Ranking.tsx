import { useMemo, useState } from 'react';
import type { NatalChart } from '../domain/chart';
import {
  MAX_SIGN_SCORE,
  MIN_SIGN_SCORE,
  MODE_LABELS,
  rankSignsForChart,
  type CompatibilityMode,
} from '../domain/compatibility';

interface Props {
  chart: NatalChart;
}

const MODES: CompatibilityMode[] = ['general', 'romantic', 'friendship'];

/**
 * Ranked compatibility against all twelve signs.
 *
 * The bar is scaled to the reachable score range rather than 0–100 — the
 * lowest possible pairing is 20, so anchoring at zero would leave a quarter of
 * every bar permanently filled and flatten the differences that matter.
 */
function barWidth(score: number): string {
  const span = MAX_SIGN_SCORE - MIN_SIGN_SCORE;
  const fraction = (score - MIN_SIGN_SCORE) / span;
  return `${Math.max(2, Math.round(fraction * 100))}%`;
}

export function Ranking({ chart }: Props) {
  const [mode, setMode] = useState<CompatibilityMode>('general');

  const ranked = useMemo(() => {
    try {
      return rankSignsForChart(chart, mode);
    } catch {
      // The chosen mode needs placements this chart does not have.
      return [];
    }
  }, [chart, mode]);

  const available = MODES.filter((m) => {
    try {
      rankSignsForChart(chart, m);
      return true;
    } catch {
      return false;
    }
  });

  return (
    <section className="panel">
      <h2>Compatibility</h2>
      <p className="panel__hint">
        How each sign sits relative to your chart, weighted across your
        placements.
      </p>

      <div className="mode-switch" role="group" aria-label="Compatibility lens">
        {available.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <ol className="ranking">
        {ranked.map((entry) => {
          const dominantAspect = entry.dominant?.pairing.aspect;
          const quality = dominantAspect?.quality ?? 'neutral';
          return (
            <li
              className={`rank-row quality-${quality}`}
              key={entry.target.name}
            >
              <div className="rank-row__head">
                <span className="rank-row__glyph">{entry.target.glyph}</span>
                <span className="rank-row__name">{entry.target.label}</span>
                <span className="rank-row__score">{entry.score}</span>
              </div>

              <div className="rank-row__bar">
                <span style={{ width: barWidth(entry.score) }} />
              </div>

              <p className="rank-row__summary">{entry.summary}</p>

              <ul className="rank-row__factors">
                {entry.contributions.map((c) => (
                  <li key={c.body}>
                    {c.bodyLabel} · {c.pairing.aspect.label} ·{' '}
                    {Math.round(c.weight * 100)}%
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      {ranked[0]?.missing.length ? (
        <p className="warning">
          Add a birth {chart.tier === 'date' ? 'time' : 'place'} to bring your{' '}
          {ranked[0].missing.join(' and ')} into the scoring.
        </p>
      ) : null}
    </section>
  );
}
