import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { BrowseEntry } from '../model/collageTypes'
import { setFrameImage } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'

const RECENTS_KEY = 'collage-studio.recentFolders'
const RECENTS_LIMIT = 8

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function pushRecent(path: string) {
  const recents = [path, ...loadRecents().filter((p) => p !== path)].slice(0, RECENTS_LIMIT)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents))
  return recents
}

export function LibraryPanel() {
  const { doc, editDoc, selectedFrameId } = useCollageStore()
  const [roots, setRoots] = useState<{ name: string; path: string }[]>([])
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [parent, setParent] = useState<string | null>(null)
  const [entries, setEntries] = useState<BrowseEntry[]>([])
  const [recents, setRecents] = useState<string[]>(loadRecents())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .browseRoots()
      .then((r) => {
        setRoots(r.roots)
        const recent = loadRecents()[0]
        setCurrentPath(recent ?? r.roots[0]?.path ?? null)
      })
      .catch((e) => setError(String(e)))
  }, [])

  useEffect(() => {
    if (!currentPath) return
    api
      .browseList(currentPath)
      .then((res) => {
        setEntries(res.entries)
        setParent(res.parent)
        setError(null)
      })
      .catch((e) => setError(String(e)))
  }, [currentPath])

  const navigate = useCallback((path: string) => {
    setCurrentPath(path)
    setRecents(pushRecent(path))
  }, [])

  const assignToSelectedFrame = useCallback(
    (path: string) => {
      if (!doc || !selectedFrameId) return
      editDoc((d) => ({ ...d, tree: setFrameImage(d.tree, selectedFrameId, { path, focal: { x: 0.5, y: 0.5 }, zoom: 1.0 }) }))
    },
    [doc, selectedFrameId, editDoc],
  )

  const folders = entries.filter((e) => e.isDir)
  const images = entries.filter((e) => !e.isDir)

  return (
    <div className="library-panel">
      <div className="library-header">
        <select value="" onChange={(e) => e.target.value && navigate(e.target.value)}>
          <option value="">Drives…</option>
          {roots.map((r) => (
            <option key={r.path} value={r.path}>
              {r.name}
            </option>
          ))}
        </select>
        {recents.length > 0 && (
          <select value="" onChange={(e) => e.target.value && navigate(e.target.value)}>
            <option value="">Recent…</option>
            {recents.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="library-path" title={currentPath ?? ''}>
        {parent && (
          <button className="up-button" onClick={() => navigate(parent)}>
            ↑ Up
          </button>
        )}
        <span className="path-text">{currentPath}</span>
      </div>

      {error && <div className="library-error">{error}</div>}

      <div className="library-folders">
        {folders.map((f) => (
          <button key={f.path} className="folder-entry" onClick={() => navigate(f.path)}>
            📁 {f.name}
          </button>
        ))}
      </div>

      <div className="library-thumbs">
        {images.map((img) => (
          <img
            key={img.path}
            src={api.thumbnailUrl(img.path)}
            alt={img.name}
            title={selectedFrameId ? `${img.name} (click to assign to selected frame)` : img.name}
            draggable
            className="library-thumb"
            onDragStart={(e) => e.dataTransfer.setData('application/x-collage-image', img.path)}
            onClick={() => assignToSelectedFrame(img.path)}
          />
        ))}
      </div>
    </div>
  )
}
