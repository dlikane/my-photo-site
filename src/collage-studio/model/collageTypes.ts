// Mirrors backend/app/models.py -- keep field names/shapes in sync.

export interface FocalPoint {
  x: number
  y: number
}

export interface ImageRef {
  // Opaque session-scoped key into the image pool (see state/imagePoolStore.tsx),
  // not a filesystem path -- fingerprinted from name|size|lastModified so the
  // same file re-dropped in a later session resolves to the same key.
  imageKey: string
  focal: FocalPoint
  zoom: number
}

export interface FrameNode {
  type: 'frame'
  id: string
  image: ImageRef | null
}

export interface SplitNode {
  type: 'split'
  id: string
  orientation: 'horizontal' | 'vertical'
  ratio: number
  first: Node
  second: Node
}

export type Node = FrameNode | SplitNode

export interface BorderSpec {
  width: number
  color: string
}

export interface BorderConfig {
  external: BorderSpec
  grid: BorderSpec
}

export interface InsertBorder {
  enabled: boolean
  width: number
  color: string
}

export interface SeamRef {
  frameIdA: string
  frameIdB: string
}

export interface PositionPct {
  cxPct: number
  cyPct: number
}

export interface Insert {
  id: string
  sourceFrameId: string
  seam: SeamRef | null
  position: PositionPct | null
  sizePct: number
  focal: FocalPoint
  zoom: number
  featherPx: number
  cornerRadiusPct: number
  border: InsertBorder | null
}

export interface CanvasSize {
  width: number
  height: number
}

export interface CollageDoc {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  canvas: CanvasSize
  border: BorderConfig
  jpegQuality: number
  insertBorderDefault: InsertBorder
  tree: Node
  inserts: Insert[]
}

export const MAX_ZOOM = 1 / 0.3

let idCounter = 0
export function newId(): string {
  idCounter += 1
  return `${Date.now().toString(36)}${idCounter.toString(36)}`
}

export function makeFrame(image: ImageRef | null = null): FrameNode {
  return { type: 'frame', id: newId(), image }
}

/** Mirrors the Pydantic default_factory values in backend/app/models.py's CollageDoc. */
export function createBlankCollageDoc(name = 'Untitled collage'): CollageDoc {
  const now = Date.now()
  return {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    canvas: { width: 2000, height: 2500 },
    border: {
      external: { width: 14, color: '#000000' },
      grid: { width: 8, color: '#000000' },
    },
    jpegQuality: 92,
    insertBorderDefault: { enabled: false, width: 6, color: '#ffffff' },
    tree: makeFrame(),
    inserts: [],
  }
}
