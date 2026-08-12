import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

import type { ChartSignCompatibility } from '../domain/compatibility';
import { scoreFraction, scoreToDistance } from '../domain/compatibility';
import { normalizeDegrees } from '../domain/signs';
import type { AspectQuality, SignName } from '../domain/types';

/**
 * Layouts for the two views.
 *
 * Both produce a plain list of positions in the same coordinate space, so the
 * view can render one SVG and transition between them. Nothing here runs an
 * animation loop: the force simulation is ticked to convergence up front and
 * the resulting positions handed over as static data.
 */

export const VIEW_RADIUS = 300;

export type NodeId = SignName | '__you__';

export interface LayoutNode {
  id: NodeId;
  label: string;
  glyph: string;
  /** 0–100 compatibility. The centre node scores itself 100. */
  score: number;
  quality: AspectQuality;
  /** Aspect name, e.g. `Trine`. Empty for the centre node. */
  aspectLabel: string;
  x: number;
  y: number;
}

/**
 * Convert an ecliptic longitude to a point on the wheel.
 *
 * Follows the natal chart convention: the reference longitude sits at the 9
 * o'clock position and longitude increases anticlockwise (downward from the
 * left). SVG's y-axis points down, hence the subtraction.
 */
export function pointOnWheel(
  longitude: number,
  radius: number,
  rotation = 0,
): { x: number; y: number } {
  const theta = ((180 + normalizeDegrees(longitude - rotation)) * Math.PI) / 180;
  return {
    x: radius * Math.cos(theta),
    y: -radius * Math.sin(theta),
  };
}

/**
 * The canonical view: the twelve signs at their true 30° positions.
 *
 * Compatibility is *not* encoded as distance here — every sign sits on the
 * same circle, exactly where it really is. The score drives edge weight and
 * glow instead, which keeps the geometry honest.
 *
 * `rotation` places a chosen longitude at the 9 o'clock point. Passing the
 * Ascendant reproduces how a real chart is drawn.
 */
export function wheelLayout(
  ranked: readonly ChartSignCompatibility[],
  rotation = 0,
): LayoutNode[] {
  const nodes: LayoutNode[] = ranked.map((entry) => {
    // Sit each sign at its midpoint (15° in) rather than its cusp, so the
    // glyph lands in the middle of its sector.
    const midpoint = entry.target.startDegree + 15;
    const { x, y } = pointOnWheel(midpoint, VIEW_RADIUS, rotation);
    return {
      id: entry.target.name,
      label: entry.target.label,
      glyph: entry.target.glyph,
      score: entry.score,
      quality: entry.dominant?.pairing.aspect.quality ?? 'neutral',
      aspectLabel: entry.dominant?.pairing.aspect.label ?? '',
      x,
      y,
    };
  });

  nodes.push(centreNode());
  return nodes;
}

function centreNode(): LayoutNode {
  return {
    id: '__you__',
    label: 'You',
    glyph: '✦',
    score: 100,
    quality: 'neutral',
    aspectLabel: '',
    x: 0,
    y: 0,
  };
}

interface SimNode extends SimulationNodeDatum {
  id: NodeId;
  score: number;
}

/**
 * Constellation view: distance carries the compatibility.
 *
 * A radial-by-score layout would place every node at exactly the right
 * distance but look mechanical — a perfect circle of varying radii. Running
 * actual physics (link distance pulling, charge repelling) lets the nodes
 * settle into something irregular and constellation-like while still honouring
 * the distances.
 *
 * The simulation is ticked to convergence synchronously and thrown away.
 * d3-force seeds initial positions deterministically, so the same chart always
 * produces the same constellation.
 */
export function constellationLayout(
  ranked: readonly ChartSignCompatibility[],
): LayoutNode[] {
  const simNodes: SimNode[] = [
    { id: '__you__', score: 100, fx: 0, fy: 0 },
    ...ranked.map((entry) => ({
      id: entry.target.name as NodeId,
      score: entry.score,
    })),
  ];

  const byId = new Map(simNodes.map((n) => [n.id, n]));

  const links: SimulationLinkDatum<SimNode>[] = ranked.map((entry) => ({
    source: byId.get('__you__')!,
    target: byId.get(entry.target.name)!,
  }));

  const simulation = forceSimulation(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
        .distance((link) => {
          const target = link.target as SimNode;
          return scoreToDistance(target.score, { min: 110, max: 300 });
        })
        // Links are the dominant constraint: distance *is* the message here.
        .strength(0.9),
    )
    // Mild repulsion so nodes spread around the centre instead of stacking
    // along one radius.
    .force('charge', forceManyBody().strength(-140))
    // Keep labels from overlapping at the tightly-packed end.
    .force('collide', forceCollide(34))
    .stop();

  // Tick to convergence rather than animating. 400 passes is well past
  // settling for 13 nodes.
  simulation.tick(400);

  return simNodes.map((node) => {
    const entry = ranked.find((r) => r.target.name === node.id);
    if (!entry) return centreNode();
    return {
      id: node.id,
      label: entry.target.label,
      glyph: entry.target.glyph,
      score: entry.score,
      quality: entry.dominant?.pairing.aspect.quality ?? 'neutral',
      aspectLabel: entry.dominant?.pairing.aspect.label ?? '',
      x: node.x ?? 0,
      y: node.y ?? 0,
    };
  });
}

/** Node radius: better compatibility burns brighter and bigger. */
export function nodeRadius(score: number): number {
  return 9 + scoreFraction(score) * 9;
}

/** Edge opacity, floored so a weak link is still visible. */
export function edgeOpacity(score: number): number {
  return 0.15 + scoreFraction(score) * 0.6;
}

/** Edge thickness, carrying the same signal as opacity for redundancy. */
export function edgeWidth(score: number): number {
  return 0.75 + scoreFraction(score) * 2.5;
}
