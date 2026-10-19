# Web and Windows distribution

Star uses one React/TypeScript application for both delivery formats. Vite builds
the static web assets in `dist/`; Electron packages those same assets into a
Windows application. Profile, Friends, chart calculations and comparisons run
in both versions. No backend is needed for the current local-data features.

Product names and installer IDs remain Star until the planned Targon rename.

## Development

Use Node.js 22.12 or newer; `.nvmrc` selects major version 22. The installed
Electron tooling requires that runtime. Install dependencies with `npm ci`.

| Command | Purpose |
| --- | --- |
| `npm run dev:web` | Browser development at `http://127.0.0.1:5173` by default |
| `npm run dev:desktop` | Electron with hot reload, backed by a loopback Vite server on port 5174 |
| `npm run app` | Build and run the desktop version from local production assets |
| `npm test` | Application logic, rendering, and user-flow tests |
| `npm run test:desktop` | Desktop URL/navigation policy tests |

The desktop launcher removes `ELECTRON_RUN_AS_NODE` from the child environment.
Electron-based terminals can set that flag, causing a direct `electron .` call
to run as Node and close before creating a window. No change to the user's
global environment is necessary. Closing the development app also stops its
Vite server.

## Web release

Run `npm run package:web` to create the web build and
`release/Star-0.1.0-web.zip` (the filename follows the package version).

The ZIP contains `index.html` and its assets at the root. Extract it and upload
those contents to static HTTPS hosting. Alternatively, build directly on the
hosting provider with `npm ci` and `npm run build:web`, using `dist` as the output
directory. Examples of suitable static hosting are documented in
[Vite's deployment guide](https://vite.dev/guide/static-deploy.html).

Relative asset URLs support the current single-page app at a domain root or a
subdirectory, and also allow Electron to load the bundle from disk. There are
no pathname-based routes requiring a server rewrite in the current app. If
real URL routing is added later, revisit `base` and host fallback configuration.
Use HTTPS for public hosting, including secure browser APIs used for friend IDs.

For a local production preview, run `npm run preview:web` and visit the printed
loopback URL (normally port 4173). Vite preview is a verification server, not the
public production host. Double-clicking `dist/index.html` is not the supported
way to run the browser version.

`node scripts/smoke-web.mjs` checks the web ZIP over local HTTP at both `/` and
`/star/`, including the HTML's JavaScript and stylesheet references. Application
interaction tests are separate from those artifact checks.

## Windows release

On Windows, run `npm run dist:win` (or the existing `npm run dist` alias).
It builds the web UI and packages Windows x64 artifacts without publishing:

| Artifact | Purpose |
| --- | --- |
| `release/Star-0.1.0-setup.exe` | NSIS installer with a selectable install directory |
| `release/Star-0.1.0-portable.exe` | Self-contained launcher requiring no installation |
| `release/win-unpacked/Star.exe` | Unpacked application for testing; distribute the whole folder if using this form |

The installer and portable launcher include Electron and the web UI. End users
do not need Node.js, npm, a local web server, or a browser installation. The
current app's calculations and locally saved profiles work without a network
connection in the desktop version.

`npm run dist:dir` builds only the unpacked test application. Do not distribute
its `Star.exe` alone; its adjacent DLLs, resources and locale files are required.

`npm run smoke:desktop` runs an isolated, hidden startup check against the
unpacked executable. To check the portable artifact, pass its path:

```powershell
npm run smoke:desktop -- release/Star-0.1.0-portable.exe
```

The test uses a temporary user-data directory, verifies that the bundled React
UI and stylesheet load, then exits and removes the temporary test data. It does
not read or modify the user's real profile. This is an application startup
check, not an installer UI or full visual acceptance test.

The binaries are unsigned unless release signing credentials are supplied.
No signing credentials or automatic update service are configured. Public
distribution should add publisher signing and a deliberate update process;
see [Electron's distribution overview](https://www.electronjs.org/docs/latest/tutorial/distribution-overview).
The current scripts build local artifacts only and never upload a release.

## Saved data and product boundaries

Browser storage belongs to the site's origin and browser profile. Changing the
domain, protocol, or port creates a separate store. Desktop storage belongs to
Electron's application profile, separate from the website. A portable executable
does not currently mean a portable profile stored beside the executable.

Profiles and friends therefore do not automatically sync between web, desktop,
devices, or browser profiles. A backup/import feature or account-based sync
would be additional work. Keep the desktop app ID and storage key stable when
planning the Targon rename, and test storage migration explicitly.

The web bundle is ready for hosting; producing it does not create a public URL.
Publishing requires choosing the hosting destination and uploading the build.

## Verification on October 18, 2026

Using Node 22.23.3, all 219 application tests and five desktop navigation tests
passed. The current Windows x64 installer and portable executable were built
successfully. Hidden startup checks passed for both the unpacked app and the
portable executable, confirming bundled-page loading, React mounting, initial
onboarding, and stylesheet loading with isolated test data. The web archive
passed HTTP asset checks at root and subdirectory paths. A local Vite production
preview also returned the built application successfully.

A production-browser walkthrough also covered onboarding, saved profiles and
friends, comparison modes, and chart switching. Three UI issues were corrected,
visually rechecked, and included in rebuilt artifacts. See the
[test report](TEST-REPORT.md) for coverage and limitations.

The generated desktop executable is unsigned. The installer wizard itself was
not run; no public website or downloadable release was uploaded. Checksums for
the three distribution artifacts are recorded in `release/SHA256SUMS.txt`.
