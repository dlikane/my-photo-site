// Canvas drawing helpers. All rects here are already in *display* pixel space
// (doc units * displayScale) -- see CanvasEditor.computeLayout. The preview
// doesn't need to match the export's pixel resolution, only its proportions;
// geometry.ts guarantees the crop/layout math itself is identical.

import type { FocalPoint } from './collageTypes'
import { computeCropBox, type Rect } from './geometry'

export function drawCoverCropImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destRect: Rect,
  focal: FocalPoint,
  zoom: number,
) {
  if (destRect.w <= 0 || destRect.h <= 0) return
  const box = computeCropBox(img.naturalWidth, img.naturalHeight, destRect.w, destRect.h, focal, zoom)
  ctx.drawImage(img, box.x, box.y, box.w, box.h, destRect.x, destRect.y, destRect.w, destRect.h)
}

export function drawFeatheredImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destRect: Rect,
  focal: FocalPoint,
  zoom: number,
  cornerRadiusPct: number,
  featherPx: number,
) {
  const w = Math.round(destRect.w)
  const h = Math.round(destRect.h)
  if (w <= 0 || h <= 0) return

  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const octx = off.getContext('2d')!
  const box = computeCropBox(img.naturalWidth, img.naturalHeight, w, h, focal, zoom)
  octx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, w, h)

  const mask = document.createElement('canvas')
  mask.width = w
  mask.height = h
  const mctx = mask.getContext('2d')!
  const radius = Math.min(w, h) * cornerRadiusPct
  mctx.filter = featherPx > 0 ? `blur(${featherPx}px)` : 'none'
  mctx.fillStyle = '#fff'
  mctx.beginPath()
  mctx.roundRect(0, 0, w, h, radius)
  mctx.fill()

  octx.globalCompositeOperation = 'destination-in'
  octx.drawImage(mask, 0, 0)

  ctx.drawImage(off, destRect.x, destRect.y)
}

export function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radiusPct: number,
  color: string,
  width: number,
) {
  if (width <= 0) return
  const radius = Math.min(rect.w, rect.h) * radiusPct
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.roundRect(rect.x + width / 2, rect.y + width / 2, rect.w - width, rect.h - width, Math.max(0, radius - width / 2))
  ctx.stroke()
  ctx.restore()
}
