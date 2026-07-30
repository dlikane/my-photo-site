import type { CollageDoc } from '../model/collageTypes'

// Collage Studio's backend only ever runs locally on the user's own machine,
// stateless and disk-free -- even though this frontend is deployed to
// Vercel, the browser calls the local backend directly, cross-origin.
// Override with VITE_COLLAGE_API_BASE for a non-default port.
const API_BASE = import.meta.env.VITE_COLLAGE_API_BASE ?? 'http://127.0.0.1:8756'

export const api = {
  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) throw new Error(`${res.status} health check failed`)
    return res.json()
  },

  /** Sends the doc + the raw bytes for every referenced image (looked up by
   * imageKey in the caller's image pool); returns the rendered JPEG. */
  exportCollage: async (doc: CollageDoc, imageFiles: Map<string, File>): Promise<Blob> => {
    const formData = new FormData()
    formData.append('doc', JSON.stringify(doc))
    for (const [key, file] of imageFiles) {
      formData.append('imageKeys', key)
      formData.append('images', file, file.name)
    }
    const res = await fetch(`${API_BASE}/api/export`, { method: 'POST', body: formData })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`${res.status} export: ${text}`)
    }
    return res.blob()
  },
}
