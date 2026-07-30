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

## Image handling: local-only, persisted per device

- **Image pool** (`src/collage-studio/state/imagePoolStore.tsx`): a `Map` of
  uploaded/dropped files, shared across every open collage so images can be
  moved between them. Each image is keyed by a SHA-256 content hash, not a
  random ID or filesystem path.
- **Persisted to IndexedDB** (`src/collage-studio/state/idb.ts`), not
  `localStorage` — `localStorage` is capped around 5-10MB and can't hold
  binary Blobs; IndexedDB stores File/Blob objects natively and gets a much
  larger quota. This is **device-local only** — nothing syncs between
  devices, and nothing ever leaves the browser (no backend involved in any
  of this). The gallery and whatever collages/tabs were open both survive a
  full browser restart; a "Clear gallery" button in `LibraryPanel.tsx`
  removes only images **not referenced by any currently-open collage**
  (computed via `collectImageKeys` across `useCollageStore().allDocs`, all
  tabs, not just the active one) — with a confirm dialog naming the count.
  Deliberately not a full wipe: an unrelated image sitting unused in the
  gallery is exactly what you'd want cleared, but something a background
  tab still needs shouldn't disappear just because you hit one button.
- **Why a content hash, not metadata or a path:** collage layout files only
  store `imageKey`, not the image bytes (see "Export/Open" below). If you
  reopen a layout file and re-select the *same* original files, they hash to
  the same key and automatically reattach to the right frames — no manual
  per-frame re-linking needed. This also means that as long as an image is
  still sitting in your persisted local gallery, reopening an old layout
  "just works" without re-selecting anything at all.
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
  dirty right away, since it's never been downloaded as a file. **Export**/
  **Open** are plain browser file download/upload, not backend calls (see
  below) — so there's no "placeholder backend record" concept and no
  Save-vs-Save-As distinction; Export always just downloads the current
  state.
- Tabs show a trailing `*` while dirty (unsaved edits, or never-yet-exported
  as a file). Closing a dirty tab confirms first (via the in-app dialog, not
  `window.confirm` — see below).
- Tabs and their `dirty` flag are persisted to IndexedDB (see above) and
  restored on the next page load — `dirty` doesn't mean "not backed up
  anywhere," it specifically tracks "not yet exported as a `.collage.json`
  file." Undo/redo history is intentionally **not** persisted (starts empty
  again after a restore) to keep things simple; only the current doc state
  survives a restart, per tab.
- Double-click a tab's name to rename it in place (`collageStore`'s
  `renameDoc`, separate from `editDoc` so it doesn't push an undo-history
  entry — renames aren't undoable).

## Export / Open / Render — three different operations

(Named to match the UI, which deliberately avoids "Save": the gallery and
open tabs *are* persisted locally now, but only on this device, and Export/
Open are still just a plain file download/upload on top of that, not a
save-to-a-project concept.)

- **Export** (download): serializes the current `CollageDoc` to JSON and
  triggers a browser file download (`<name>.collage.json`). This is
  **layout-only** — it stores `imageKey`s, not image bytes. Reopening it
  elsewhere (or after clearing the image pool) shows "missing image"
  placeholders until the original files are re-selected.
- **Open** (upload): a file picker for a previously-exported `.json` layout
  file -- accepts multiple files at once, so selecting the `.json` together
  with its original images (typically the same folder) loads both the
  layout and its images in one action. Any referenced `imageKey` still not
  in the pool afterward is reported as missing in the status line.
- **Render**: the only operation that talks to the backend.
  `Toolbar.handleRender` collects every `imageKey` the doc references,
  refuses to proceed if any are missing from the pool, then POSTs a
  multipart request — `doc` (JSON) plus the actual file bytes for each
  `imageKey` — to `POST /api/export` (the backend route name wasn't renamed,
  just the button). The backend (`render_engine.py`, unchanged compositing
  logic, just re-keyed) renders the final JPEG in memory and streams it
  back; the frontend triggers a download. Nothing is written to disk on
  either side.

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
  insertBorderDefault: { enabled, width, color }        # enabled is always true -- no UI toggle, width 0 = invisible
  insertShadowDefault: { enabled, offsetPx, angleDeg, blurPx, opacity, color }  # same -- always true, opacity 0 = invisible
  tree: Node                 # root always covers the full canvas
  inserts: Insert[]

Node = Frame { id, image: {imageKey, focal:{x,y}, zoom, flipH, flipV} | null }
     | Split { id, orientation: horizontal|vertical, ratio, first: Node, second: Node }

Insert
  id, imageKey             # independent from any frame -- not auto-linked to the frame it was created near
  seam: {frameIdA, frameIdB} | null    # starting position only; overridden once dragged (position wins)
  position: {cxPct, cyPct} | null      # set on drag; freely movable/resizable on the canvas, not just seam midpoints
  sizePct, focal, zoom, featherPx, cornerRadiusPct
  border: {enabled, width, color} | null                                      # null = inherit insertBorderDefault
  shadow: {enabled, offsetPx, angleDeg, blurPx, opacity, color} | null        # null = inherit insertShadowDefault
```

- **Insert defaults (border, shadow) are always "enabled"** — deliberately no
  on/off toggle for `insertBorderDefault`/`insertShadowDefault` in
  `InspectorPanel.tsx`; width/opacity of 0 is the practical "off." Per-insert
  *overrides* (`insert.border`/`insert.shadow`, when non-null) still expose
  their own enabled checkbox, since turning off just one insert's border or
  shadow is a legitimate thing to want. New inserts start with
  `shadow: null` (and `border: null`), so they pick up whatever the doc
  defaults are automatically — "shadow for all inserts" is the out-of-the-box
  behavior, with "Apply default shadow/border to all inserts" available to
  reset any inserts that were given their own override back to inheriting.

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
      collageStore.tsx     # multi-doc tab store: per-tab doc/dirty/undo-redo, active tab; hydrates from + persists to idb.ts
      imagePoolStore.tsx     # content-hash-keyed image pool; hydrates from + persists to idb.ts
      idb.ts                  # IndexedDB wrapper: images + session (tabs/active/dirty), device-local only
      dialogStore.tsx         # in-app prompt/confirm dialog (replaces window.prompt/confirm)
    components/
      Toolbar.tsx          # tabs bar + new/open/export/render/undo/redo/preview-toggle
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
- IndexedDB persistence (gallery + tabs) is type-checked and built, but not
  verified in an actual browser (no way to drive one from here) — the real
  test is closing and reopening the browser and confirming the gallery/tabs
  come back.
- No storage-quota handling: if IndexedDB ever hits the browser's quota
  (unlikely for a personal tool, but possible with a very large gallery),
  `saveImage`/`saveSession` just reject and log to the console rather than
  surfacing anything to the user.
