import type {
  ElementName,
  ModalityName,
  PolarityName,
  SignName,
  BodyName,
} from './types';

export interface Sign {
  /** 0 = Aries … 11 = Pisces. Also the sign's position on the wheel. */
  index: number;
  name: SignName;
  label: string;
  glyph: string;
  symbol: string;
  element: ElementName;
  modality: ModalityName;
  polarity: PolarityName;
  /** Modern ruler. Outer planets were assigned after their discovery. */
  ruler: BodyName;
  /** Pre-telescopic ruler. Differs from `ruler` only for Scorpio, Aquarius, Pisces. */
  traditionalRuler: BodyName;
  /** Ecliptic longitude where the sign begins: index × 30. */
  startDegree: number;
  /** The classic first-person keyphrase for each sign. */
  keyphrase: string;
  /** Approximate tropical date range. Boundaries drift ~a day year to year. */
  dates: string;
}

/**
 * The twelve signs in zodiacal order.
 *
 * Element and modality are written out explicitly for readability, but they are
 * not free-form: element cycles every 4 signs and modality every 3. That
 * invariant is what makes the aspect geometry work (a trine — 4 signs apart —
 * always lands on the same element), and it is asserted in the tests.
 */
export const SIGNS: readonly Sign[] = [
  {
    index: 0,
    name: 'aries',
    label: 'Aries',
    glyph: '♈\uFE0E',
    symbol: 'The Ram',
    element: 'fire',
    modality: 'cardinal',
    polarity: 'active',
    ruler: 'mars',
    traditionalRuler: 'mars',
    startDegree: 0,
    keyphrase: 'I am',
    dates: 'Mar 21 – Apr 19',
  },
  {
    index: 1,
    name: 'taurus',
    label: 'Taurus',
    glyph: '♉\uFE0E',
    symbol: 'The Bull',
    element: 'earth',
    modality: 'fixed',
    polarity: 'receptive',
    ruler: 'venus',
    traditionalRuler: 'venus',
    startDegree: 30,
    keyphrase: 'I have',
    dates: 'Apr 20 – May 20',
  },
  {
    index: 2,
    name: 'gemini',
    label: 'Gemini',
    glyph: '♊\uFE0E',
    symbol: 'The Twins',
    element: 'air',
    modality: 'mutable',
    polarity: 'active',
    ruler: 'mercury',
    traditionalRuler: 'mercury',
    startDegree: 60,
    keyphrase: 'I think',
    dates: 'May 21 – Jun 20',
  },
  {
    index: 3,
    name: 'cancer',
    label: 'Cancer',
    glyph: '♋\uFE0E',
    symbol: 'The Crab',
    element: 'water',
    modality: 'cardinal',
    polarity: 'receptive',
    ruler: 'moon',
    traditionalRuler: 'moon',
    startDegree: 90,
    keyphrase: 'I feel',
    dates: 'Jun 21 – Jul 22',
  },
  {
    index: 4,
    name: 'leo',
    label: 'Leo',
    glyph: '♌\uFE0E',
    symbol: 'The Lion',
    element: 'fire',
    modality: 'fixed',
    polarity: 'active',
    ruler: 'sun',
    traditionalRuler: 'sun',
    startDegree: 120,
    keyphrase: 'I will',
    dates: 'Jul 23 – Aug 22',
  },
  {
    index: 5,
    name: 'virgo',
    label: 'Virgo',
    glyph: '♍\uFE0E',
    symbol: 'The Maiden',
    element: 'earth',
    modality: 'mutable',
    polarity: 'receptive',
    ruler: 'mercury',
    traditionalRuler: 'mercury',
    startDegree: 150,
    keyphrase: 'I analyse',
    dates: 'Aug 23 – Sep 22',
  },
  {
    index: 6,
    name: 'libra',
    label: 'Libra',
    glyph: '♎\uFE0E',
    symbol: 'The Scales',
    element: 'air',
    modality: 'cardinal',
    polarity: 'active',
    ruler: 'venus',
    traditionalRuler: 'venus',
    startDegree: 180,
    keyphrase: 'I balance',
    dates: 'Sep 23 – Oct 22',
  },
  {
    index: 7,
    name: 'scorpio',
    label: 'Scorpio',
    glyph: '♏\uFE0E',
    symbol: 'The Scorpion',
    element: 'water',
    modality: 'fixed',
    polarity: 'receptive',
    ruler: 'pluto',
    traditionalRuler: 'mars',
    startDegree: 210,
    keyphrase: 'I desire',
    dates: 'Oct 23 – Nov 21',
  },
  {
    index: 8,
    name: 'sagittarius',
    label: 'Sagittarius',
    glyph: '♐\uFE0E',
    symbol: 'The Archer',
    element: 'fire',
    modality: 'mutable',
    polarity: 'active',
    ruler: 'jupiter',
    traditionalRuler: 'jupiter',
    startDegree: 240,
    keyphrase: 'I seek',
    dates: 'Nov 22 – Dec 21',
  },
  {
    index: 9,
    name: 'capricorn',
    label: 'Capricorn',
    glyph: '♑\uFE0E',
    symbol: 'The Sea-Goat',
    element: 'earth',
    modality: 'cardinal',
    polarity: 'receptive',
    ruler: 'saturn',
    traditionalRuler: 'saturn',
    startDegree: 270,
    keyphrase: 'I use',
    dates: 'Dec 22 – Jan 19',
  },
  {
    index: 10,
    name: 'aquarius',
    label: 'Aquarius',
    glyph: '♒\uFE0E',
    symbol: 'The Water Bearer',
    element: 'air',
    modality: 'fixed',
    polarity: 'active',
    ruler: 'uranus',
    traditionalRuler: 'saturn',
    startDegree: 300,
    keyphrase: 'I know',
    dates: 'Jan 20 – Feb 18',
  },
  {
    index: 11,
    name: 'pisces',
    label: 'Pisces',
    glyph: '♓\uFE0E',
    symbol: 'The Fishes',
    element: 'water',
    modality: 'mutable',
    polarity: 'receptive',
    ruler: 'neptune',
    traditionalRuler: 'jupiter',
    startDegree: 330,
    keyphrase: 'I believe',
    dates: 'Feb 19 – Mar 20',
  },
];

