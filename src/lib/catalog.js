let catalog = null;
let loadingPromise = null;

async function loadCatalog() {
    const response = await fetch('/api/catalog');
    if (!response.ok) {
        throw new Error('Failed to load catalog');
    }
    catalog = await response.json();
}

async function ensureCatalog() {
    if (catalog) return;
    if (!loadingPromise) {
        loadingPromise = loadCatalog().finally(() => {
            loadingPromise = null;
        });
    }
    await loadingPromise;
}

export function isLoaded() {
    return !!catalog;
}

export async function refreshCatalog() {
    catalog = null;
    await ensureCatalog();
}

export async function getAbout() {
    await ensureCatalog();
    return catalog.about || "";
}

export async function getCategories() {
    await ensureCatalog();
    return Object.keys(catalog.categories || {});
}

export async function getImagesByCategory(categoryName) {
    await ensureCatalog();
    return catalog.categories?.[categoryName] || [];
}

export async function getPlaylists() {
    await ensureCatalog();
    return catalog.playlists?.playlists || {};
}

export async function getVideosByPlaylist(playlistName) {
    await ensureCatalog();
    const playlists = catalog.playlists?.playlists || {};
    const playlistId = playlists[playlistName];
    if (!playlistId) {
        console.warn(`❌ Playlist not found: ${playlistName}`);
        return [];
    }

    const res = await fetch(`/api/videos/${playlistId}`);
    if (!res.ok) throw new Error("Failed to fetch videos");
    return await res.json();
}

let firstQuoteReturned = false;

export async function getQuote() {
    await ensureCatalog();
    const quotes = catalog.quotes || [];
    if (quotes.length === 0) return {};

    let index;

    if (!firstQuoteReturned) {
        const today = new Date().toISOString().split("T")[0]; // e.g. "2025-07-30"
        const hash = Array.from(today).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        index = hash % quotes.length;
        firstQuoteReturned = true;
    } else {
        index = Math.floor(Math.random() * quotes.length);
    }

    const raw = quotes[index].text;
    const [quote, author] = raw.split("|").map((x) => x.trim());
    return { text: quote, author };
}

const imageUrlCache = new Map();

export async function getImageUrlByPath(path) {
    if (imageUrlCache.has(path)) {
        return imageUrlCache.get(path);
    }

    const res = await fetch(`/api/image/${encodeURIComponent(path)}/url`);
    if (!res.ok) throw new Error(`Failed to fetch URL for image: ${path}`);

    const data = await res.json();
    imageUrlCache.set(path, data.url);
    return data.url;
}
