import type { AspectName, AspectQuality } from './types';
import { normalizeDegrees } from './signs';

export interface Aspect {
  name: AspectName;
  label: string;
  glyph: string;
  /** Exact angular separation in degrees. */
  angle: number;
  /** Separation expressed in whole signs — `angle / 30`. */
  signDistance: number;
  quality: AspectQuality;
  /** Default orb: how far from exact the aspect still counts. */
  orb: number;
  /** One of the five Ptolemaic aspects. */
  ptolemaic: boolean;
  /**
   * Base compatibility contribution, 0–100. Derived in docs/RESEARCH.md §3
   * from the standard harmonious/challenging reading of each aspect.
   */
  baseScore: number;
  /** Plain-language reading, used to explain an edge in the graph. */
  reading: string;
}

/**
 * Aspects at whole-sign distances, indexed by how many signs apart they are.
 *
 * Only multiples of 30° appear here, because sign-to-sign comparison can only
 * ever produce those. Degree-level synastry additionally picks up the
 * off-multiple aspects (semi-square 45°, sesquiquadrate 135°), which we leave
 * out for now — they are minor and would add noise to a first version.
 */
export const ASPECTS: readonly Aspect[] = [
  {
    name: 'conjunction',
    label: 'Conjunction',
    glyph: '☌',
    angle: 0,
    signDistance: 0,
    quality: 'neutral',
    orb: 8,
    ptolemaic: true,
    baseScore: 70,
    reading:
      'the same sign — instant recognition, though it can double down on shared blind spots',
  },
  {
    name: 'semiSextile',
    label: 'Semi-sextile',
    glyph: '⚺',
    angle: 30,
    signDistance: 1,
    quality: 'neutral',
    orb: 2,
    ptolemaic: false,
    baseScore: 40,
    reading:
      'neighbouring signs — adjacent but sharing no element or modality, so the connection takes translation',
  },
  {
    name: 'sextile',
    label: 'Sextile',
    glyph: '⚹',
    angle: 60,
    signDistance: 2,
    quality: 'harmonious',
    orb: 6,
    ptolemaic: true,
    baseScore: 80,
    reading:
      'complementary elements — easy encouragement, the kind that gets each other moving',
  },
  {
    name: 'square',
    label: 'Square',
    glyph: '□',
    angle: 90,
    signDistance: 3,
    quality: 'challenging',
    orb: 7,
    ptolemaic: true,
    baseScore: 30,
    reading:
      'same modality, clashing elements — friction, and the growth that comes with it',
  },
  {
    name: 'trine',
    label: 'Trine',
    glyph: '△',
    angle: 120,
    signDistance: 4,
    quality: 'harmonious',
    orb: 8,
    ptolemaic: true,
    // 85 rather than 90: a trine always collects the +10 element and +3
    // modality bonuses, and 90 would clamp at the 100 ceiling, flattening the
    // top of the scale. See COMPATIBILITY_SCALE in compatibility.ts.
    baseScore: 85,
    reading:
      'the same element — the easiest flow in the zodiac, sometimes too easy to be interesting',
  },
  {
    name: 'quincunx',
    label: 'Quincunx',
    glyph: '⚻',
    angle: 150,
    signDistance: 5,
    quality: 'challenging',
    orb: 5,
    ptolemaic: false,
    baseScore: 35,
    reading:
      'nothing in common — no shared element, modality or polarity; requires deliberate adjustment',
  },
  {
    name: 'opposition',
    label: 'Opposition',
    glyph: '☍',
    angle: 180,
    signDistance: 6,
    quality: 'neutral',
    orb: 8,
    ptolemaic: true,
    baseScore: 55,
    reading:
      'across the wheel — magnetic and polarising, each holding what the other leaves out',
  },
];

/** Indexed 0–6 by whole-sign separation. */
const ASPECTS_BY_SIGN_DISTANCE: readonly Aspect[] = (() => {
  const table = new Array<Aspect>(7);
  for (const aspect of ASPECTS) table[aspect.signDistance] = aspect;
  return table;
})();

/**
 * Shortest distance between two signs, 0–6.
 *
 * The zodiac is a circle, so Pisces (11) and Aries (0) are 1 apart, not 11.
 * Capping at 6 is what makes the aspect table symmetric.
 */
export function signSeparation(indexA: number, indexB: number): number {
  const raw = Math.abs(Math.trunc(indexA) - Math.trunc(indexB)) % 12;
  return Math.min(raw, 12 - raw);
}

/** The aspect formed by two signs, purely from their positions on the wheel. */
export function aspectBetweenSigns(indexA: number, indexB: number): Aspect {
  const separation = signSeparation(indexA, indexB);
  const aspect = ASPECTS_BY_SIGN_DISTANCE[separation];
  if (!aspect) {
    // Unreachable: signSeparation always returns 0–6.
    throw new Error(`No aspect for separation ${separation}`);
  }
  return aspect;
}

/** Shortest angular distance between two ecliptic longitudes, 0–180°. */
export function angularSeparation(
  longitudeA: number,
  longitudeB: number,
): number {
  const raw = Math.abs(
    normalizeDegrees(longitudeA) - normalizeDegrees(longitudeB),
  );
  return raw > 180 ? 360 - raw : raw;
}

export interface AspectHit {
  aspect: Aspect;
  /** Degrees away from exact. */
  orb: number;
  /** 1 at exact, falling to 0 at the edge of the allowed orb. */
  strength: number;
  /** Actual separation between the two points. */
  separation: number;
}

/**
 * Find the degree-level aspect between two longitudes, if any.
 *
 * Unlike `aspectBetweenSigns`, this is what real synastry uses: two planets in
 * adjacent signs can still be conjunct if they sit either side of the cusp.
 * Returns the tightest match, or null when nothing lands inside orb.
 *
 * Used by the Friends chart comparison for known birth times. The generic
 * twelve-sign exploration continues to use sign-level scoring.
 */
export function findAspect(
  longitudeA: number,
  longitudeB: number,
  options: { orbFactor?: number; aspects?: readonly Aspect[] } = {},
): AspectHit | null {
  const { orbFactor = 1, aspects = ASPECTS } = options;
  const separation = angularSeparation(longitudeA, longitudeB);

  let best: AspectHit | null = null;
  for (const aspect of aspects) {
    const maxOrb = aspect.orb * orbFactor;
    const orb = Math.abs(separation - aspect.angle);
    if (orb > maxOrb) continue;

    const hit: AspectHit = {
      aspect,
      orb,
      strength: maxOrb === 0 ? 1 : 1 - orb / maxOrb,
      separation,
    };
    if (!best || hit.orb < best.orb) best = hit;
  }
  return best;
}
