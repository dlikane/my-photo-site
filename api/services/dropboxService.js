import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import yaml from "js-yaml";
import { getAccessToken } from "./auth.js";

async function getDropboxInstance() {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("Failed to get access token");
    }
    return new Dropbox({ accessToken, fetch });
}

export async function getDropboxImages(category = "") {
    try {
        const dbx = await getDropboxInstance();
        const folderPath = category ? `/${category}` : "";
        console.log(`📂 Requesting images from: ${folderPath || "root"}`);

        const response = await dbx.filesListFolder({ path: folderPath });

        if (!response.result.entries || response.result.entries.length === 0) {
            throw new Error("No images found");
        }

        let images = response.result.entries
            .filter(file => file[".tag"] === "file" && file.name.toLowerCase().endsWith(".jpg"))
            .map(async (file) => {
                const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });
                let parts = file.name.replace(/\.[^/.]+$/, "").split("_");
                if (parts.length > 1) {
                    parts.pop();
                }
                const formattedName = parts.join(" | ");
                return { url: link.result.link, name: formattedName };
            });

        return await Promise.all(images);
    } catch (error) {
        console.error("❌ Error fetching images:", error);
        throw error;
    }
}

export async function getFirstDropboxImage(category) {
    try {
        const dbx = await getDropboxInstance();
        console.log(`🖼️ Requesting first image from: ${category}`);

        const response = await dbx.filesListFolder({ path: category });

        const file = response.result.entries.find(entry =>
            entry[".tag"] === "file" && entry.name.toLowerCase().endsWith(".jpg")
        );

        if (!file) throw new Error("No image found");

        const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });
        return { url: link.result.link };
    } catch (error) {
        console.error("❌ Error fetching image:", error);
        throw error;
    }
}

export async function getDropboxCategories(includeHidden = false) {
    try {
        const dbx = await getDropboxInstance();
        console.log("📁 Requesting categories list");

        const response = await dbx.filesListFolder({ path: "" });

        if (!response.result.entries) {
            throw new Error("No categories found");
        }

        return response.result.entries
            .filter(entry =>
                entry[".tag"] === "folder" &&
                !entry.name.startsWith(".") &&
                (includeHidden || !entry.name.startsWith("_"))
            )
            .map(entry => entry.name);
    } catch (error) {
        console.error("❌ Error fetching categories:", error);
        throw error;
    }
}

export async function getDropboxQuotes() {
    try {
        const dbx = await getDropboxInstance();
        console.log("📜 Requesting quotes");

        const filePath = "/quotes_list.txt";
        const file = await dbx.filesDownload({ path: filePath });

        return file.result.fileBinary.toString("utf-8");
    } catch (error) {
        console.error("❌ Error fetching quotes:", error);
        throw error;
    }
}

export async function getDropboxAbout() {
    try {
        const dbx = await getDropboxInstance();
        console.log("ℹ️ Requesting about.md");

        const filePath = "/about.md";
        const file = await dbx.filesDownload({ path: filePath });

        return file.result.fileBinary.toString("utf-8");
    } catch (error) {
        console.error("❌ Dropbox about.md not found.", error);
        return null;
    }
}

export async function getDropboxPlaylists() {
    try {
        const dbx = await getDropboxInstance();
        console.log("🎶 Requesting playlists.yml");

        const filePath = "/playlists.yml";
        const file = await dbx.filesDownload({ path: filePath });

        const content = file.result.fileBinary.toString("utf-8");
        const parsedData = yaml.load(content);

        return parsedData?.playlists || {};
    } catch (error) {
        console.error("❌ Error fetching playlists:", error);
        throw error;
    }
}

export async function uploadToDropbox(path, buffer) {
    try {
        const dbx = await getDropboxInstance();
        const uploadRes = await dbx.filesUpload({
            path,
            contents: buffer,
            mode: "add",
        });

        const linkRes = await dbx.filesGetTemporaryLink({ path: uploadRes.result.path_lower });
        return { link: linkRes.result.link };
    } catch (err) {
        console.error("Dropbox upload error:", err);
        return null;
    }
}

export async function getTemporaryDropboxLink(path) {
    const dbx = await getDropboxInstance();
    const link = await dbx.filesGetTemporaryLink({ path: `/${path}` });
    return link.result;
}