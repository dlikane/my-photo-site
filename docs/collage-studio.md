# Collage Studio

A browser-based collage builder merged into this site as the `/collage-studio`
route. Recursive split/resize/remove frames, drag-drop image placement,
per-frame pan/zoom, feathered "insert" accents across seams, and borders at
three scopes (external frame, grid between frames, per-insert).

## Architecture

- **Frontend**: part of this site's own React app (`src/collage-studio/`),
  routed at `/collage-studio` in `src/components/Main.jsx` (bypasses the
  site's `Header`/`Footer` for a full-viewport editor). Builds and deploys
  with the rest of the site — no separate frontend build step.
- **Backend**: `collage-studio-backend/` (FastAPI + Pillow), sibling to
  `api/` (not inside it, so Vercel's Python auto-detection never picks it
  up — it must never be deployed). Runs **locally only**, bound to
  `127.0.0.1:8756`. It is **stateless and disk-free**: it does one job,
  rendering the final high-quality export, and holds nothing between
  requests.
- **No local filesystem access at all.** There is no folder browser and no
  server-side storage. Every image enters the app via drag-drop or a file
  picker (from Explorer/Finder, or the Gallery/Photos picker on
  mobile/Android browsers) and lives only in browser memory for the
  session.
- **Why a local, cross-origin backend still works without a tunnel:** the
  frontend is static content served from Vercel, but it runs in *your*
  browser on *your* machine. Its JS calls `http://127.0.0.1:8756` directly,
  cross-origin — browsers treat `127.0.0.1` as a secure context, so an
  `https://` page fetching `http://127.0.0.1:...` is allowed. This only
  works for whoever has the backend running locally; anyone else hitting
  `/collage-studio` gets a page that can't reach an API and does nothing
  useful. That's the deliberate access-control model — no login gate, the
  URL is just unlisted.
- **CORS** (`collage-studio-backend/app/main.py`) allow-lists the production
  domain (`https://www.dlikane.com`, `https://dlikane.com`), this project's
  Vercel preview URLs (`https://my-photo-site-git-*-dlikanes-projects.vercel.app`),
  and any `localhost`/`127.0.0.1` port (Vite auto-increments its port when
  5173+ are taken). **Never widen this to `allow_origins=["*"]`** — even
  though the backend is stateless, wildcard CORS would let any site the
  user's browser visits make requests to it.

## Session-only image handling

- **Image pool** (`src/collage-studio/state/imagePoolStore.tsx`): a
  session-scoped `Map` of uploaded/dropped files, shared across every open
  collage so images can be moved between them. Each image is keyed by an
  `imageKey` fingerprint — `name|size|lastModified` — not a random ID.
  Nothing is persisted; refreshing the tab loses the pool (object URLs are
  revoked on unmount).
- **Why a fingerprint, not a random ID:** collage layout files only store
  `imageKey`, not the image bytes (see "Save/Open" below). If you reopen a
  layout file and re-drop the *same* original files, they produce the same
  fingerprint and automatically reattach to the right frames — no manual
  per-frame re-linking needed. Different files (even with the same name) get
  a different key and are treated as new uploads.
- Drop targets: the library panel's dropzone (general upload) and directly
  onto a canvas frame (uploads and assigns in one step). Both accept
  multiple files at once.
- A frame referencing an `imageKey` not currently in the pool renders a
  "missing image" placeholder rather than attempting any network fetch.

## Multiple collages per session

- `src/collage-studio/state/collageStore.tsx` holds a dictionary of open
  collages (tabs), each with its own undo/redo history and dirty flag, plus
  which one is active. `useCollageStore()` exposes the *active* doc under
  the same shape as a single-doc store (`doc`, `editDoc`, `selectedFrameId`,
  etc.) — `CanvasEditor`/`InspectorPanel`/`QuickStartTemplates` only ever
  work with "the current doc" and don't know tabs exist. `Toolbar.tsx` owns
  the tabs bar (`tabs`, `activeId`, `newDoc`/`openDoc`/`closeDoc`/`setActive`).
- **New** creates a blank tab immediately (no naming prompt) and marks it
  dirty right away, since it's never been saved. **Save**/**Open** are
  plain browser file download/upload, not backend calls (see below) — so
  there's no "placeholder backend record" concept and no Save-vs-Save-As
  distinction; Save always just downloads the current state.
- Tabs show a trailing `*` while dirty (unsaved edits, or never-yet-saved).
  Closing a dirty tab confirms first (via the in-app dialog, not
  `window.confirm` — see below).

## Save / Open / Export — three different operations

- **Save** (download): serializes the current `CollageDoc` to JSON and
  triggers a browser file download (`<name>.collage.json`). This is
  **layout-only** — it stores `imageKey`s, not image bytes. Reopening it
  elsewhere (or after clearing the image pool) shows "missing image"
  placeholders until the original files are re-dropped.
- **Open** (upload): a file picker for a previously-downloaded `.json`
  layout file. Parses it into a new tab; any referenced `imageKey` not
  currently in the pool is reported as missing in the status line.
- **Export** (render): the only operation that talks to the backend.
  `Toolbar.handleExport` collects every `imageKey` the doc references,
  refuses to proceed if any are missing from the pool, then POSTs a
  multipart request — `doc` (JSON) plus the actual file bytes for each
  `imageKey` — to `POST /api/export`. The backend (`render_engine.py`,
  unchanged compositing logic, just re-keyed) renders the final JPEG in
  memory and streams it back; the frontend triggers a download. Nothing is
  written to disk on either side.

## In-app dialogs, not native ones

Native `window.prompt`/`confirm`/`alert` don't work in some embedded
webviews (e.g. VS Code's Simple Browser) — they return `null`/`false`
instantly with no visible dialog. `src/collage-studio/state/dialogStore.tsx`
provides `useDialog().prompt(...)`/`.confirm(...)` (promise-based, backed by
an actual React modal) as a drop-in replacement. Use these for any new
confirm/prompt needs in this app — never reach for the native ones here.

## Data model

One `CollageDoc` per collage. Canonical definition:
`collage-studio-backend/app/models.py` (Pydantic), mirrored by hand in
`src/collage-studio/model/collageTypes.ts` — keep both in sync, there's no
codegen step.

```
CollageDoc
  id, name, createdAt, updatedAt
  canvas: { width, height }
  border: { external: {width,color}, grid: {width,color} }
  jpegQuality
  insertBorderDefault: { enabled, width, color }
  tree: Node                 # root always covers the full canvas
  inserts: Insert[]

Node = Frame { id, image: {imageKey, focal:{x,y}, zoom, flipH, flipV} | null }
     | Split { id, orientation: horizontal|vertical, ratio, first: Node, second: Node }

Insert
  id, imageKey             # independent from any frame -- not auto-linked to the frame it was created near
  seam: {frameIdA, frameIdB} | null    # starting position only; overridden once dragged (position wins)
  position: {cxPct, cyPct} | null      # set on drag; freely movable/resizable on the canvas, not just seam midpoints
  sizePct, focal, zoom, featherPx, cornerRadiusPct
  border: {enabled, width, color} | null   # null = inherit insertBorderDefault
```

Note: an insert's `imageKey` defaults to the adjacent frame's image when created via the seam `+` button, but from then on it's independent -- reassigning the frame's image (or flipping it) does not affect the insert, and vice versa. Reassign an insert's image the same way as a frame: click or drag a library thumbnail onto it while it's selected.

- **Render split: client-side canvas preview, Pillow for final export.** The
  cover-crop / split-rect / seam-adjacency math is implemented **twice** and
  must be kept in lockstep:
  - `collage-studio-backend/app/render_engine.py` (source of truth, used
    for the `/api/export` render)
  - `src/collage-studio/model/geometry.ts` (mirror, used for the live
    canvas preview)
  If you change one, change the other. Same function shapes/constants on
  purpose (e.g. `MAX_ZOOM = 1/0.3` in both places).

## File layout

```
my-photo-site/
  collage-studio-backend/
    app/
      main.py            # FastAPI app + CORS + router wiring
      models.py            # Pydantic models -- source of truth for the data model
      render_engine.py      # layout/crop/insert math + render_collage(); ImageStore reads in-memory bytes, not disk
      routers/
        export.py             # POST /api/export -- stateless multipart render endpoint
    requirements.txt
  src/collage-studio/
    model/
      collageTypes.ts    # TS mirror of models.py + createBlankCollageDoc()
      geometry.ts          # TS mirror of render_engine.py's layout/crop math
      treeOps.ts            # split/remove/resize/setFrameImage tree operations
      canvasRender.ts        # canvas drawing helpers (cover-crop, feathered insert, borders)
      imageCache.ts           # module-level HTMLImageElement cache, loads from pool object URLs
    api/client.ts        # health check + exportCollage() (multipart upload, returns a Blob)
    state/
      collageStore.tsx     # multi-doc tab store: per-tab doc/dirty/undo-redo, active tab
      imagePoolStore.tsx     # session-only image pool, fingerprint-keyed
      dialogStore.tsx         # in-app prompt/confirm dialog (replaces window.prompt/confirm)
    components/
      Toolbar.tsx          # tabs bar + new/open/save/export/undo/redo/preview-toggle
      LibraryPanel.tsx       # drop zone + file picker + thumbnail grid (drag source), remove-from-pool
      CanvasEditor.tsx        # the core editor -- canvas render + all pointer interaction
      InspectorPanel.tsx       # numeric fields: canvas/borders/selected frame/selected insert
      QuickStartTemplates.tsx   # starting-point split layouts (only shown for a blank canvas)
    CollageStudioApp.tsx    # root component: ImagePoolProvider > CollageStoreProvider > DialogProvider
    collage-studio.css      # scoped under .collage-studio-page so it can't leak into the site's Tailwind styles
  src/components/Main.jsx    # route wiring: /collage-studio bypasses Header/Footer
  Makefile                    # collage-install / collage-start / collage-stop targets (backend only)
```

## Running locally

```
make collage-install   # one-time: creates collage-studio-backend/.venv, installs requirements.txt
make collage-start     # starts uvicorn on 127.0.0.1:8756 in the background
make collage-stop      # stops it
```

Then `pnpm dev` as usual and visit `http://localhost:5173/collage-studio`
(whatever port Vite actually picks).

## Known gaps

- Canvas aspect-ratio presets are limited to 1:1 and 4:5 (`InspectorPanel.tsx`'s
  `ASPECT_PRESETS`); trivial to add more.
- No cap on how many collages can be open as tabs at once.
- `VITE_COLLAGE_API_BASE` env var exists for overriding the backend URL
  (e.g. a non-default port) but isn't set anywhere yet — defaults to
  `http://127.0.0.1:8756`.
- Mobile: Library/Inspector slide-in drawers and double-tap-to-assign are
  implemented and CSS/type-checked, but not verified on a real touch device.
  A long-press-on-canvas menu (as an alternative to the fixed top toolbar)
  was considered but not implemented — the fixed toolbar is standard,
  lower-risk mobile UX and didn't seem worth a gesture no one could test.
- Flip is per-frame-image only; inserts don't have their own flip (they
  didn't ask for it and Insert doesn't wrap a full ImageRef, just an
  imageKey + its own focal/zoom/etc., so adding it is a small but separate change).