const SIGNS_BY_NAME = new Map<SignName, Sign>(SIGNS.map((s) => [s.name, s]));

/** Normalise any number of degrees into the 0–360 range. */
export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Look up a sign by wheel position. The index wraps, so `getSign(12)` is Aries
 * and `getSign(-1)` is Pisces — which keeps aspect arithmetic free of guards.
 */
export function getSign(index: number): Sign {
  const wrapped = ((Math.trunc(index) % 12) + 12) % 12;
  const sign = SIGNS[wrapped];
  if (!sign) {
    // Unreachable: `wrapped` is always 0–11 and SIGNS has 12 entries.
    throw new Error(`No sign at index ${index}`);
  }
  return sign;
}

export function getSignByName(name: SignName): Sign {
  const sign = SIGNS_BY_NAME.get(name);
  if (!sign) throw new Error(`Unknown sign: ${name}`);
  return sign;
}

/** Which sign an ecliptic longitude falls in. */
export function signFromLongitude(longitude: number): Sign {
  return getSign(Math.floor(normalizeDegrees(longitude) / 30));
}

/** How far into its sign a longitude sits, 0–30°. */
export function degreeInSign(longitude: number): number {
  return normalizeDegrees(longitude) % 30;
}

/** Format a longitude the way charts print it, e.g. `10°22' Capricorn`. */
export function formatLongitude(longitude: number): string {
  const sign = signFromLongitude(longitude);
  const deg = degreeInSign(longitude);
  const whole = Math.floor(deg);
  const minutes = Math.floor((deg - whole) * 60);
  return `${whole}°${String(minutes).padStart(2, '0')}' ${sign.label}`;
}

/**
 * Elements that actively support each other.
 *
 * Same element is the trine (easiest flow). Fire–air and earth–water are the
 * complementary pairs reached by sextile: air feeds fire, water nourishes earth.
 */
const COMPLEMENTARY_ELEMENTS: Readonly<Record<ElementName, ElementName>> = {
  fire: 'air',
  air: 'fire',
  earth: 'water',
  water: 'earth',
};

export function areElementsComplementary(
  a: ElementName,
  b: ElementName,
): boolean {
  return COMPLEMENTARY_ELEMENTS[a] === b;
}

/** One-line gloss of what each element brings to a relationship. */
export const ELEMENT_TEMPERAMENT: Readonly<Record<ElementName, string>> = {
  fire: 'drive and enthusiasm',
  earth: 'steadiness and practicality',
  air: 'ideas and conversation',
  water: 'feeling and intuition',
};

/** One-line gloss of how each modality characteristically moves. */
export const MODALITY_TEMPERAMENT: Readonly<Record<ModalityName, string>> = {
  cardinal: 'starts things',
  fixed: 'holds its ground',
  mutable: 'adapts and shifts',
};
