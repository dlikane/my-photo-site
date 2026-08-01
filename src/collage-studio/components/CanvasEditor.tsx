import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FocalPoint, ImageRef, Insert } from '../model/collageTypes'
import { newId } from '../model/collageTypes'
import { collectDividers, collectFrames, computeCropBox, rectsAdjacentSeam, resolveRects, type Rect } from '../model/geometry'
import { drawCoverCropImage, drawFeatheredImage, drawInsertShadow, strokeRoundedRect } from '../model/canvasRender'
import { ensureImageLoaded, getCachedImage } from '../model/imageCache'
import { useCollageStore } from '../state/collageStore'
import { useImagePool } from '../state/imagePoolStore'
import { removeFrame, resizeSplit, setFrameImage, splitFrame, swapFrameImages, updateFrame } from '../model/treeOps'
import { MAX_ZOOM } from '../model/collageTypes'

const FRAME_DRAG_MIME = 'application/x-collage-frame'
const LIBRARY_DRAG_MIME = 'application/x-collage-image'

type DragState =
  | { type: 'pan'; frameId: string; pointerId: number; startX: number; startY: number; startFocal: FocalPoint; rect: Rect; img: HTMLImageElement; cropW: number; cropH: number }
  | { type: 'divider'; pointerId: number; splitId: string; orientation: 'horizontal' | 'vertical'; parentRect: Rect }
  | { type: 'insert-pan'; insertId: string; pointerId: number; startX: number; startY: number; startFocal: FocalPoint; rect: Rect; img: HTMLImageElement; cropW: number; cropH: number }
  | { type: 'insert-move'; insertId: string; pointerId: number; startX: number; startY: number; startCxPct: number; startCyPct: number }
  | { type: 'insert-resize'; insertId: string; pointerId: number; startX: number; startY: number; startW: number; startH: number }
  | { type: 'new-insert-drag'; pointerId: number; startX: number; startY: number; insertId: string | null }

// Long-press on an insert (instead of using its dedicated move handle)
// switches from panning its image to moving the insert itself -- cancelled
// if the pointer moves more than this before the timer fires, since that's
// a clear sign the intent was to pan, not to long-press-and-move.
const LONG_PRESS_MS = 450
const LONG_PRESS_CANCEL_PX = 8
// How far the "New insert" button must be dragged before it's treated as a
// drag-to-place gesture rather than a plain tap (which still creates the
// insert centered, as before).
const NEW_INSERT_DRAG_THRESHOLD_PX = 6

function makeNewInsert(cxPct: number, cyPct: number): Insert {
  return {
    id: newId(),
    imageKey: null,
    seam: null,
    position: { cxPct, cyPct },
    sizePct: 0.26,
    aspectRatio: 1,
    focal: { x: 0.5, y: 0.5 },
    zoom: 1.6,
    featherPx: 18,
    cornerRadiusPct: 0.08,
    border: null,
    shadow: null,
  }
}

function hitTest(point: { x: number; y: number }, rects: Record<string, Rect>): string | null {
  for (const [id, r] of Object.entries(rects)) {
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return id
  }
  return null
}

/** Thin outline showing where the edges of the *full* source image would
 * fall, in display space -- while zoomed in, that's larger than (and
 * extends beyond) destRect, since destRect only shows a cropped portion.
 * Only drawn transiently, while actively panning/zooming (see
 * activeZoomTarget) -- at zoom 1 this would just retrace destRect itself. */
function drawFullImageOutline(ctx: CanvasRenderingContext2D, img: HTMLImageElement, destRect: Rect, focal: FocalPoint, zoom: number) {
  if (zoom <= 1.01) return
  const box = computeCropBox(img.naturalWidth, img.naturalHeight, destRect.w, destRect.h, focal, zoom)
  const scaleX = destRect.w / box.w
  const scaleY = destRect.h / box.h
  const fullX = destRect.x - box.x * scaleX
  const fullY = destRect.y - box.y * scaleY
  const fullW = img.naturalWidth * scaleX
  const fullH = img.naturalHeight * scaleY
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.lineWidth = 1
  ctx.strokeRect(Math.round(fullX) + 0.5, Math.round(fullY) + 0.5, Math.round(fullW) - 1, Math.round(fullH) - 1)
  ctx.restore()
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, rect: Rect, label?: string) {
  if (rect.w <= 4 || rect.h <= 4) return
  ctx.save()
  ctx.fillStyle = '#2a2a2e'
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
  ctx.strokeStyle = '#555'
  ctx.setLineDash([6, 6])
  ctx.lineWidth = 1.5
  ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8)
  ctx.setLineDash([])
  if (label) {
    ctx.fillStyle = '#888'
    ctx.font = '13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (rect.w > 60 && rect.h > 20) ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2)
  }
  ctx.restore()
}

// Matches the CSS mobile breakpoint (collage-studio.css) -- below it, "Drop
// image here" isn't useful copy (drag-and-drop isn't the primary mobile
// interaction) and just wastes space on an already-small frame.
const MOBILE_BREAKPOINT = 860

interface CanvasEditorProps {
  previewMode: boolean
}

