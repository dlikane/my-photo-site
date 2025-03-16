import { useState, useEffect } from "react";

const FullscreenViewer = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);

    const prevImage = () => {
        if (index > 0) setIndex(index - 1);
    };

    const nextImage = () => {
        if (index < images.length - 1) setIndex(index + 1);
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft") prevImage();
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "Escape") onClose();
    };

    useEffect(() => {
        document.body.classList.add("hide-menu"); // Hide menu when in Fullscreen
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.classList.remove("hide-menu"); // Show menu when exiting Fullscreen
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [index]);

    return (
        <div className="fullscreen-overlay">
            {/* 🔢 Move Counter to Top-Left */}
            <div className="image-counter">
                {index + 1} / {images.length}
            </div>

            {/* ❌ Close Button */}
            <button className="close-btn" onClick={onClose}>✖</button>

            <div className="image-wrapper">
                <button className="nav-btn left" onClick={prevImage} disabled={index === 0}>←</button>
                <img src={images[index].url} alt={images[index].name} className="fullscreen-image" />
                <button className="nav-btn right" onClick={nextImage} disabled={index === images.length - 1}>→</button>
            </div>
        </div>
    );
};

export default FullscreenViewer;
