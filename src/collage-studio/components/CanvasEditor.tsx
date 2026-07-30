import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FocalPoint, ImageRef, Insert } from '../model/collageTypes'
import { newId } from '../model/collageTypes'
import {
  collectDividers,
  collectFrames,
  computeCropBox,
  findAdjacentSeams,
  rectsAdjacentSeam,
  resolveRects,
  type Rect,
} from '../model/geometry'
import { drawCoverCropImage, drawFeatheredImage, strokeRoundedRect } from '../model/canvasRender'
import { ensureImageLoaded, getCachedImage } from '../model/imageCache'
import { useCollageStore } from '../state/collageStore'
import { useImagePool } from '../state/imagePoolStore'
import { removeFrame, resizeSplit, setFrameImage, splitFrame, updateFrame } from '../model/treeOps'
import { MAX_ZOOM } from '../model/collageTypes'

type DragState =
  | { type: 'pan'; frameId: string; pointerId: number; startX: number; startY: number; startFocal: FocalPoint; rect: Rect; img: HTMLImageElement; cropW: number; cropH: number }
  | { type: 'divider'; pointerId: number; splitId: string; orientation: 'horizontal' | 'vertical'; parentRect: Rect }

function hitTest(point: { x: number; y: number }, rects: Record<string, Rect>): string | null {
  for (const [id, r] of Object.entries(rects)) {
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return id
  }
  return null
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, rect: Rect, label: string) {
  if (rect.w <= 4 || rect.h <= 4) return
  ctx.save()
  ctx.fillStyle = '#2a2a2e'
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
  ctx.strokeStyle = '#555'
  ctx.setLineDash([6, 6])
  ctx.lineWidth = 1.5
  ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8)
  ctx.setLineDash([])
  ctx.fillStyle = '#888'
  ctx.font = '13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (rect.w > 60 && rect.h > 20) ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2)
  ctx.restore()
}

