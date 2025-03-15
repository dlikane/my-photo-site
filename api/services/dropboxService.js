import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import yaml from "js-yaml";
import { getAccessToken } from "../auth.js";

/** ✅ Get authenticated Dropbox instance */
async function getDropboxInstance() {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("Failed to get access token");
    }
    return new Dropbox({ accessToken, fetch });
}

/** ✅ List JPG images from Dropbox */
export async function getDropboxImages() {
    try {
        const dbx = await getDropboxInstance();
        const response = await dbx.filesListFolder({ path: "" });

        if (!response.result.entries) {
            throw new Error("No images found");
        }

        let images = response.result.entries
            .filter(file => file[".tag"] === "file" && file.name.toLowerCase().endsWith(".jpg"))
            .map(async (file) => {
                const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });

                // ✅ Format filename correctly
                let parts = file.name.replace(/\.[^/.]+$/, "").split("_");
                if (parts.length > 1) {
                    parts.pop(); // ✅ Remove last part if multiple
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

/** ✅ Fetch category list from Dropbox based on folder names */
export async function getDropboxCategories() {
    try {
        const dbx = await getDropboxInstance();
        const response = await dbx.filesListFolder({ path: "" }); // ✅ List root folder

        if (!response.result.entries) {
            throw new Error("No categories found");
        }

        // ✅ Filter folders and ignore names starting with "." or "_"
        const categories = response.result.entries
            .filter(entry => entry[".tag"] === "folder" && !entry.name.startsWith(".") && !entry.name.startsWith("_"))
            .map(entry => entry.name);

        return categories;
    } catch (error) {
        console.error("❌ Error fetching categories:", error);
        throw error;
    }
}


/** ✅ Fetch quote list from Dropbox */
export async function getDropboxQuotes() {
    try {
        const dbx = await getDropboxInstance();
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
        const filePath = "/about.md";
        const file = await dbx.filesDownload({ path: filePath });

        return file.result.fileBinary.toString("utf-8");
    } catch (error) {
        console.error("❌ Dropbox about.md not found.");
        return null; // ✅ Return null instead of handling local fallback
    }
}

export async function getDropboxPlaylists() {
    try {
        const dbx = await getDropboxInstance();
        const filePath = "/playlists.yml"; // ✅ Make sure this file exists in Dropbox
        const file = await dbx.filesDownload({ path: filePath });

        // ✅ Convert file to string and parse as YAML
        const content = file.result.fileBinary.toString("utf-8");
        const parsedData = yaml.load(content);

        return parsedData?.playlists || {}; // ✅ Return playlists object or empty object
    } catch (error) {
        console.error("❌ Error fetching playlists:", error);
        throw error;
    }
}
