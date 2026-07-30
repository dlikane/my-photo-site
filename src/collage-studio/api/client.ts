import type { AppConfig, BrowseListResult, CollageDoc, CollageSummary } from '../model/collageTypes'

// Collage Studio's backend only ever runs locally on the user's own machine
// (real filesystem access, bound to 127.0.0.1) -- even though this frontend
// is deployed to Vercel, the browser calls the local backend directly,
// cross-origin. Override with VITE_COLLAGE_API_BASE for a non-default port.
const API_BASE = import.meta.env.VITE_COLLAGE_API_BASE ?? 'http://127.0.0.1:8756'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${path}: ${text}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  health: () => req<{ status: string }>('/api/health'),

  getConfig: () => req<AppConfig>('/api/config'),
  putConfig: (cfg: AppConfig) => req<AppConfig>('/api/config', { method: 'PUT', body: JSON.stringify(cfg) }),

  browseRoots: () => req<{ roots: { name: string; path: string }[] }>('/api/browse/roots'),
  browseList: (path: string) => req<BrowseListResult>(`/api/browse/list?path=${encodeURIComponent(path)}`),
  thumbnailUrl: (path: string, size = 220) =>
    `${API_BASE}/api/browse/thumbnail?path=${encodeURIComponent(path)}&size=${size}`,
  previewUrl: (path: string, size = 1600) =>
    `${API_BASE}/api/browse/preview?path=${encodeURIComponent(path)}&size=${size}`,

  listCollages: () => req<CollageSummary[]>('/api/collages'),
  createCollage: (name: string) =>
    req<CollageDoc>(`/api/collages?name=${encodeURIComponent(name)}`, { method: 'POST' }),
  getCollage: (id: string) => req<CollageDoc>(`/api/collages/${id}`),
  saveCollage: (doc: CollageDoc) =>
    req<CollageDoc>(`/api/collages/${doc.id}`, { method: 'PUT', body: JSON.stringify(doc) }),
  deleteCollage: (id: string) => req<{ deleted: string }>(`/api/collages/${id}`, { method: 'DELETE' }),
  exportCollage: (id: string) => req<{ path: string }>(`/api/collages/${id}/export`, { method: 'POST' }),
}
