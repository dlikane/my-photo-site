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
            {/* Video Title */}
            <h2 className="video-title">{videos[currentIndex]?.title}</h2>

            {/* YouTube Video */}
            <iframe
                ref={videoRef}
                key={videos[currentIndex]?.id}
                className="video-frame"
                src={`https://www.youtube.com/embed/${videos[currentIndex]?.id}?controls=1&modestbranding=1&playsinline=1&rel=0&showinfo=0&fs=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
            ></iframe>

            {/* Video Counter */}
            <div className="video-counter">
                {currentIndex + 1} / {videos.length}
            </div>

            {/* Navigation Buttons */}
            <div className="video-nav">
                <button className="nav-button left" onClick={navigateToPrev} disabled={currentIndex === 0}>
                    ◀ Previous
                </button>
                <button className="nav-button right" onClick={navigateToNext} disabled={currentIndex === videos.length - 1}>
                    Next ▶
                </button>
            </div>
        </div>
    );
};

export default Videos;
