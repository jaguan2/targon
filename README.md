# Star

A birth chart, and the distances between signs.

Enter your birth data and Star computes a real natal chart from an ephemeris,
then shows how each of the twelve signs sits relative to it — as a zodiac wheel
and as a force-directed constellation.

Everything runs locally. No API, no accounts, no network. Birth data never
leaves the device.

## Running it

```bash
npm install

npm run dev        # web app with hot reload  → http://localhost:5173
npm test           # 139 unit tests
npm run typecheck  # strict TypeScript, no emit

npm run app        # build, then open as a desktop window
npm run dist       # build the Windows installer + portable .exe → release/
```

`npm run dist` produces two artifacts in `release/`:

| File | What it is |
|---|---|
| `Star-0.1.0-setup.exe` | NSIS installer, lets you choose the install directory |
| `Star-0.1.0-portable.exe` | Single self-contained executable, no install |

### If `npm run app` closes immediately

VS Code and other Electron-based hosts export **`ELECTRON_RUN_AS_NODE=1`** to
their child processes. That flag makes `electron.exe` behave as a plain Node
binary, so `require('electron')` returns a path string instead of the API and
the app exits before opening a window.

It is an artifact of the terminal, not a bug in the app — double-clicking the
built `.exe` from Explorer works fine. To run it from such a terminal:

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE   # PowerShell
npm run app
```

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
