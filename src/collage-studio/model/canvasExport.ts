// Full-resolution export, entirely in the browser -- no backend involved.
//
// Reuses the exact same layout/crop math (geometry.ts) and drawing helpers
// (canvasRender.ts) as the live preview in CanvasEditor.tsx, just drawn onto
// an off-screen canvas sized at the doc's actual doc.canvas.width/height
// (scale 1) instead of a viewport-fit display scale, and without any
// selection/hover overlays.

import type { CollageDoc } from './collageTypes'
import { collectFrames, rectsAdjacentSeam, resolveRects, type Rect } from './geometry'
import { drawCoverCropImage, drawFeatheredImage, drawInsertShadow, strokeRoundedRect } from './canvasRender'
import { getCachedImage } from './imageCache'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/** Reuses an already-decoded image from the live preview's cache when
 * available (most images will be, if the doc has been open in the editor)
 * rather than decoding it a second time. */
async function resolveImage(imageKey: string, objectUrl: string): Promise<HTMLImageElement> {
  return getCachedImage(imageKey) ?? loadImage(objectUrl)
}

/** imageKey -> object URL for every image the doc references (from the
 * caller's image pool). Missing keys are simply skipped when drawing, same
 * as the live preview's "missing image" handling -- callers should already
 * be refusing to render with missing images before calling this (see
 * Toolbar.handleRender), this is just a defensive fallback, not validation. */
export async function renderCollageToBlob(doc: CollageDoc, imageUrls: Map<string, string>): Promise<Blob> {
  const images = new Map<string, HTMLImageElement>()
  await Promise.all(
    Array.from(imageUrls, async ([key, url]) => {
      images.set(key, await resolveImage(key, url))
    }),
  )

  const canvasW = Math.max(1, Math.round(doc.canvas.width))
  const canvasH = Math.max(1, Math.round(doc.canvas.height))
  const extW = Math.max(0, doc.border.external.width)
  const gutter = Math.max(0, doc.border.grid.width)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = doc.border.external.color
  ctx.fillRect(0, 0, canvasW, canvasH)

  const interior: Rect = { x: extW, y: extW, w: Math.max(0, canvasW - 2 * extW), h: Math.max(0, canvasH - 2 * extW) }

  if (interior.w > 0 && interior.h > 0) {
    ctx.fillStyle = doc.border.grid.color
    ctx.fillRect(interior.x, interior.y, interior.w, interior.h)

    const frameRects = resolveRects(doc.tree, interior, gutter)
    const frames = collectFrames(doc.tree)

    for (const [frameId, rect] of Object.entries(frameRects)) {
      const frame = frames[frameId]
      if (!frame?.image || rect.w <= 0 || rect.h <= 0) continue
      const img = images.get(frame.image.imageKey)
      if (!img) continue
      drawCoverCropImage(ctx, img, rect, frame.image.focal, frame.image.zoom, frame.image.flipH, frame.image.flipV)
    }

    for (const insert of doc.inserts) {
      if (!insert.imageKey) continue
      const img = images.get(insert.imageKey)
      if (!img) continue

      const base = insert.sizePct * Math.min(canvasW, canvasH)
      // aspectRatio is width/height -- split the overall "size" scale
      // between width and height via sqrt so the two stay inverse of each
      // other (area roughly constant as aspect changes) and aspectRatio 1
      // reduces to exactly the old square behavior (w = h = base). Mirrors
      // CanvasEditor.tsx's insertRects computation.
      const aspect = Math.max(0.05, Math.min(20, insert.aspectRatio))
      const w = base * Math.sqrt(aspect)
      const h = base / Math.sqrt(aspect)
      let cx: number
      let cy: number
      if (insert.position) {
        cx = insert.position.cxPct * canvasW
        cy = insert.position.cyPct * canvasH
      } else if (insert.seam) {
        const seam = rectsAdjacentSeam(frameRects[insert.seam.frameIdA], frameRects[insert.seam.frameIdB], gutter)
        if (!seam) continue
        cx = seam.cx
        cy = seam.cy
      } else {
        continue
      }
      const rect: Rect = { x: cx - w / 2, y: cy - h / 2, w, h }

      const shadow = insert.shadow ?? doc.insertShadowDefault
      if (shadow.enabled) drawInsertShadow(ctx, rect, insert.cornerRadiusPct, shadow, 1)
      drawFeatheredImage(ctx, img, rect, insert.focal, insert.zoom, insert.cornerRadiusPct, insert.featherPx)
      const border = insert.border ?? doc.insertBorderDefault
      if (border?.enabled) strokeRoundedRect(ctx, rect, insert.cornerRadiusPct, border.color, border.width)
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      Math.max(0, Math.min(1, doc.jpegQuality / 100)),
    )
  })
}
