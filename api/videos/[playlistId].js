import { getYoutubePlaylistVideos } from "../services/youtube.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { playlistId } = req.query;

    if (!playlistId) {
        console.error("❌ No playlistId provided");
        return res.status(400).json({ error: "Missing playlistId" });
    }

    try {
        const videos = await getYoutubePlaylistVideos(playlistId);
        res.status(200).json(videos);
    } catch (err) {
        console.error("❌ Error fetching videos:", err.message);
        res.status(500).json({ error: "Failed to fetch videos" });
    }
}
