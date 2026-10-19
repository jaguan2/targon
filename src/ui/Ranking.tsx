import type { NatalChart } from '../domain/chart';
import {
  scoreFraction,
  type ChartSignCompatibility,
} from '../domain/compatibility';

interface Props {
  chart: NatalChart;
  ranked: readonly ChartSignCompatibility[];
}

/** Floored at 2% so the weakest pairing still shows a sliver of bar. */
function barWidth(score: number): string {
  return `${Math.max(2, Math.round(scoreFraction(score) * 100))}%`;
}

export function Ranking({
  chart,
  ranked,
}: Props) {
  return (
    <section className="panel ranking-panel">
      <h2>All twelve signs</h2>
      <p className="panel__hint">
        How each sign sits relative to your chart, weighted across your
        placements.
      </p>

      <ol className="ranking">
        {ranked.map((entry) => {
          const quality = entry.dominant?.pairing.aspect.quality ?? 'neutral';
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
                {entry.contributions.map((contribution) => (
                  <li key={contribution.body}>
                    {contribution.bodyLabel} ·{' '}
                    {contribution.pairing.aspect.label} ·{' '}
                    {Math.round(contribution.weight * 100)}%
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      {ranked[0]?.missing.length ? (
        <p className="warning">
          Add a birth {chart.tier === 'date' ? chart.input.latitude === undefined ? 'time and place' : 'time' : 'place'} in Profile to bring your{' '}
          {ranked[0].missing.join(' and ')} into the scoring.
        </p>
      ) : null}
    </section>
  );
}
