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
    return !!catalog
}

export async function refreshCatalog() {
    catalog = null;
    await ensureCatalog();
}

export async function getAbout() {
    await ensureCatalog();
    return catalog.about || {};
}

export async function getMenuTags() {
    await ensureCatalog();
    return Object.keys(catalog.menulist?.menu || {});
}

export async function getPlaylists() {
    await ensureCatalog();
    return catalog.playlists?.playlists || {};
}

export async function getQuote() {
    await ensureCatalog();
    const quotes = catalog.quotes || [];
    if (quotes.length === 0) {
        return {};
    }
    const raw = quotes[Math.floor(Math.random() * quotes.length)].text;
    const [quote, author] = raw.split("|").map(x => x.trim());
    const ret = { text: quote, author: author };
    console.log(`Quote: ${JSON.stringify(ret)} of ${quotes.length}`);

    return ret;
}

export async function getImagesByCategory(categoryName, isLoggedIn) {
    await ensureCatalog();

    const entry = catalog.menulist?.menu?.[categoryName];
    if (!entry) {
        console.warn(`❌ Category not found: ${categoryName}`);
        return [];
    }

    const tags = ["small"];
    if (!isLoggedIn) tags.push("public");

    const exclude = [];

    for (const tag of entry.tags || []) {
        if (tag.startsWith("!")) {
            exclude.push(tag.slice(1));
        } else {
            tags.push(tag);
        }
    }
    console.log(`Getting category ${categoryName} include tags: ${tags.join(",")} exclude tags: ${exclude.join(",")}`);
    return getImagesByTags(tags, exclude);
}

export async function getImagesByTags(includeTags, excludeTags = []) {
    await ensureCatalog();

    const images = catalog.images.filter(img => {
        const tags = img.tags || [];
        const includes = includeTags.every(tag => tags.includes(tag));
        const excludes = excludeTags.every(tag => !tags.includes(tag));
        return includes && excludes;
    });

    console.log(`getImagesByTags +${includeTags.join(", ")} -${excludeTags.join(", ")} → ${images.length}`);
    return images;
}

export async function getRandomImagesByTags(tags, count = 3) {
    await ensureCatalog();
    const filtered = catalog.images.filter(img =>
        tags.every(tag => img.tags && img.tags.includes(tag))
    );
    console.log(`getImagesByTags ${tags} got filtered: ${filtered.length} take: ${count}`);

    // Shuffle and select random images
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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
