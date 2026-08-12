import { useMemo, useState } from 'react';
import type { NatalChart } from '../domain/chart';
import type { ChartSignCompatibility } from '../domain/compatibility';
import { getBody } from '../domain/bodies';
import { SIGNS, formatLongitude, getSignByName } from '../domain/signs';
import type { AspectQuality } from '../domain/types';
import {
  constellationLayout,
  edgeOpacity,
  edgeWidth,
  nodeRadius,
  pointOnWheel,
  wheelLayout,
  type NodeId,
} from './layout';
import { useTweenedNodes } from './useTweenedNodes';

type ViewMode = 'wheel' | 'constellation';

interface Props {
  chart: NatalChart;
  ranked: readonly ChartSignCompatibility[];
  /** Panel heading, personalised with the user's name when they gave one. */
  title?: string;
}

const RING_INNER = 320;
const RING_OUTER = 386;
const RING_GLYPH = 353;
const PLANET_RADIUS = 300;

const QUALITY_VAR: Record<AspectQuality, string> = {
  harmonious: 'var(--harmony)',
  challenging: 'var(--tension)',
  neutral: 'var(--gold)',
};

/** SVG arc path for one 30° zodiac sector of the outer ring. */
function sectorPath(startLongitude: number, rotation: number): string {
  const a = pointOnWheel(startLongitude, RING_INNER, rotation);
  const b = pointOnWheel(startLongitude + 30, RING_INNER, rotation);
  const c = pointOnWheel(startLongitude + 30, RING_OUTER, rotation);
  const d = pointOnWheel(startLongitude, RING_OUTER, rotation);
  // sweep-flag 0: longitude increases anticlockwise, matching pointOnWheel.
  return [
    `M ${a.x} ${a.y}`,
    `A ${RING_INNER} ${RING_INNER} 0 0 0 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${RING_OUTER} ${RING_OUTER} 0 0 1 ${d.x} ${d.y}`,
    'Z',
  ].join(' ');
}

