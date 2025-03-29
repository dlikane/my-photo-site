import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import yaml from "js-yaml";
import { getAccessToken } from "./auth.js";

export async function uploadToDropboxImpl(path, buffer) {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");

    const dbx = new Dropbox({ accessToken, fetch });

    const result = await dbx.filesUpload({
        path,
        contents: buffer,
        mode: { ".tag": "overwrite" }
    });

    const linkRes = await dbx.filesGetTemporaryLink({ path: result.result.path_lower });
    return linkRes.result;
}

export async function getImageUrl(path) {
    if (!path || path === "." || path === "/") {
        throw new Error("Invalid Dropbox path");
    }

    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");

    let result = null;
    try {
        const dbx = new Dropbox({accessToken, fetch});
        result = await dbx.filesGetTemporaryLink({path: `${path}`});
        return result.result;
    } catch(err) {
        console.log(`error for ${path}: ${err.message} ${result}`);
        return null;
    }
}

export async function allocateUrls(images) {
    const updated = [];

    for (const img of images) {
        if (!img.url) {
            try {
                const result = await getImageUrl(img.path);
                if (result?.link) {
                    img.url = result.link;
                }
            } catch (err) {
                console.warn(`⚠️ Failed to get URL for ${img.path}: ${err.message}`);
            }
        }
        updated.push(img);
    }
    return updated;
}

export async function parseImage(entry) {
    const { path_lower, name: filename } = entry;
    const pathParts = path_lower.split("/");
    const adminFolder = (pathParts.length > 1) && pathParts[0].startsWith("_")
    const isAdmin = adminFolder || filename.startsWith("_");
    if (!/\.jpe?g$/i.test(filename)) return null;

    const baseName = filename.replace(/\.jpe?g$/i, "");
    const parts = baseName.split("_");
    if (parts.length < 3) return null;

    const year = parts[0];
    const name = parts[1];
    const caption = name + " | " + year;
    const tags = parts.slice(2).filter(t => !/^\d+$/.test(t));
    if (!isAdmin)
        tags.push("public");

    if (tags.length === 0) return null;

    return {
        path: path_lower,
        filename: filename,
        name,
        year,
        caption,
        tags,
        url: null,
    };
}

async function getDropboxInstance() {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");
    return new Dropbox({ accessToken, fetch });
}

async function getAllDropboxFiles() {
    const dbx = await getDropboxInstance();
    const response = await dbx.filesListFolder({ path: "", recursive: true });
    let entries = response.result.entries;

    while (response.result.has_more) {
        const continueRes = await dbx.filesListFolderContinue({ cursor: response.result.cursor });
        entries = entries.concat(continueRes.result.entries);
        response.result = continueRes.result;
    }

    return entries;
}

async function getSupplementalFile(dbx, path, parseYaml = false) {
    try {
        const file = await dbx.filesDownload({ path });
        const content = file.result.fileBinary.toString("utf-8");
        if (parseYaml) return yaml.load(content);
        return content;
    } catch {
        return null;
    }
}

function decodeQuotes(text) {
    if (!text) return [];
    return text
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean)
        .map((text, id) => ({ id, text }));
}

export async function loadCatalogFromDropbox() {
    const dbx = await getDropboxInstance();
    const entries = await getAllDropboxFiles();

    const parseTasks = entries
        .filter(entry => entry[".tag"] === "file")
        .map(parseImage);

    const parsedResults = await Promise.all(parseTasks);
    const images = parsedResults.filter(Boolean);

    const menulist = await getSupplementalFile(dbx, "/menutags.yml", true);
    const playlists = await getSupplementalFile(dbx, "/playlists.yml", true);
    const about = await getSupplementalFile(dbx, "/about.md");
    const quotesfile = await getSupplementalFile(dbx, "/quotes_list.txt");
    const quotes = decodeQuotes(quotesfile);

    return { images, menulist, playlists, about, quotes };
}
