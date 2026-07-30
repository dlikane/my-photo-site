import { useRef, useState } from 'react'
import { setFrameImage } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'
import { useImagePool } from '../state/imagePoolStore'

export function LibraryPanel() {
  const { doc, editDoc, selectedFrameId } = useCollageStore()
  const pool = useImagePool()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assignToSelectedFrame = (imageKey: string) => {
    if (!doc || !selectedFrameId) return
    editDoc((d) => ({ ...d, tree: setFrameImage(d.tree, selectedFrameId, { imageKey, focal: { x: 0.5, y: 0.5 }, zoom: 1.0 }) }))
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) pool.add(e.dataTransfer.files)
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
            if (e.target.files) pool.add(e.target.files)
            e.target.value = ''
          }}
        />
        <span>Drop images here, or click to choose (from Explorer/Finder, or Gallery on mobile)</span>
      </div>

      <div className="library-thumbs">
        {pool.images.map((img) => (
          <div key={img.key} className="library-thumb-wrap">
            <img
              src={img.objectUrl}
              alt={img.name}
              title={selectedFrameId ? `${img.name} (click to assign to selected frame)` : img.name}
              draggable
              className="library-thumb"
              onDragStart={(e) => e.dataTransfer.setData('application/x-collage-image', img.key)}
              onClick={() => assignToSelectedFrame(img.key)}
            />
            <button className="library-thumb-remove" title="Remove from this session" onClick={() => pool.remove(img.key)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
