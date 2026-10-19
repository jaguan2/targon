# Targon

A birth chart, and the distances between signs.

The midnight observatory refresh is implemented: a split introduction, guided
birth intake, a profile overview, and compatibility highlights above the chart.
First-time setup asks for name, birthday, birth time and birthplace in four
steps, with an unknown-time option and preserved answers when going back.
See [design notes](docs/DESIGN-REFRESH.md) and [verification](docs/TEST-REPORT.md).

Enter your birth data and Targon computes a real natal chart from an ephemeris,
then shows how each of the twelve signs sits relative to it — as a zodiac wheel
and as a force-directed constellation.

Everything runs locally. No API, no accounts, no network. Birth data never
leaves the device.

The **Profile** tab shows Sun, Moon, Rising, Descendant, Midheaven, Imum Coeli,
and planetary placements. Edit your name and birth details there, or opt in to
remembering the profile on this device. Unknown birth times produce clearly
labelled estimates; time-dependent angles and houses stay unavailable.

The **Friends** tab lets you add, edit, compare, and remove local birth profiles.
It compares selected placements across both charts, with Friendship, Overall,
and Romantic lenses. Known birth times enable degree-based aspects; missing
times use a clearly labelled, provisional sign comparison. Removal has an Undo
action. The profile's remember preference also controls friends' persistence.

The **Compatibility** tab remains an exploration of your chart against twelve
generic signs. See [the friends model](docs/FRIENDS.md) for the two-person scoring
rules and their limits.

See [the profile and logic audit](docs/PROFILE-LOGIC.md) for required inputs,
timezone handling, research sources, validation, and remaining limitations.

## Running it

Use Node.js 22.12 or newer (`.nvmrc` selects version 22).

```bash
npm ci

npm run dev:web    # browser app with hot reload → http://127.0.0.1:5173
npm run dev:desktop # desktop app with hot reload
npm test           # domain, rendering, and profile interaction tests
npm run test:desktop # desktop navigation policy tests
npm run typecheck  # strict TypeScript, no emit

npm run app        # build, then open as a desktop window
npm run package:web # build a ZIP ready for static web hosting → release/
npm run dist:win   # build the Windows x64 installer + portable .exe → release/
```

`npm run dist` produces two artifacts in `release/`:

| File | What it is |
|---|---|
| `Targon-0.1.0-setup.exe` | NSIS installer, lets you choose the install directory |
| `Targon-0.1.0-portable.exe` | Single self-contained executable, no install |
| `Targon-0.1.0-web.zip` | Website files for static HTTPS hosting (from `npm run package:web`) |

The desktop launcher handles `ELECTRON_RUN_AS_NODE` inherited from Electron-based
terminals automatically. `npm run dev` and `npm run dist` remain aliases for the
original development and Windows-release workflows.

The same application works on the web and in the Windows package. Saved profiles
and friends belong to the current browser or desktop application; they do not
automatically sync between the two. See [distribution instructions](docs/DISTRIBUTION.md)
for hosting, startup checks, desktop signing, and data-storage behavior.

## Layout

```
src/
  domain/          pure logic, zero UI, fully unit-tested
    types.ts         shared vocabulary
    signs.ts         the twelve signs: element, modality, ruler, glyph
    bodies.ts        planets and points, with their scoring weights
    aspects.ts       angular relationships and orbs
    chart.ts         natal chart computation (ephemeris, angles, houses)
    compatibility.ts the scoring model
    profile.ts       name and pronouns — no effect on any calculation
  ui/              React components, SVG rendering, layouts
electron/
  main.cjs         desktop shell
docs/
  RESEARCH.md      the research and design decisions behind all of it
```

The domain layer has no imports from `ui/`, and is where essentially all the
logic lives. It can be tested — and reasoned about — without rendering anything.

## Accuracy

Planetary positions come from [astronomy-engine](https://github.com/cosinekitty/astronomy)
(MIT, zero dependencies), accurate to about an arcminute. Houses, the Ascendant
and the Midheaven are computed here; see `docs/RESEARCH.md` §7 for the formulae
and for the three traps that are easy to get subtly wrong.

Validated against Einstein's chart (an AA birth-certificate rating): Sun and
Ascendant match the published values exactly, most planets to the arcminute.

## A note on what this is

Astrology has no predictive validity, and the app does not pretend otherwise.
It is a data-visualisation project over a rich, well-structured symbolic system:
the zodiac is genuinely a distance graph, where the angular separation between
two signs determines the traditional reading of their relationship. That is a
real and rather elegant structure, and it is what the app draws.

Every score is shown with its reasoning — which aspect, which shared element,
which placement drove it — rather than presented as a bare number.
