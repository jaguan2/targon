# Star — Research & Design Notes

Research backing an astrology-driven node graph: a user enters birth data, we compute their
placements, and render a star-map graph where **edge length encodes compatibility** (closer = more
compatible).

Scope decisions locked in:

- **Domain:** astrology (zodiac / birth chart), not literal astronomy
- **Shape:** single-user exploration tool — one "you" node against a fixed dataset (the 12 signs)

---

## 1. The key insight: the zodiac is already a distance graph

This is the finding that should drive the whole architecture.

The 12 signs sit on a circle at **30° intervals**. In traditional astrology, the *quality* of the
relationship between two signs is defined by their **angular separation** — that's what an "aspect"
is. So the distance metaphor isn't something we're bolting onto the domain; **it is the domain's
native structure.**

| Signs apart | Angle | Aspect | Character |
|---|---|---|---|
| 0 | 0° | Conjunction | Same sign — merged, intense, can be redundant |
| 1 | 30° | Semi-sextile | Adjacent, awkward — "don't quite speak the same language" |
| 2 | 60° | Sextile | Harmonious, complementary elements, stimulating |
| 3 | 90° | Square | Friction, challenge, growth |
| 4 | 120° | Trine | Easiest flow — always same element |
| 5 | 150° | Quincunx | Most disconnected, no shared element *or* modality |
| 6 | 180° | Opposition | Polarizing, magnetic — "opposites attract," dynamic |

Two structural facts that fall out of the geometry for free:

- **Trines (120°) are always same-element.** Fire trines fire, water trines water.
- **Squares (90°) and oppositions (180°) are always same-modality.** This is *why* they clash —
  two cardinal signs both want to lead, two fixed signs both refuse to move.

