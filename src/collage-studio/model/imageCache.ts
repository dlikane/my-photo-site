const cache = new Map<string, HTMLImageElement>()
const pending = new Set<string>()

export function getCachedImage(imageKey: string): HTMLImageElement | undefined {
  return cache.get(imageKey)
}

/** Kicks off a load from the given object URL if needed; calls onReady (schedule a
 * redraw) once available. Safe to call every render. Caller is responsible for only
 * calling this when the imageKey actually resolves to a pooled image/URL. */
export function ensureImageLoaded(imageKey: string, objectUrl: string, onReady: () => void): void {
  if (cache.has(imageKey) || pending.has(imageKey)) return
  pending.add(imageKey)
  const img = new Image()
  img.onload = () => {
    cache.set(imageKey, img)
    pending.delete(imageKey)
    onReady()
  }
  img.onerror = () => {
    pending.delete(imageKey)
  }
  img.src = objectUrl
}
