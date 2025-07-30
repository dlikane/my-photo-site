import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import yaml from "js-yaml";
import { getAccessToken } from "./auth.js";

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
        return parseYaml ? yaml.load(content) : content;
    } catch (err) {
        console.warn(`[ERROR] getSupplementalFile('${path}') - ${err.message}`);
        return null;
    }
}

function decodeQuotes(text) {
    if (!text) return [];
    return text
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((text, id) => ({ id, text }));
}

export async function getImageUrl(path) {
    if (!path || path === "." || path === "/") {
        throw new Error("Invalid Dropbox path");
    }

    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");

    const dbx = new Dropbox({ accessToken, fetch });
    try {
        const result = await dbx.filesGetTemporaryLink({ path });
        return result.result.link;
    } catch (err) {
        console.log(`[ERROR] getImageUrl('${path}') - ${err.message}`);
        return null;
    }
}

export async function loadCatalogFromDropbox() {
    const dbx = await getDropboxInstance();
    const entries = await getAllDropboxFiles();

    const categoriesYml = await getSupplementalFile(dbx, "/categories.yml", true);
    const playlistsYml = await getSupplementalFile(dbx, "/playlists.yml", true);
    const aboutHtml = await getSupplementalFile(dbx, "/about.html", false);
    const quotesText = await getSupplementalFile(dbx, "/quotes_list.txt", false);

    const categories = categoriesYml?.list || {};
    const result = {};

    for (const [key, value] of Object.entries(categories)) {
        const dir = value.dir?.replace(/^\/+/, "").replace(/\/+$/, "");
        if (!dir) continue;

        const images = entries
            .filter((e) =>
                e[".tag"] === "file" &&
                e.path_lower.startsWith(`/${dir}`) &&
                /\.(jpe?g)$/i.test(e.name)
            )
            .sort((a, b) => a.name.localeCompare(b.name)) // ✅ sort alphabetically by filename
            .map((e) => ({
                path: e.path_lower
            }));

        result[key] = images;
    }

    return {
        categories: result,
        playlists: playlistsYml || {},
        about: aboutHtml || "",
        quotes: decodeQuotes(quotesText)
    };
}
