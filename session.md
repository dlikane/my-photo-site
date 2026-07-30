# Collage Studio — session notes (post-migration)

Handoff doc, updated after moving Collage Studio out of the `handytools`
repo (`collage-studio/`, branch `feature/collage-studio`, commit `7025883`)
into `my-photo-site`, branch `feature/collage-studio` (this repo). The
original handoff doc (with full context on why things were built this way)
is preserved below under "Original session notes" — read that first if
you need the *why* behind the data model / rendering approach; this top
section only covers what changed in the move.

## What changed in the move

- **Frontend merged into this site**, not a separate app. Source now lives
  at `src/collage-studio/` and is wired in as a route, `/collage-studio`,
  in `src/components/Main.jsx` (bypasses the site's `Header`/`Footer` — see
  the `isCollageStudio` branch there — since the editor wants the full
  viewport, not the photography site's chrome). It shares this site's Vite
  dev server (`pnpm dev`, port 5173) and its `pnpm build`/Vercel deploy —
  there's no separate frontend build step anymore.
- **Backend stays local, unauthenticated, deployed nowhere.** It lives at
  `collage-studio-backend/` (sibling to `api/`, not inside it, so Vercel's
  zero-config Python detection never picks it up — it must never be
  deployed). It still binds `127.0.0.1` only and still has real local
  filesystem access (folder browsing, local collage/output storage) exactly
  as designed originally.
- **Why this split works without a tunnel:** the frontend is static/SPA
  content served from Vercel, but it runs in *your* browser on *your*
  machine. Its JS calls `http://127.0.0.1:8756` directly and cross-origin —
  browsers treat `127.0.0.1` as a secure context, so an `https://` page
  fetching `http://127.0.0.1:...` is allowed. This only ever works for
  whoever has the backend running locally; anyone else hitting
  `/collage-studio` gets a page that can't reach an API and does nothing
  useful. That's the deliberate access-control model — see "Access control"
  below.
  - `src/collage-studio/api/client.ts` now prefixes every request with
    `API_BASE` (`import.meta.env.VITE_COLLAGE_API_BASE ?? 'http://127.0.0.1:8756'`)
    instead of relative `/api/...` paths — relative paths would have hit
    this site's own `/api/*.js` Vercel functions, which is a different API
    entirely.
  - `collage-studio-backend/app/main.py` CORS now allow-lists explicit
    origins instead of the old dev-only localhost list: production
    (`https://www.dlikane.com`, `https://dlikane.com`), an
    `allow_origin_regex` for this project's Vercel preview URLs
    (`https://my-photo-site-git-*-dlikanes-projects.vercel.app` — confirmed
    via `vercel project ls`), and local dev ports 5173-5174. **Never widen
    this to `allow_origins=["*"]`** — this backend has real local
    filesystem access; wildcard CORS would let any site the user's browser
    visits reach it.
- **Access control: intentionally none.** Confirmed with the user: no login
  gate on `/collage-studio`, relying on the URL being unlisted plus the
  route being non-functional for anyone without the local backend running.
  Revisit if the route ever gets linked from site navigation.
- **CSS scoping added.** The original `index.css` had unscoped global
  selectors (`*`, `body`, `button`, `input`, `select`) that would have
  reskinned this site's Tailwind-based UI. Rewrote every rule in
  `src/collage-studio/collage-studio.css` under a `.collage-studio-page`
  ancestor (that class + `.app-shell` both sit on `CollageStudioApp`'s root
  div). If you add new global-looking selectors to this file, scope them
  the same way.
- **TypeScript added to this repo** for the first time (it was previously
  plain JS/JSX). Root `tsconfig.json` only `include`s
  `src/collage-studio/**/*.{ts,tsx}` — it's scoped narrowly on purpose so
  it can't affect type-checking assumptions for the rest of the (JS) site.
  `vite build` uses esbuild to strip types regardless of tsconfig, so this
  is for editor/type-check support only, not a build gate — `tsc` is not
  wired into `pnpm build`/`vercel-build`.
- **Local run instructions changed.** The frontend no longer needs its own
  install/dev/port — it's just part of `pnpm install` / `pnpm dev` now.
  Only the backend needs a separate process:
  ```
  make collage-install   # one-time: creates collage-studio-backend/.venv, installs requirements.txt
  make collage-start     # starts uvicorn on 127.0.0.1:8756 in the background
  make collage-stop      # stops it
  ```
  Then visit `http://localhost:5173/collage-studio` (whatever port `pnpm dev`
  actually picks — it auto-increments if 5173 is taken).
- **Not copied over:** `backend/.venv/`, `backend/appdata/{config.json,
  collages,output,thumbcache}`, `frontend/` (superseded entirely — the old
  standalone Vite app), `frontend/node_modules/`, `frontend/dist/`. The old
  `handytools` checkout at `collage-studio/` still exists on its
  `feature/collage-studio` branch, not pushed, not merged — it's now
  superseded by this move and can eventually be deleted once this is
  confirmed working, but nothing has been deleted yet.

## Verified so far (this session, not a full manual pass)

- `pnpm install` + `pnpm build` succeed with the merged code.
- Backend starts cleanly from `collage-studio-backend/`, `/api/health` and
  `/api/config` respond correctly, and `config.py`'s relative-path resolution
  (`BACKEND_DIR` = two dirs up from `app/config.py`) correctly re-resolves
  `appdata/{collages,output}` under the new location — no path fixes needed
  there.
- Every collage-studio module (`CollageStudioApp.tsx` and everything under
  `components/`, `state/`, `api/`) transforms cleanly through Vite's dev
  server (no esbuild/syntax errors) and the `/collage-studio` route serves
  the SPA shell (200).
- **Not yet done: an actual browser pass.** No canvas render, drag/drop,
  save/export, or visual check of the CSS scoping has been driven end to
  end since the move — that's still needed before this is trustworthy
  beyond "compiles and boots." The user asked to test manually before this
  branch is pushed; treat that as the real verification step.
- Two stray leftover dev processes may still be running on ports
  5173/5174 from the *original* handytools-checkout session (its own Vite
  dev server + a Python process) — worth killing those before testing this
  branch's own dev server, so port numbers don't get confusing.

## Open follow-ups from this migration specifically

- Vercel Hobby/free tier was a driving constraint for *not* deploying the
  Python backend there (serverless functions have no persistent disk and
  wouldn't have access to the user's local drives regardless of plan) —
  this was the reasoning that led to the local-backend/cloud-frontend
  split, not a Python-support limitation (Vercel's Python runtime does
  support FastAPI/ASGI on the free tier — it just wasn't the right fit
  given local storage + local folder browsing were requirements).
- `VITE_COLLAGE_API_BASE` env var exists for overriding the backend URL
  (e.g. a non-default port) but isn't set anywhere yet — defaults to
  `http://127.0.0.1:8756`.
- No favicon/nav link points at `/collage-studio` anywhere in the site;
  it's only reachable by typing the URL.

---

# Original session notes

Handoff doc for picking this up in a fresh session/repo. Written after the
first implementation pass (branch `feature/collage-studio` in the
`handytools` repo, commit `7025883`, not pushed/merged yet).

## What this is

A browser-based, generic collage builder: recursive split/resize/remove
frames, drag/drop images from a local folder browser, per-frame pan/zoom,
feathered "insert" accents across seams, and borders at three scopes
(external frame, grid between frames, per-insert). Local Python API backend,
React/TS frontend, one JSON file per collage.

It generalizes a narrower prototype — `M:\projects\running\photo_collages\collage_maker.py`
— which only did fixed 2-3 panel "dominant/support" layouts for a specific
"Contrasts" concept (colour vs B&W pairs, etc). That B&W tagging / contrast
logic was **deliberately not ported** — this tool is generic, no concept of
"dominant panel" or colour contrast checking.

## Status: working MVP, verified end-to-end

All planned pieces are built and I drove a real browser session against it
(via a scripted Puppeteer session, not just unit-level checks): new collage →
quick-start 2-column split → dragged two real photos from `R:\Rendered\tmp`
onto frames → panned one frame, zoomed the other → clicked a seam to add an
insert → enabled + applied insert borders → saved → reloaded the page →
reopened the saved collage → exported → inspected the resulting JPG. Layout,
crop, pan, and the feathered/bordered insert all rendered correctly and
matched the live preview.

One bug found and fixed during that pass: wheel-to-zoom used React's
`onWheel`, which is registered passive by default, so `preventDefault()`
silently failed and the page would scroll while zooming. Fixed by attaching
a native non-passive `wheel` listener directly to the canvas element in
`CanvasEditor.tsx` (see the `useEffect` right before the JSX return).

One cosmetic, not-fully-explained item: a single React dev-mode warning
("Cannot update a component while rendering a different component") appeared
once during the scripted test, triggered by firing synthetic `dragstart`/
`dragover`/`drop` DOM events with zero delay between them (not how a real
browser spaces out a real user drag). Never reproduced under normal
interaction and doesn't affect production builds. Worth a second look if it
ever shows up from real usage rather than a test harness.

## Key architecture decisions (and why)

These were deliberately decided with the user before writing code — worth
preserving so a future session doesn't accidentally relitigate or violate
them:

- **Split-tree editing model, not fixed panels.** The canvas is a recursive
  binary tree of `Frame`/`Split` nodes. "Split window", "remove split",
  "resize split" *are* the primitives — there's no separate template system.
  `QuickStartTemplates` just applies these primitives to produce a few
  starting layouts (2 columns, 2 rows, 3 columns, 2×2), and only shows while
  the doc is still a single blank frame so it can't clobber real work.
- **"Insert" = the old prototype's "inset" concept**: a small rounded,
  feathered accent crop that bleeds across the seam between two adjacent
  frames. Not capped at 2-3 per collage or tied to any "dominant" frame.
- **Render split: client-side canvas preview, Python only for file I/O and
  final export.** This was an explicit tradeoff — it means the cover-crop /
  split-rect / seam-adjacency math is implemented **twice** and must be kept
  in lockstep:
  - `collage-studio-backend/app/render_engine.py` (source of truth, Pillow, used for export)
  - `src/collage-studio/model/geometry.ts` (mirror, used for the live canvas preview)
  If you change one, change the other. Same function shapes and constants on
  purpose (e.g. `MAX_ZOOM = 1/0.3` in both places).
- **No native OS file dialog for picking images.** Browsers withhold real,
  reopenable absolute paths from `<input type=file>` and the File System
  Access API for security. Since this app only ever runs locally for one
  user, image picking goes through a **backend-driven folder browser**
  instead (`/api/browse/roots`, `/list`, `/thumbnail`, `/preview`) — the
  backend has real filesystem access and hands back true absolute paths that
  it can reopen later at full resolution for export. This is why
  `LibraryPanel.tsx` looks like a mini file manager instead of calling a
  picker API.
- **Collages/output live in a configurable external folder**, not inside the
  repo. First run auto-creates `collage-studio-backend/appdata/config.json` (gitignored)
  pointing at `collage-studio-backend/appdata/{collages,output}`; the Settings button in the
  toolbar lets you repoint `collagesDir`/`outputDir` anywhere (e.g. a network
  drive), persisted via `PUT /api/config`.
- **Backend binds to `127.0.0.1` only.** It exposes arbitrary local
  filesystem browsing — must never listen on all interfaces, and (post-move)
  must never get wildcard CORS either, for the same reason.
- **React + TypeScript + Vite**, **FastAPI + Uvicorn + Pillow** — chosen over
  alternatives (vanilla TS, Flask, Svelte) by explicit user preference, not
  because the alternatives were unworkable.

## Data model

One JSON file = one `CollageDoc`. Canonical definition:
`collage-studio-backend/app/models.py` (Pydantic). Mirrored in
`src/collage-studio/model/collageTypes.ts` (TS interfaces) — keep both in sync by
hand, there's no codegen step.

```
CollageDoc
  id, name, createdAt, updatedAt
  canvas: { width, height }
  border: { external: {width,color}, grid: {width,color} }
  jpegQuality
  insertBorderDefault: { enabled, width, color }
  tree: Node                 # root always covers the full canvas
  inserts: Insert[]

Node = Frame { id, image: {path, focal:{x,y}, zoom} | null }
     | Split { id, orientation: horizontal|vertical, ratio, first: Node, second: Node }

Insert
  id, sourceFrameId
  seam: {frameIdA, frameIdB} | null    # auto-placed on the seam between two adjacent frames
  position: {cxPct, cyPct} | null      # manual override, bypasses seam detection
  sizePct, focal, zoom, featherPx, cornerRadiusPct
  border: {enabled, width, color} | null   # null = inherit insertBorderDefault
```

## File layout (current, post-move)

```
my-photo-site/
  collage-studio-backend/       # was collage-studio/backend/
    app/
      main.py            # FastAPI app + CORS (now allow-lists this site's domain/preview URLs) + router wiring
      config.py           # appdata/config.json load/save (collagesDir, outputDir) -- paths resolve relative to this dir, unaffected by the move
      models.py            # Pydantic models -- source of truth for the data model
      render_engine.py      # layout/crop/insert math + render_collage() + export_collage()
      routers/
        browse.py            # local filesystem browser (drives/list/thumbnail/preview)
        collages.py           # collage JSON CRUD
        export.py              # POST .../export -> full-res render via Pillow
        settings.py             # GET/PUT /api/config
    requirements.txt
    appdata/config.example.json   # template; real config.json is gitignored
  src/collage-studio/            # was collage-studio/frontend/src/
    model/
      collageTypes.ts    # TS mirror of models.py
      geometry.ts          # TS mirror of render_engine.py's layout/crop math
      treeOps.ts            # split/remove/resize/setFrameImage tree operations
      canvasRender.ts        # canvas drawing helpers (cover-crop, feathered insert, borders)
      imageCache.ts           # module-level HTMLImageElement cache + loader
    api/client.ts        # fetch wrappers -- now hit an absolute API_BASE, not relative /api paths
    state/collageStore.tsx  # useReducer store: doc, selection, undo/redo history
    components/
      Toolbar.tsx          # new/open/save/save-as/delete/export/undo/redo/settings
      LibraryPanel.tsx       # folder browser + thumbnail grid, drag source
      CanvasEditor.tsx        # the core editor -- canvas render + all pointer interaction
      InspectorPanel.tsx       # numeric fields: canvas/borders/selected frame/selected insert
      QuickStartTemplates.tsx   # starting-point split layouts
    CollageStudioApp.tsx    # was App.tsx -- root component, mounted at the /collage-studio route
    collage-studio.css      # was index.css -- now scoped under .collage-studio-page
  src/components/Main.jsx    # route wiring: /collage-studio bypasses Header/Footer
  Makefile                    # collage-install / collage-start / collage-stop targets
```

## Not yet built / ideas for next steps

Nothing from the original ask is missing, but these came up as natural
follow-ups and were deliberately left out of the first pass to keep scope
tight:

- Recent-folders dropdown in `LibraryPanel` only stores paths in
  `localStorage` (key `collage-studio.recentFolders`) — fine for a single
  browser profile, wouldn't sync across machines.
- No multi-select / batch export across several collages.
- No page/canvas-size presets (the old CLI's `optimise` profiles or
  `collage`'s `4x5` override aren't mirrored here — canvas width/height are
  just free-form numeric fields).
- `QuickStartTemplates` covers 4 starting layouts; trivial to add more in
  `src/collage-studio/components/QuickStartTemplates.tsx`'s `TEMPLATES` array.
- Insert placement is either seam-based or a manual `{cxPct,cyPct}` — there's
  no UI yet to drag an insert freely on the canvas once placed (you'd need to
  hand-edit `position` via... there's currently no field exposing that in
  `InspectorPanel`; would be a reasonable small addition).
