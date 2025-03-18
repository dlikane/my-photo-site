import { useState, useEffect } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

const FullscreenViewer = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);

    // Close viewer when pressing Escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const formattedImages = images.map((img) => ({
        original: img.url,
    }));

    return (
        <div className="fullscreen-overlay">
            <button className="close-btn" onClick={onClose}>✖</button>

            {/* Image Counter */}
            <div className="image-counter">
                {index + 1} / {images.length}
            </div>

            <ImageGallery
                items={formattedImages}
                startIndex={index}
                showFullscreenButton={false}
                showPlayButton={false}
                showThumbnails={false} // No thumbnails
                showNav={false} // No navigation arrows
                showIndex={false} // Prevent double counter
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