export function CanvasEditor() {
  const { doc, editDoc, selectedFrameId, selectedInsertId, selectFrame, selectInsert } = useCollageStore()
  const pool = useImagePool()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })
  const [tick, setTick] = useState(0)
  const [liveFocal, setLiveFocal] = useState<{ frameId: string; focal: FocalPoint } | null>(null)
  const [liveRatio, setLiveRatio] = useState<{ splitId: string; ratio: number } | null>(null)
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

  const layout = useMemo(() => {
    if (!doc) return null
    const tree = liveRatio ? resizeSplit(doc.tree, liveRatio.splitId, liveRatio.ratio) : doc.tree
    const maxW = Math.max(50, containerSize.w - 40)
    const maxH = Math.max(50, containerSize.h - 40)
    const scale = Math.max(0.01, Math.min(maxW / doc.canvas.width, maxH / doc.canvas.height))
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
    const seams = findAdjacentSeams(frameRects, gutter)
    return { scale, canvasCssW, canvasCssH, extW, gutter, interior, frameRects, frames, dividers, seams }
  }, [doc, containerSize, liveRatio])

  const insertRects = useMemo(() => {
    if (!doc || !layout) return {}
    const out: Record<string, Rect> = {}
    for (const insert of doc.inserts) {
      const size = insert.sizePct * Math.min(layout.canvasCssW, layout.canvasCssH)
      let cx: number
      let cy: number
      if (insert.position) {
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
      out[insert.id] = { x: cx - size / 2, y: cy - size / 2, w: size, h: size }
    }
    return out
  }, [doc, layout])

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
          if (img) drawCoverCropImage(ctx, img, rect, focal, frame.image.zoom)
          else if (pooled) {
            ensureImageLoaded(frame.image.imageKey, pooled.objectUrl, forceRedraw)
            drawPlaceholder(ctx, rect, 'Loading…')
          } else {
            drawPlaceholder(ctx, rect, 'Missing image — drop it in the library')
          }
        } else {
          drawPlaceholder(ctx, rect, 'Drop image here')
        }
        if (frameId === selectedFrameId) {
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
        const sourceFrame = layout.frames[insert.sourceFrameId]
        if (!sourceFrame?.image) continue
        const pooled = pool.get(sourceFrame.image.imageKey)
        if (!pooled) continue
        const img = getCachedImage(sourceFrame.image.imageKey)
        if (!img) {
          ensureImageLoaded(sourceFrame.image.imageKey, pooled.objectUrl, forceRedraw)
          continue
        }
        drawFeatheredImage(ctx, img, rect, insert.focal, insert.zoom, insert.cornerRadiusPct, insert.featherPx * layout.scale)
        const border = insert.border ?? doc.insertBorderDefault
        if (border?.enabled) strokeRoundedRect(ctx, rect, insert.cornerRadiusPct, border.color, border.width * layout.scale)
        if (insert.id === selectedInsertId) {
          ctx.save()
          ctx.strokeStyle = '#3b82f6'
          ctx.setLineDash([5, 4])
          ctx.lineWidth = 2
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
          ctx.restore()
        }
      }
    }
  }, [doc, layout, selectedFrameId, selectedInsertId, tick, liveFocal, insertRects, forceRedraw, pool])

  // ---- pointer interaction on the canvas itself (select / pan) ----
  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!doc || !layout) return
      const box = e.currentTarget.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }

      const insertId = hitTest(point, insertRects)
      if (insertId) {
        selectInsert(insertId)
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
    },
    [doc, layout, insertRects, selectFrame, selectInsert],
  )

  const onCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag || drag.type !== 'pan') return
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
  }, [])

  const onCanvasPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag || drag.type !== 'pan') return
      dragRef.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
      setLiveFocal((live) => {
        if (live && live.frameId === drag.frameId) {
          editDoc((d) => ({ ...d, tree: updateFrame(d.tree, drag.frameId, (f) => ({ ...f, image: f.image ? { ...f.image, focal: live.focal } : f.image })) }))
        }
        return null
      })
    },
    [editDoc],
  )

  // Native (non-React) listener: React's onWheel is registered passive on the
  // root container, so e.preventDefault() there can't stop page scroll.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !doc || !layout) return
    const handler = (e: WheelEvent) => {
      const box = canvas.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }
      const frameId = hitTest(point, layout.frameRects)
      if (!frameId) return
      const frame = layout.frames[frameId]
      if (!frame?.image) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const nextZoom = Math.max(1, Math.min(MAX_ZOOM, frame.image.zoom + delta))
      editDoc((d) => ({ ...d, tree: updateFrame(d.tree, frameId, (f) => ({ ...f, image: f.image ? { ...f.image, zoom: nextZoom } : f.image })) }))
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [doc, layout, editDoc])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (!layout) return
      const box = e.currentTarget.getBoundingClientRect()
      const point = { x: e.clientX - box.left, y: e.clientY - box.top }
      const frameId = hitTest(point, layout.frameRects)
      if (!frameId) return

      // Files dropped straight from Explorer/Finder/Gallery, not dragged from the library.
      if (e.dataTransfer.files.length > 0) {
        const [imageKey] = pool.add(e.dataTransfer.files)
        if (!imageKey) return
        const image: ImageRef = { imageKey, focal: { x: 0.5, y: 0.5 }, zoom: 1.0 }
        editDoc((d) => ({ ...d, tree: setFrameImage(d.tree, frameId, image) }))
        selectFrame(frameId)
        return
      }

      const imageKey = e.dataTransfer.getData('application/x-collage-image')
      if (!imageKey) return
      const image: ImageRef = { imageKey, focal: { x: 0.5, y: 0.5 }, zoom: 1.0 }
      editDoc((d) => ({ ...d, tree: setFrameImage(d.tree, frameId, image) }))
      selectFrame(frameId)
    },
    [layout, editDoc, selectFrame, pool],
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

  if (!doc || !layout) {
    return (
      <div className="canvas-editor-empty" ref={wrapperRef}>
        No collage open. Use "New" or "Open" to get started.
      </div>
    )
  }

  const selectedRect = selectedFrameId ? layout.frameRects[selectedFrameId] : null
  const frameCount = Object.keys(layout.frameRects).length

  return (
    <div className="canvas-editor" ref={wrapperRef}>
      <div className="canvas-editor-stage" style={{ width: layout.canvasCssW, height: layout.canvasCssH }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        />

        {layout.dividers.map((d) => (
          <div
            key={d.splitId}
            className={`divider divider-${d.orientation}`}
            style={{ left: d.rect.x, top: d.rect.y, width: Math.max(6, d.rect.w), height: Math.max(6, d.rect.h) }}
            onPointerDown={(e) => beginDividerDrag(e, d.splitId, d.orientation, d.parentRect)}
            onPointerMove={onDividerPointerMove}
            onPointerUp={onDividerPointerUp}
          />
        ))}

        {layout.seams.map((seam) => (
          <button
            key={`${seam.frameIdA}-${seam.frameIdB}`}
            className="seam-marker"
            title="Add insert on this seam"
            style={{ left: seam.cx - 13, top: seam.cy - 13 }}
            onClick={() => {
              const frameA = layout.frames[seam.frameIdA]
              const frameB = layout.frames[seam.frameIdB]
              const sourceFrameId = frameA?.image ? seam.frameIdA : frameB?.image ? seam.frameIdB : seam.frameIdA
              const insert: Insert = {
                id: newId(),
                sourceFrameId,
                seam: { frameIdA: seam.frameIdA, frameIdB: seam.frameIdB },
                position: null,
                sizePct: 0.26,
                focal: { x: 0.5, y: 0.5 },
                zoom: 1.6,
                featherPx: 18,
                cornerRadiusPct: 0.08,
                border: null,
              }
              editDoc((d) => ({ ...d, inserts: [...d.inserts, insert] }))
              selectInsert(insert.id)
            }}
          >
            +
          </button>
        ))}

        {selectedRect && selectedFrameId && (
          <div className="frame-toolbar" style={{ left: selectedRect.x + selectedRect.w - 4, top: selectedRect.y + 4 }}>
            <button title="Split horizontally" onClick={() => editDoc((d) => ({ ...d, tree: splitFrame(d.tree, selectedFrameId, 'horizontal') }))}>
              ⬌
            </button>
            <button title="Split vertically" onClick={() => editDoc((d) => ({ ...d, tree: splitFrame(d.tree, selectedFrameId, 'vertical') }))}>
              ⬍
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
  )
}
