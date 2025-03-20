import axios from "axios";
import { getDropboxPlaylists } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { playlist } = req.query;
    console.log(`📺 Requested Playlist: ${playlist}`);

    try {
        // Fetch playlists from Dropbox
        const playlists = await getDropboxPlaylists();
        console.log("🎵 Retrieved Playlists from Dropbox:", playlists);

        const playlistId = playlists[playlist];

        if (!playlistId) {
            console.error(`❌ No playlist found for '${playlist}'`);
            return res.status(404).json({ error: `No playlist found for '${playlist}'` });
        }

        console.log(`✅ Found Playlist ID: ${playlistId}`);

        // Fetch all videos from YouTube Playlist with pagination
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        let videos = [];
        let nextPageToken = "";

        do {
            const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;

            const playlistResponse = await axios.get(youtubeApiUrl);

            if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
                break;
            }

            // Collect video IDs for statistics lookup
            const videoIds = playlistResponse.data.items.map(item => item.snippet.resourceId.videoId);
            videos.push(...playlistResponse.data.items);

            // Get the nextPageToken
            nextPageToken = playlistResponse.data.nextPageToken;
        } while (nextPageToken);

        if (videos.length === 0) {
            console.warn("⚠️ No videos found in this playlist.");
            return res.status(404).json({ error: "No videos found in this playlist." });
        }

        // Fetch video statistics (views & likes) for all videos in chunks of 50
        let statsMap = {};
        for (let i = 0; i < videos.length; i += 50) {
            const videoIdsChunk = videos.slice(i, i + 50).map(item => item.snippet.resourceId.videoId).join(",");
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIdsChunk}&key=${YOUTUBE_API_KEY}`;
            const statsResponse = await axios.get(statsUrl);

            statsResponse.data.items.forEach(item => {
                statsMap[item.id] = {
                    views: item.statistics.viewCount || "0",
                    likes: item.statistics.likeCount || "0",
                };
            });
        }

        // Format the videos list with stats
        const formattedVideos = videos.map(item => {
            const id = item.snippet.resourceId.videoId;
            return {
                id,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                description: item.snippet.description,
                views: statsMap[id]?.views || "0",
                likes: statsMap[id]?.likes || "0",
            };
        });

        console.log(`🎬 Returning ${formattedVideos.length} videos.`);
        res.status(200).json(formattedVideos);
    } catch (error) {
        console.error("❌ Error fetching videos:", error.message);
        res.status(500).json({ error: "Failed to fetch videos" });
    }
}
