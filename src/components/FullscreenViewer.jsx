import { useState } from "react";

const FullscreenViewer = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);

    const prevImage = () => {
        if (index > 0) setIndex(index - 1);
    };

    const nextImage = () => {
        if (index < images.length - 1) setIndex(index + 1);
    };

    return (
        <div className="fullscreen-overlay">
            <button className="close-btn" onClick={onClose}>✕</button>

            <div className="image-wrapper">
                <button className="nav-btn left" onClick={prevImage} disabled={index === 0}>◀</button>
                <img src={images[index].url} alt={images[index].name} className="fullscreen-image" />
                <button className="nav-btn right" onClick={nextImage} disabled={index === images.length - 1}>▶</button>
            </div>

            <div className="counter">
                {index + 1} / {images.length}
            </div>
        </div>
    );
};

export default FullscreenViewer;
