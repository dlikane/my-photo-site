import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import yaml from "js-yaml";
import { getAccessToken } from "./auth.js";

export async function uploadToDropboxImpl(path, buffer) {
    console.log(`loader [START] uploadToDropboxImpl('${path}')`);
    const start = Date.now();

    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");
    const dbx = new Dropbox({ accessToken, fetch });

    const result = await dbx.filesUpload({
        path,
        contents: buffer,
        mode: { ".tag": "overwrite" }
    });

    const linkRes = await dbx.filesGetTemporaryLink({ path: result.result.path_lower });

    console.log(`loader [END] uploadToDropboxImpl('${path}') - ${Date.now() - start}ms`);
    return linkRes.result;
}

export async function getImageUrl(path) {
    // console.log(`loader [START] getImageUrl('${path}')`);
    // const start = Date.now();

    if (!path || path === "." || path === "/") {
        throw new Error("Invalid Dropbox path");
    }

    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");

    let result = null;
    try {
        const dbx = new Dropbox({ accessToken, fetch });
        result = await dbx.filesGetTemporaryLink({ path: `${path}` });
        // console.log(`loader [END] getImageUrl('${path}') - ${Date.now() - start}ms`);
        return result.result.link;
    } catch (err) {
        console.log(`[ERROR] getImageUrl('${path}') - ${err.message}`);
        return null;
    }
}

export async function allocateUrls(images) {
    // console.log(`loader [START] allocateUrls`);
    // const start = Date.now();
    const updated = [];

    for (const img of images) {
        if (!img.url) {
            try {
                const result = await getImageUrl(img.path);
                if (result?.link) {
                    img.url = result.link;
                }
            } catch (err) {
                console.warn(`⚠️ allocateUrls failed for ${img.path}: ${err.message}`);
            }
        }
        updated.push(img);
    }
    // console.log(`loader [END] allocateUrls - ${Date.now() - start}ms`);
    return updated;
}

export async function parseImage(entry) {
    const { path_lower, name: filename } = entry;
    const pathParts = path_lower.split("/");

    // first real folder after leading "/"
    const adminFolder = (pathParts.length > 1) && pathParts[1].startsWith("_");
    const isAdmin = adminFolder || filename.startsWith("_");

    if (!/\.jpe?g$/i.test(filename)) {
        return null;
    }

    const baseName = filename.replace(/\.jpe?g$/i, "");
    const parts = baseName.split("_");
    if (parts.length < 3) {
        return null;
    }

    const year = parts[0];
    const name = parts[1];
    const caption = `${name} | ${year}`;
    const tags = parts.slice(2).filter(t => !/^\d+$/.test(t));

    if (!isAdmin) {
        tags.push("public");
    }

    if (tags.length === 0) {
        return null;
    }

    return {
        path: path_lower,
        filename,
        name,
        year,
        caption,
        tags,
    };
}

async function getDropboxInstance() {
    // console.log(`loader [START] getDropboxInstance`);
    // const start = Date.now();

    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");
    const dbx = new Dropbox({ accessToken, fetch });

    // console.log(`loader [END] getDropboxInstance - ${Date.now() - start}ms`);
    return dbx;
}

async function getAllDropboxFiles() {
    // console.log(`loader [START] getAllDropboxFiles`);
    // const start = Date.now();

    const dbx = await getDropboxInstance();
    const response = await dbx.filesListFolder({ path: "", recursive: true });
    let entries = response.result.entries;

    while (response.result.has_more) {
        const continueRes = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
        entries = entries.concat(continueRes.result.entries);
        response.result = continueRes.result;
    }

    // console.log(`loader [END] getAllDropboxFiles - ${Date.now() - start}ms (entries: ${entries.length})`);
    return entries;
}

async function getSupplementalFile(dbx, path, parseYaml = false) {
    // console.log(`loader [START] getSupplementalFile('${path}')`);
    // const start = Date.now();

    try {
        const file = await dbx.filesDownload({ path });
        const content = file.result.fileBinary.toString("utf-8");
        // console.log(`loader [END] getSupplementalFile('${path}') - ${Date.now() - start}ms`);
        return parseYaml ? yaml.load(content) : content;
    } catch (err) {
        console.warn(`[ERROR] getSupplementalFile('${path}') - ${err.message}`);
        return null;
    }
}

function decodeQuotes(text) {
    // console.log(`loader [START] decodeQuotes`);
    // const start = Date.now();

    if (!text) {
        // console.log(`loader [END] decodeQuotes - ${Date.now() - start}ms (no content)`);
        return [];
    }

    const result = text.split("\n").map(x => x.trim()).filter(Boolean).map((text, id) => ({ id, text }));
    // console.log(`loader [END] decodeQuotes - ${Date.now() - start}ms (quotes: ${result.length})`);
    return result;
}

export async function loadCatalogFromDropbox() {
    console.log(`loader [START] loadCatalogFromDropbox`);
    const start = Date.now();

    const dbx = await getDropboxInstance();
    const entries = await getAllDropboxFiles();

    const parseTasks = entries.filter(entry => entry[".tag"] === "file").map(parseImage);
    const parsedResults = await Promise.all(parseTasks);
    const images = parsedResults.filter(Boolean);

    const menulist = await getSupplementalFile(dbx, "/menutags.yml", true);
    const playlists = await getSupplementalFile(dbx, "/playlists.yml", true);
    const about = await getSupplementalFile(dbx, "/about.md");
    const quotesfile = await getSupplementalFile(dbx, "/quotes_list.txt");
    const quotes = decodeQuotes(quotesfile);

    console.log(`loader [END] loadCatalogFromDropbox (images: ${images.length}, quotes: ${quotes.length}) - ${Date.now() - start}ms`);
    return { images, menulist, playlists, about, quotes };
}
