import { useRef, useState } from 'react'
import { collectImageKeys } from '../model/geometry'
import { setFrameImage } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'
import { useDialog } from '../state/dialogStore'
import { useImagePool } from '../state/imagePoolStore'

export function LibraryPanel() {
  const { doc, editDoc, selectedFrameId, selectedInsertId, allDocs } = useCollageStore()
  const pool = useImagePool()
  const dialog = useDialog()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <div className="library-panel">
      <div
        className={`library-dropzone${isDragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
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
        <span>Drop images here, or click to choose (from Explorer/Finder, or Gallery on mobile)</span>
      </div>

      {pool.images.length > 0 && (
        <div className="library-gallery-header">
          <span className="hint">{pool.images.length} image(s)</span>
          <button
            onClick={handleClearGallery}
            disabled={unusedImages.length === 0}
            title={
              unusedImages.length === 0
                ? 'Every image here is used by an open collage -- nothing to remove'
                : `Removes ${unusedImages.length} image(s) not used by any open collage; images still in use are kept`
            }
          >
            Clear gallery{unusedImages.length > 0 ? ` (${unusedImages.length})` : ''}
          </button>
        </div>
      )}

      <div className="library-thumbs">
        {pool.images.map((img) => (
          <div key={img.key} className="library-thumb-wrap">
            <img
              src={img.objectUrl}
              alt={img.name}
              title={
                selectedInsertId
                  ? `${img.name} (click to assign to selected insert)`
                  : selectedFrameId
                    ? `${img.name} (click to assign to selected frame)`
                    : img.name
              }
              draggable
              className="library-thumb"
              onDragStart={(e) => e.dataTransfer.setData('application/x-collage-image', img.key)}
              onClick={() => assignToSelected(img.key)}
              onDoubleClick={() => assignToSelected(img.key)}
            />
            <button className="library-thumb-remove" title="Remove from gallery" onClick={() => pool.remove(img.key)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
