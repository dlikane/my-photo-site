import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { CollageDoc } from '../model/collageTypes'

const HISTORY_LIMIT = 50

interface State {
  doc: CollageDoc | null
  dirty: boolean
  selectedFrameId: string | null
  selectedInsertId: string | null
  past: CollageDoc[]
  future: CollageDoc[]
}

type Action =
  | { type: 'LOAD'; doc: CollageDoc }
  | { type: 'EDIT'; updater: (doc: CollageDoc) => CollageDoc }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SELECT_FRAME'; id: string | null }
  | { type: 'SELECT_INSERT'; id: string | null }
  | { type: 'MARK_SAVED' }
  | { type: 'CLOSE' }

const initialState: State = {
  doc: null,
  dirty: false,
  selectedFrameId: null,
  selectedInsertId: null,
  past: [],
  future: [],
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return { ...initialState, doc: action.doc }
    case 'EDIT': {
      if (!state.doc) return state
      const next = action.updater(state.doc)
      if (next === state.doc) return state
      const past = [...state.past, state.doc].slice(-HISTORY_LIMIT)
      return { ...state, doc: next, dirty: true, past, future: [] }
    }
    case 'UNDO': {
      if (state.past.length === 0 || !state.doc) return state
      const previous = state.past[state.past.length - 1]
      return {
        ...state,
        doc: previous,
        dirty: true,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
      }
    }
    case 'REDO': {
      if (state.future.length === 0 || !state.doc) return state
      const next = state.future[0]
      return {
        ...state,
        doc: next,
        dirty: true,
        past: [...state.past, state.doc],
        future: state.future.slice(1),
      }
    }
    case 'SELECT_FRAME':
      return { ...state, selectedFrameId: action.id, selectedInsertId: null }
    case 'SELECT_INSERT':
      return { ...state, selectedInsertId: action.id, selectedFrameId: null }
    case 'MARK_SAVED':
      return { ...state, dirty: false }
    case 'CLOSE':
      return initialState
    default:
      return state
  }
}

interface StoreApi extends State {
  loadDoc: (doc: CollageDoc) => void
  editDoc: (updater: (doc: CollageDoc) => CollageDoc) => void
  undo: () => void
  redo: () => void
  selectFrame: (id: string | null) => void
  selectInsert: (id: string | null) => void
  markSaved: () => void
  closeDoc: () => void
  canUndo: boolean
  canRedo: boolean
}

const CollageStoreContext = createContext<StoreApi | null>(null)

export function CollageStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadDoc = useCallback((doc: CollageDoc) => dispatch({ type: 'LOAD', doc }), [])
  const editDoc = useCallback((updater: (doc: CollageDoc) => CollageDoc) => dispatch({ type: 'EDIT', updater }), [])
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])
  const selectFrame = useCallback((id: string | null) => dispatch({ type: 'SELECT_FRAME', id }), [])
  const selectInsert = useCallback((id: string | null) => dispatch({ type: 'SELECT_INSERT', id }), [])
  const markSaved = useCallback(() => dispatch({ type: 'MARK_SAVED' }), [])
  const closeDoc = useCallback(() => dispatch({ type: 'CLOSE' }), [])

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      loadDoc,
      editDoc,
      undo,
      redo,
      selectFrame,
      selectInsert,
      markSaved,
      closeDoc,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state, loadDoc, editDoc, undo, redo, selectFrame, selectInsert, markSaved, closeDoc],
  )

  return <CollageStoreContext.Provider value={value}>{children}</CollageStoreContext.Provider>
}

export function useCollageStore(): StoreApi {
  const ctx = useContext(CollageStoreContext)
  if (!ctx) throw new Error('useCollageStore must be used within CollageStoreProvider')
  return ctx
}
