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
        <div className="flex flex-col items-center w-full h-screen mt-20 bg-white dark:bg-black overflow-hidden">
            <div className="w-full flex-grow p-5 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-w-full">
                {videos.map((video) => {
                    const isActive = selectedVideoId === video.id;
                    return (
                        <div key={video.id} className="relative w-full pt-[56.25%]">
                            <div
                                className={`absolute inset-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md transition-transform duration-300 cursor-pointer ${isActive ? "p-3" : "hover:scale-105"}`}
                                onClick={() => handleTileClick(video.id)}
                            >
                                {!isActive ? (
                                    <>
                                        <img src={video.thumbnail} alt={video.title}
                                             className="w-full h-full object-cover hover:opacity-80 transition-opacity"/>
                                        <div
                                            className="absolute bottom-2 left-2 bg-black/60 text-white text-xs p-1 rounded">
                                            ▶ {formatViews(video.views)} | 👍 {video.likes.toLocaleString()}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-black dark:text-white text-sm md:text-lg text-center mb-4">{video.title}</h3>
                                        <div className="flex gap-2">
                                            <img src={video.thumbnail} alt={video.title} className="w-2/5 rounded-lg" />
                                            <div className="w-3/5 text-xs text-gray-700 dark:text-gray-300">
                                                <p>{video.description.slice(0, 300)}...</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://youtube.com/watch?v=${video.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-8 h-8 mx-auto mt-2"
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
