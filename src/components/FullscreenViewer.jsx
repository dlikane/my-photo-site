import { useState, useEffect } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

const FullscreenViewer = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const formattedImages = images.map((img) => ({
        original: img.url,
    }));

    return (
        <div className="fullscreen-overlay">
            <button className="close-btn" onClick={onClose}>✖</button>

            {/* Image Counter - Always Visible */}
            <div className="image-counter">
                {index + 1} / {images.length}
            </div>

            <ImageGallery
                items={formattedImages}
                startIndex={index}
                showFullscreenButton={false}
                showPlayButton={false}
                showThumbnails={false} // Hide thumbnails completely
                showNav={false} // Remove navigation arrows
                showIndex={false} // Disable default index to avoid duplicate counters
                slideDuration={200} // Faster transitions
                swipeThreshold={10} // More responsive swiping
                disableSwipe={false} // Keep swiping enabled
                lazyLoad={true} // Optimize loading
                useTranslate3D={true} // Improve performance
                onSlide={(currentIndex) => setIndex(currentIndex)} // Update counter
                onScreenChange={(isFullscreen) => {
                    if (!isFullscreen) onClose(); // Close when exiting fullscreen
                }}
            />
        </div>
    );
};

export default FullscreenViewer;
