# Application test report

## Four-step onboarding — October 19, 2026

First-time profile setup now asks for Name, Birthday, Birth time and Birthplace
on separate screens. All 225 application tests pass, including the updated
profile lifecycle, full and unknown-time setup, completed-step navigation,
validation, midnight birth time, answer preservation, and final profile focus
and scroll position. The five desktop navigation policy checks also pass.

A production-browser walkthrough in Opera GX completed all four steps with a
synthetic QA Stepper profile, using a native date picker, the explicit unknown
time option, London city filtering, timezone preview, and the final answer
summary. It produced estimated signs and omitted time-dependent angles as
expected. A retained scroll position found at completion was corrected and
covered by a regression assertion for scroll reset and profile-heading focus.

The production build, web archive and Windows packages were rebuilt for this
flow. The web archive passes root/subdirectory asset checks; unpacked and
portable executable startup checks pass. Current artifact hashes are recorded
in `release/SHA256SUMS.txt`. Installer-wizard and physical mobile-device testing
remain outside this verification. No public deployment was performed.

## Design and profile refresh — October 19, 2026

Verified on Windows x64 with Node.js 22.23.3 after implementing the midnight
observatory refresh.

| Check | Result |
| --- | --- |
| Application suite | 223 tests passed across 13 files |
| Desktop navigation policy | 5 tests passed |
| TypeScript and production build | Passed |
| Final web ZIP at `/` and `/star/` | Entry page, JavaScript, CSS and SVG favicon load |
| Final unpacked and portable Windows executables | Both startup checks passed |
| Windows installer and portable build | Both rebuilt successfully |

New regression coverage verifies that explicit unknown time removes clock data
and its repeated-time occurrence, survives Back navigation, and produces a noon
estimate with unavailable Rising. It also checks that filtering cities preserves
the selected birthplace and that changing the compatibility lens updates the
highlights, chart and ranking together. All earlier profile and friend lifecycle
tests continue to pass.

The production build was reviewed in Opera GX using the existing synthetic
profiles on the isolated test origin. Desktop review covered the redesigned
profile, prefilled editing, intake, birthplace timezone preview, compatibility
highlights, and chart/ranking alignment. Fresh
onboarding and birth intake were also reviewed in DevTools' 400 × 650 responsive
viewport. This checks narrow layout in Chromium; it is not a physical-phone or
mobile-browser test. A missing favicon request found during review was corrected
with a bundled SVG icon and included in the release asset checks.

The refreshed artifacts replace the previous local packages. Their current
hashes are in `release/SHA256SUMS.txt`. The installer wizard, complete manual
desktop interaction flow, other browser engines, and comprehensive accessibility
testing remain outside this verification. No deployment was performed.

## Previous verification — October 18, 2026

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
