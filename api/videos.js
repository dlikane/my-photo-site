import axios from "axios";
import {getPlaylists} from "./services/catalog.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { playlist } = req.query;
    console.log(`📺 Requested Playlist: ${playlist}`);

    try {
        const playlists = await getPlaylists()
        const playlistId = playlists[playlist];

        if (!playlistId) {
            console.error(`❌ No playlist found for '${playlist}'`);
            return res.status(404).json({ error: `No playlist found for '${playlist}'` });
        }

        console.log(`✅ Found Playlist ID: ${playlistId}`);

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        let videos = [];
        let nextPageToken = "";

        do {
            const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
            const response = await axios.get(youtubeApiUrl);

            if (!response.data.items?.length) break;

            videos.push(...response.data.items);
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        if (!videos.length) {
            return res.status(404).json({ error: "No videos found in this playlist." });
        }

        const statsMap = {};
        for (let i = 0; i < videos.length; i += 50) {
            const ids = videos.slice(i, i + 50).map(v => v.snippet.resourceId.videoId).join(",");
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;
            const statsResponse = await axios.get(statsUrl);
            statsResponse.data.items.forEach(item => {
                statsMap[item.id] = {
                    views: item.statistics.viewCount || "0",
                    likes: item.statistics.likeCount || "0",
                };
            });
        }

        const result = videos.map(item => {
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

        console.log(`🎬 Returning ${result.length} videos.`);
        res.status(200).json(result);
    } catch (err) {
        console.error("❌ Error fetching videos:", err.message);
        res.status(500).json({ error: "Failed to fetch videos" });
    }
}
