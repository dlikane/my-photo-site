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
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9 _-]/g, '_').trim() || 'collage'
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
  return Array.from(keys)
}

export function Toolbar({ previewMode, onTogglePreview }: ToolbarProps) {
  const { doc, dirty, tabs, activeId, newDoc, openDoc, closeDoc, setActive, undo, redo, canUndo, canRedo, markSaved } = useCollageStore()
  const dialog = useDialog()
  const pool = useImagePool()
  const [status, setStatus] = useState<string | null>(null)
  const openInputRef = useRef<HTMLInputElement>(null)

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

  const handleOpenFile = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as CollageDoc
      if (!parsed || typeof parsed !== 'object' || !parsed.tree) {
        throw new Error('Not a collage layout file')
      }
      openDoc(parsed)
      const missing = collectImageKeys(parsed).filter((key) => !pool.get(key))
      setStatus(
        missing.length > 0
          ? `Opened "${parsed.name}" -- ${missing.length} image(s) missing. Drop the original files into the library to restore them.`
          : `Opened "${parsed.name}"`,
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
        <button onClick={handleNew}>New</button>
        <button onClick={handleOpenClick}>Open…</button>
        <input
          ref={openInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleOpenFile(file)
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
        {status && <span className="toolbar-status">{status}</span>}
      </div>

      {tabs.length > 0 && (
        <div className="tabs-bar">
          {tabs.map((tab) => (
            <div key={tab.id} className={`tab${tab.id === activeId ? ' active' : ''}`} onClick={() => setActive(tab.id)}>
              <span className="tab-name">
                {tab.name}
                {tab.dirty ? ' *' : ''}
              </span>
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
