import { api } from '../api/client'

const cache = new Map<string, HTMLImageElement>()
const pending = new Set<string>()

export function getCachedImage(path: string): HTMLImageElement | undefined {
  return cache.get(path)
}

/** Kicks off a load if needed; calls onReady (schedule a redraw) once available. Safe to call every render. */
export function ensureImageLoaded(path: string, onReady: () => void): void {
  if (cache.has(path) || pending.has(path)) return
  pending.add(path)
  const img = new Image()
  img.onload = () => {
    cache.set(path, img)
    pending.delete(path)
    onReady()
  }
  img.onerror = () => {
    pending.delete(path)
  }
  img.src = api.previewUrl(path)
}
