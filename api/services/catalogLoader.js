import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import yaml from "js-yaml";
import { getAccessToken } from "./auth.js";

export async function getTempDropboxLinkImpl(path) {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");

    const dbx = new Dropbox({ accessToken, fetch });
    const result = await dbx.filesGetTemporaryLink({ path: `/${path}` });
    return result.result;
}

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

function parseImage(entry) {
    const { path_lower, name } = entry;
    const pathParts = path_lower.split("/");
    if (pathParts.length < 3) return null;

    const folderName = pathParts[1];
    const isPublic = !folderName.startsWith("_") && !name.startsWith("_");

    if (!/^_?\d{4}_.+/.test(folderName)) return null;
    if (!/\.jpe?g$/i.test(name)) return null;

    const baseName = name.replace(/\.jpe?g$/i, "");
    const parts = baseName.split("_");
    if (parts.length < 3) return null;

    const year = parts[0];
    const caption = parts[1];
    const tags = parts.slice(2).filter(t => !/^\d+$/.test(t));
    if (isPublic) tags.push("public");

    return {
        path: path_lower,
        folder: folderName,
        name,
        year,
        caption,
        tags,
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

    const images = [];
    for (const entry of entries) {
        if (entry[".tag"] !== "file") continue;
        const parsed = parseImage(entry);
        if (parsed) images.push(parsed);
    }

    const menulist = await getSupplementalFile(dbx, "/menutags.yml", true);
    const playlists = await getSupplementalFile(dbx, "/playlists.yml", true);
    const about = await getSupplementalFile(dbx, "/about.md");
    const quotesfile = await getSupplementalFile(dbx, "/quotes_list.txt");
    const quotes = decodeQuotes(quotesfile);

    return { images, menulist, playlists, about, quotes };
}
