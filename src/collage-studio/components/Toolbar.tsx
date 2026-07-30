import { useRef, useState } from 'react'
import { api } from '../api/client'
import { createBlankCollageDoc, type CollageDoc } from '../model/collageTypes'
import { collectFrames } from '../model/geometry'
import { useCollageStore } from '../state/collageStore'
import { useDialog } from '../state/dialogStore'
import { useImagePool } from '../state/imagePoolStore'

interface ToolbarProps {
  previewMode: boolean
  onTogglePreview: () => void
  onToggleLibrary: () => void
  onToggleInspector: () => void
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9 _-]/g, '_').trim() || 'collage'
}

/** Inverse of the `${sanitizeFilename(doc.name)}.collage.json` save naming --
 * the filename is the source of truth for the name when reopening a file
 * (e.g. if you renamed it in Explorer/Finder after saving). */
function nameFromFilename(filename: string): string {
  const stripped = filename.replace(/\.collage\.json$/i, '').replace(/\.json$/i, '')
  return stripped.trim() || 'Untitled collage'
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function collectImageKeys(doc: CollageDoc): string[] {
  const frames = collectFrames(doc.tree)
  const keys = new Set<string>()
  for (const frame of Object.values(frames)) {
    if (frame.image) keys.add(frame.image.imageKey)
  }
  // Inserts have their own, independent image assignment (see collageTypes.ts) --
  // not necessarily used by any frame, so must be collected separately.
  for (const insert of doc.inserts) {
    if (insert.imageKey) keys.add(insert.imageKey)
  }
  return Array.from(keys)
}

export function Toolbar({ previewMode, onTogglePreview, onToggleLibrary, onToggleInspector }: ToolbarProps) {
  const { doc, dirty, tabs, activeId, newDoc, openDoc, closeDoc, setActive, renameDoc, undo, redo, canUndo, canRedo, markSaved } = useCollageStore()
  const dialog = useDialog()
  const pool = useImagePool()
  const [status, setStatus] = useState<string | null>(null)
  const openInputRef = useRef<HTMLInputElement>(null)
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const startRename = (tabId: string, currentName: string) => {
    setRenamingTabId(tabId)
    setRenameValue(currentName)
  }

  const commitRename = () => {
    if (renamingTabId) renameDoc(renamingTabId, renameValue.trim() || tabs.find((t) => t.id === renamingTabId)?.name || 'Untitled collage')
    setRenamingTabId(null)
  }

  const confirmCloseIfDirty = async (id: string) => {
    const tab = tabs.find((t) => t.id === id)
    if (tab?.dirty) {
      return dialog.confirm(`"${tab.name}" has unsaved changes. Close it anyway?`)
    }
    return true
  }

  const handleNew = () => {
    newDoc(createBlankCollageDoc())
  }

  const handleOpenClick = () => openInputRef.current?.click()

  // Select (or drop) the .collage.json alongside its original image files --
  // typically the same folder they were dropped from originally -- and both
  // the layout AND its images load in one action, no separate re-drop needed.
  const handleOpenFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const jsonFile = fileArray.find((f) => /\.json$/i.test(f.name))
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'))

    // pool.add() is async; its own React state update won't be visible via
    // pool.get() within this same call, so track what we just added directly.
    const addedKeys = imageFiles.length > 0 ? await pool.add(imageFiles) : []
    const addedKeySet = new Set(addedKeys)

    if (!jsonFile) {
      if (imageFiles.length > 0) setStatus(`Added ${imageFiles.length} image(s) to the library.`)
      return
    }

    try {
      const text = await jsonFile.text()
      const parsed = JSON.parse(text) as CollageDoc
      if (!parsed || typeof parsed !== 'object' || !parsed.tree) {
        throw new Error('Not a collage layout file')
      }
      parsed.name = nameFromFilename(jsonFile.name)
      openDoc(parsed)
      const missing = collectImageKeys(parsed).filter((key) => !pool.get(key) && !addedKeySet.has(key))
      setStatus(
        missing.length > 0
          ? `Opened "${parsed.name}" -- ${missing.length} image(s) still missing. Select them alongside the .json next time, or drop them into the library now.`
          : `Opened "${parsed.name}"${imageFiles.length > 0 ? ` (${imageFiles.length} image(s) loaded)` : ''}`,
      )
    } catch (e) {
      setStatus(`Couldn't open file: ${String(e)}`)
    }
  }

  const handleCloseTab = async (id: string) => {
    if (!(await confirmCloseIfDirty(id))) return
    closeDoc(id)
  }

  const handleSave = () => {
    if (!doc) return
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${sanitizeFilename(doc.name)}.collage.json`)
    markSaved()
    setStatus('Saved')
  }

  const handleExport = async () => {
    if (!doc) return
    const imageKeys = collectImageKeys(doc)
    const missing = imageKeys.filter((key) => !pool.get(key))
    if (missing.length > 0) {
      setStatus(`Can't export -- ${missing.length} image(s) are missing. Drop them into the library first.`)
      return
    }
    setStatus('Exporting…')
    try {
      const imageFiles = new Map(imageKeys.map((key) => [key, pool.get(key)!.file]))
      const blob = await api.exportCollage(doc, imageFiles)
      downloadBlob(blob, `${sanitizeFilename(doc.name)}.jpg`)
      setStatus('Exported')
    } catch (e) {
      setStatus(String(e))
    }
  }

  return (
    <div className="toolbar-wrap">
      <div className="toolbar">
        <button className="mobile-panel-toggle" onClick={onToggleLibrary} title="Show image library">
          ☰ Library
        </button>
        <button onClick={handleNew}>New</button>
        <button onClick={handleOpenClick} title="Select the .collage.json and its images together to load both at once">
          Open…
        </button>
        <input
          ref={openInputRef}
          type="file"
          accept="application/json,.json,image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) void handleOpenFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button disabled={!doc} onClick={handleSave}>
          Save{dirty ? ' *' : ''}
        </button>
        <span className="toolbar-sep" />
        <button disabled={!canUndo} onClick={undo}>
          Undo
        </button>
        <button disabled={!canRedo} onClick={redo}>
          Redo
        </button>
        <span className="toolbar-sep" />
        <button disabled={!doc} onClick={handleExport}>
          Export
        </button>
        <button className={previewMode ? 'active' : undefined} onClick={onTogglePreview}>
          {previewMode ? 'Exit Preview' : 'Preview'}
        </button>
        <button className="mobile-panel-toggle" onClick={onToggleInspector} title="Show adjustments panel">
          Inspector ☰
        </button>
        {status && <span className="toolbar-status">{status}</span>}
      </div>

      {tabs.length > 0 && (
        <div className="tabs-bar">
          {tabs.map((tab) => (
            <div key={tab.id} className={`tab${tab.id === activeId ? ' active' : ''}`} onClick={() => setActive(tab.id)}>
              {renamingTabId === tab.id ? (
                <input
                  className="tab-rename-input"
                  value={renameValue}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingTabId(null)
                  }}
                />
              ) : (
                <span
                  className="tab-name"
                  title="Double-click to rename"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    startRename(tab.id, tab.name)
                  }}
                >
                  {tab.name}
                  {tab.dirty ? ' *' : ''}
                </span>
              )}
              <button
                className="tab-close"
                title="Close"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseTab(tab.id)
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
