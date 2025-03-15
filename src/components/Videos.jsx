import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Videos = () => {
    const { videoType } = useParams();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoType) return;

        const fetchVideos = async () => {
            try {
                const response = await axios.get(`/api/videos?playlist=${videoType}`);
                setVideos(response.data);
            } catch (error) {
                console.error("❌ Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [videoType]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.src += "&autoplay=1&mute=1"; // ✅ Auto-play muted
        }
    }, [currentIndex]);

    const navigateToNext = () => {
        if (currentIndex < videos.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const navigateToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowRight") navigateToNext();
        if (e.key === "ArrowLeft") navigateToPrev();
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex]);

    if (loading) return <p>Loading videos...</p>;
    if (videos.length === 0) return <p>No videos found.</p>;

    return (
        <div className="video-feed">
            {/* Left Navigation Indicator */}
            {currentIndex > 0 && (
                <button className="nav-button left" onClick={navigateToPrev}>
                    ◀ {currentIndex} / {videos.length}
                </button>
            )}

            {/* YouTube Video */}
            <iframe
                ref={videoRef}
                key={videos[currentIndex]?.id}
                className="video-frame"
                src={`https://www.youtube.com/embed/${videos[currentIndex]?.id}?autoplay=1&controls=1&modestbranding=1&playsinline=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
            ></iframe>
            {/* Right Navigation Indicator */}
            {currentIndex < videos.length - 1 && (
                <button className="nav-button right" onClick={navigateToNext}>
                    {currentIndex + 1} / {videos.length} ▶
                </button>
            )}
        </div>
    );
};

export default Videos;
