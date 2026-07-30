import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { CollageDoc } from '../model/collageTypes'

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
    case 'OPEN_DOC':
      // Freshly loaded from a file on disk -- matches what's on disk, so it's clean.
      return {
        entries: { ...state.entries, [action.doc.id]: newEntry(action.doc, false) },
        order: [...state.order, action.doc.id],
        activeId: action.doc.id,
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
}

const CollageStoreContext = createContext<StoreApi | null>(null)

export function CollageStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const activeEntry = state.activeId ? state.entries[state.activeId] : null

  const newDoc = useCallback((doc: CollageDoc) => dispatch({ type: 'NEW_DOC', doc }), [])
  const openDoc = useCallback((doc: CollageDoc) => dispatch({ type: 'OPEN_DOC', doc }), [])
  const closeDoc = useCallback((id: string) => dispatch({ type: 'CLOSE_DOC', id }), [])
  const setActive = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE', id }), [])

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
    }),
    [activeEntry, editDoc, undo, redo, selectFrame, selectInsert, markSaved, tabs, state.activeId, newDoc, openDoc, closeDoc, setActive],
  )

  return <CollageStoreContext.Provider value={value}>{children}</CollageStoreContext.Provider>
}

export function useCollageStore(): StoreApi {
  const ctx = useContext(CollageStoreContext)
  if (!ctx) throw new Error('useCollageStore must be used within CollageStoreProvider')
  return ctx
}
