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
frontend/              React + TypeScript + Vite workspace
  public/              static assets
  src/
    App.tsx            application shell and navigation
    components/        React views and SVG rendering, with interaction tests
    hooks/             workspace state, compatibility selection and animation
    lib/               pure chart/scoring rules, validation, geometry and data
    services/          browser storage boundary
    styles/            application stylesheet
    types/             third-party TypeScript declarations
  package.json         frontend dependencies and scripts
  vite.config.ts       web build and application test configuration
electron/              desktop shell, navigation policy and application identity
scripts/               desktop launcher, packaging and artifact smoke checks
docs/                  architecture, feature guides, research and verification
package.json           npm workspace, root commands and Electron packaging
```

This follows TaskNook's frontend organization: components render, hooks coordinate
state, services access browser systems, and `lib/` holds pure rules. The library
has no React or browser dependencies and can be tested without rendering anything.
The current app runs locally without a backend.

Run `npm ci` once at the repository root; npm manages the frontend workspace with
the shared root lockfile. All commands above still work from the root. You can
also run `npm run dev`, `npm test`, or `npm run build` from `frontend/`.
Web builds now land in `frontend/dist/`; release artifacts remain in `release/`.
See [architecture](docs/ARCHITECTURE.md) for module boundaries and the
[documentation index](docs/README.md) for the other guides.

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
