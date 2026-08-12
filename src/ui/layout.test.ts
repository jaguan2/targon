import { describe, expect, it } from 'vitest';
import {
  VIEW_RADIUS,
  constellationLayout,
  edgeOpacity,
  edgeWidth,
  nodeRadius,
  pointOnWheel,
  wheelLayout,
} from './layout';
import { computeChart } from '../domain/chart';
import {
  MAX_SIGN_SCORE,
  MIN_SIGN_SCORE,
  rankSignsForChart,
  scoreFraction,
} from '../domain/compatibility';

const chart = computeChart({
  year: 1990,
  month: 7,
  day: 4,
  hour: 14,
  minute: 30,
  latitude: 40.7128,
  longitude: -74.006,
});

const ranked = rankSignsForChart(chart, 'general');

describe('pointOnWheel', () => {
  /**
   * Natal charts are drawn with the reference longitude at 9 o'clock and
   * longitude increasing anticlockwise — which, with SVG's downward y-axis,
   * means the first quadrant of the zodiac renders *below* the centre.
   */
  it('puts 0° at the 9 o’clock position', () => {
    const point = pointOnWheel(0, 100);
    expect(point.x).toBeCloseTo(-100, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });

  it('runs anticlockwise: 90° lands at the bottom', () => {
    const point = pointOnWheel(90, 100);
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(100, 6);
  });

  it('puts 180° opposite 0°', () => {
    const point = pointOnWheel(180, 100);
    expect(point.x).toBeCloseTo(100, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });

  it('keeps every point on the given radius', () => {
    for (let longitude = 0; longitude < 360; longitude += 17) {
      const { x, y } = pointOnWheel(longitude, 250);
      expect(Math.hypot(x, y)).toBeCloseTo(250, 6);
    }
  });

  it('rotates the reference longitude to 9 o’clock', () => {
    // With rotation = 120, longitude 120 should sit where 0 normally does.
    const point = pointOnWheel(120, 100, 120);
    expect(point.x).toBeCloseTo(-100, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });

  it('wraps longitudes outside 0–360', () => {
    const a = pointOnWheel(370, 100);
    const b = pointOnWheel(10, 100);
    expect(a.x).toBeCloseTo(b.x, 9);
    expect(a.y).toBeCloseTo(b.y, 9);
  });
});

describe('wheelLayout', () => {
  const nodes = wheelLayout(ranked);

  it('returns the twelve signs plus the centre', () => {
    expect(nodes).toHaveLength(13);
    expect(nodes.filter((n) => n.id === '__you__')).toHaveLength(1);
  });

  it('places every sign on the same radius — distance carries no meaning here', () => {
    for (const node of nodes) {
      if (node.id === '__you__') continue;
      expect(Math.hypot(node.x, node.y)).toBeCloseTo(VIEW_RADIUS, 6);
    }
  });

  it('spaces the signs exactly 30° apart', () => {
    const angles = nodes
      .filter((n) => n.id !== '__you__')
      .map((n) => (Math.atan2(-n.y, n.x) * 180) / Math.PI)
      .map((a) => (a + 360) % 360)
      .sort((a, b) => a - b);

    for (let i = 1; i < angles.length; i += 1) {
      expect(angles[i]! - angles[i - 1]!).toBeCloseTo(30, 6);
    }
  });

  it('anchors the centre node at the origin', () => {
    const centre = nodes.find((n) => n.id === '__you__')!;
    expect(centre.x).toBe(0);
    expect(centre.y).toBe(0);
  });

  it('is unaffected by score — only the true positions matter', () => {
    const reversed = wheelLayout([...ranked].reverse());
    for (const node of nodes) {
      if (node.id === '__you__') continue;
      const match = reversed.find((n) => n.id === node.id)!;
      expect(match.x).toBeCloseTo(node.x, 9);
      expect(match.y).toBeCloseTo(node.y, 9);
    }
  });
});

describe('constellationLayout', () => {
  const nodes = constellationLayout(ranked);

  it('returns the twelve signs plus the centre', () => {
    expect(nodes).toHaveLength(13);
  });

  it('pins the centre node at the origin', () => {
    const centre = nodes.find((n) => n.id === '__you__')!;
    expect(centre.x).toBeCloseTo(0, 6);
    expect(centre.y).toBeCloseTo(0, 6);
  });

  /**
   * The whole premise of this view: a better score must end up closer. The
   * simulation is a physical approximation rather than an exact solve, so this
   * checks the overall ordering holds rather than exact radii.
   */
  it('pulls better-scoring signs closer to the centre', () => {
    const signs = nodes
      .filter((n) => n.id !== '__you__')
      .map((n) => ({ score: n.score, distance: Math.hypot(n.x, n.y) }));

    const best = signs.reduce((a, b) => (a.score > b.score ? a : b));
    const worst = signs.reduce((a, b) => (a.score < b.score ? a : b));

    expect(best.distance).toBeLessThan(worst.distance);
  });

  it('correlates distance with score across every pair', () => {
    const signs = nodes
      .filter((n) => n.id !== '__you__')
      .map((n) => ({ score: n.score, distance: Math.hypot(n.x, n.y) }));

    let agreeing = 0;
    let total = 0;
    for (const a of signs) {
      for (const b of signs) {
        if (a.score === b.score) continue;
        total += 1;
        const closer = a.score > b.score ? a.distance < b.distance : a.distance > b.distance;
        if (closer) agreeing += 1;
      }
    }
    // Charge repulsion perturbs the ideal radii slightly; the ranking should
    // still hold for the overwhelming majority of pairs.
    expect(agreeing / total).toBeGreaterThan(0.9);
  });

  it('separates nodes enough that labels do not collide', () => {
    const signs = nodes.filter((n) => n.id !== '__you__');
    for (const a of signs) {
      for (const b of signs) {
        if (a.id === b.id) continue;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20);
      }
    }
  });

  it('is deterministic — the same chart yields the same constellation', () => {
    const again = constellationLayout(ranked);
    for (const node of nodes) {
      const match = again.find((n) => n.id === node.id)!;
      expect(match.x).toBeCloseTo(node.x, 9);
      expect(match.y).toBeCloseTo(node.y, 9);
    }
  });
});

describe('visual encodings', () => {
  it('normalises scores across the reachable range', () => {
    expect(scoreFraction(MIN_SIGN_SCORE)).toBeCloseTo(0, 9);
    expect(scoreFraction(MAX_SIGN_SCORE)).toBeCloseTo(1, 9);
  });

  it('clamps scores outside the range', () => {
    expect(scoreFraction(0)).toBe(0);
    expect(scoreFraction(100)).toBe(1);
  });

  it('grows node radius, opacity and width with score', () => {
    expect(nodeRadius(MAX_SIGN_SCORE)).toBeGreaterThan(nodeRadius(MIN_SIGN_SCORE));
    expect(edgeOpacity(MAX_SIGN_SCORE)).toBeGreaterThan(edgeOpacity(MIN_SIGN_SCORE));
    expect(edgeWidth(MAX_SIGN_SCORE)).toBeGreaterThan(edgeWidth(MIN_SIGN_SCORE));
  });

  it('keeps the weakest edge visible', () => {
    expect(edgeOpacity(MIN_SIGN_SCORE)).toBeGreaterThan(0.1);
    expect(edgeWidth(MIN_SIGN_SCORE)).toBeGreaterThan(0.5);
  });
});
