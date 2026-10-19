# Application test report

Tested October 18, 2026 on Windows x64 using Node.js 22.23.3.

## Automated checks

| Check | Result |
| --- | --- |
| Application suite (`vitest run`) | 219 tests passed across 13 files |
| Desktop navigation policy | 5 tests passed |
| TypeScript and production build | Passed |
| Web release archive at `/` and `/star/` | HTML, JavaScript and CSS served successfully |
| Unpacked Windows executable | Bundled page, React mount, onboarding and styles passed |
| Portable Windows executable | Bundled page, React mount, onboarding and styles passed |
| Windows installer and portable packaging | Both rebuilt successfully after the UI fixes |
| Diff whitespace check | Passed |

The application suite covers reference natal placements, chart angles and houses,
timezone and clock-change handling, incomplete birth information, compatibility
calculations, profile persistence, and friend creation, editing, removal, undo,
comparison modes and restoration. These tests validate the implemented symbolic
compatibility model; they do not establish predictive validity for astrology.

## Browser walkthrough

Used the production build in Opera GX on an isolated local origin
(`http://127.0.0.1:4187`). Synthetic profiles QA Mira and QA Alex were used;
existing profiles on other origins were not touched.

- Completed onboarding with a native birth-date picker and a selected birth city.
- Confirmed unknown birth time produces estimated placements and unavailable
  angles, with the birth city's timezone shown correctly.
- Opted into local saving and confirmed the owner and friend survived a reload.
- Added a friend and opened their comparison; Friendship and Romantic modes
  produced different indices and placement weights.
- Opened the compatibility chart and switched between the zodiac wheel and
  constellation views.
- Inspected compatibility rankings, friend editing, and cancellation of an
  unsaved friend draft.

Three issues discovered during the walkthrough were fixed and visually rechecked:

1. City dropdown options now use readable foreground and background colors.
2. Adding a friend focuses the name field and brings it into view.
3. Ranking bar colors now apply only to the bars, preserving readable sign names
   and scores.

The automated suites were rerun after these changes. The web archive, installer
and portable executable were rebuilt, and the final web and executable startup
checks passed. Artifact hashes are in `release/SHA256SUMS.txt`.

## Coverage limits

The Windows checks launch the real unpacked and portable executables with
isolated temporary data. They are startup checks; a complete desktop interaction
walkthrough and the installer wizard were not run. Mobile browsers, additional
browser engines, and a comprehensive accessibility audit were not tested.

The Windows artifacts are unsigned. No public deployment or release upload was
performed. Web and desktop profiles remain separate local stores without sync.
