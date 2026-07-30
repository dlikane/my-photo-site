import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { deleteImage, loadAllImages, saveImage } from './idb'

// Image pool, persisted locally (IndexedDB) so the gallery survives a
// browser restart -- but never leaves this device and never touches a
// backend. Shared across every open collage so images can be moved
// between them.

export interface PooledImage {
  key: string
  file: File
  objectUrl: string
  name: string
  addedAt: number
}

interface ImagePoolApi {
  images: PooledImage[]
  get: (key: string) => PooledImage | undefined
  /** Adds files to the pool, deduping by content fingerprint; returns the resulting keys (added or already-present). */
  add: (files: FileList | File[]) => Promise<string[]>
  remove: (key: string) => void
  /** Removes several images at once (e.g. "Clear gallery" removing everything unused). */
  removeMany: (keys: string[]) => Promise<void>
}

const ImagePoolContext = createContext<ImagePoolApi | null>(null)

export function useImagePool(): ImagePoolApi {
  const ctx = useContext(ImagePoolContext)
  if (!ctx) throw new Error('useImagePool must be used within ImagePoolProvider')
  return ctx
}

/** Content hash (SHA-256 of the actual bytes) rather than name|size|lastModified.
 *
 * The original scheme fingerprinted metadata, which looked buggy in practice:
 * the *same photo* dragged in from two locations (a synced copy, a re-export,
 * a file that went through any copy operation that doesn't preserve mtime)
 * gets a different lastModified even though the bytes are identical -- so it
 * showed up twice in the library for what the user reasonably expected to be
 * one image. Hashing content instead means truly-the-same file always dedupes,
 * regardless of name/mtime, and still satisfies the original goal (re-drop the
 * same original file after reopening a layout and it resolves to the same key). */
async function fingerprint(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex
}

export function ImagePoolProvider({ children }: { children: ReactNode }) {
  const [pool, setPool] = useState<Map<string, PooledImage>>(new Map())
  const poolRef = useRef(pool)

  useEffect(() => {
    poolRef.current = pool
  }, [pool])

  // Load the persisted gallery once on mount.
  useEffect(() => {
    let cancelled = false
    loadAllImages()
      .then((stored) => {
        if (cancelled || stored.length === 0) return
        setPool((prev) => {
          const next = new Map(prev)
          for (const img of stored) {
            if (next.has(img.key)) continue
            const file = new File([img.blob], img.name, { type: img.blob.type })
            next.set(img.key, { key: img.key, file, objectUrl: URL.createObjectURL(img.blob), name: img.name, addedAt: img.addedAt ?? 0 })
          }
          return next
        })
      })
      .catch((e) => console.error('Failed to load persisted image gallery:', e))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const img of poolRef.current.values()) URL.revokeObjectURL(img.objectUrl)
    }
  }, [])

  const add = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const fingerprints = await Promise.all(imageFiles.map(fingerprint))

    const keys: string[] = []
    const newlyAdded: { key: string; file: File; addedAt: number }[] = []
    setPool((prev) => {
      const next = new Map(prev)
      imageFiles.forEach((file, i) => {
        const key = fingerprints[i]
        keys.push(key)
        if (next.has(key)) return
        const addedAt = Date.now()
        next.set(key, { key, file, objectUrl: URL.createObjectURL(file), name: file.name, addedAt })
        newlyAdded.push({ key, file, addedAt })
      })
      return next
    })
    // Persist new entries only -- fire-and-forget, the in-memory pool is the source of truth for this tab.
    for (const { key, file, addedAt } of newlyAdded) {
      saveImage({ key, name: file.name, blob: file, addedAt }).catch((e) => console.error('Failed to persist image:', e))
    }
    return keys
  }, [])

  const remove = useCallback((key: string) => {
    setPool((prev) => {
      const entry = prev.get(key)
      if (!entry) return prev
      URL.revokeObjectURL(entry.objectUrl)
      const next = new Map(prev)
      next.delete(key)
      return next
    })
    deleteImage(key).catch((e) => console.error('Failed to delete persisted image:', e))
  }, [])

  const removeMany = useCallback(async (keys: string[]) => {
    if (keys.length === 0) return
    const keySet = new Set(keys)
    setPool((prev) => {
      const next = new Map(prev)
      for (const key of keySet) {
        const entry = next.get(key)
        if (entry) {
          URL.revokeObjectURL(entry.objectUrl)
          next.delete(key)
        }
      }
      return next
    })
    await Promise.all(keys.map((key) => deleteImage(key).catch((e) => console.error('Failed to delete persisted image:', e))))
  }, [])

  const get = useCallback((key: string) => pool.get(key), [pool])

  const value = useMemo<ImagePoolApi>(
    () => ({ images: Array.from(pool.values()).sort((a, b) => b.addedAt - a.addedAt), get, add, remove, removeMany }),
    [pool, get, add, remove, removeMany],
  )

  return <ImagePoolContext.Provider value={value}>{children}</ImagePoolContext.Provider>
}
