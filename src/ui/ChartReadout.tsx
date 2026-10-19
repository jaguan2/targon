import type { NatalChart } from '../domain/chart';
import { getBody } from '../domain/bodies';
import { formatLongitude, getSignByName } from '../domain/signs';
import type { BodyName } from '../domain/types';

interface Props {
  chart: NatalChart;
  title?: string;
}

const PRIMARY_POINTS: BodyName[] = ['sun', 'moon', 'ascendant', 'descendant', 'midheaven', 'imumCoeli'];

const POINT_CAPTIONS: Record<string, string> = {
  sun: 'Sun · Identity',
  moon: 'Moon · Inner life',
  ascendant: 'Rising',
  descendant: 'Setting · Descendant',
  midheaven: 'Midheaven',
  imumCoeli: 'Roots · Imum Coeli',
};

export function ChartReadout({ chart, title = 'Your signs & placements' }: Props) {
  const rows = [...chart.placements.values()];

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="panel__hint">
        {chart.tier === 'date' ? 'Reference moment (assumed noon): ' : 'Birth moment: '}
        {chart.utc.toUTCString()} · {chart.timeZone} · Tropical zodiac ·{' '}
        {chart.houses ? `${chart.houseSystem} houses` : 'houses need a birth time and place'}
      </p>

      {chart.warnings.map((warning) => (
        <p className="warning" key={warning}>
          {warning}
        </p>
      ))}

      <div className="big-three">
        {PRIMARY_POINTS.map((name) => {
          const placement = chart.placements.get(name);
          const body = getBody(name);
          return (
            <div className="big-three__card" key={name}>
              <div className="big-three__glyph">{body.glyph}</div>
              <div className="big-three__label">
                {POINT_CAPTIONS[name] ?? body.label}
              </div>
              <div className="big-three__value">
                {placement ? (
                  <>
                    {getSignByName(placement.sign).glyph}{' '}
                    {getSignByName(placement.sign).label}
                    {chart.tier === 'date' && <small className="placement-status">Estimated at noon</small>}
                  </>
                ) : (
                  <span style={{ color: 'var(--dim)', fontSize: '0.9rem' }}>
                    needs birth {chart.input.hour === undefined ? chart.input.latitude === undefined ? 'time and place' : 'time' : 'place'}
                  </span>
                )}
              </div>
              <p className="placement-meaning">Traditionally: {body.governs}.</p>
            </div>
          );
        })}
      </div>

      <div className="table-scroll">
        <table className="placements">
          <thead>
            <tr>
              <th colSpan={2}>Body</th>
              <th>Position{chart.tier === 'date' ? ' (estimated)' : ''}</th>
              <th>House</th>
              <th>Governs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((placement) => {
              const body = getBody(placement.body);
              const sign = getSignByName(placement.sign);
              return (
                <tr key={placement.body}>
                  <td className="glyph-cell">{body.glyph}</td>
                  <td>{body.label}</td>
                  <td>
                    {sign.glyph} {formatLongitude(placement.longitude)}
                    {placement.retrograde && (
                      <span className="retro" title="Retrograde">
                        ℞
                      </span>
                    )}
                  </td>
                  <td>{placement.house ?? '—'}</td>
                  <td style={{ color: 'var(--dim)' }}>{body.governs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
