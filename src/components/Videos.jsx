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
        <div className="flex flex-col items-center w-full bg-white dark:bg-black">
            <div className="w-full p-5 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-full">
                {videos.map((video) => {
                    const isActive = selectedVideoId === video.id;
                    return (
                        <div key={video.id} className="relative w-full pt-[56.25%]">
                            <div
                                className={`absolute inset-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md transition-transform duration-300 flex flex-col ${
                                    isActive ? "p-4" : "hover:scale-105 cursor-pointer"
                                }`}
                                onClick={() => handleTileClick(video.id)}
                            >
                                {!isActive ? (
                                    <>
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                        />
                                        <div
                                            className="absolute bottom-2 left-2 bg-black/60 text-white text-xs p-1 rounded">
                                            ▶ {formatViews(video.views)} | 👍 {video.likes.toLocaleString()}
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="absolute inset-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md transition-transform duration-300 flex flex-col p-4">
                                        <h3 className="text-black dark:text-white text-sm md:text-lg text-center mb-3">
                                            {video.title}
                                        </h3>

                                        <div className="flex gap-3 mb-3 flex-grow overflow-hidden">
                                            <div className="w-2/5">
                                                <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden">
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="w-3/5 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line overflow-hidden">
                                                <div className="animate-[scroll-description_30s_linear_infinite]">
                                                    {video.description}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex justify-center">
                                            <a
                                                href={`https://youtube.com/watch?v=${video.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-16 h-16"
                                            >
                                                <img src="/youtube-play.svg" alt="Play on YouTube"/>
                                            </a>
                                        </div>
                                    </div>)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Videos;
