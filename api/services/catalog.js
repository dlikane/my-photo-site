import {
    allocateUrls, getImageUrl,
    loadCatalogFromDropbox,
    uploadToDropboxImpl
} from "./catalogLoader.js";

let cache = null;
let timestamp = 0;
const CACHE_MS = 1000 * 60 * 30;

export async function getCatalog() {
    if (cache && Date.now() - timestamp < CACHE_MS) return cache;

    const raw = await loadCatalogFromDropbox();
    cache = {
        images: raw.images,
        menulist: raw.menulist,
        playlists: raw.playlists,
        about: raw.about,
        quotes: raw.quotes,
    };
    timestamp = Date.now();
    return cache;
}

export async function getMenuTags() {
    const catalog = await getCatalog();
    return catalog.menulist || {};
}

export async function getImagesByTags(tagString) {
    const tags = tagString.split("_").filter(Boolean);
    const catalog = await getCatalog();
    return catalog.images.filter(img => tags.every(tag => {
        if (!img.tags) {
            console.log("not tags for image:", img);
            return false;
        }
        return img.tags.includes(tag)
    }));
}

export async function getAbout() {
    const catalog = await getCatalog();
    return catalog.about || {};
}

export async function getPlaylists() {
    const catalog = await getCatalog();
    return catalog.playlists || {};
}

export async function getQuote() {
    const catalog = await getCatalog();
    const quotes = catalog.quotes || [];

    if (quotes.length === 0) return {};

    const raw = quotes[Math.floor(Math.random() * quotes.length)].text;
    const [quote, author] = raw.split("|").map(x => x.trim());

    return { quote, author };
}

export async function uploadToDropbox(path, buffer){
    return uploadToDropboxImpl(path, buffer)

}

export async function verifyUrls(images) {
    const updated = await allocateUrls(images);

    const catalog = await getCatalog();
    for (const updatedImg of updated) {
        const original = catalog.images.find(img => img.filename === updatedImg.filename);
        if (original) {
            original.url = updatedImg.url;
        }
    }
    return allocateUrls(images);
}

export async function getImageUrlByName(imageName) {
    const catalog = await getCatalog();
    const image = catalog.images.find(img => img.filename === imageName);
    if (!image) return null;

    if (!image.url) {
        const result = await getImageUrl(image.path);
        if (result?.link) {
            image.url = result.link;
        }
    }

    return image.url || null;
}