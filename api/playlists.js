import { getDropboxPlaylists } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const playlists = await getDropboxPlaylists();
        res.status(200).json(playlists);
    } catch (err) {
        console.error("❌ Error fetching playlists:", err);
        res.status(500).json({ error: err.message });
    }
}