export function StarChart({ chart, ranked, title = 'Your sky' }: Props) {
  const [mode, setMode] = useState<ViewMode>('wheel');
  const [selected, setSelected] = useState<NodeId | null>(null);

  /**
   * Real charts put the Ascendant at the 9 o'clock position. Without a birth
   * place there is no Ascendant, so we fall back to 0° Aries — the natural
   * zodiac orientation.
   */
  const rotation = chart.placements.get('ascendant')?.longitude ?? 0;

  const targetNodes = useMemo(
    () =>
      mode === 'wheel'
        ? wheelLayout(ranked, rotation)
        : constellationLayout(ranked),
    [mode, ranked, rotation],
  );

  const nodes = useTweenedNodes(targetNodes);
  const centre = nodes.find((n) => n.id === '__you__');
  const signNodes = nodes.filter((n) => n.id !== '__you__');

  const selectedEntry = ranked.find((r) => r.target.name === selected) ?? null;

  // Placements sit on the ring at their true longitude — this is the user's
  // actual chart, not a decoration.
  const placements = [...chart.placements.values()].filter(
    (p) => p.body !== 'ascendant' && p.body !== 'midheaven',
  );

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="panel__hint">
        {mode === 'wheel'
          ? 'The signs at their true positions, with your planets on the outer ring. Compatibility is carried by the brightness and weight of each thread.'
          : 'The same scores as distance: the more compatible a sign, the closer it is pulled.'}
      </p>

      <div className="mode-switch" role="group" aria-label="Chart view">
        <button
          type="button"
          aria-pressed={mode === 'wheel'}
          onClick={() => setMode('wheel')}
        >
          Zodiac wheel
        </button>
        <button
          type="button"
          aria-pressed={mode === 'constellation'}
          onClick={() => setMode('constellation')}
        >
          Constellation
        </button>
      </div>

      <svg
        className="star-chart"
        viewBox="-420 -420 840 840"
        role="img"
        aria-label={`Compatibility chart. Strongest match: ${ranked[0]?.target.label ?? 'none'}.`}
      >
        <defs>
          <filter id="node-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer zodiac ring — only meaningful when signs are at true positions. */}
        {mode === 'wheel' && (
          <g className="zodiac-ring">
            {SIGNS.map((sign) => {
              const glyphAt = pointOnWheel(
                sign.startDegree + 15,
                RING_GLYPH,
                rotation,
              );
              return (
                <g key={sign.name}>
                  <path
                    d={sectorPath(sign.startDegree, rotation)}
                    className={`ring-sector ring-sector--${sign.element}`}
                  />
                  <text
                    x={glyphAt.x}
                    y={glyphAt.y}
                    className="ring-glyph"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {sign.glyph}
                  </text>
                </g>
              );
            })}

            {/* The user's actual planetary positions, at their true degrees. */}
            {placements.map((placement) => {
              const at = pointOnWheel(
                placement.longitude,
                PLANET_RADIUS,
                rotation,
              );
              const tickInner = pointOnWheel(
                placement.longitude,
                RING_INNER - 8,
                rotation,
              );
              const body = getBody(placement.body);
              return (
                <g key={placement.body} className="natal-mark">
                  <line
                    x1={at.x}
                    y1={at.y}
                    x2={tickInner.x}
                    y2={tickInner.y}
                    className="natal-tick"
                  />
                  <text
                    x={at.x}
                    y={at.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="natal-glyph"
                  >
                    {/* Single expression: an SVG <title> may only contain one
                        text node, and React splits interpolated children into
                        several. */}
                    <title>{`${body.label} at ${formatLongitude(placement.longitude)}`}</title>
                    {body.glyph}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Threads from you to each sign. */}
        <g className="edges">
          {centre &&
            signNodes.map((node) => (
              <line
                key={node.id}
                x1={centre.x}
                y1={centre.y}
                x2={node.x}
                y2={node.y}
                stroke={QUALITY_VAR[node.quality]}
                strokeWidth={edgeWidth(node.score)}
                strokeOpacity={
                  selected === null || selected === node.id
                    ? edgeOpacity(node.score)
                    : edgeOpacity(node.score) * 0.25
                }
                strokeLinecap="round"
              />
            ))}
        </g>

        {/* Sign nodes. */}
        <g className="nodes">
          {signNodes.map((node) => {
            const isSelected = selected === node.id;
            const dimmed = selected !== null && !isSelected;
            return (
              <g
                key={node.id}
                className="star-node"
                transform={`translate(${node.x} ${node.y})`}
                opacity={dimmed ? 0.4 : 1}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, score ${node.score}${node.aspectLabel ? `, ${node.aspectLabel}` : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelected(isSelected ? null : node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelected(isSelected ? null : node.id);
                  }
                  if (event.key === 'Escape') setSelected(null);
                }}
              >
                <circle
                  r={nodeRadius(node.score)}
                  fill={QUALITY_VAR[node.quality]}
                  filter="url(#node-glow)"
                  opacity={0.9}
                />
                <text
                  className="node-glyph"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {node.glyph}
                </text>
                <text
                  className="node-label"
                  y={nodeRadius(node.score) + 18}
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* You. */}
        {centre && (
          <g
            className="star-node star-node--you"
            transform={`translate(${centre.x} ${centre.y})`}
          >
            <circle r={13} fill="var(--gold)" filter="url(#node-glow)" />
            <text
              className="node-label"
              y={30}
              textAnchor="middle"
              fill="var(--gold)"
            >
              You
            </text>
          </g>
        )}
      </svg>

      {selectedEntry ? (
        <div className="selection">
          <h3>
            {selectedEntry.target.glyph} {selectedEntry.target.label}
            <span className="selection__score">{selectedEntry.score}</span>
          </h3>
          <p className="rank-row__summary">{selectedEntry.summary}</p>
          <ul className="selection__factors">
            {selectedEntry.contributions.map((contribution) => (
              <li key={contribution.body}>
                <strong>
                  {contribution.bodyLabel} in{' '}
                  {getSignByName(contribution.sign).label}
                </strong>{' '}
                — {contribution.pairing.aspect.label.toLowerCase()} (
                {contribution.pairing.score})
                <p>{contribution.pairing.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="panel__hint" style={{ margin: 0, textAlign: 'center' }}>
          Select a sign to see why it sits where it does.
        </p>
      )}
    </section>
  );
}
