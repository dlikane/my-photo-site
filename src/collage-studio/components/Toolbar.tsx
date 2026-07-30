import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { AppConfig, CollageSummary } from '../model/collageTypes'
import { useCollageStore } from '../state/collageStore'

export function Toolbar() {
  const { doc, dirty, loadDoc, markSaved, undo, redo, canUndo, canRedo, closeDoc } = useCollageStore()
  const [collages, setCollages] = useState<CollageSummary[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<AppConfig | null>(null)

  const refreshCollages = useCallback(() => {
    api.listCollages().then(setCollages).catch((e) => setStatus(String(e)))
  }, [])

  useEffect(() => {
    refreshCollages()
    api.getConfig().then(setConfig).catch(() => {})
  }, [refreshCollages])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const confirmDiscard = () => !dirty || window.confirm('You have unsaved changes. Discard them?')

  const handleNew = async () => {
    if (!confirmDiscard()) return
    const name = window.prompt('Collage name?', 'Untitled collage')
    if (!name) return
    const created = await api.createCollage(name)
    loadDoc(created)
    refreshCollages()
  }

  const handleOpen = async (id: string) => {
    if (!id || !confirmDiscard()) return
    const opened = await api.getCollage(id)
    loadDoc(opened)
  }

  const handleSave = async () => {
    if (!doc) return
    const saved = await api.saveCollage(doc)
    loadDoc(saved)
    markSaved()
    refreshCollages()
    setStatus('Saved')
  }

  const handleSaveAs = async () => {
    if (!doc) return
    const name = window.prompt('Save as new collage named:', `${doc.name} copy`)
    if (!name) return
    const fresh = await api.createCollage(name)
    const copy = { ...doc, id: fresh.id, name, createdAt: fresh.createdAt, updatedAt: fresh.updatedAt }
    const saved = await api.saveCollage(copy)
    loadDoc(saved)
    markSaved()
    refreshCollages()
  }

  const handleExport = async () => {
    if (!doc) return
    setStatus('Exporting…')
    try {
      const result = await api.exportCollage(doc.id)
      setStatus(`Exported to ${result.path}`)
    } catch (e) {
      setStatus(String(e))
    }
  }

  const handleDelete = async () => {
    if (!doc) return
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    await api.deleteCollage(doc.id)
    closeDoc()
    refreshCollages()
  }

  const saveConfig = async () => {
    if (!config) return
    const saved = await api.putConfig(config)
    setConfig(saved)
    setShowSettings(false)
  }

  return (
    <div className="toolbar">
      <button onClick={handleNew}>New</button>
      <select value="" onChange={(e) => handleOpen(e.target.value)}>
        <option value="">Open…</option>
        {collages.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button disabled={!doc} onClick={handleSave}>
        Save{dirty ? ' *' : ''}
      </button>
      <button disabled={!doc} onClick={handleSaveAs}>
        Save As
      </button>
      <button disabled={!doc} onClick={handleDelete}>
        Delete
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
      <button onClick={() => setShowSettings((s) => !s)}>Settings</button>
      {status && <span className="toolbar-status">{status}</span>}

      {showSettings && config && (
        <div className="settings-popover">
          <label>
            Collages folder
            <input type="text" value={config.collagesDir} onChange={(e) => setConfig({ ...config, collagesDir: e.target.value })} />
          </label>
          <label>
            Output folder
            <input type="text" value={config.outputDir} onChange={(e) => setConfig({ ...config, outputDir: e.target.value })} />
          </label>
          <button onClick={saveConfig}>Save settings</button>
        </div>
      )}
    </div>
  )
}
