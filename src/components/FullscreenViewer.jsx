import { useState, useEffect } from "react";
import ImageGallery from "react-image-gallery";
import { getImageUrlByPath } from "../lib/catalog.js";
import "react-image-gallery/styles/css/image-gallery.css";

const FullscreenViewer = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);
    const [formattedImages, setFormattedImages] = useState([]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const load = async () => {
            try {
                const items = await Promise.all(
                    images.map(async (img) => {
                        const url = await getImageUrlByPath(img.path);
                        return { original: url };
                    })
                );
                setFormattedImages(items);
            } catch (err) {
                console.error("❌ Error loading fullscreen images:", err);
            }
        };

        load();
    }, [images]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-black/90">
            <button
                className="absolute right-4 top-4 z-50 rounded-full bg-white/50 p-1.5 text-xl text-black transition hover:bg-black/10 dark:text-white dark:hover:bg-white/20"
                onClick={onClose}
                title="Close"
            >
                ✖
            </button>

            <div className="absolute bottom-4 rounded-md bg-white/80 px-4 py-2 text-lg text-black shadow-md">
                {index + 1} / {images.length}
            </div>

            {formattedImages.length > 0 && (
                <div className="w-full max-w-5xl pb-16">
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
            )}
        </div>
    );
};

export default FullscreenViewer;