export function CanvasEditor({ previewMode }: CanvasEditorProps) {
  const { doc, editDoc, selectedFrameId, selectedInsertId, selectFrame, selectInsert } = useCollageStore()
  const pool = useImagePool()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })
  const [tick, setTick] = useState(0)
  const [liveFocal, setLiveFocal] = useState<{ frameId: string; focal: FocalPoint } | null>(null)
  const [liveRatio, setLiveRatio] = useState<{ splitId: string; ratio: number } | null>(null)
  const [liveInsertFocal, setLiveInsertFocal] = useState<{ insertId: string; focal: FocalPoint } | null>(null)
  const [liveInsertPos, setLiveInsertPos] = useState<{ insertId: string; cxPct: number; cyPct: number } | null>(null)
  const [liveInsertSize, setLiveInsertSize] = useState<{ insertId: string; w: number; h: number } | null>(null)
  // Whole-collage view zoom (1 = fit-to-panel, the only zoom level before
  // this). Independent of any per-frame/insert image zoom -- this scales
  // the *display*, same as resizing the window would, not the doc itself.
  const [viewZoom, setViewZoom] = useState(1)
  // Which frame/insert to draw the transient "full image" outline for --
  // set while actively panning/zooming that image, cleared shortly after.
  const [activeZoomTarget, setActiveZoomTarget] = useState<{ kind: 'frame' | 'insert'; id: string } | null>(null)
  const longPressRef = useRef<{ timer: ReturnType<typeof setTimeout>; insertId: string; pointerId: number } | null>(null)
  const wheelZoomClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const forceRedraw = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect
      setContainerSize({ w: box.width, h: box.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Re-centers the scroll position whenever the view zoom changes -- simple
  // "zoom around the middle" rather than trying to preserve exactly what was
  // under the cursor/fingers, which fits the "just fit or zoom in" slider
  // this drives (not a full pan-to-point zoom tool).
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
    el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2)
  }, [viewZoom])

  const layout = useMemo(() => {
    if (!doc) return null
    const tree = liveRatio ? resizeSplit(doc.tree, liveRatio.splitId, liveRatio.ratio) : doc.tree
    const maxW = Math.max(50, containerSize.w - 40)
    const maxH = Math.max(50, containerSize.h - 40)
    const fitScale = Math.max(0.01, Math.min(maxW / doc.canvas.width, maxH / doc.canvas.height))
    // viewZoom only ever zooms *in* from fit (see the zoom bar) -- fit
    // itself is already "as much as the panel can show", so there's no
    // zoom-out below it.
    const scale = fitScale * viewZoom
    const canvasCssW = doc.canvas.width * scale
    const canvasCssH = doc.canvas.height * scale
    const extW = doc.border.external.width * scale
    const gutter = doc.border.grid.width * scale
    const interior: Rect = {
      x: extW,
      y: extW,
      w: Math.max(0, canvasCssW - 2 * extW),
      h: Math.max(0, canvasCssH - 2 * extW),
    }
    const frameRects = resolveRects(tree, interior, gutter)
    const frames = collectFrames(tree)
    const dividers = collectDividers(tree, interior, gutter)
    return { scale, canvasCssW, canvasCssH, extW, gutter, interior, frameRects, frames, dividers }
  }, [doc, containerSize, liveRatio, viewZoom])

  const insertRects = useMemo(() => {
    if (!doc || !layout) return {}
    const out: Record<string, Rect> = {}
    for (const insert of doc.inserts) {
      let w: number
      let h: number
      if (liveInsertSize && liveInsertSize.insertId === insert.id) {
        // Live-resizing: track the drag's raw pixel dimensions directly
        // rather than round-tripping through sizePct/aspectRatio, so the
        // bottom-right handle tracks the pointer exactly.
        w = liveInsertSize.w
        h = liveInsertSize.h
      } else {
        const base = insert.sizePct * Math.min(layout.canvasCssW, layout.canvasCssH)
        // aspectRatio is width/height -- split the overall "size" scale
        // between width and height via sqrt so the two stay inverse of each
        // other (area roughly constant as aspect changes) and aspectRatio 1
        // reduces to exactly the old square behavior (w = h = base).
        const aspect = Math.max(0.05, Math.min(20, insert.aspectRatio))
        w = base * Math.sqrt(aspect)
        h = base / Math.sqrt(aspect)
      }
      let cx: number
      let cy: number
      // Seam-anchored by default (created via the seam "+"), but the move
      // handle can drag it anywhere -- once it has a `position` that takes
      // over from the seam anchor.
      if (liveInsertPos && liveInsertPos.insertId === insert.id) {
        cx = liveInsertPos.cxPct * layout.canvasCssW
        cy = liveInsertPos.cyPct * layout.canvasCssH
      } else if (insert.position) {
        cx = insert.position.cxPct * layout.canvasCssW
        cy = insert.position.cyPct * layout.canvasCssH
      } else if (insert.seam) {
        const seam = rectsAdjacentSeam(layout.frameRects[insert.seam.frameIdA], layout.frameRects[insert.seam.frameIdB], layout.gutter)
        if (!seam) continue
        cx = seam.cx
        cy = seam.cy
      } else {
        continue
      }
      out[insert.id] = { x: cx - w / 2, y: cy - h / 2, w, h }
    }
    return out
  }, [doc, layout, liveInsertPos, liveInsertSize])

  // ---- draw ----
  useEffect(() => {
    if (!doc || !layout || !canvasRef.current) return
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(layout.canvasCssW * dpr))
    canvas.height = Math.max(1, Math.round(layout.canvasCssH * dpr))
    canvas.style.width = `${layout.canvasCssW}px`
    canvas.style.height = `${layout.canvasCssH}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, layout.canvasCssW, layout.canvasCssH)

    ctx.fillStyle = doc.border.external.color
    ctx.fillRect(0, 0, layout.canvasCssW, layout.canvasCssH)

    if (layout.interior.w > 0 && layout.interior.h > 0) {
      ctx.fillStyle = doc.border.grid.color
      ctx.fillRect(layout.interior.x, layout.interior.y, layout.interior.w, layout.interior.h)

      for (const [frameId, rect] of Object.entries(layout.frameRects)) {
        const frame = layout.frames[frameId]
        if (!frame || rect.w <= 0 || rect.h <= 0) continue
        if (frame.image) {
          const pooled = pool.get(frame.image.imageKey)
          const img = pooled ? getCachedImage(frame.image.imageKey) : undefined
          const focal = liveFocal && liveFocal.frameId === frameId ? liveFocal.focal : frame.image.focal
          if (img) {
            drawCoverCropImage(ctx, img, rect, focal, frame.image.zoom, frame.image.flipH, frame.image.flipV)
            if (activeZoomTarget?.kind === 'frame' && activeZoomTarget.id === frameId) {
              drawFullImageOutline(ctx, img, rect, focal, frame.image.zoom)
            }
          } else if (pooled) {
            ensureImageLoaded(frame.image.imageKey, pooled.objectUrl, forceRedraw)
            drawPlaceholder(ctx, rect, 'Loading…')
          } else {
            drawPlaceholder(ctx, rect, 'Missing image — drop it in the library')
          }
        } else {
          drawPlaceholder(ctx, rect, containerSize.w < MOBILE_BREAKPOINT ? undefined : 'Drop image here')
        }
        if (!previewMode && frameId === selectedFrameId) {
          ctx.save()
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 3
          ctx.strokeRect(rect.x + 1.5, rect.y + 1.5, Math.max(0, rect.w - 3), Math.max(0, rect.h - 3))
          ctx.restore()
        }
      }

      for (const insert of doc.inserts) {
        const rect = insertRects[insert.id]
        if (!rect) continue
        if (insert.imageKey === null) {
          // Previously invisible until assigned an image -- no way to tell
          // one exists at all unless it happened to be selected. Now shown
          // for every imageless insert, selected or not.
          drawPlaceholder(ctx, rect, containerSize.w < MOBILE_BREAKPOINT ? undefined : 'Drop image here')
          if (!previewMode && insert.id === selectedInsertId) {
            ctx.save()
            ctx.strokeStyle = '#3b82f6'
            ctx.setLineDash([5, 4])
            ctx.lineWidth = 2
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            ctx.restore()
          }
          continue
        }
        const pooled = pool.get(insert.imageKey)
        if (!pooled) continue
        const img = getCachedImage(insert.imageKey)
        if (!img) {
          ensureImageLoaded(insert.imageKey, pooled.objectUrl, forceRedraw)
          continue
        }
        const insertFocal = liveInsertFocal && liveInsertFocal.insertId === insert.id ? liveInsertFocal.focal : insert.focal
        const shadow = insert.shadow ?? doc.insertShadowDefault
        if (shadow.enabled) {
          drawInsertShadow(ctx, rect, insert.cornerRadiusPct, shadow, layout.scale)
        }
        drawFeatheredImage(ctx, img, rect, insertFocal, insert.zoom, insert.cornerRadiusPct, insert.featherPx * layout.scale)
        if (activeZoomTarget?.kind === 'insert' && activeZoomTarget.id === insert.id) {
          drawFullImageOutline(ctx, img, rect, insertFocal, insert.zoom)
        }
        const border = insert.border ?? doc.insertBorderDefault
        if (border?.enabled) strokeRoundedRect(ctx, rect, insert.cornerRadiusPct, border.color, border.width * layout.scale)
        if (!previewMode && insert.id === selectedInsertId) {
          ctx.save()
          ctx.strokeStyle = '#3b82f6'
          ctx.setLineDash([5, 4])
          ctx.lineWidth = 2
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
          ctx.restore()
        }
      }
    }
  }, [doc, layout, selectedFrameId, selectedInsertId, tick, liveFocal, liveInsertFocal, insertRects, forceRedraw, pool, previewMode, activeZoomTarget])

  // ---- pointer interaction on the canvas itself (select / pan / move insert) ----
  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // A second (or third...) touch starting a pinch shouldn't hijack the
      // single-pointer pan/move drag the first touch may have already
      // started -- isPrimary is only true for the first active touch point.
      if (!e.isPrimary) return
      if (!doc || !layout) return
      const box = e.currentTarget.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }

      const insertId = hitTest(point, insertRects)
      if (insertId) {
        selectInsert(insertId)
        const insert = doc.inserts.find((i) => i.id === insertId)
        if (!insert?.imageKey) return
        const img = getCachedImage(insert.imageKey)
        if (!img) return
        const rect = insertRects[insertId]
        const cropBox = computeCropBox(img.naturalWidth, img.naturalHeight, rect.w, rect.h, insert.focal, insert.zoom)
        dragRef.current = {
          type: 'insert-pan',
          insertId,
          pointerId: e.pointerId,
          startX: point.x,
          startY: point.y,
          startFocal: insert.focal,
          rect,
          img,
          cropW: cropBox.w,
          cropH: cropBox.h,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
        setActiveZoomTarget({ kind: 'insert', id: insertId })
        // Long-press (instead of using the dedicated move handle) switches
        // this from panning the image to moving the insert itself --
        // cancelled in onCanvasPointerMove if the pointer moves first.
        if (longPressRef.current) clearTimeout(longPressRef.current.timer)
        const timer = setTimeout(() => {
          const drag = dragRef.current
          if (!drag || drag.type !== 'insert-pan' || drag.insertId !== insertId || drag.pointerId !== e.pointerId) return
          if (navigator.vibrate) navigator.vibrate(30)
          dragRef.current = {
            type: 'insert-move',
            insertId,
            pointerId: drag.pointerId,
            startX: drag.startX,
            startY: drag.startY,
            startCxPct: (rect.x + rect.w / 2) / layout.canvasCssW,
            startCyPct: (rect.y + rect.h / 2) / layout.canvasCssH,
          }
          longPressRef.current = null
        }, LONG_PRESS_MS)
        longPressRef.current = { timer, insertId, pointerId: e.pointerId }
        return
      }

      const frameId = hitTest(point, layout.frameRects)
      if (!frameId) return
      selectFrame(frameId)
      const frame = layout.frames[frameId]
      if (!frame?.image) return
      const img = getCachedImage(frame.image.imageKey)
      if (!img) return
      const rect = layout.frameRects[frameId]
      const cropBox = computeCropBox(img.naturalWidth, img.naturalHeight, rect.w, rect.h, frame.image.focal, frame.image.zoom)
      dragRef.current = {
        type: 'pan',
        frameId,
        pointerId: e.pointerId,
        startX: point.x,
        startY: point.y,
        startFocal: frame.image.focal,
        rect,
        img,
        cropW: cropBox.w,
        cropH: cropBox.h,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      setActiveZoomTarget({ kind: 'frame', id: frameId })
    },
    [doc, layout, insertRects, selectFrame, selectInsert, previewMode],
  )

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag || !layout) return

      if (drag.type === 'pan') {
        const box = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - box.left
        const y = e.clientY - box.top
        const dxCss = x - drag.startX
        const dyCss = y - drag.startY
        // source px per css px, from the same cover-crop box used to draw this frame
        const scaleX = drag.cropW / drag.rect.w
        const scaleY = drag.cropH / drag.rect.h
        const newX = Math.max(0, Math.min(1, drag.startFocal.x - (dxCss * scaleX) / drag.img.naturalWidth))
        const newY = Math.max(0, Math.min(1, drag.startFocal.y - (dyCss * scaleY) / drag.img.naturalHeight))
        setLiveFocal({ frameId: drag.frameId, focal: { x: newX, y: newY } })
        return
      }

      if (drag.type === 'insert-pan') {
        const box = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - box.left
        const y = e.clientY - box.top
        const dxCss = x - drag.startX
        const dyCss = y - drag.startY
        // Real panning intent, confirmed by movement -- don't let the
        // pending long-press timer convert this into a move partway through.
        if (longPressRef.current && Math.hypot(dxCss, dyCss) > LONG_PRESS_CANCEL_PX) {
          clearTimeout(longPressRef.current.timer)
          longPressRef.current = null
        }
        const scaleX = drag.cropW / drag.rect.w
        const scaleY = drag.cropH / drag.rect.h
        const newX = Math.max(0, Math.min(1, drag.startFocal.x - (dxCss * scaleX) / drag.img.naturalWidth))
        const newY = Math.max(0, Math.min(1, drag.startFocal.y - (dyCss * scaleY) / drag.img.naturalHeight))
        setLiveInsertFocal({ insertId: drag.insertId, focal: { x: newX, y: newY } })
        return
      }

      // Long-press converted this into a move -- same math as the dedicated
      // move handle's onInsertMovePointerMove, just driven by the canvas's
      // own pointer events since that's where capture already is.
      if (drag.type === 'insert-move') {
        const box = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - box.left
        const y = e.clientY - box.top
        const newCxPct = Math.max(0, Math.min(1, drag.startCxPct + (x - drag.startX) / layout.canvasCssW))
        const newCyPct = Math.max(0, Math.min(1, drag.startCyPct + (y - drag.startY) / layout.canvasCssH))
        setLiveInsertPos({ insertId: drag.insertId, cxPct: newCxPct, cyPct: newCyPct })
      }
    },
    [layout],
  )

  const onCanvasPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag) return

      if (drag.type === 'pan') {
        dragRef.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
        setActiveZoomTarget(null)
        setLiveFocal((live) => {
          if (live && live.frameId === drag.frameId) {
            editDoc((d) => ({ ...d, tree: updateFrame(d.tree, drag.frameId, (f) => ({ ...f, image: f.image ? { ...f.image, focal: live.focal } : f.image })) }))
          }
          return null
        })
        return
      }

      if (drag.type === 'insert-pan') {
        dragRef.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
        setActiveZoomTarget(null)
        if (longPressRef.current) {
          clearTimeout(longPressRef.current.timer)
          longPressRef.current = null
        }
        setLiveInsertFocal((live) => {
          if (live && live.insertId === drag.insertId) {
            editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === live.insertId ? { ...i, focal: live.focal } : i)) }))
          }
          return null
        })
        return
      }

      // Long-press-converted move -- same commit logic as the dedicated
      // move handle's onInsertMovePointerUp.
      if (drag.type === 'insert-move') {
        dragRef.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
        setLiveInsertPos((live) => {
          if (live) {
            editDoc((d) => ({
              ...d,
              inserts: d.inserts.map((i) => (i.id === live.insertId ? { ...i, seam: null, position: { cxPct: live.cxPct, cyPct: live.cyPct } } : i)),
            }))
          }
          return null
        })
      }
    },
    [editDoc],
  )

  // Double-click an image (frame or insert) to reset it back to a plain
  // fit -- zoom 1, centered focal -- undoing any amount of zoom/pan in one step.
  const onCanvasDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!layout) return
      const box = e.currentTarget.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }

      const insertId = hitTest(point, insertRects)
      if (insertId) {
        editDoc((d) => ({
          ...d,
          inserts: d.inserts.map((i) => (i.id === insertId ? { ...i, zoom: 1, focal: { x: 0.5, y: 0.5 } } : i)),
        }))
        return
      }

      const frameId = hitTest(point, layout.frameRects)
      if (!frameId) return
      editDoc((d) => ({
        ...d,
        tree: updateFrame(d.tree, frameId, (f) => (f.image ? { ...f, image: { ...f.image, zoom: 1, focal: { x: 0.5, y: 0.5 } } } : f)),
      }))
    },
    [layout, insertRects, editDoc],
  )

  // Native (non-React) listener: React's onWheel is registered passive on the
  // root container, so e.preventDefault() there can't stop page scroll.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !doc || !layout) return
    const handler = (e: WheelEvent) => {
      const box = canvas.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }
      // Multiplicative (not additive) step -- with MAX_ZOOM this high, a fixed
      // +/-0.1 per tick would take hundreds of scroll ticks to reach the top
      // of the range. A proportional step stays fine-grained near 1x and
      // still reaches high zoom quickly.
      const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1

      // Shown while the wheel is actively turning, cleared shortly after it
      // stops -- wheel ticks don't have a clear gesture start/end the way a
      // drag or pinch does, so this just debounces on inactivity instead.
      const markActive = (kind: 'frame' | 'insert', id: string) => {
        setActiveZoomTarget({ kind, id })
        if (wheelZoomClearRef.current) clearTimeout(wheelZoomClearRef.current)
        wheelZoomClearRef.current = setTimeout(() => setActiveZoomTarget(null), 600)
      }

      const insertId = hitTest(point, insertRects)
      if (insertId) {
        const insert = doc.inserts.find((i) => i.id === insertId)
        if (!insert?.imageKey) return
        e.preventDefault()
        const nextZoom = Math.max(1, Math.min(MAX_ZOOM, insert.zoom * factor))
        editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === insertId ? { ...i, zoom: nextZoom } : i)) }))
        markActive('insert', insertId)
        return
      }

      const frameId = hitTest(point, layout.frameRects)
      if (!frameId) return
      const frame = layout.frames[frameId]
      if (!frame?.image) return
      e.preventDefault()
      const nextZoom = Math.max(1, Math.min(MAX_ZOOM, frame.image.zoom * factor))
      editDoc((d) => ({ ...d, tree: updateFrame(d.tree, frameId, (f) => ({ ...f, image: f.image ? { ...f.image, zoom: nextZoom } : f.image })) }))
      markActive('frame', frameId)
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [doc, layout, insertRects, editDoc])

  // Two-finger touch is either a pinch (zoom whichever frame/insert is under
  // the midpoint, touch equivalent of the wheel handler above) or a drag
  // (pan the whole collage view -- see the zoom bar below). Both start the
  // same way, so the first ~10px of movement decides which one it is by
  // comparing how much the distance between the two touches changed
  // (pinch signal) against how much their midpoint moved (pan signal),
  // then commits to that mode for the rest of the gesture. Kept in a ref
  // (not a plain closure variable) so the active gesture survives this
  // effect re-running mid-gesture, which it does on every editDoc call
  // since `doc` is a dependency (same as the wheel handler already relies on).
  type TouchGesture =
    | { mode: 'pending'; startDist: number; startMidX: number; startMidY: number; target: { kind: 'insert' | 'frame'; id: string } | null; startScrollLeft: number; startScrollTop: number }
    | { mode: 'zoom'; kind: 'insert' | 'frame'; id: string; lastDist: number }
    | { mode: 'pan'; startMidX: number; startMidY: number; startScrollLeft: number; startScrollTop: number }
  const touchGestureRef = useRef<TouchGesture | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const container = wrapperRef.current
    if (!canvas || !container || !doc || !layout) return
    const touchDist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const touchMid = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 })
    const GESTURE_DECIDE_PX = 10

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const box = canvas.getBoundingClientRect()
      const mid = touchMid(e.touches)
      const point = { x: mid.x - box.left, y: mid.y - box.top }
      const insertId = hitTest(point, insertRects)
      let target: { kind: 'insert' | 'frame'; id: string } | null = null
      if (insertId && doc.inserts.find((i) => i.id === insertId)?.imageKey) {
        target = { kind: 'insert', id: insertId }
      } else {
        const frameId = hitTest(point, layout.frameRects)
        if (frameId && layout.frames[frameId]?.image) target = { kind: 'frame', id: frameId }
      }
      touchGestureRef.current = {
        mode: 'pending',
        startDist: touchDist(e.touches),
        startMidX: mid.x,
        startMidY: mid.y,
        target,
        startScrollLeft: container.scrollLeft,
        startScrollTop: container.scrollTop,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const gesture = touchGestureRef.current
      if (e.touches.length !== 2 || !gesture) return
      e.preventDefault()
      const mid = touchMid(e.touches)
      const dist = touchDist(e.touches)

      if (gesture.mode === 'pending') {
        const distChange = Math.abs(dist - gesture.startDist)
        const midMove = Math.hypot(mid.x - gesture.startMidX, mid.y - gesture.startMidY)
        if (Math.max(distChange, midMove) < GESTURE_DECIDE_PX) return
        if (gesture.target && distChange > midMove) {
          touchGestureRef.current = { mode: 'zoom', kind: gesture.target.kind, id: gesture.target.id, lastDist: dist }
          setActiveZoomTarget(gesture.target)
        } else {
          touchGestureRef.current = {
            mode: 'pan',
            startMidX: gesture.startMidX,
            startMidY: gesture.startMidY,
            startScrollLeft: gesture.startScrollLeft,
            startScrollTop: gesture.startScrollTop,
          }
        }
        return
      }

      if (gesture.mode === 'zoom') {
        const ratio = dist / gesture.lastDist
        gesture.lastDist = dist
        if (gesture.kind === 'insert') {
          const insert = doc.inserts.find((i) => i.id === gesture.id)
          if (!insert) return
          const nextZoom = Math.max(1, Math.min(MAX_ZOOM, insert.zoom * ratio))
          editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === gesture.id ? { ...i, zoom: nextZoom } : i)) }))
        } else {
          const frame = layout.frames[gesture.id]
          if (!frame?.image) return
          const nextZoom = Math.max(1, Math.min(MAX_ZOOM, frame.image.zoom * ratio))
          editDoc((d) => ({ ...d, tree: updateFrame(d.tree, gesture.id, (f) => (f.image ? { ...f, image: { ...f.image, zoom: nextZoom } } : f)) }))
        }
        return
      }

      // pan -- drag fingers right, the view scrolls to reveal what was to the left.
      container.scrollLeft = gesture.startScrollLeft - (mid.x - gesture.startMidX)
      container.scrollTop = gesture.startScrollTop - (mid.y - gesture.startMidY)
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchGestureRef.current = null
        setActiveZoomTarget(null)
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [doc, layout, insertRects, editDoc])

  const assignImageToDropTarget = useCallback(
    (imageKey: string, insertId: string | null, frameId: string | null) => {
      // Inserts render on top of frames, so a drop that lands on an insert
      // assigns to the insert (its own, decoupled image) rather than the frame beneath.
      if (insertId) {
        editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === insertId ? { ...i, imageKey } : i)) }))
        selectInsert(insertId)
      } else if (frameId) {
        const image: ImageRef = { imageKey, focal: { x: 0.5, y: 0.5 }, zoom: 1.0, flipH: false, flipV: false }
        editDoc((d) => ({ ...d, tree: setFrameImage(d.tree, frameId, image) }))
        selectFrame(frameId)
      }
    },
    [editDoc, selectFrame, selectInsert],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (!layout) return
      const box = e.currentTarget.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }
      const insertId = hitTest(point, insertRects)
      const frameId = hitTest(point, layout.frameRects)
      if (!insertId && !frameId) return

      // Dragging one already-populated frame onto another -- swap their images.
      const frameSourceId = e.dataTransfer.getData(FRAME_DRAG_MIME)
      if (frameSourceId) {
        if (frameId && frameSourceId !== frameId) {
          editDoc((d) => ({ ...d, tree: swapFrameImages(d.tree, frameSourceId, frameId) }))
          selectFrame(frameId)
        }
        return
      }

      // Files dropped straight from Explorer/Finder/Gallery, not dragged from the library.
      if (e.dataTransfer.files.length > 0) {
        const files = e.dataTransfer.files
        void pool.add(files).then((keys) => {
          const imageKey = keys[0]
          if (imageKey) assignImageToDropTarget(imageKey, insertId, frameId)
        })
        return
      }

      const imageKey = e.dataTransfer.getData(LIBRARY_DRAG_MIME)
      if (!imageKey) return
      assignImageToDropTarget(imageKey, insertId, frameId)
    },
    [layout, insertRects, pool, assignImageToDropTarget],
  )

  // ---- divider drag (DOM overlay) ----
  const beginDividerDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, splitId: string, orientation: 'horizontal' | 'vertical', parentRect: Rect) => {
      e.stopPropagation()
      dragRef.current = { type: 'divider', pointerId: e.pointerId, splitId, orientation, parentRect }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [],
  )

  const onDividerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.type !== 'divider' || !layout || !canvasRef.current) return
    const canvasBox = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - canvasBox.left
    const y = e.clientY - canvasBox.top
    const ratio =
      drag.orientation === 'horizontal'
        ? (x - drag.parentRect.x) / Math.max(1, drag.parentRect.w - layout.gutter)
        : (y - drag.parentRect.y) / Math.max(1, drag.parentRect.h - layout.gutter)
    setLiveRatio({ splitId: drag.splitId, ratio: Math.max(0.05, Math.min(0.95, ratio)) })
  }, [layout])

  const onDividerPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'divider') return
      dragRef.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
      setLiveRatio((live) => {
        if (live) editDoc((d) => ({ ...d, tree: resizeSplit(d.tree, live.splitId, live.ratio) }))
        return null
      })
    },
    [editDoc],
  )

  // ---- "New insert" button: tap creates one centered, drag places it directly ----
  const beginNewInsertDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const canvasBox = canvasRef.current?.getBoundingClientRect()
    if (!canvasBox) return
    dragRef.current = { type: 'new-insert-drag', pointerId: e.pointerId, startX: e.clientX - canvasBox.left, startY: e.clientY - canvasBox.top, insertId: null }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onNewInsertDragMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'new-insert-drag' || !layout) return
      const canvasBox = canvasRef.current?.getBoundingClientRect()
      if (!canvasBox) return
      const x = e.clientX - canvasBox.left
      const y = e.clientY - canvasBox.top
      const cxPct = Math.max(0, Math.min(1, x / layout.canvasCssW))
      const cyPct = Math.max(0, Math.min(1, y / layout.canvasCssH))

      if (!drag.insertId) {
        // Only actually create the insert once the drag clears a small
        // threshold -- a plain tap (released before this) instead falls
        // through to onNewInsertDragUp's centered-creation fallback.
        if (Math.hypot(x - drag.startX, y - drag.startY) < NEW_INSERT_DRAG_THRESHOLD_PX) return
        const insert = makeNewInsert(cxPct, cyPct)
        editDoc((d) => ({ ...d, inserts: [...d.inserts, insert] }))
        selectInsert(insert.id)
        dragRef.current = { ...drag, insertId: insert.id }
        setLiveInsertPos({ insertId: insert.id, cxPct, cyPct })
        return
      }
      setLiveInsertPos({ insertId: drag.insertId, cxPct, cyPct })
    },
    [layout, editDoc, selectInsert],
  )

  const onNewInsertDragUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'new-insert-drag') return
      dragRef.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
      if (!drag.insertId) {
        // Never crossed the drag threshold -- treat as a plain tap.
        const insert = makeNewInsert(0.5, 0.5)
        editDoc((d) => ({ ...d, inserts: [...d.inserts, insert] }))
        selectInsert(insert.id)
        return
      }
      setLiveInsertPos((live) => {
        if (live && live.insertId === drag.insertId) {
          editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === live.insertId ? { ...i, position: { cxPct: live.cxPct, cyPct: live.cyPct } } : i)) }))
        }
        return null
      })
    },
    [editDoc, selectInsert],
  )

  // ---- insert move handle (DOM overlay, top-left anchor) ----
  const beginInsertMove = useCallback((e: React.PointerEvent<HTMLDivElement>, insertId: string, rect: Rect) => {
    e.stopPropagation()
    const canvasBox = canvasRef.current?.getBoundingClientRect()
    if (!canvasBox || !layout) return
    dragRef.current = {
      type: 'insert-move',
      insertId,
      pointerId: e.pointerId,
      startX: e.clientX - canvasBox.left,
      startY: e.clientY - canvasBox.top,
      startCxPct: (rect.x + rect.w / 2) / layout.canvasCssW,
      startCyPct: (rect.y + rect.h / 2) / layout.canvasCssH,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [layout])

  const onInsertMovePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'insert-move' || !layout || !canvasRef.current) return
      const canvasBox = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - canvasBox.left
      const y = e.clientY - canvasBox.top
      const newCxPct = Math.max(0, Math.min(1, drag.startCxPct + (x - drag.startX) / layout.canvasCssW))
      const newCyPct = Math.max(0, Math.min(1, drag.startCyPct + (y - drag.startY) / layout.canvasCssH))
      setLiveInsertPos({ insertId: drag.insertId, cxPct: newCxPct, cyPct: newCyPct })
    },
    [layout],
  )

  const onInsertMovePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'insert-move') return
      dragRef.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
      setLiveInsertPos((live) => {
        if (live) {
          // Detach from its birth seam once freely positioned -- otherwise
          // that seam would look permanently "occupied" (no "+" marker) even
          // though the insert has moved away from it.
          editDoc((d) => ({
            ...d,
            inserts: d.inserts.map((i) => (i.id === live.insertId ? { ...i, seam: null, position: { cxPct: live.cxPct, cyPct: live.cyPct } } : i)),
          }))
        }
        return null
      })
    },
    [editDoc],
  )

  // ---- insert resize handle (DOM overlay, bottom-right anchor) ----
  // Dragging tracks width and height independently -- unlike the old
  // uniform-scale resize, this lets the aspect ratio change freely just by
  // dragging, not only via the Inspector's slider.
  const beginInsertResize = useCallback((e: React.PointerEvent<HTMLDivElement>, insertId: string, startRect: Rect) => {
    e.stopPropagation()
    const canvasBox = canvasRef.current?.getBoundingClientRect()
    if (!canvasBox) return
    dragRef.current = {
      type: 'insert-resize',
      insertId,
      pointerId: e.pointerId,
      startX: e.clientX - canvasBox.left,
      startY: e.clientY - canvasBox.top,
      startW: startRect.w,
      startH: startRect.h,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onInsertResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'insert-resize' || !canvasRef.current) return
      const canvasBox = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - canvasBox.left
      const y = e.clientY - canvasBox.top
      const MIN_PX = 20
      const w = Math.max(MIN_PX, drag.startW + (x - drag.startX))
      const h = Math.max(MIN_PX, drag.startH + (y - drag.startY))
      setLiveInsertSize({ insertId: drag.insertId, w, h })
    },
    [],
  )

  const onInsertResizePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'insert-resize' || !layout) return
      dragRef.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
      setLiveInsertSize((live) => {
        if (live) {
          const minDim = Math.min(layout.canvasCssW, layout.canvasCssH)
          // No practical upper limit on insert size (it can be bigger than
          // the canvas itself) -- only a small floor to avoid a degenerate
          // near-zero box.
          const sizePct = Math.max(0.02, Math.sqrt(live.w * live.h) / minDim)
          const aspectRatio = Math.max(0.05, Math.min(20, live.w / live.h))
          editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === live.insertId ? { ...i, sizePct, aspectRatio } : i)) }))
        }
        return null
      })
    },
    [editDoc, layout],
  )

  if (!doc || !layout) {
    return (
      <div className="canvas-editor-empty" ref={wrapperRef}>
        No collage open. Use "New" or "Open" to get started.
      </div>
    )
  }

  const selectedRect = selectedFrameId ? layout.frameRects[selectedFrameId] : null
  const selectedFrame = selectedFrameId ? layout.frames[selectedFrameId] : null
  const frameCount = Object.keys(layout.frameRects).length

  return (
    <div className="canvas-editor-wrap">
    <div
      className={`canvas-editor${viewZoom > 1 ? ' zoomed' : ''}`}
      ref={wrapperRef}
      onClick={(e) => {
        // Only when the click lands on this wrapper itself -- the padding
        // area around the stage -- not any descendant (stage/canvas clicks
        // are handled by onCanvasPointerDown, which already selects/
        // deselects based on what's under the pointer).
        if (e.target !== e.currentTarget) return
        selectFrame(null)
        selectInsert(null)
      }}
    >
      <div className="canvas-editor-stage" style={{ width: layout.canvasCssW, height: layout.canvasCssH }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onDoubleClick={onCanvasDoubleClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        />

        {!previewMode &&
          layout.dividers.map((d) => (
            <div
              key={d.splitId}
              className={`divider divider-${d.orientation}`}
              style={{ left: d.rect.x, top: d.rect.y, width: Math.max(6, d.rect.w), height: Math.max(6, d.rect.h) }}
              onPointerDown={(e) => beginDividerDrag(e, d.splitId, d.orientation, d.parentRect)}
              onPointerMove={onDividerPointerMove}
              onPointerUp={onDividerPointerUp}
            />
          ))}

        {!previewMode && (
          <button
            className="insert-add-btn"
            title="Add an insert -- tap to place it centered, or press and drag to place it directly"
            onPointerDown={beginNewInsertDrag}
            onPointerMove={onNewInsertDragMove}
            onPointerUp={onNewInsertDragUp}
          >
            +
          </button>
        )}

        {/* Move/resize/remove controls only for the *selected* insert --
            wherever it currently is (seam-anchored or freely moved). */}
        {!previewMode && selectedInsertId && insertRects[selectedInsertId] && (
          <>
            <div
              className="insert-move-handle"
              style={{ left: insertRects[selectedInsertId].x - 6, top: insertRects[selectedInsertId].y - 6 }}
              onPointerDown={(e) => beginInsertMove(e, selectedInsertId, insertRects[selectedInsertId])}
              onPointerMove={onInsertMovePointerMove}
              onPointerUp={onInsertMovePointerUp}
              title="Drag to move"
            />
            <div
              className="insert-resize-handle"
              style={{
                left: insertRects[selectedInsertId].x + insertRects[selectedInsertId].w - 6,
                top: insertRects[selectedInsertId].y + insertRects[selectedInsertId].h - 6,
              }}
              onPointerDown={(e) => beginInsertResize(e, selectedInsertId, insertRects[selectedInsertId])}
              onPointerMove={onInsertResizePointerMove}
              onPointerUp={onInsertResizePointerUp}
              title="Drag to resize"
            />
            <button
              className="seam-remove"
              title="Remove insert"
              style={{
                left: insertRects[selectedInsertId].x + insertRects[selectedInsertId].w - 11,
                top: insertRects[selectedInsertId].y - 11,
              }}
              onClick={() => {
                editDoc((d) => ({ ...d, inserts: d.inserts.filter((i) => i.id !== selectedInsertId) }))
                selectInsert(null)
              }}
            >
              ✕
            </button>
          </>
        )}

        {/* Imageless inserts are otherwise easy to lose track of (nothing
            to click to select them except their own placeholder) -- give
            every one a remove-X regardless of selection, not just the
            selected one (which already gets the fuller control set above). */}
        {!previewMode &&
          doc.inserts
            .filter((insert) => insert.imageKey === null && insert.id !== selectedInsertId)
            .map((insert) => {
              const rect = insertRects[insert.id]
              if (!rect) return null
              return (
                <button
                  key={insert.id}
                  className="seam-remove"
                  title="Remove insert"
                  style={{ left: rect.x + rect.w - 11, top: rect.y - 11 }}
                  onClick={() => editDoc((d) => ({ ...d, inserts: d.inserts.filter((i) => i.id !== insert.id) }))}
                >
                  ✕
                </button>
              )
            })}

        {!previewMode && selectedRect && selectedFrameId && (
          <div className="frame-toolbar" style={{ left: selectedRect.x + selectedRect.w - 4, top: selectedRect.y + 4 }}>
            <button title="Split horizontally" onClick={() => editDoc((d) => ({ ...d, tree: splitFrame(d.tree, selectedFrameId, 'horizontal') }))}>
              ⬌
            </button>
            <button title="Split vertically" onClick={() => editDoc((d) => ({ ...d, tree: splitFrame(d.tree, selectedFrameId, 'vertical') }))}>
              ⬍
            </button>
            <button
              title="Flip horizontally"
              disabled={!selectedFrame?.image}
              className={selectedFrame?.image?.flipH ? 'active' : undefined}
              onClick={() =>
                editDoc((d) => ({
                  ...d,
                  tree: updateFrame(d.tree, selectedFrameId, (f) => (f.image ? { ...f, image: { ...f.image, flipH: !f.image.flipH } } : f)),
                }))
              }
            >
              ⇋
            </button>
            <button
              title="Flip vertically"
              disabled={!selectedFrame?.image}
              className={selectedFrame?.image?.flipV ? 'active' : undefined}
              onClick={() =>
                editDoc((d) => ({
                  ...d,
                  tree: updateFrame(d.tree, selectedFrameId, (f) => (f.image ? { ...f, image: { ...f.image, flipV: !f.image.flipV } } : f)),
                }))
              }
            >
              ⇵
            </button>
            <button
              title="Drag onto another frame to swap images"
              draggable={!!selectedFrame?.image}
              disabled={!selectedFrame?.image}
              onDragStart={(e) => e.dataTransfer.setData(FRAME_DRAG_MIME, selectedFrameId)}
            >
              ⇄
            </button>
            <button
              title="Clear image from this frame"
              disabled={!selectedFrame?.image}
              onClick={() => editDoc((d) => ({ ...d, tree: updateFrame(d.tree, selectedFrameId, (f) => ({ ...f, image: null })) }))}
            >
              ⌫
            </button>
            <button
              title="Remove this frame"
              disabled={frameCount <= 1}
              onClick={() => {
                editDoc((d) => ({ ...d, tree: removeFrame(d.tree, selectedFrameId) }))
                selectFrame(null)
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
    {!previewMode && (
      <div className="canvas-zoom-bar">
        <button onClick={() => setViewZoom(1)} disabled={viewZoom === 1} title="Fit to panel">
          Fit
        </button>
        <input
          type="range"
          min={1}
          max={4}
          step={0.1}
          value={viewZoom}
          onChange={(e) => setViewZoom(Number(e.target.value))}
          title="Zoom the whole collage view (not any individual photo)"
        />
        <span className="hint">{Math.round(viewZoom * 100)}%</span>
      </div>
    )}
    </div>
  )
}
