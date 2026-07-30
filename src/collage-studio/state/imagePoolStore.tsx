import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

// Session-only image pool: nothing here ever touches local disk or a
// backend -- files dropped/picked by the user live purely in browser memory
// (as object URLs) for the lifetime of this tab, and are shared across every
// open collage so images can be moved between them.

export interface PooledImage {
  key: string
  file: File
  objectUrl: string
  name: string
}

interface ImagePoolApi {
  images: PooledImage[]
  get: (key: string) => PooledImage | undefined
  /** Adds files to the pool, deduping by content fingerprint; returns the resulting keys (added or already-present). */
  add: (files: FileList | File[]) => Promise<string[]>
  remove: (key: string) => void
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

  useEffect(() => {
    return () => {
      for (const img of poolRef.current.values()) URL.revokeObjectURL(img.objectUrl)
    }
  }, [])

  const add = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const fingerprints = await Promise.all(imageFiles.map(fingerprint))

    const keys: string[] = []
    setPool((prev) => {
      const next = new Map(prev)
      imageFiles.forEach((file, i) => {
        const key = fingerprints[i]
        keys.push(key)
        if (next.has(key)) return
        next.set(key, { key, file, objectUrl: URL.createObjectURL(file), name: file.name })
      })
      return next
    })
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
  }, [])

  const get = useCallback((key: string) => pool.get(key), [pool])

  const value = useMemo<ImagePoolApi>(
    () => ({ images: Array.from(pool.values()), get, add, remove }),
    [pool, get, add, remove],
  )

  return <ImagePoolContext.Provider value={value}>{children}</ImagePoolContext.Provider>
}
