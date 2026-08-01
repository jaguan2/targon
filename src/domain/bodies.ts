import type { BodyClass, BodyName, PrecisionTier } from './types';

export interface Body {
  name: BodyName;
  label: string;
  glyph: string;
  class: BodyClass;
  /**
   * Scoring weight, following the widely used 3/2/1 scheme:
   * luminaries and angles 3, personal planets 2, everything slower 1.
   * See docs/RESEARCH.md §3.
   */
  weight: number;
  /** Minimum birth data needed before this placement means anything. */
  requires: PrecisionTier;
  /** Mean geocentric motion in degrees per day — drives the precision warnings. */
  dailyMotion: number;
  /**
   * False for points we can name but not yet compute.
   * Chiron is an asteroid and is not in astronomy-engine's ephemeris.
   */
  computable: boolean;
  /** What this body governs, in relationship terms. */
  governs: string;
}

/**
 * Bodies in the order charts conventionally list them.
 *
 * A note on the generational planets: Uranus, Neptune and Pluto take 7–20 years
 * to cross a single sign, so everyone born within a decade of you shares them.
 * They say nothing about you as an individual, which is exactly why they carry
 * weight 1 and are excluded from compatibility scoring by default.
 */
export const BODIES: readonly Body[] = [
  {
    name: 'sun',
    label: 'Sun',
    glyph: '☉',
    class: 'luminary',
    weight: 3,
    requires: 'date',
    dailyMotion: 0.9856,
    computable: true,
    governs: 'core identity and what you are driven by',
  },
  {
    name: 'moon',
    label: 'Moon',
    glyph: '☽',
    class: 'luminary',
    weight: 3,
    requires: 'time',
    dailyMotion: 13.1764,
    computable: true,
    governs: 'emotional needs and what makes you feel safe',
  },
  {
    name: 'ascendant',
    label: 'Ascendant',
    glyph: 'AC',
    class: 'angle',
    weight: 3,
    requires: 'place',
    dailyMotion: 360,
    computable: true,
    governs: 'first impressions and how you meet the world',
  },
  {
    name: 'midheaven',
    label: 'Midheaven',
    glyph: 'MC',
    class: 'angle',
    weight: 3,
    requires: 'place',
    dailyMotion: 360,
    computable: true,
    governs: 'public role, vocation and reputation',
  },
  {
    name: 'mercury',
    label: 'Mercury',
    glyph: '☿',
    class: 'personal',
    weight: 2,
    requires: 'date',
    dailyMotion: 1.383,
    computable: true,
    governs: 'how you think and communicate',
  },
  {
    name: 'venus',
    label: 'Venus',
    glyph: '♀',
    class: 'personal',
    weight: 2,
    requires: 'date',
    dailyMotion: 1.2,
    computable: true,
    governs: 'affection, taste and how you love',
  },
  {
    name: 'mars',
    label: 'Mars',
    glyph: '♂',
    class: 'personal',
    weight: 2,
    requires: 'date',
    dailyMotion: 0.524,
    computable: true,
    governs: 'desire, drive and how you handle conflict',
  },
  {
    name: 'jupiter',
    label: 'Jupiter',
    glyph: '♃',
    class: 'social',
    weight: 1,
    requires: 'date',
    dailyMotion: 0.083,
    computable: true,
    governs: 'growth, luck and what you believe',
  },
  {
    name: 'saturn',
    label: 'Saturn',
    glyph: '♄',
    class: 'social',
    weight: 1,
    requires: 'date',
    dailyMotion: 0.0335,
    computable: true,
    governs: 'discipline, limits and long-term commitment',
  },
  {
    name: 'uranus',
    label: 'Uranus',
    glyph: '♅',
    class: 'generational',
    weight: 1,
    requires: 'date',
    dailyMotion: 0.0117,
    computable: true,
    governs: 'disruption and the urge to break form',
  },
  {
    name: 'neptune',
    label: 'Neptune',
    glyph: '♆',
    class: 'generational',
    weight: 1,
    requires: 'date',
    dailyMotion: 0.006,
    computable: true,
    governs: 'imagination, dreams and dissolution',
  },
  {
    name: 'pluto',
    label: 'Pluto',
    glyph: '♇',
    class: 'generational',
    weight: 1,
    requires: 'date',
    dailyMotion: 0.004,
    computable: true,
    governs: 'power, depth and transformation',
  },
  {
    name: 'northNode',
    label: 'North Node',
    glyph: '☊',
    class: 'point',
    weight: 1,
    requires: 'date',
    // Negative: the nodes move backwards through the zodiac.
    dailyMotion: -0.0529,
    computable: true,
    governs: 'the direction you are growing toward',
  },
  {
    name: 'southNode',
    label: 'South Node',
    glyph: '☋',
    class: 'point',
    weight: 1,
    requires: 'date',
    dailyMotion: -0.0529,
    computable: true,
    governs: 'what comes easily, and what you over-rely on',
  },
  {
    name: 'chiron',
    label: 'Chiron',
    glyph: '⚷',
    class: 'point',
    weight: 1,
    requires: 'date',
    dailyMotion: 0.02,
    // Chiron is a minor planet; astronomy-engine ships no orbital elements for
    // it. Listed for completeness so the UI can show it as "not yet available"
    // rather than silently omitting a body users expect to see.
    computable: false,
    governs: 'the wound you keep learning from',
  },
];

const BODIES_BY_NAME = new Map<BodyName, Body>(BODIES.map((b) => [b.name, b]));

export function getBody(name: BodyName): Body {
  const body = BODIES_BY_NAME.get(name);
  if (!body) throw new Error(`Unknown body: ${name}`);
  return body;
}

/** Bodies we can actually calculate today. */
export const COMPUTABLE_BODIES: readonly Body[] = BODIES.filter(
  (b) => b.computable,
);

/** Rank of each tier, so we can ask "does tier X satisfy requirement Y?". */
const TIER_RANK: Readonly<Record<PrecisionTier, number>> = {
  date: 0,
  time: 1,
  place: 2,
};

export function tierSatisfies(
  available: PrecisionTier,
  required: PrecisionTier,
): boolean {
  return TIER_RANK[available] >= TIER_RANK[required];
}

/** Which bodies are meaningful given the birth data on hand. */
export function bodiesForTier(tier: PrecisionTier): readonly Body[] {
  return COMPUTABLE_BODIES.filter((b) => tierSatisfies(tier, b.requires));
}

/**
 * Worst-case sign error if we guess the time of day.
 *
 * Assuming noon puts us at most 12 hours from the truth, so a body can be off
 * by up to half a day's motion. Used to warn honestly about date-only charts:
 * the Sun barely moves (0.5°), but the Moon can be off by 6.6° — around a fifth
 * of a sign, which is why we ask for a birth time.
 */
export function maxDriftWithoutTime(body: Body): number {
  return Math.abs(body.dailyMotion) / 2;
}
