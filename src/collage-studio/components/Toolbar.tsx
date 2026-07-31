import { useEffect, useRef, useState } from 'react'
import { renderCollageToBlob } from '../model/canvasExport'
import { createBlankCollageDoc, type CollageDoc } from '../model/collageTypes'
import { collectImageKeys } from '../model/geometry'
import { LAYOUT_TEMPLATES } from '../model/templates'
import { useCollageStore } from '../state/collageStore'
import { useDialog } from '../state/dialogStore'
import { useImagePool } from '../state/imagePoolStore'

interface ToolbarProps {
  previewMode: boolean
  onTogglePreview: () => void
  mobileLibraryOpen: boolean
  onToggleLibrary: () => void
  mobileInspectorOpen: boolean
  onToggleInspector: () => void
}

function LibraryPanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="2.5" width="5" height="11" rx="1.5" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

function InspectorPanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2.5" width="5" height="11" rx="1.5" fill="currentColor" opacity="0.55" />
    </svg>
  )
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

export function Toolbar({
  previewMode,
  onTogglePreview,
  mobileLibraryOpen,
  onToggleLibrary,
  mobileInspectorOpen,
  onToggleInspector,
}: ToolbarProps) {
  const { doc, tabs, activeId, newDoc, openDoc, closeDoc, setActive, renameDoc, undo, redo, canUndo, canRedo, markSaved } = useCollageStore()
  const dialog = useDialog()
  const pool = useImagePool()
  const [status, setStatus] = useState<string | null>(null)
  const openInputRef = useRef<HTMLInputElement>(null)
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const newMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!newMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setNewMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [newMenuOpen])

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
    setNewMenuOpen(false)
  }

  const handleNewFromTemplate = (build: () => CollageDoc['tree']) => {
    const blank = createBlankCollageDoc()
    newDoc({ ...blank, tree: build() })
    setNewMenuOpen(false)
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

  // "Export" = download the layout-only .collage.json (was "Save").
  const handleExportLayout = () => {
    if (!doc) return
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${sanitizeFilename(doc.name)}.collage.json`)
    markSaved()
    setStatus('Exported')
  }

  // "Render" = full-resolution export to a final JPEG (was "Export"). Runs
  // entirely client-side via canvas (model/canvasExport.ts) -- no backend.
  const handleRender = async () => {
    if (!doc) return
    const imageKeys = collectImageKeys(doc)
    const missing = imageKeys.filter((key) => !pool.get(key))
    if (missing.length > 0) {
      setStatus(`Can't render -- ${missing.length} image(s) are missing. Drop them into the library first.`)
      return
    }
    setStatus('Rendering…')
    try {
      const imageUrls = new Map(imageKeys.map((key) => [key, pool.get(key)!.objectUrl]))
      const blob = await renderCollageToBlob(doc, imageUrls)
      downloadBlob(blob, `${sanitizeFilename(doc.name)}.jpg`)
      setStatus('Rendered')
    } catch (e) {
      setStatus(String(e))
    }
  }

  return (
    <div className="toolbar-wrap">
      <div className="toolbar">
        <div className="new-menu-wrap" ref={newMenuRef}>
          <button className="new-menu-main" onClick={handleNew}>
            New
          </button>
          <button className="new-menu-caret" onClick={() => setNewMenuOpen((o) => !o)} title="Choose a starting layout">
            ▾
          </button>
          {newMenuOpen && (
            <div className="new-menu-dropdown">
              <button onClick={handleNew}>
                <span className="layout-icon" />
                Blank
              </button>
              {LAYOUT_TEMPLATES.map((t) => (
                <button key={t.key} onClick={() => handleNewFromTemplate(t.build)}>
                  <span className={`layout-icon layout-icon-${t.key}`} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <button disabled={!doc} onClick={handleExportLayout}>
          Export
        </button>
        <span className="toolbar-sep" />
        <button disabled={!canUndo} onClick={undo}>
          Undo
        </button>
        <button disabled={!canRedo} onClick={redo}>
          Redo
        </button>
        <span className="toolbar-sep" />
        <button disabled={!doc} onClick={handleRender}>
          Render
        </button>
        <button className={previewMode ? 'active' : undefined} onClick={onTogglePreview}>
          {previewMode ? 'Exit Preview' : 'Preview'}
        </button>
        {status && <span className="toolbar-status">{status}</span>}
      </div>

      {tabs.length > 0 && (
        <div className="tabs-bar">
          <button
            className={`mobile-panel-icon-toggle${mobileLibraryOpen ? ' active' : ''}`}
            onClick={onToggleLibrary}
            title="Toggle Library"
          >
            <LibraryPanelIcon />
          </button>
          <div className="tabs-bar-tabs">
          {tabs.map((tab) => (
            <div key={tab.id} className={`tab${tab.id === activeId ? ' active' : ''}`} onClick={() => setActive(tab.id)}>
              {renamingTabId === tab.id ? (
                <input
                  type="text"
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
          <button
            className={`mobile-panel-icon-toggle${mobileInspectorOpen ? ' active' : ''}`}
            onClick={onToggleInspector}
            title="Toggle Inspector"
          >
            <InspectorPanelIcon />
          </button>
        </div>
      )}
    </div>
  )
}
