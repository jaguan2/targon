import { useMemo, useState } from 'react';
import type { NatalChart } from '../domain/chart';
import { getBody } from '../domain/bodies';
import { MODE_LABELS, type CompatibilityMode } from '../domain/compatibility';
import { formatLongitude, signFromLongitude } from '../domain/signs';
import { compareCharts } from '../domain/synastry';

const MODES: CompatibilityMode[] = ['friendship', 'general', 'romantic'];

export function FriendComparison({ chart, friendChart, name }: { chart: NatalChart; friendChart: NatalChart; name: string }) {
  const [mode, setMode] = useState<CompatibilityMode>('friendship');
  const result = useMemo(() => compareCharts(chart, friendChart, mode), [chart, friendChart, mode]);
  const estimated = result.method === 'estimated-signs';
  return (
    <section className="panel friend-comparison" aria-label={`Your connection with ${name}`}>
      <p className="step-count">Your connection</p>
      <div className="connection-heading">
        <div>
          <h2>You &amp; {name}</h2>
          <p className="panel__hint">{estimated ? 'Provisional sign comparison' : 'Selected aspects between both birth charts'}</p>
        </div>
        <p className="connection-score" aria-label={`Compatibility index ${result.score ?? 'unavailable'} out of 100`}>
          {result.score ?? '—'}<small>/ 100 · model index</small>
        </p>
      </div>
      <div className="mode-switch" role="group" aria-label="Friend comparison lens">
        {MODES.map((item) => <button type="button" key={item} aria-pressed={mode === item} onClick={() => setMode(item)}>{MODE_LABELS[item]}</button>)}
      </div>
      <p className="field-help" role="status">{MODE_LABELS[mode]} · {result.contributions.length} placement pairs · {estimated ? 'estimated signs' : 'degree-based aspects'}</p>
      {estimated && <p className="warning">One or both birth times are unknown. This comparison uses signs estimated at noon, including the Moon. Signs near a boundary and this index may change when a birth time is added.</p>}
      {result.missing.length > 0 && <p className="field-help">Some Rising-dependent pairs are unavailable without both a birth time and place. The available pairs are reweighted.</p>}
      {result.score === null ? <p className="warning">There are no shared placements available for this comparison.</p> : (
        <ul className="interaspect-list">
          {result.contributions.map((entry) => {
            const quality = entry.signPair?.quality ?? entry.hit?.aspect.quality ?? 'neutral';
            const aspect = entry.signPair?.aspect ?? entry.hit?.aspect;
            return (
              <li key={`${entry.a}-${entry.b}`} className={`interaspect interaspect--${quality}`}>
                <div className="interaspect__pair">
                  <span>Your {getBody(entry.a).label}<small>{estimated ? signFromLongitude(entry.longitudeA).label : formatLongitude(entry.longitudeA)}</small></span>
                  <span aria-hidden="true">↔</span>
                  <span>{name} · {getBody(entry.b).label}<small>{estimated ? signFromLongitude(entry.longitudeB).label : formatLongitude(entry.longitudeB)}</small></span>
                </div>
                <div className="interaspect__reading">
                  <strong>{aspect?.label ?? 'No close aspect'}</strong>
                  <span>{estimated
                    ? entry.signPair?.summary
                    : entry.hit
                      ? `${entry.hit.separation.toFixed(1)}° apart · ${entry.hit.orb.toFixed(1)}° from exact · ${quality} in this model`
                      : 'Outside the model’s aspect orbs; contributes a neutral value of 50.'}</span>
                  <small>{Math.round(entry.weight * 100)}% of this lens · pair value {entry.score.toFixed(1)}</small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <details className="comparison-method">
        <summary>How this index works</summary>
        <p>We compare selected Sun, Moon, Mercury, Venus, Mars and Rising placements across both charts. Friendship emphasizes communication; Romantic emphasizes Venus–Mars and emotional connections; Overall blends identity, emotions and connection.</p>
        <p>With known times, the actual degrees determine whether a pair is within an aspect’s allowed orb. Its influence fades toward neutral as the aspect becomes less exact. Without a time, the entire comparison uses estimated signs instead, so the two methods are not directly interchangeable.</p>
        <p>Cross-placement pairs are checked in both directions. Missing pairs are omitted and the remaining weights are normalized. This is a custom interpretive index, not a probability, a verdict about your friendship, or a complete synastry report.</p>
      </details>
    </section>
  );
}
