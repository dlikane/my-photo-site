import axios from "axios";

export async function getYoutubePlaylistVideos(playlistId) {
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
        throw new Error("No videos found in playlist");
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

    return videos.map(item => {
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
}
