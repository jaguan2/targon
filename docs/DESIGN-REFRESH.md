# Star → Targon: design research and refresh brief

Reviewed October 18, 2026. The product was subsequently renamed Targon on
October 19; references to Star below describe the earlier design stages.

## Implementation update — October 19, 2026

The midnight observatory refresh is now implemented. The research and original
baseline below are retained as context, rather than a description of today's UI.

First-time onboarding has since been refined into a four-step wizard: Name,
Birthday, Birth time and Birthplace. Each screen asks one main question, with a
numbered progress indicator, Back navigation, completed-step links, and a final
answer summary. Friend entry and profile editing retain their compact flow.

- A compact brand header replaces the large centered masthead. Ink surfaces,
  ivory serif headings, brass actions, restrained stars and fine borders carry
  the identity without repeated glows or frosted panels.
- Introduction and birth intake use a split desktop composition with original
  SVG orbital art. The illustration is explicitly decorative, independent of
  calculated charts. Narrow layouts remove it and put the form in one column.
- The first step explains the product, keeps name optional, puts pronouns in a
  disclosure, and uses a stable Continue action. A step indicator shows progress.
- Birth intake adds an explicit unknown-time choice, filtering of the 32-city
  offline list, a birthplace timezone preview, and contextual chart availability.
  Coordinates and timezone/clock-change controls remain available.
- The profile leads with the six principal signs/angles. Birth details and
  saving controls sit beside the chart on desktop; full planetary degrees,
  houses and retrogrades expand on demand. Related actions open Compatibility
  and Friends directly.
- Compatibility lenses sit above both charts and rankings. Three strongest sign
  connections appear first, followed by the interactive chart and all twelve
  rankings. Selected modes update all of these from the same calculation.
- Zodiac symbols request text presentation, and the site now has a matching SVG
  favicon. Assets and system-font fallbacks work offline; no remote fonts or
  images are required.

The app and release names are now Targon; storage identifiers and the installer
identity remain compatible with Star. See [rename notes](TARGON-RENAME.md).
Verification details are in [the test report](TEST-REPORT.md).

## Baseline before the profile implementation

This is a working local React/TypeScript application with an Electron desktop
shell. It has a two-step introduction, natal chart computation, an interactive
zodiac wheel, a constellation view, placement tables, and rankings for overall,
romantic, and friendship compatibility. Baseline verification: all 139 tests
passed and `npm run build` succeeded.

The current scoring compares one person's chart with each of twelve generic
signs. Friend profiles, saved sessions, and comparisons between two people's
charts have not been implemented. The current session lives in React state and
is lost on reload. The design should leave room for those later features without
presenting them as available now.

The immediate priority is visual design and onboarding, as selected by the user.
This document records research and a proposed direction; it does not implement
the overhaul.

The subsequent profile implementation adds Profile/Compatibility navigation,
editable birth details, optional local saving, uncertainty labels, Descendant
and Imum Coeli, and an initial midnight palette. See [the logic audit](PROFILE-LOGIC.md).
The baseline observations below describe the app before that implementation;
the full visual overhaul remains a later pass.

The [Friends implementation](FRIENDS.md) subsequently adds local people profiles
and a comparison detail view; the baseline gaps below are retained as research
history.

## Reference shortlist

These are design references, not endorsements of their astrology claims. The
observations below distinguish published visual references from our proposals.
Public website content, portfolio case studies, and selected published images
were reviewed; authenticated app flows were not tested. Some portfolio images
represent earlier versions of the referenced sites.

