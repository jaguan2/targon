/**
 * Star position generation for the CSS box-shadow starfield.
 *
 * Every star in a layer lives in that layer's `box-shadow` list, so the whole
 * sky costs three DOM nodes rather than a few hundred. Positions come from a
 * seeded PRNG: the sky is random-looking but identical on every load, which
 * keeps it from shimmering when React re-renders.
 */

/** mulberry32 — small, fast, and good enough for scattering dots. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vertical span of one tile. Must match the `drift` keyframe distance. */
export const TILE_HEIGHT = 2000;

/** Horizontal span. Generous enough to cover ultrawide displays. */
const TILE_WIDTH = 3200;

export interface StarLayerOptions {
  count: number;
  seed: number;
  /** Base star colour. A few stars are tinted warm to break up the white. */
  color?: string;
}

/**
 * Build a `box-shadow` value holding `count` stars.
 *
 * The pattern is emitted twice — once at y, once at y + TILE_HEIGHT — so that
 * when the layer scrolls a full tile the copy has already taken its place and
 * the loop is seamless.
 */
export function buildStarLayer({
  count,
  seed,
  color = '#f4f1ea',
}: StarLayerOptions): string {
  const random = seededRandom(seed);
  const shadows: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const x = Math.round(random() * TILE_WIDTH);
    const y = Math.round(random() * TILE_HEIGHT);
    // Roughly one star in six takes the warm tint, echoing the gold accent.
    const tint = random() < 0.16 ? '#e8c87e' : color;
    shadows.push(`${x}px ${y}px ${tint}`);
    shadows.push(`${x}px ${y + TILE_HEIGHT}px ${tint}`);
  }

  return shadows.join(', ');
}
