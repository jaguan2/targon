# Architecture

Targon uses TaskNook's frontend folder conventions, with a React/Vite application
in `frontend/` and desktop tooling outside it. All chart calculations run on the
device. There is no server or API layer.

## Frontend boundaries

| Location | Responsibility |
| --- | --- |
| `frontend/src/main.tsx` | React startup and stylesheet import |
| `frontend/src/App.tsx` | Application shell, active tab, and edit navigation |
| `frontend/src/components/` | Profile, friends, onboarding, compatibility and SVG views |
| `frontend/src/hooks/` | Workspace lifecycle, compatibility selection and node animation |
| `frontend/src/lib/` | Chart computation, scoring, saved-data codecs, form validation, geometry and catalogs |
| `frontend/src/services/` | Browser storage reads, writes and removal |
| `frontend/src/styles/` | Application CSS |
| `frontend/src/assets/` | Bundled sky artwork and source attribution |
| `frontend/src/types/` | External module declarations |

Use relative imports within a folder and the `@/` alias across frontend layers.
Keep tests beside the behavior they exercise. Pure rules belong in `lib/`, which
must not import React, browser APIs, components, hooks or services. Hooks may
combine library rules with services and React state. Components consume those
rules and hooks to render the interface.

`useWorkspace` owns the current profile, derived chart, friends, remember
preference, and storage/error notices. `App` owns tabs and edit visibility.
`CompatibilityView` uses `useCompatibility` to keep the highlights, chart and
ranking in the same lens. Local form and friend-selection state stays in the
components that use it.

## Persistence

All production `localStorage` access goes through `services/storage.ts`. It lets
storage errors reach `useWorkspace`, where each action provides appropriate
feedback. Profile and friend updates remain usable in memory after a failed
write; the app reports that the saved copy is stale. Clearing a remembered
profile requires successful removal of its saved copy.

`lib/savedProfile.ts` and `lib/friends.ts` validate and encode the saved inputs.
Charts are recalculated when loading, never stored. Keep the `star.profile.v1`
key and version 1/version 2 decoding compatible with existing profiles. Invalid
friends must not prevent recovery of a valid owner, and recovery must not
overwrite the saved copy until the user saves changes.

The desktop application identity remains `com.jason.star`, and its user-data
directory remains `Star`, so the source move does not relocate saved data.

## Tooling and distribution

Install with `npm ci` at the repository root. The root `package.json` declares
the frontend workspace and provides the existing development, test and release
commands. Frontend libraries and testing tools belong in `frontend/package.json`;
Electron and packaging tools belong at the root. Vite is also a root development
dependency because the desktop launcher uses its server API directly.

Vite builds `frontend/dist/` with relative asset URLs. The web ZIP collects that
directory, and Electron loads `frontend/dist/index.html` from the same location
in both local and packaged builds. The desktop dev launcher starts Vite with
`frontend/` as its root. Release artifacts still go to `release/`.

From the root, verify changes with `npm test`, `npm run test:desktop`,
`npm run typecheck`, and `npm run package:web` followed by `npm run smoke:web`.
For changes to desktop/build paths, run `npm run dist:dir` followed by
`npm run smoke:desktop`. See [distribution](DISTRIBUTION.md) for full releases.

## Previous locations

| Previous | Current |
| --- | --- |
| `src/domain/` | `frontend/src/lib/` |
| `src/ui/*.tsx` | `frontend/src/components/` |
| `src/ui/use*.ts` | `frontend/src/hooks/` |
| `src/ui/birthDetails.ts`, `cities.ts`, `layout.ts`, `starLayers.ts` | `frontend/src/lib/` |
| State and persistence inside `src/App.tsx` | `frontend/src/hooks/useWorkspace.ts` and `frontend/src/services/storage.ts` |
| Compatibility results inside `src/App.tsx` | `frontend/src/components/CompatibilityView.tsx` |
| `src/styles.css` | `frontend/src/styles/index.css` |
| Root `index.html`, `public/`, Vite and TypeScript config | `frontend/` |
| `dist/` | `frontend/dist/` |
