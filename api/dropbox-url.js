import { getTemporaryDropboxLink } from "./services/dropboxService.js";

export default async function handler(req, res) {
    const { path } = req.query;

    if (!path) return res.status(400).json({ error: "Missing path" });

    try {
        const result = await getTemporaryDropboxLink(path);
        if (!result?.link) return res.status(404).json({ error: "File not found" });

        res.redirect(result.link);
    } catch (e) {
        console.error("Error generating Dropbox URL:", e);
        res.status(500).json({ error: "Failed to get Dropbox link" });
    }
}
