import { useRef, useState } from 'react'
import { setFrameImage } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'
import { useDialog } from '../state/dialogStore'
import { useImagePool } from '../state/imagePoolStore'

export function LibraryPanel() {
  const { doc, editDoc, selectedFrameId, selectedInsertId } = useCollageStore()
  const pool = useImagePool()
  const dialog = useDialog()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClearGallery = async () => {
    if (pool.images.length === 0) return
    const ok = await dialog.confirm(
      `Remove all ${pool.images.length} image(s) from your local gallery? This can't be undone -- any collage still referencing them will show "missing image" until you re-add them.`,
    )
    if (ok) await pool.clearAll()
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
          <button onClick={handleClearGallery}>Clear gallery</button>
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
