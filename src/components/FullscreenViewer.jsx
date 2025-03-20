import { useState, useEffect } from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

const FullscreenViewer = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);

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
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-black/90 z-50">
            <button
                className="absolute top-4 right-4 text-black dark:text-white text-3xl p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition"
                onClick={onClose}
            >
                ✖
            </button>

            <div className="absolute bottom-4 text-black dark:text-white text-lg bg-black/60 px-4 py-2 rounded-md">
                {index + 1} / {images.length}
            </div>

            <div className="w-full max-w-5xl">
                <ImageGallery
                    items={formattedImages}
                    startIndex={index}
                    showFullscreenButton={false}
                    showPlayButton={false}
                    showThumbnails={false}
                    showNav={false}
                    showIndex={false}
                    slideDuration={200}
                    swipeThreshold={10}
                    disableSwipe={false}
                    lazyLoad={true}
                    useTranslate3D={true}
                    onSlide={(currentIndex) => setIndex(currentIndex)}
                    onScreenChange={(isFullscreen) => {
                        if (!isFullscreen) onClose();
                    }}
                />
            </div>
        </div>
    );
};

export default FullscreenViewer;
