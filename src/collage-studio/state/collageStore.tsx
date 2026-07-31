import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { normalizeDoc, type CollageDoc } from '../model/collageTypes'
import { loadSession, saveSession } from './idb'

const HISTORY_LIMIT = 50

interface DocEntry {
  doc: CollageDoc
  dirty: boolean
  selectedFrameId: string | null
  selectedInsertId: string | null
  past: CollageDoc[]
  future: CollageDoc[]
}

interface State {
  entries: Record<string, DocEntry>
  order: string[]
  activeId: string | null
}

type Action =
  | { type: 'NEW_DOC'; doc: CollageDoc }
  | { type: 'OPEN_DOC'; doc: CollageDoc }
  | { type: 'CLOSE_DOC'; id: string }
  | { type: 'SET_ACTIVE'; id: string }
  | { type: 'EDIT'; id: string; updater: (doc: CollageDoc) => CollageDoc }
  | { type: 'UNDO'; id: string }
  | { type: 'REDO'; id: string }
  | { type: 'SELECT_FRAME'; id: string; frameId: string | null }
  | { type: 'SELECT_INSERT'; id: string; insertId: string | null }
  | { type: 'MARK_SAVED'; id: string }
  | { type: 'RENAME_DOC'; id: string; name: string }
  | { type: 'HYDRATE'; order: string[]; activeId: string | null; entries: Record<string, DocEntry> }

const initialState: State = { entries: {}, order: [], activeId: null }

function newEntry(doc: CollageDoc, dirty: boolean): DocEntry {
  return { doc, dirty, selectedFrameId: null, selectedInsertId: null, past: [], future: [] }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NEW_DOC':
      // Never saved/downloaded yet -- starts dirty so it's highlighted like any unsaved tab.
      return {
        entries: { ...state.entries, [action.doc.id]: newEntry(action.doc, true) },
        order: [...state.order, action.doc.id],
        activeId: action.doc.id,
      }
    case 'OPEN_DOC': {
      // Freshly loaded from a file on disk -- matches what's on disk, so it's clean.
      // normalizeDoc backfills any fields added after this file might have been
      // exported (e.g. an older .collage.json missing insertShadowDefault).
      const doc = normalizeDoc(action.doc)
      return {
        entries: { ...state.entries, [doc.id]: newEntry(doc, false) },
        order: [...state.order, doc.id],
        activeId: doc.id,
      }
    }
    case 'CLOSE_DOC': {
      if (!state.entries[action.id]) return state
      const { [action.id]: _removed, ...entries } = state.entries
      const order = state.order.filter((id) => id !== action.id)
      let activeId = state.activeId
      if (activeId === action.id) {
        const idx = state.order.indexOf(action.id)
        activeId = order[idx] ?? order[idx - 1] ?? null
      }
      return { entries, order, activeId }
    }
    case 'SET_ACTIVE':
      return state.entries[action.id] ? { ...state, activeId: action.id } : state
    case 'EDIT': {
      const entry = state.entries[action.id]
      if (!entry) return state
      const next = action.updater(entry.doc)
      if (next === entry.doc) return state
      const past = [...entry.past, entry.doc].slice(-HISTORY_LIMIT)
      return { ...state, entries: { ...state.entries, [action.id]: { ...entry, doc: next, dirty: true, past, future: [] } } }
    }
    case 'UNDO': {
      const entry = state.entries[action.id]
      if (!entry || entry.past.length === 0) return state
      const previous = entry.past[entry.past.length - 1]
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.id]: {
            ...entry,
            doc: previous,
            dirty: true,
            past: entry.past.slice(0, -1),
            future: [entry.doc, ...entry.future],
          },
        },
      }
    }
    case 'REDO': {
      const entry = state.entries[action.id]
      if (!entry || entry.future.length === 0) return state
      const next = entry.future[0]
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.id]: {
            ...entry,
            doc: next,
            dirty: true,
            past: [...entry.past, entry.doc],
            future: entry.future.slice(1),
          },
        },
      }
    }
    case 'SELECT_FRAME': {
      const entry = state.entries[action.id]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.id]: { ...entry, selectedFrameId: action.frameId, selectedInsertId: null } } }
    }
    case 'SELECT_INSERT': {
      const entry = state.entries[action.id]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.id]: { ...entry, selectedInsertId: action.insertId, selectedFrameId: null } } }
    }
    case 'MARK_SAVED': {
      const entry = state.entries[action.id]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.id]: { ...entry, dirty: false } } }
    }
    case 'RENAME_DOC': {
      const entry = state.entries[action.id]
      if (!entry || entry.doc.name === action.name) return state
      // Not pushed onto undo history -- a rename isn't a canvas edit, matching
      // most tools' convention of not undoing renames.
      return { ...state, entries: { ...state.entries, [action.id]: { ...entry, doc: { ...entry.doc, name: action.name }, dirty: true } } }
    }
    case 'HYDRATE':
      // Only fires once, right after mount, and only if there was nothing
      // created in the brief window before the IndexedDB load resolved.
      if (state.order.length > 0) return state
      return { entries: action.entries, order: action.order, activeId: action.activeId }
    default:
      return state
  }
}

export interface TabInfo {
  id: string
  name: string
  dirty: boolean
}

