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
        <div className="flex w-full flex-col items-center bg-white dark:bg-black">
            <div className="grid w-full max-w-full grid-cols-2 gap-6 p-5 md:grid-cols-3">
                {videos.map((video) => {
                    const isActive = selectedVideoId === video.id;
                    return (
                        <div key={video.id} className="relative w-full pt-[56.25%]">
                            <div
                                className={`absolute inset-0 flex flex-col overflow-hidden rounded-lg bg-gray-100 shadow-md transition-transform duration-300 dark:bg-gray-900 ${
                                    isActive ? "p-4" : "cursor-pointer hover:scale-105"
                                }`}
                                onClick={() => handleTileClick(video.id)}
                            >
                                {!isActive ? (
                                    <>
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="size-full object-cover transition-opacity hover:opacity-80"
                                        />
                                        <div
                                            className="absolute bottom-2 left-2 rounded bg-black/60 p-1 text-xs text-white">
                                            ▶ {formatViews(video.views)} | 👍 {video.likes.toLocaleString()}
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="absolute inset-0 flex flex-col overflow-hidden rounded-lg bg-gray-100 p-4 shadow-md transition-transform duration-300 dark:bg-gray-900">
                                        <h3 className="mb-3 text-center text-sm text-black md:text-lg dark:text-white">
                                            {video.title}
                                        </h3>

                                        <div className="mb-3 flex grow gap-3 overflow-hidden">
                                            <div className="w-2/5">
                                                <div className="relative w-full overflow-hidden rounded-lg pt-[56.25%]">
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title}
                                                        className="absolute inset-0 size-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="w-3/5 overflow-hidden whitespace-pre-line text-xs text-gray-700 dark:text-gray-300">
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
                                                className="block size-16"
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
