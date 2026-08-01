import type { NatalChart } from '../domain/chart';
import { getBody } from '../domain/bodies';
import { formatLongitude, getSignByName } from '../domain/signs';
import type { BodyName } from '../domain/types';

interface Props {
  chart: NatalChart;
}

const BIG_THREE: BodyName[] = ['sun', 'moon', 'ascendant'];

const BIG_THREE_CAPTIONS: Record<string, string> = {
  sun: 'Identity',
  moon: 'Inner life',
  ascendant: 'Rising',
};

export function ChartReadout({ chart }: Props) {
  const rows = [...chart.placements.values()];

  return (
    <section className="panel">
      <h2>Your chart</h2>
      <p className="panel__hint">
        {chart.utc.toUTCString()} · {chart.timeZone} ·{' '}
        {chart.houses ? `${chart.houseSystem} houses` : 'no houses (birth place not given)'}
      </p>

      {chart.warnings.map((warning) => (
        <p className="warning" key={warning}>
          {warning}
        </p>
      ))}

      <div className="big-three">
        {BIG_THREE.map((name) => {
          const placement = chart.placements.get(name);
          const body = getBody(name);
          return (
            <div className="big-three__card" key={name}>
              <div className="big-three__glyph">{body.glyph}</div>
              <div className="big-three__label">
                {BIG_THREE_CAPTIONS[name] ?? body.label}
              </div>
              <div className="big-three__value">
                {placement ? (
                  <>
                    {getSignByName(placement.sign).glyph}{' '}
                    {getSignByName(placement.sign).label}
                  </>
                ) : (
                  <span style={{ color: 'var(--dim)', fontSize: '0.9rem' }}>
                    needs birth {name === 'moon' ? 'time' : 'place'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="table-scroll">
        <table className="placements">
          <thead>
            <tr>
              <th colSpan={2}>Body</th>
              <th>Position</th>
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
