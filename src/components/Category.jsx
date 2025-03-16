import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import FullscreenViewer from "./FullscreenViewer";

const Category = () => {
    const { categoryName } = useParams();
    const [images, setImages] = useState([]);
    const [visibleImages, setVisibleImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const observerRef = useRef(null);

    useEffect(() => {
        if (!categoryName) {
            console.error("❌ Category name is undefined!");
            return;
        }

        console.log(`📂 Opening category: ${categoryName}`);

        const fetchImages = async () => {
            console.log(`🔄 Fetching images for category: ${categoryName}`);
            try {
                const response = await axios.get(`/api/images?category=${encodeURIComponent(categoryName)}`);
                console.log(`✅ Successfully fetched ${response.data.length} images.`);
                setImages(response.data);
                setVisibleImages(response.data.slice(0, 10));
            } catch (error) {
                console.error("❌ Error fetching images:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [categoryName]);

    useEffect(() => {
        if (!images.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const imgIndex = Number(entry.target.getAttribute("data-index"));
                    setVisibleImages((prev) => {
                        const newImages = [...prev, ...images.slice(prev.length, prev.length + 10)];
                        return Array.from(new Set(newImages)); // ✅ Prevents duplicates
                    });
                    entry.target.classList.add("loaded"); // ✅ Adds fade-in effect
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll(".category-image").forEach((img) => observer.observe(img));

        return () => observer.disconnect();
    }, [images]);

    return (
        <div className="category-container">
            {loading ? <p>Loading images...</p> : null}

            <div className="image-grid">
                {visibleImages.map((img, index) => (
                    <img
                        key={index}
                        src={img.url}
                        alt={img.name}
                        className="category-image"
                        data-index={index}
                        onClick={() => setSelectedImage({ url: img.url, index })}
                    />
                ))}
            </div>

            {/* ✅ Invisible Element to Trigger More Loading */}
            <div ref={observerRef} style={{ height: "1px" }}></div>

            {selectedImage && (
                <FullscreenViewer
                    images={images}
                    currentIndex={selectedImage.index}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

export default Category;
