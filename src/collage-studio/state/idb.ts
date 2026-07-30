// Minimal IndexedDB wrapper -- device-local persistence for the image
// gallery and open collages/tabs. Deliberately not localStorage: that's
// capped around 5-10MB and can't hold binary image data; IndexedDB stores
// Blobs/Files natively and gets a much larger quota. No sync between
// devices -- this is scoped to "resume where I left off, on this machine."

const DB_NAME = 'collage-studio'
const DB_VERSION = 1
const IMAGES_STORE = 'images'
const SESSION_STORE = 'session'
const SESSION_KEY = 'main'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface StoredImage {
  key: string
  name: string
  blob: Blob
}

export async function loadAllImages(): Promise<StoredImage[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, 'readonly')
    const req = tx.objectStore(IMAGES_STORE).getAll()
    req.onsuccess = () => resolve(req.result as StoredImage[])
    req.onerror = () => reject(req.error)
  })
}

export async function saveImage(img: StoredImage): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, 'readwrite')
    tx.objectStore(IMAGES_STORE).put(img)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteImage(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, 'readwrite')
    tx.objectStore(IMAGES_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearImages(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, 'readwrite')
    tx.objectStore(IMAGES_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export interface StoredSession {
  id: 'main'
  order: string[]
  activeId: string | null
  // Value type is deliberately loose (CollageDoc) here to avoid a circular
  // import; callers own the real typing.
  docs: Record<string, { doc: unknown; dirty: boolean }>
}

export async function loadSession(): Promise<StoredSession | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readonly')
    const req = tx.objectStore(SESSION_STORE).get(SESSION_KEY)
    req.onsuccess = () => resolve(req.result as StoredSession | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSession(session: Omit<StoredSession, 'id'>): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, 'readwrite')
    tx.objectStore(SESSION_STORE).put({ id: SESSION_KEY, ...session })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
