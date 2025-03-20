import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const formatViews = (views) => {
    if (views < 1000) return views.toLocaleString();
    if (views < 1_000_000) return (views / 1000).toFixed(1).replace(/\.0$/, '') + "K";
    if (views < 1_000_000_000) return (views / 1_000_000).toFixed(1).replace(/\.0$/, '') + "M";
    return (views / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + "B";
};

const Videos = () => {
    const { videoType } = useParams();
    const [videos, setVideos] = useState([]);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await axios.get(`/api/videos?playlist=${videoType}`);
                setVideos(response.data);
            } catch (error) {
                console.error("❌ Error fetching videos:", error);
            }
        };
        fetchVideos();
    }, [videoType]);

    const handleTileClick = (videoId) => {
        setSelectedVideoId(prevId => (prevId === videoId ? null : videoId));
    };


    return (
        <div className="videos-wrapper">
            <div className="videos-container">
                {videos.map((video) => {
                    const isActive = selectedVideoId === video.id;
                    return (
                        <div key={video.id} className="video-tile-wrapper">
                            <div
                                className={`video-tile ${isActive ? "active" : ""}`}
                                onClick={() => handleTileClick(video.id)}
                            >
                                {!isActive ? (
                                    <>
                                        <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                                        <div className="video-stats">
                                            ▶ {formatViews(video.views)} | 👍 {video.likes.toLocaleString()}

                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="video-title">{video.title}</h3>
                                        <div className="video-details">
                                            <img src={video.thumbnail} alt={video.title} className="details-thumb" />
                                            <div className="details-text">
                                                <p>{video.description.slice(0, 300)}...</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://youtube.com/watch?v=${video.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="yt-button"
                                        >
                                            <img src="/youtube-play.svg" alt="Play on YouTube" />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Videos;
