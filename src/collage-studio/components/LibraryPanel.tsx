import { useEffect, useRef, useState } from 'react'
import { collectImageKeys } from '../model/geometry'
import { setFrameImage } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'
import { useDialog } from '../state/dialogStore'
import { useImagePool } from '../state/imagePoolStore'

type SortKey = 'name' | 'date'
type SortDir = 'asc' | 'desc'

const THUMB_MIN_PX = 104
const THUMB_GAP_PX = 10
const MIN_COLUMNS = 1
const MAX_COLUMNS = 10

export function LibraryPanel() {
  const { doc, editDoc, selectedFrameId, selectedInsertId, allDocs } = useCollageStore()
  const pool = useImagePool()
  const dialog = useDialog()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Date/desc (newest first) matches the pool's own default ordering.
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Thumbnail grid density -- null means "auto" (the CSS auto-fill default,
  // ~104px minimum). Scrolling over the grid switches to an explicit
  // columns-per-row count, stepping from whatever's currently on screen.
  const [columns, setColumns] = useState<number | null>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  // A fixed column count is deliberately decoupled from the panel's own
  // width (so pinch/Ctrl+Scroll steps predictably), but that means it
  // doesn't shrink/grow along with the panel either once set -- dragging
  // the library-panel resize handle would otherwise stop visibly resizing
  // thumbnails at all until the next manual pinch/scroll. Revert to "auto"
  // whenever the panel itself is resized (not by a column-count change --
  // that never alters the grid's own width, only how a fixed width is
  // divided -- so this only fires on real panel resizes).
  useEffect(() => {
    const el = thumbsRef.current
    if (!el) return
    let seeded = false
    let lastWidth = 0
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (!seeded) {
        seeded = true
        lastWidth = w
        return
      }
      if (Math.abs(w - lastWidth) > 0.5) {
        lastWidth = w
        setColumns(null)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = thumbsRef.current
    if (!el) return

    const stepColumns = (step: number) => {
      setColumns((c) => {
        // clientWidth is the content box (padding already excluded, and
        // scrollbar-gutter keeps the scrollbar out of it too) -- subtract
        // one gap-width's worth of slack per column so the seeded guess
        // undershoots slightly rather than overshoots into invisible/
        // under-scrollbar territory.
        const current = c ?? Math.max(MIN_COLUMNS, Math.floor(el.clientWidth / (THUMB_MIN_PX + THUMB_GAP_PX)))
        return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, current + step))
      })
    }

    // Native (non-passive) listener -- React's onWheel can't reliably
    // preventDefault(). Gated on Ctrl/Cmd so plain scrolling still scrolls
    // the list -- an earlier version resized on *every* wheel tick, which
    // meant there was no way left to scroll a long gallery with the wheel.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      stepColumns(e.deltaY > 0 ? 1 : -1)
    }

    // Pinch-to-resize on touch -- same column-stepping as Ctrl+Scroll, just
    // driven by two-finger pinch distance instead. Distance change is
    // accumulated and only converted into a step every PINCH_STEP_PX of
    // travel, so it steps discretely rather than firing on every touchmove.
    const PINCH_STEP_PX = 40
    let pinchDist: number | null = null
    let pinchAccum = 0
    const touchDist = (touches: TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchDist = touchDist(e.touches)
        pinchAccum = 0
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchDist === null) return
      e.preventDefault()
      const dist = touchDist(e.touches)
      pinchAccum += dist - pinchDist
      pinchDist = dist
      while (Math.abs(pinchAccum) >= PINCH_STEP_PX) {
        // Pinching outward (fingers spreading, distance growing) means
        // "bigger thumbnails" -- fewer columns.
        stepColumns(pinchAccum > 0 ? -1 : 1)
        pinchAccum += pinchAccum > 0 ? -PINCH_STEP_PX : PINCH_STEP_PX
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchDist = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sortedImages = [...pool.images].sort((a, b) => {
    const cmp = sortKey === 'name' ? a.name.localeCompare(b.name) : a.addedAt - b.addedAt
    return sortDir === 'asc' ? cmp : -cmp
  })

  // Only removes images no *open* collage references -- anything still in
  // use (even in a background tab) is kept, so this can't silently break a
  // collage you haven't looked at recently. Computed at render time (not
  // just inside the click handler) so the button can show/disable based on
  // whether there's actually anything to remove.
  const usedKeys = new Set(allDocs.flatMap(collectImageKeys))
  const unusedImages = pool.images.filter((img) => !usedKeys.has(img.key))

  const handleClearGallery = async () => {
    if (unusedImages.length === 0) return
    const keptCount = pool.images.length - unusedImages.length
    const ok = await dialog.confirm(
      `Remove ${unusedImages.length} unused image(s) from your local gallery? ${keptCount} still in use by open collages will be kept. This can't be undone.`,
    )
    if (ok) await pool.removeMany(unusedImages.map((img) => img.key))
  }

  // Assigns to whichever is currently selected -- a frame or an insert (its
  // own, independent image; see docs/collage-studio.md). No-op if neither.
  const assignToSelected = (imageKey: string) => {
    if (!doc) return
    if (selectedInsertId) {
      editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === selectedInsertId ? { ...i, imageKey } : i)) }))
    } else if (selectedFrameId) {
      editDoc((d) => ({ ...d, tree: setFrameImage(d.tree, selectedFrameId, { imageKey, focal: { x: 0.5, y: 0.5 }, zoom: 1.0, flipH: false, flipV: false }) }))
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) void pool.add(files)
  }

  return (
    <div
      className={`library-panel${isDragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void pool.add(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="library-gallery-header">
        <span className="hint">{pool.images.length}</span>
        <div className="library-header-actions">
          <button className="library-add-btn" onClick={() => fileInputRef.current?.click()} title="Add photos">
            +
          </button>
          <button
            className={sortKey === 'name' ? 'active' : undefined}
            onClick={() => toggleSort('name')}
            title="Sort by name"
          >
            Name{sortKey === 'name' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
          <button
            className={sortKey === 'date' ? 'active' : undefined}
            onClick={() => toggleSort('date')}
            title="Sort by date added"
          >
            Date{sortKey === 'date' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
          <button
            onClick={handleClearGallery}
            disabled={unusedImages.length === 0}
            title={
              unusedImages.length === 0
                ? 'Every image here is used by an open collage -- nothing to remove'
                : `Removes ${unusedImages.length} image(s) not used by any open collage; images still in use are kept`
            }
          >
            Clear{unusedImages.length > 0 ? ` (${unusedImages.length})` : ''}
          </button>
        </div>
      </div>

      {pool.images.length === 0 && <p className="library-thumbs-hint">Drop images anywhere here, or tap + to add.</p>}

      <div
        className="library-thumbs"
        ref={thumbsRef}
        title="Ctrl+Scroll (Cmd+Scroll on Mac), or pinch on touch, to resize thumbnails"
        style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
      >
        {sortedImages.map((img) => (
          <div
            key={img.key}
            className="library-thumb-wrap"
            draggable
            title={
              selectedInsertId
                ? `${img.name} (click to assign to selected insert)`
                : selectedFrameId
                  ? `${img.name} (click to assign to selected frame)`
                  : img.name
            }
            onDragStart={(e) => e.dataTransfer.setData('application/x-collage-image', img.key)}
            onClick={() => assignToSelected(img.key)}
            onDoubleClick={() => assignToSelected(img.key)}
          >
            <img src={img.objectUrl} alt={img.name} className="library-thumb" />
            <span className="library-thumb-name">{img.name}</span>
            <button
              className="library-thumb-remove"
              title="Remove from gallery"
              onClick={(e) => {
                e.stopPropagation()
                pool.remove(img.key)
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <p className="library-thumbs-hint">Drag an image directly onto a frame in the canvas to place it there.</p>
    </div>
  )
}