| Reference | Observed approach | Application to Targon |
| --- | --- | --- |
| [Co–Star](https://www.costarastrology.com/) | Published homepage imagery uses a monochrome palette, serif display type, small utilitarian labels, fine grid lines, and a clear focal point. | Strong typography and deliberate contrast between display text and chart data. Give each screen one clear action. |
| [CHANI](https://www.chani.com/) · [Awwwards visual reference](https://www.awwwards.com/sites/chani-1) | The published 2025 reference combines paper textures, hand-drawn marks, playful typography, and small color accents. | Create a recognizable illustration language and a warmer introduction. Keep decorative texture away from dense chart labels. |
| [The Pattern](https://www.thepattern.com/) | The public site organizes its offer around self-understanding and relationships, with plain-language descriptions of connections and challenges. | Explain what a compatibility reading means before asking someone to interpret aspects, degrees, or weighting. |
| [Starheal / By Emily Jane](https://www.byemilyjane.com/blog/astrologer-squarespace-website) | The designer combines dark framing, sunset imagery, pale marble textures, layered photography, and generous display typography. | Use one memorable atmospheric composition on the introduction, with controlled contrast and generous spacing. |
| [Pomegranate Astrology / Willful Studio](https://www.willful.studio/portfolio/pomegranate-astrology-squarespace-website) | The portfolio emphasizes classic typography; its published imagery pairs ivory text and dark botanical photography with a warm dark surface. | Build a richer reading experience through typography and art direction. Long interpretations need room to breathe. |
| [Oroiael / Goodglyph](https://goodglyph.com/en/portfolio/oroiael) | The case study documents a book-inspired identity with cream and dark modes, Spectral typography, and chart diagrams. | Treat the chart and the written interpretation as parts of the same visual system. |

For onboarding specifically, [Ashley Dager's CHANI case study](https://www.ashleydager.com/chaniproject)
describes beginner confusion around terminology and proposes contextual
education. Its findings concern that project's participant group, not Targon's
users. The useful design hypothesis here is to explain Sun, Moon, Rising, and
aspects at the moment someone encounters them, then validate this with our own
users.

## Assessment of Star's current design

This assessment comes from the components and styles in the repository; the
running application was not visually inspected in this research pass.

- The page uses a centered masthead followed by similarly styled rounded,
  translucent panels. The hierarchy gives the introduction, chart, detailed
  table, and rankings similar visual emphasis.
- The twilight blue gradients, animated stars, pale accents, and repeated glow
  effects establish a celestial theme, but need a more distinctive composition
  and typography system.
- The first step asks for name and pronouns before showing the value of the
  product. Those fields are optional, but the opening could explain what the
  visitor will discover and show a preview.
- The results put the large chart and a detailed placement table before the
  compatibility ranking. A compatibility product should surface its main
  reading sooner.
- The controls offer Overall, Romantic, and Friendship lenses inside the ranking
  panel, even though those controls also change the chart above it. They should
  sit near the shared results heading.

## Three possible directions

| Direction | Character | Main references | Tradeoff |
| --- | --- | --- | --- |
| Midnight observatory — recommended | Ink navy, warm ivory, muted brass, precise orbital linework, large editorial headings | Co–Star's hierarchy; Starheal's atmosphere; Oroiael's chart/reading relationship | Requires a carefully composed chart and restraint with glow so it develops its own identity. |
| Celestial journal | Cream paper, ink typography, small illustrated celestial motifs, approachable copy | CHANI; Pomegranate's classic typography | Welcoming, with a softer mood than the proposed dark observatory direction. |
| Cosmic social space | Dark plum, expressive accent colors, compact personal summaries, connections as the main subject | The Pattern's relationship framing | Best suited to a later stage when saved people and actual comparisons exist. |

The recommended direction is an original composition using midnight surfaces,
large ivory headings, sparse celestial detail, and a chart as the main visual.
Gold should identify the user or the primary action; teal and rose can retain
their existing compatibility meanings. Avoid applying a glow or translucent
container to every element.

Provisional palette for mockups, subject to contrast checks:

| Role | Color |
| --- | --- |
| Page | `#0C1220` |
| Elevated surface | `#151E2F` |
| Main text | `#F1EBDD` |
| Secondary text | `#ABB4C5` |
| Primary accent | `#D8BC80` |
| Harmony | `#91CDBD` |
| Tension | `#DCA0AF` |

Pair a characterful serif heading family with a neutral sans-serif for inputs
and explanations. Use tabular numerals for degrees and scores. Bundle fonts
locally to preserve offline operation. Make layout, spacing, and type carry the
identity before adding more imagery.

## Proposed first screens

1. **Introduction and identity.** On desktop, use a split composition: a short
   headline and a large, clearly illustrative celestial chart on one side, a
   compact profile form on the other. Suggested headline: “Discover how your
   stars connect.” Explain that today's app explores the user's chart against
   the twelve signs. Keep name optional and move optional pronouns into a quiet
   disclosure. Use a stable “Continue” action. On mobile, show the form near the
   top and reduce the decorative illustration.
2. **Birth details.** Lead with the date, then optional time and place. Explain
   why each field helps. Offer an explicit unknown-time choice. Preserve all
   inputs when moving back. Replace manual coordinate entry as the common
   fallback with a better offline city-search experience when feasible.
3. **Results overview.** Show a short personalized introduction, the Big Three,
   and the strongest sign connections before the detailed placement table.
   Place relationship lenses above both the visualization and rankings. Let
   visitors expand the technical chart details as needed.

The redesign must reflect the engine's actual uncertainty. It currently
calculates the Moon even without a supplied time, using assumed noon, so
“unlocks the Moon” is misleading. A time with no place defaults to UTC, which
needs an explicit explanation or a timezone choice. Selecting a place with no
time currently blocks submission; revisit that behavior so an unknown time
remains a supported path. The date currently starts at July 4, 1990; a real
birth-date field should start empty, with sample data offered separately if
desired.

## Implementation order and review criteria

First produce desktop and mobile mockups of the introduction and birth-details
screens in the recommended direction. Then update shared colors, typography,
spacing, forms, focus states, and responsive layout in the existing app. Follow
with results hierarchy and chart styling. Rename the product in a separate
later pass, including package metadata and desktop artifacts.

Review at mobile and desktop widths, with keyboard navigation and reduced
motion. Check long names, missing birth time/place, back navigation, validation
errors, chart label readability, and text contrast. Keep visible names beside
zodiac symbols and explanations beside scores. Clearly label illustrative
previews and assumed birth times. Retain local calculations and offline assets.

The first implementation pass is complete when the opening communicates the
product's purpose, the form works with partial birth information, and the
results give compatibility a clear visual priority while keeping detailed
chart information accessible.
