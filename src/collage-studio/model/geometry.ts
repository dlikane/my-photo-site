// TS mirror of backend/app/render_engine.py's layout/crop/seam math.
// Keep this in lockstep with that file -- same function shapes, same
// constants -- so the live canvas preview never diverges from the Pillow
// export.

import { MAX_ZOOM, type FocalPoint, type FrameNode, type Node } from './collageTypes'

export type Rect = { x: number; y: number; w: number; h: number }

export function computeCropBox(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  focal: FocalPoint,
  zoom: number,
): Rect & { x2: number; y2: number } {
  const targetRatio = targetW / targetH
  const srcRatio = srcW / srcH

  let baseW: number
  let baseH: number
  if (srcRatio > targetRatio) {
    baseH = srcH
    baseW = srcH * targetRatio
  } else {
    baseW = srcW
    baseH = srcW / targetRatio
  }

  const z = Math.max(1.0, Math.min(zoom, MAX_ZOOM))
  const cropW = baseW / z
  const cropH = baseH / z

  const cx = srcW * focal.x
  const cy = srcH * focal.y
  let left = cx - cropW / 2
  let top = cy - cropH / 2
  left = Math.max(0, Math.min(left, srcW - cropW))
  top = Math.max(0, Math.min(top, srcH - cropH))
  return { x: left, y: top, w: cropW, h: cropH, x2: left + cropW, y2: top + cropH }
}

export function resolveRects(node: Node, rect: Rect, gutter: number): Record<string, Rect> {
  const { x, y, w, h } = rect

  if (node.type === 'frame') {
    return { [node.id]: { x, y, w, h } }
  }

  const ratio = Math.max(0, Math.min(1, node.ratio))

  if (node.orientation === 'horizontal') {
    const avail = Math.max(0, w - gutter)
    const w1 = Math.round(avail * ratio)
    const w2 = avail - w1
    const rects = resolveRects(node.first, { x, y, w: w1, h }, gutter)
    Object.assign(rects, resolveRects(node.second, { x: x + w1 + gutter, y, w: w2, h }, gutter))
    return rects
  }

  const avail = Math.max(0, h - gutter)
  const h1 = Math.round(avail * ratio)
  const h2 = avail - h1
  const rects = resolveRects(node.first, { x, y, w, h: h1 }, gutter)
  Object.assign(rects, resolveRects(node.second, { x, y: y + h1 + gutter, w, h: h2 }, gutter))
  return rects
}

export function collectFrames(node: Node, out: Record<string, FrameNode> = {}): Record<string, FrameNode> {
  if (node.type === 'frame') {
    out[node.id] = node
  } else {
    collectFrames(node.first, out)
    collectFrames(node.second, out)
  }
  return out
}

/** Returns null if the two rects aren't geometrically adjacent (within gutter tolerance). */
export function rectsAdjacentSeam(rectA: Rect, rectB: Rect, gutter: number): { cx: number; cy: number } | null {
  const tol = gutter + 4
  const { x: ax, y: ay, w: aw, h: ah } = rectA
  const { x: bx, y: by, w: bw, h: bh } = rectB

  const gapARightOfB = bx - (ax + aw)
  const gapBRightOfA = ax - (bx + bw)
  if (Math.abs(gapARightOfB) <= tol || Math.abs(gapBRightOfA) <= tol) {
    const seamX = Math.abs(gapARightOfB) <= tol ? (ax + aw + bx) / 2 : (bx + bw + ax) / 2
    const y0 = Math.max(ay, by)
    const y1 = Math.min(ay + ah, by + bh)
    return { cx: seamX, cy: (y0 + y1) / 2 }
  }

  const gapABelowB = by - (ay + ah)
  const gapBBelowA = ay - (by + bh)
  if (Math.abs(gapABelowB) <= tol || Math.abs(gapBBelowA) <= tol) {
    const seamY = Math.abs(gapABelowB) <= tol ? (ay + ah + by) / 2 : (by + bh + ay) / 2
    const x0 = Math.max(ax, bx)
    const x1 = Math.min(ax + aw, bx + bw)
    return { cx: (x0 + x1) / 2, cy: seamY }
  }

  return null
}

export interface Divider {
  splitId: string
  orientation: 'horizontal' | 'vertical'
  rect: Rect
  parentRect: Rect
}

/** Recursively collects the draggable divider strip for every split node. */
export function collectDividers(node: Node, rect: Rect, gutter: number, out: Divider[] = []): Divider[] {
  if (node.type === 'frame') return out
  const { x, y, w, h } = rect
  const ratio = Math.max(0, Math.min(1, node.ratio))

  if (node.orientation === 'horizontal') {
    const avail = Math.max(0, w - gutter)
    const w1 = Math.round(avail * ratio)
    out.push({ splitId: node.id, orientation: 'horizontal', rect: { x: x + w1, y, w: gutter, h }, parentRect: rect })
    collectDividers(node.first, { x, y, w: w1, h }, gutter, out)
    collectDividers(node.second, { x: x + w1 + gutter, y, w: avail - w1, h }, gutter, out)
  } else {
    const avail = Math.max(0, h - gutter)
    const h1 = Math.round(avail * ratio)
    out.push({ splitId: node.id, orientation: 'vertical', rect: { x, y: y + h1, w, h: gutter }, parentRect: rect })
    collectDividers(node.first, { x, y, w, h: h1 }, gutter, out)
    collectDividers(node.second, { x, y: y + h1 + gutter, w, h: avail - h1 }, gutter, out)
  }
  return out
}

/** Finds every frame pair whose rects are adjacent -- used to offer "add insert here" on seams. */
export function findAdjacentSeams(
  frameRects: Record<string, Rect>,
  gutter: number,
): Array<{ frameIdA: string; frameIdB: string; cx: number; cy: number }> {
  const ids = Object.keys(frameRects)
  const seams: Array<{ frameIdA: string; frameIdB: string; cx: number; cy: number }> = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const seam = rectsAdjacentSeam(frameRects[ids[i]], frameRects[ids[j]], gutter)
      if (seam) {
        seams.push({ frameIdA: ids[i], frameIdB: ids[j], cx: seam.cx, cy: seam.cy })
      }
    }
  }
  return seams
}
