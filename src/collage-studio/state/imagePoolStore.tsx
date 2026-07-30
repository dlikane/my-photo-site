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
  /** Adds files to the pool, deduping by fingerprint; returns the resulting keys (added or already-present). */
  add: (files: FileList | File[]) => string[]
  remove: (key: string) => void
}

const ImagePoolContext = createContext<ImagePoolApi | null>(null)

export function useImagePool(): ImagePoolApi {
  const ctx = useContext(ImagePoolContext)
  if (!ctx) throw new Error('useImagePool must be used within ImagePoolProvider')
  return ctx
}

/** name|size|lastModified -- stable across sessions for the *same* file, so
 * reopening a layout-only collage and re-dropping the original files
 * automatically re-resolves the same imageKeys without manual re-linking. */
function fingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`
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

  const add = useCallback((files: FileList | File[]) => {
    const keys: string[] = []
    setPool((prev) => {
      const next = new Map(prev)
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const key = fingerprint(file)
        keys.push(key)
        if (next.has(key)) continue
        next.set(key, { key, file, objectUrl: URL.createObjectURL(file), name: file.name })
      }
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
