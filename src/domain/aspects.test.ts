import { describe, expect, it } from 'vitest';
import {
  ASPECTS,
  PTOLEMAIC_ASPECTS,
  angularSeparation,
  aspectBetweenSigns,
  findAspect,
  signSeparation,
} from './aspects';
import { SIGNS, getSignByName } from './signs';

describe('aspect table', () => {
  it('covers every whole-sign separation from 0 to 6', () => {
    const distances = ASPECTS.map((a) => a.signDistance).sort((x, y) => x - y);
    expect(distances).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('keeps angle and sign distance consistent', () => {
    for (const aspect of ASPECTS) {
      expect(aspect.angle).toBe(aspect.signDistance * 30);
    }
  });

  it('lists exactly the five Ptolemaic aspects', () => {
    expect(PTOLEMAIC_ASPECTS.map((a) => a.name).sort()).toEqual([
      'conjunction',
      'opposition',
      'sextile',
      'square',
      'trine',
    ]);
  });
});

describe('signSeparation', () => {
  it('is zero for a sign against itself', () => {
    expect(signSeparation(0, 0)).toBe(0);
    expect(signSeparation(7, 7)).toBe(0);
  });

  it('takes the short way round the wheel', () => {
    // Pisces (11) to Aries (0) is one sign, not eleven.
    expect(signSeparation(11, 0)).toBe(1);
    expect(signSeparation(0, 11)).toBe(1);
    expect(signSeparation(10, 1)).toBe(3);
  });

  it('is symmetric and never exceeds 6', () => {
    for (let a = 0; a < 12; a += 1) {
      for (let b = 0; b < 12; b += 1) {
        const sep = signSeparation(a, b);
        expect(sep).toBe(signSeparation(b, a));
        expect(sep).toBeGreaterThanOrEqual(0);
        expect(sep).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('aspectBetweenSigns', () => {
  it('reads the classic pairings correctly', () => {
    const aries = getSignByName('aries').index;
    expect(aspectBetweenSigns(aries, getSignByName('aries').index).name).toBe(
      'conjunction',
    );
    expect(aspectBetweenSigns(aries, getSignByName('leo').index).name).toBe(
      'trine',
    );
    expect(aspectBetweenSigns(aries, getSignByName('gemini').index).name).toBe(
      'sextile',
    );
    expect(aspectBetweenSigns(aries, getSignByName('cancer').index).name).toBe(
      'square',
    );
    expect(aspectBetweenSigns(aries, getSignByName('libra').index).name).toBe(
      'opposition',
    );
    expect(aspectBetweenSigns(aries, getSignByName('virgo').index).name).toBe(
      'quincunx',
    );
    expect(aspectBetweenSigns(aries, getSignByName('taurus').index).name).toBe(
      'semiSextile',
    );
  });

  /**
   * The geometric facts that make the zodiac a coherent distance graph — see
   * docs/RESEARCH.md §1. These are not conventions we chose; they fall out of
   * element cycling every 4 signs and modality every 3.
   */
  it('makes every trine same-element', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        if (aspectBetweenSigns(a.index, b.index).name === 'trine') {
          expect(a.element).toBe(b.element);
        }
      }
    }
  });

  it('makes every square and opposition same-modality', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const name = aspectBetweenSigns(a.index, b.index).name;
        if (name === 'square' || name === 'opposition') {
          expect(a.modality).toBe(b.modality);
        }
      }
    }
  });

  it('makes every sextile a complementary element pair', () => {
    const complement = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        if (aspectBetweenSigns(a.index, b.index).name === 'sextile') {
          expect(complement[a.element]).toBe(b.element);
        }
      }
    }
  });
});

describe('angularSeparation', () => {
  it('never exceeds 180 degrees', () => {
    expect(angularSeparation(0, 190)).toBe(170);
    expect(angularSeparation(350, 10)).toBe(20);
    expect(angularSeparation(0, 180)).toBe(180);
  });
});

describe('findAspect', () => {
  it('finds an exact aspect at full strength', () => {
    const hit = findAspect(0, 120);
    expect(hit?.aspect.name).toBe('trine');
    expect(hit?.orb).toBeCloseTo(0, 9);
    expect(hit?.strength).toBeCloseTo(1, 9);
  });

  it('accepts an aspect inside orb and weakens it with distance', () => {
    const tight = findAspect(0, 121);
    const loose = findAspect(0, 127);
    expect(tight?.aspect.name).toBe('trine');
    expect(loose?.aspect.name).toBe('trine');
    expect(tight!.strength).toBeGreaterThan(loose!.strength);
  });

  it('returns null when nothing lands inside orb', () => {
    // 100° is 10 off a square and 20 off a trine — outside both orbs.
    expect(findAspect(0, 100)).toBeNull();
  });

  /**
   * The case that makes degree-level scoring more than a restatement of the
   * sign grid: 29° Aries and 1° Taurus are in different signs (a semi-sextile
   * by sign) yet only 2° apart, which is a conjunction by orb.
   */
  it('detects conjunctions across a sign cusp', () => {
    const hit = findAspect(29, 31);
    expect(hit?.aspect.name).toBe('conjunction');
    expect(hit?.orb).toBeCloseTo(2, 9);
  });

  it('handles the 0° Aries wrap', () => {
    const hit = findAspect(359, 1);
    expect(hit?.aspect.name).toBe('conjunction');
    expect(hit?.orb).toBeCloseTo(2, 9);
  });

  it('narrows orbs when given a factor', () => {
    expect(findAspect(0, 127)?.aspect.name).toBe('trine');
    expect(findAspect(0, 127, { orbFactor: 0.5 })).toBeNull();
  });

  it('prefers the tighter aspect when two are in range', () => {
    // 29° is inside the conjunction orb (8) and the semi-sextile orb (2 → 1 off).
    const hit = findAspect(0, 29);
    expect(hit?.aspect.name).toBe('semiSextile');
  });
});
