# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm install` — install dependencies
- `pnpm dev` — run the full local stack: Vite frontend (`:5173`) + `local-api-server.js` (`:3000`) together via `concurrently`. Vite proxies `/api/*` to the local API server (see `vite.config.ts`).
- `pnpm vite` — frontend dev server only
- `pnpm api` — local API server only (`local-api-server.js`)
- `pnpm build` — production build to `dist/` (also what Vercel runs via `vercel-build`)
- `pnpm preview` / `pnpm start` — serve the built `dist/`
- `pnpm lint` — ESLint. Only covers `**/*.{js,jsx}` (see `eslint.config.js`); the TypeScript files under `src/collage-studio/` are not linted by this command.
- There is no test suite in this repo (no test script, no test files) — don't assume one exists.
- Collage Studio's local backend (separate from the rest of the stack — see below):
  - `make collage-install` — one-time: creates `collage-studio-backend/.venv`, installs `requirements.txt`
  - `make collage-start` — runs uvicorn on `127.0.0.1:8756` in the background
  - `make collage-stop`
- `pnpm dotenv -e .env -- pwsh ./scripts/getRefreshToken.ps1` — regenerate the Dropbox refresh token (only needed if Dropbox scopes/tokens change)

## Architecture

### Two deployables in one Vercel project

- **Frontend**: Vite + React, plain JS/JSX (not TypeScript, except see Collage Studio below), routed with `react-router-dom`. Entry is `src/main.jsx` → `src/App.jsx` → `src/components/Main.jsx`, which owns the `<Routes>` table and the light/dark theme class on `<html>`.
- **Backend**: Vercel serverless functions under `api/`, one file per route, each a plain `export default function handler(req, res)` — no Express, no framework, just Vercel's own file-based-routing convention (`api/videos/[playlistId].js` → dynamic `:playlistId`).
- `local-api-server.js` re-implements that same file-based routing locally for dev: it walks `api/` recursively, rewrites `[param].js` segments to Express `:param` routes, and mounts every handler on an Express app on port 3000. This is the only thing `pnpm dev`'s API half runs — add new endpoints as another file under `api/`, not as routes in this server.

### Content lives in Dropbox, not a database

- All photos, videos, and site copy live in a Dropbox account — nothing is stored in this repo or in a database. `api/services/catalogLoader.js` walks the Dropbox file tree and reads sibling config files expected at the Dropbox root: `categories.yml` (category → folder + required access level), `playlists.yml` (YouTube playlist IDs), `about.html`, `quotes_list.txt`, and `access.yml` (per-user hashed codes + access levels).
- `api/catalog.js` exposes all of this as `GET /api/catalog`; the frontend (`src/lib/catalog.js`) fetches it wholesale rather than talking to Dropbox directly. YouTube playlist videos are fetched separately per playlist (`api/videos/[playlistId].js` → `api/services/youtube.js`) using the YouTube Data API.
- Dropbox auth is a long-lived refresh token exchanged server-side for short-lived access tokens (`api/services/auth.js`) — there's no interactive Dropbox login.

### Access control is a custom code system, not Supabase

- `@supabase/supabase-js` is a dependency, but nothing under `src/` or `api/` currently uses it — don't assume the Supabase-backed admin panel described in `README.md` is implemented; it isn't present in this branch.
- What actually gates content: `categories.yml` marks some categories as requiring an access level. `src/components/CategoryRoute.jsx` checks `sessionStorage` first (`src/lib/access.js`); if access hasn't been granted this session, it shows `Login.jsx` to collect a user + code. The code is SHA-256'd client-side, POSTed to `/api/verify`, and re-derived server-side with PBKDF2-SHA512 against the stored hash in `access.yml` (`api/verify.js`). Grants are session-only (`sessionStorage`), never persisted.

### Collage Studio: session-only, no local filesystem access anywhere

- `src/collage-studio/` + `collage-studio-backend/` implement a browser-based photo collage editor, merged into this site as the `/collage-studio` route. `src/components/Main.jsx` special-cases that path to skip the site's `Header`/`Footer` chrome.
- **Nothing in this subsystem touches local disk, on either side.** Images enter purely via drag-drop or a file picker (works with Explorer/Finder, or the Gallery/Photos picker on mobile) and live only in an in-memory, session-scoped image pool (`state/imagePoolStore.tsx`), keyed by a `name|size|lastModified` fingerprint rather than a path or random ID — so re-dropping the same original file (e.g. after reopening a saved layout) automatically resolves to the same key. "Save"/"Open" are plain browser file download/upload of a layout-only JSON (no image bytes); "Export" is the one operation that calls the backend, POSTing the doc + the actual image bytes to render the final JPEG.
- The backend (`collage-studio-backend/`, Python/FastAPI + Pillow) is still **never deployed** and only ever runs locally, bound to `127.0.0.1:8756` — but now purely because that's simplest for a personal tool, not because it needs filesystem access: it's stateless and disk-free, just a `POST /api/export` render endpoint. The deployed frontend's browser calls it directly, cross-origin. If the production domain ever changes, update the CORS allowlist in `collage-studio-backend/app/main.py` to match.
- The app supports multiple open collages at once as tabs (`state/collageStore.tsx` holds a dict of docs, each with its own undo/redo + dirty flag); `useCollageStore()` still exposes an active-doc-shaped surface (`doc`, `editDoc`, `selectedFrameId`, ...) so most components don't need to know tabs exist.
- Confirm/prompt dialogs go through `state/dialogStore.tsx` (`useDialog()`), not native `window.confirm`/`prompt` — those don't work in some embedded webviews (e.g. VS Code's Simple Browser).
- Its stylesheet (`src/collage-studio/collage-studio.css`) is scoped under a `.collage-studio-page` ancestor class specifically so it can't leak into the rest of the site's Tailwind styling — keep any new global-looking selectors there scoped the same way.
- This is also the only TypeScript in the repo; the root `tsconfig.json` only `include`s `src/collage-studio/**/*.{ts,tsx}` on purpose, and `pnpm build` (esbuild) strips types regardless — `tsc` is not wired in as a build gate.
- Full architecture writeup: `docs/collage-studio.md`.

### Styling

- Tailwind CSS, dark mode via a `dark`/`light` class toggled on `<html>` (persisted to `localStorage`). Tailwind's `content` globs only cover `src/**/*.{js,jsx,ts,tsx}` (see `tailwind.config.ts`) — Collage Studio deliberately uses its own plain CSS instead of Tailwind utility classes.
