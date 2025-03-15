import axios from "axios";
import { getDropboxPlaylists } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { playlist } = req.query; // ✅ Updated to use 'playlist' instead of 'videoType'

    console.log(`📺 Requested Playlist: ${playlist}`);

    try {
        // ✅ Fetch playlists from Dropbox
        const playlists = await getDropboxPlaylists();
        console.log("🎵 Retrieved Playlists from Dropbox:", playlists);

        // ✅ Extract the correct playlist ID based on the name
        const playlistId = playlists[playlist];

        if (!playlistId) {
            console.error(`❌ No playlist found for '${playlist}'`);
            return res.status(404).json({ error: `No playlist found for '${playlist}'` });
        }

        console.log(`✅ Found Playlist ID: ${playlistId}`);

        // ✅ Build YouTube API request
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;

        console.log(`🔗 Fetching videos from YouTube API: ${youtubeApiUrl}`);

        const response = await axios.get(youtubeApiUrl);

        if (!response.data.items || response.data.items.length === 0) {
            console.warn("⚠️ No videos found in this playlist.");
            return res.status(404).json({ error: "No videos found in this playlist." });
        }

        // ✅ Format the videos list
        const videos = response.data.items.map((item) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            description: item.snippet.description,
        }));

        console.log(`🎬 Returning ${videos.length} videos.`);
        res.status(200).json(videos);
    } catch (error) {
        console.error("❌ Error fetching videos:", error.message);
        res.status(500).json({ error: "Failed to fetch videos" });
    }
}