interface StoreApi {
  // Active-doc surface -- what CanvasEditor/InspectorPanel/QuickStartTemplates use.
  doc: CollageDoc | null
  dirty: boolean
  selectedFrameId: string | null
  selectedInsertId: string | null
  editDoc: (updater: (doc: CollageDoc) => CollageDoc) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  selectFrame: (id: string | null) => void
  selectInsert: (id: string | null) => void
  markSaved: () => void

  // Multi-doc tab management -- what Toolbar uses.
  tabs: TabInfo[]
  activeId: string | null
  newDoc: (doc: CollageDoc) => void
  openDoc: (doc: CollageDoc) => void
  closeDoc: (id: string) => void
  setActive: (id: string) => void
  renameDoc: (id: string, name: string) => void
  /** Every open collage's doc, across all tabs (not just the active one) --
   * e.g. for "which images does any open collage still reference." */
  allDocs: CollageDoc[]
}

const CollageStoreContext = createContext<StoreApi | null>(null)

export function CollageStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)
  const activeEntry = state.activeId ? state.entries[state.activeId] : null

  // Restore whatever collages/tabs were open last time, once, on mount.
  useEffect(() => {
    let cancelled = false
    loadSession()
      .then((session) => {
        if (cancelled || !session || session.order.length === 0) return
        const entries: Record<string, DocEntry> = {}
        for (const id of session.order) {
          const stored = session.docs[id]
          if (stored) entries[id] = newEntry(normalizeDoc(stored.doc as CollageDoc), stored.dirty)
        }
        dispatch({ type: 'HYDRATE', order: session.order, activeId: session.activeId, entries })
      })
      .catch((e) => console.error('Failed to load persisted session:', e))
      .finally(() => {
        if (!cancelled) setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist on every change, once hydration has had its chance to run first
  // (otherwise the initial empty state would race the load and win).
  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => {
      const docs: Record<string, { doc: CollageDoc; dirty: boolean }> = {}
      for (const id of state.order) {
        docs[id] = { doc: state.entries[id].doc, dirty: state.entries[id].dirty }
      }
      saveSession({ order: state.order, activeId: state.activeId, docs }).catch((e) => console.error('Failed to persist session:', e))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [state, hydrated])

  const newDoc = useCallback((doc: CollageDoc) => dispatch({ type: 'NEW_DOC', doc }), [])
  const openDoc = useCallback((doc: CollageDoc) => dispatch({ type: 'OPEN_DOC', doc }), [])
  const closeDoc = useCallback((id: string) => dispatch({ type: 'CLOSE_DOC', id }), [])
  const setActive = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE', id }), [])
  const renameDoc = useCallback((id: string, name: string) => dispatch({ type: 'RENAME_DOC', id, name }), [])

  const editDoc = useCallback(
    (updater: (doc: CollageDoc) => CollageDoc) => {
      if (state.activeId) dispatch({ type: 'EDIT', id: state.activeId, updater })
    },
    [state.activeId],
  )
  const undo = useCallback(() => {
    if (state.activeId) dispatch({ type: 'UNDO', id: state.activeId })
  }, [state.activeId])
  const redo = useCallback(() => {
    if (state.activeId) dispatch({ type: 'REDO', id: state.activeId })
  }, [state.activeId])
  const selectFrame = useCallback(
    (frameId: string | null) => {
      if (state.activeId) dispatch({ type: 'SELECT_FRAME', id: state.activeId, frameId })
    },
    [state.activeId],
  )
  const selectInsert = useCallback(
    (insertId: string | null) => {
      if (state.activeId) dispatch({ type: 'SELECT_INSERT', id: state.activeId, insertId })
    },
    [state.activeId],
  )
  const markSaved = useCallback(() => {
    if (state.activeId) dispatch({ type: 'MARK_SAVED', id: state.activeId })
  }, [state.activeId])

  const tabs = useMemo<TabInfo[]>(
    () => state.order.map((id) => ({ id, name: state.entries[id].doc.name, dirty: state.entries[id].dirty })),
    [state.order, state.entries],
  )

  const allDocs = useMemo<CollageDoc[]>(() => state.order.map((id) => state.entries[id].doc), [state.order, state.entries])

  const value = useMemo<StoreApi>(
    () => ({
      doc: activeEntry?.doc ?? null,
      dirty: activeEntry?.dirty ?? false,
      selectedFrameId: activeEntry?.selectedFrameId ?? null,
      selectedInsertId: activeEntry?.selectedInsertId ?? null,
      editDoc,
      undo,
      redo,
      canUndo: (activeEntry?.past.length ?? 0) > 0,
      canRedo: (activeEntry?.future.length ?? 0) > 0,
      selectFrame,
      selectInsert,
      markSaved,
      tabs,
      activeId: state.activeId,
      newDoc,
      openDoc,
      closeDoc,
      setActive,
      renameDoc,
      allDocs,
    }),
    [activeEntry, editDoc, undo, redo, selectFrame, selectInsert, markSaved, tabs, state.activeId, newDoc, openDoc, closeDoc, setActive, renameDoc, allDocs],
  )

  return <CollageStoreContext.Provider value={value}>{children}</CollageStoreContext.Provider>
}

export function useCollageStore(): StoreApi {
  const ctx = useContext(CollageStoreContext)
  if (!ctx) throw new Error('useCollageStore must be used within CollageStoreProvider')
  return ctx
}