Sources: [Cafe Astrology — aspects](https://cafeastrology.com/articles/aspectsinastrology.html),
[Bustle — aspect meanings](https://www.bustle.com/life/what-conjunction-trine-square-opposition-sextile-mean-in-astrology-birth-charts-13108526),
[mindbodygreen — compatibility guide](https://www.mindbodygreen.com/articles/zodiac-guide-for-horoscope-compatibility)

### Design consequence

A **force-directed layout is arguably the wrong default.** The honest layout is a **radial zodiac
wheel** — fixed 30° positions, true to the real chart — with compatibility encoded as **edge
weight/brightness** rather than length. Best approach: build the wheel as the canonical view and
offer force-directed as a toggle ("constellation mode") where the physics pulls compatible signs
together. Two views, one dataset.

---

## 2. Data model & input tiers

The birth chart maps Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto (plus
Chiron, lunar nodes) across 12 signs and 12 houses. What you can compute depends strictly on what
the user gives you:

| Tier | Input | Unlocks | Notes |
|---|---|---|---|
| **1** | Date only | Sun sign | Trivial — a date-range lookup table. No ephemeris needed. |
| **2** | Date + time | Moon sign, all personal planets (Venus, Mars, Mercury) | Moon moves ~13°/day, so it genuinely needs the time. Requires ephemeris. |
| **3** | Date + time + location | Rising/Ascendant, Midheaven, all 12 houses | Ascendant changes ~1° every 4 minutes — highly time/place sensitive. |

The "Big Three" (Sun / Moon / Rising) are the standard foundational triad and the right thing to
build the UI around. Critically: *the same person born one hour later has a different Rising sign.*

**Product implication:** make birth time **optional but incentivized** — many users genuinely don't
know it. Degrade gracefully: date-only still yields a usable Sun-sign graph; adding time visibly
"unlocks" more nodes and re-weights the edges. That's a strong progressive-disclosure hook rather
than a hard validation wall.

Sources: [Cafe Astrology — natal report](https://cafeastrology.com/free-natal-chart-report.html),
[Nummi — birth chart guide](https://www.nummi.ai/blog/birth-chart-explained-natal-astrology-guide)

---

## 3. Compatibility scoring

### What practitioners actually do

Real synastry compares two full charts and weights every inter-chart aspect. Cafe Astrology
publishes an explicit rubric using weights **+4, +3, +2, +1, −1, −2, −3, −4**:

- **Weight 4 (strongest):** Sun conjunct Descendant, Moon conjunct Descendant, Sun/Moon conjunct
  North Node, Ascendant conjunct North Node
- **Weight 3:** Sun trine/sextile Sun · Sun conjunct/trine/sextile Moon · Sun conjunct/trine Venus ·
  Moon conjunct/sextile/trine Moon · Moon conjunct/sextile/trine Venus · Venus
  conjunct/sextile/trine/opposition Venus · Venus conjunct/sextile/trine Mars

Their own stated caveat is worth honoring: *"None of these weights are absolute. I offer these as a
general guideline only"* — and that intuition beats mechanically tallying points.

**Ratio-based schools** (a useful sanity check on any score): Ron Bippus uses Ptolemaic aspects only
with a max **8° orb**, and argues the soft:hard aspect *ratio* matters more than raw counts —
**1.5:1 minimum** for a smooth relationship. Nance McCullough sets it at **2:1**, and notes that
*too much* harmony makes for dull relationships.

An **elemental weighting** scheme also appears repeatedly, useful for weighting planets by
importance:

- Sun, Moon, Ascendant, MC → **3 points**
- Mercury, Venus, Mars → **2 points**
- Jupiter, Saturn, Uranus, Neptune, Pluto → **1 point**

Sources: [Cafe Astrology — synastry](https://cafeastrology.com/synastry-2.html),
[Cosmitec — compatibility scores & rating systems](https://www.cosmitec-astrological-compatibility-advice.com/astrology-compatibility-scores.html)

### Proposed algorithm

Composable in three layers — ship Layer 1, add 2 and 3 as input tiers unlock.

**Layer 1 — aspect base score** from angular separation (0–100):

```
separation = min(|a - b|, 12 - |a - b|)   // in signs, 0..6

TRINE       (4) → 85
SEXTILE     (2) → 80
CONJUNCTION (0) → 70
OPPOSITION  (6) → 55
SEMI_SEXTILE(1) → 40
QUINCUNX    (5) → 35
SQUARE      (3) → 30
```

> Trine is 85, not 90, because it always collects both layer-2 bonuses (+13).
> At 90 it would clamp against the 100 ceiling and every same-element pair
> would tie, flattening the top of the scale.

**Layer 2 — element & modality modifiers:**

```
element:  same            → +10
          fire↔air, earth↔water (complementary) → +8
          otherwise (fire↔water, fire↔earth, air↔earth, air↔water) → −5

modality: same            → −5    // same approach = competition
          different       → +3
```

Same-element/complementary-element rules are well attested: same element harmonizes (trine),
fire–air and earth–water are the complementary pairs (sextile).

**Layer 3 — weighted blend across placements** (only when the tier supports it):

```
platonic/general:  0.50·Sun + 0.30·Moon + 0.20·Rising
romantic:          0.35·Sun + 0.25·Moon + 0.25·Venus + 0.15·Mars
```

### Layer 2 is explanatory, not independent — verified

Element cycles every 4 signs and modality every 3, so by the Chinese remainder theorem a separation
mod 12 **fully determines both**. Brute-forcing all 144 pairings confirms it: no separation ever
produces conflicting element/modality relations.

| Separation | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Same element | ✓ | | | | ✓ | | |
| Complementary | | | ✓ | | | | ✓ |
| Same modality | ✓ | | | ✓ | | | ✓ |

So at sign level, layer 2 adds **no new signal** — only seven scores are reachable across all 144
pairings:

```
trine 98 · sextile 91 · conjunction 75 · opposition 58 · semi-sextile 38 · quincunx 33 · square 20
```

It is still worth computing, for two reasons. It generates the human-readable *reasons* behind each
edge, and at **degree level the redundancy genuinely breaks** — two planets either side of a cusp
can be conjunct by orb while sitting in signs of different elements. That is where layer 2 does real
work, and it's the argument for degree-level scoring over a lookup table.

### Score → layout

Calibrate against the **real bounds (20–98), not 0–100** — anchoring at zero leaves a fifth of every
bar permanently filled and wastes the radius:

```
distance = maxDist − ((score − 20) / 78) × (maxDist − minDist)
```

So a 98-point trine sits close and a 20-point square is flung far out. In wheel mode, feed the same
score into **edge opacity + stroke width + glow intensity** instead of length.

**Store the reasons, not just the number.** Every edge should carry the aspect name, shared/clashing
element, modality relation, and which placements drove it — that's the "information about the
relationship" you wanted, and it's what makes the graph explanatory rather than a black box.

---

## 4. Library survey

### Astrology / ephemeris calculation

| Library | Computes | License | Verdict |
|---|---|---|---|
| **astronomy-engine** | Planet positions, `EclipticLongitude()` = true ecliptic-of-date longitude. ±1 arcminute, any date for millennia. Zero dependencies. | **MIT** | ✅ **Recommended.** |
| **circular-natal-horoscope-js** | Full natal chart: 10 planets + Chiron/Sirius, N/S Node, Lilith, Ascendant, MC, 12 house cusps, aspects w/ configurable orbs. Tropical + sidereal. 7 house systems. Auto-derives timezone + historical DST from lat/lon. TS-friendly. | Check repo | ✅ **Recommended for Tier 3.** |
| **sweph** (Swiss Ephemeris) | Gold-standard accuracy | ⚠️ **AGPL-3.0** (≤2.10.0 GPL-2.0) | ⚠️ **Avoid** unless you buy the license. |

**The Swiss Ephemeris licensing trap — flagging this early because it bites people late.** `sweph`
is AGPL-3.0 from v2.10.1 on. AGPL forces you to open-source your *entire* application, and the
network clause means that applies even to a hosted web app that nobody downloads. The escape hatch
is Astrodienst's Professional Edition — **CHF 700 one-time, 99-year validity, signed contract** —
which then permits LGPL-3.0 use. It's the most accurate option and the fee is honestly reasonable,
but it's a deliberate decision, not a default. For this project's needs, **±1 arcminute from
MIT-licensed astronomy-engine is far more precision than sign placement requires** — a sign is 30°
wide, so you'd need to be off by ~1800 arcminutes to land in the wrong one.

Practical split: **astronomy-engine** for planetary longitudes (`Math.floor(longitude / 30)` → sign
index), **circular-natal-horoscope-js** when you want Ascendant + houses without hand-rolling
sidereal-time math (astronomy-engine does *not* compute houses or the Ascendant).

Sources: [astronomy-engine](https://github.com/cosinekitty/astronomy) ·
[CircularNatalHoroscopeJS](https://github.com/0xStarcat/CircularNatalHoroscopeJS) ·
[sweph licensing](https://github.com/timotejroiko/sweph/blob/main/README.md) ·
[Swiss Ephemeris](https://www.astro.com/swisseph/swephinfo_e.htm)

### Graph rendering

| Library | Rendering | Custom styling | Fit |
|---|---|---|---|
| **react-force-graph-2d** | HTML Canvas | `nodeCanvasObject(node, ctx, scale)` + `linkCanvasObject`, each with `before`/`after`/`replace` modes | ✅ **Recommended** |
| react-force-graph-3d | ThreeJS/WebGL | `nodeThreeObject` | Overkill; adds a 2nd WebGL context |
| cytoscape.js | Canvas | Stylesheet-based | Built for large-scale analysis; styling is less free-form |
| d3-force (raw) | Bring your own | Total control | Most work; viable if the wheel layout makes physics moot |

`react-force-graph-2d` wins because `nodeCanvasObject` hands you **the raw 2D context** — you draw
the glow yourself with `ctx.shadowBlur` / radial gradients, which is exactly what a star-node needs.
Layout forces are reachable via `d3Force('link')` for distance control, and `dagMode` supports
`radialout` / `radialin`. MIT licensed. At ~13–30 nodes, performance is a non-issue, so optimize
purely for styling freedom.

Sources: [react-force-graph](https://github.com/vasturiano/react-force-graph)

---

## 5. Starry-night theme

### Techniques, cheapest first

1. **CSS `box-shadow` starfield** — one element, hundreds of tiny dots generated as a comma-separated
   `box-shadow` list; 3 layers translating at different speeds gives real parallax, plus a drifting
   nebula gradient and keyframe twinkle. Effectively free at runtime (GPU-composited transforms), no
   canvas context.
2. **Canvas 2D particle starfield** — needed only if you want interactivity (stars reacting to
   cursor) or thousands of independently-twinkling particles.
3. **tsParticles** (`@tsparticles/preset-stars`) — official blinking-stars preset, React component,
   modular imports keep the bundle small. Good if you want it configurable without writing it.
4. **Three.js `THREE.Points` + UnrealBloom** — genuinely beautiful, and genuinely overkill here.
   Skip it.

**Performance gotcha worth designing around:** the graph canvas and an animated background canvas
are two independently-animating layers. Keep the background **CSS-only** (option 1) so there's
exactly *one* JS animation loop — the graph's. Mixing two `requestAnimationFrame` loops plus a
WebGL context is the standard way these pages get janky on mobile.

Sources: [CSS parallax starfield](https://codepen.io/sarazond/pen/LYGbwj) ·
[resizable parallax starfield](https://codepen.io/kylehenwood/pen/XXdrJM) ·
[tsParticles stars preset](https://particles.js.org/samples/presets/stars.html) ·
[tsParticles](https://github.com/tsparticles/tsparticles)

### Visual direction

The dominant convention in this space (Co-Star being the reference point) is **stark, minimal, and
high-contrast** — near-black backgrounds, restrained type, monochrome with sparing accent — rather
than the purple-gradient "mystical" cliché. That restraint is also what makes the *data* legible:
if the background is busy, a glowing node graph has nothing to glow against.

Proposed palette:

```
--void:      #0A0E27   /* deep navy-black page base   */
--nebula:    #1B1035   /* indigo, for gradient depth  */
--starlight: #F4F1EA   /* warm off-white — primary text */
--gold:      #E8C87E   /* accent: user's own node     */
--harmony:   #7FD8C4   /* teal-cyan: harmonious edges */
--tension:   #E87E9B   /* rose: challenging edges     */
--dim:       #6B7394   /* muted slate: secondary text */
```

Harmonious/challenging as **teal vs. rose** rather than green/red — it reads as celestial rather
than as a spreadsheet, and stays distinguishable for the most common forms of color blindness (never
encode aspect quality in hue *alone*; pair it with line weight, dash pattern, or an icon).

**Accessibility on dark backgrounds:** WCAG AA needs 4.5:1 for body text — `--dim` on `--void` must
be verified and probably lightened for anything smaller than headings. Pure `#FFF` on pure `#000` is
actively uncomfortable (halation), which is why `--starlight` is warm off-white. Also: the twinkle
and parallax animations must respect `prefers-reduced-motion`.

Typography: a high-contrast serif for sign names / display (celestial, editorial) against a geometric
sans for UI and data labels. Zodiac glyphs (♈–♓) are Unicode, so no icon font needed — but they
render inconsistently across platforms, so consider inlining SVG glyphs.

---

## 6. Recommended stack

```
React + TypeScript + Vite
├── astronomy-engine ............ planetary longitudes (MIT, zero-dep, offline)
├── circular-natal-horoscope-js .. Ascendant + houses (Tier 3 only)
├── react-force-graph-2d ......... constellation view (canvas, nodeCanvasObject glow)
├── custom SVG/canvas ............ zodiac wheel view (canonical layout)
└── CSS box-shadow starfield ..... background (no JS loop)
```

**Everything runs client-side.** No backend, no API keys, no accounts — birth data never leaves the
device, which is both the simplest architecture and the right privacy posture for data this
personal. Deployable as a static site.

### Build order

1. **Pure scoring engine first** — `signs.ts` (element/modality/degree tables) + `compatibility.ts`
   (the Layer 1+2 algorithm). No UI, no dependencies, fully unit-testable. The whole product lives
   or dies on this being right, and it's verifiable against published compatibility tables.
2. **Zodiac wheel view** with Tier 1 (date-only → Sun sign). End-to-end value, minimal surface.
3. **Theme pass** — starfield, palette, glow.
4. **Tier 2/3** — birth time & location unlock Moon/Rising and re-weight edges.
5. **Constellation mode** — force-directed toggle.

---

## 7. Verification notes

The chart engine is checked against Einstein's chart (14 Mar 1879, 11:30 LMT, Ulm) — an AA
birth-certificate rating, published identically across every major astrology site, so it is a real
external check rather than a self-consistency test.

| Body | Computed | Published | Δ |
|---|---|---|---|
| Sun | 23°30′ Pisces | 23°30′ Pisces | exact |
| **Ascendant** | **11°38′ Cancer** | **11°38′ Cancer** | **exact** |
| Mars, Jupiter, Saturn, Uranus, Neptune | — | — | exact |
| Mercury, Venus, Pluto | — | — | 1′ |
| Moon | 14°31′ Sgr | 14°23′ Sgr | 8′ |

The Ascendant matching to the arcminute is the meaningful one — it exercises sidereal time,
obliquity and the horizon formula together, and it moves ~1° every 4 minutes, so it cannot match by
luck.

### Three traps worth remembering

**`EclipticLongitude()` is heliocentric.** Astrology needs geocentric. The correct path is
`Ecliptic(GeoVector(body, time, true)).elon`, with `SunPosition()` as a special case since the Sun
cannot be measured from itself. Using the obvious-looking function silently produces wrong charts —
the values look plausible, just wrong.

**Placidus below the horizon uses a different semi-arc.** Cusps 11 and 12 divide the semi-*diurnal*
arc, `arccos(−sin RA · tan φ · tan ε)`; cusps 2 and 3 divide the semi-*nocturnal* arc, which is the
same expression with the sign flipped. Both collapse to 90° when the argument is zero, so the error
is invisible at the equator and at first glance — it shows up only as lopsided house widths (a 52°
first house next to a 21° second). Placidus widths should vary *smoothly*; a discontinuity means the
wrong arc. There is a regression test asserting exactly this.

**IANA pre-dates standard time badly.** For births before a region adopted standard time (Germany:
1893), `Europe/Berlin` resolves to *Berlin's* local mean time (+53:28), not the birth city's. Ulm at
10°E is +40 min — a 13-minute error, which moves the Ascendant ~3°. For historical charts, convert
LMT by longitude by hand and pass UTC explicitly.

### A framing note

Astrology has no empirical predictive validity. That doesn't make this a bad project — it's a
genuinely lovely data-visualization problem over a rich, well-structured symbolic system with real
cultural meaning. But it does mean the copy should sit in the register of *exploration and
reflection* rather than claims of fact. In practice that's a light touch: "Leo and Sagittarius share
a fire trine — traditionally read as easy, energizing" lands better than "you are 90% compatible."
The sourcing is more interesting than a bare number anyway, and it's the difference between a toy
and something people find genuinely engaging.
