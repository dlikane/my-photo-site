import fetch from "node-fetch";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("🔄 Fetching YouTube playlist videos...");

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}`
        );

        const data = await response.json();

        if (!data.items) {
            return res.status(404).json({ error: "No videos found" });
        }

        // ✅ Extract video IDs and Titles
        const videos = data.items.map((item) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
        }));

        res.status(200).json(videos);
    } catch (error) {
        console.error("❌ Error fetching YouTube videos:", error);
        res.status(500).json({ error: error.message });
    }
}
