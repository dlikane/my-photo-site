import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import FullscreenViewer from "./FullscreenViewer";

const IMAGE_BATCH_SIZE = 20; // Load images in chunks
const OBSERVER_THRESHOLD = 0.8; // Detects when 80% of the last item is visible

const Category = () => {
    const { categoryName } = useParams();
    const [images, setImages] = useState([]);
    const [visibleImages, setVisibleImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const hasMoreImages = useRef(true); // Track if we have more images to load

    useEffect(() => {
        if (!categoryName) {
            console.error("⚠️ Category name is undefined!");
            return;
        }

        console.log(`📁 Opening category: ${categoryName}`);

        const fetchImages = async () => {
            console.log(`📸 Fetching images for category: ${categoryName}`);
            try {
                const response = await axios.get(`/api/images?category=${encodeURIComponent(categoryName)}`);
                console.log(`✅ Successfully fetched ${response.data.length} images.`);

                setImages(response.data); // Set full image list
                setVisibleImages(response.data.slice(0, IMAGE_BATCH_SIZE)); // Start with the first batch
                hasMoreImages.current = response.data.length > IMAGE_BATCH_SIZE;
            } catch (error) {
                console.error("❌ Error fetching images:", error);
            } finally {
                setLoading(false);
            }
        };

        // **Clear images when switching categories**
        setImages([]);
        setVisibleImages([]);
        setLoading(true);
        hasMoreImages.current = true;

        fetchImages();
    }, [categoryName]);

    useEffect(() => {
        if (!images.length || !containerRef.current || !hasMoreImages.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const lastEntry = entries[0];

                if (lastEntry.isIntersecting) {
                    setVisibleImages((prev) => {
                        const nextBatch = images.slice(prev.length, prev.length + IMAGE_BATCH_SIZE);
                        hasMoreImages.current = nextBatch.length > 0; // Stop when all images are loaded
                        return [...prev, ...nextBatch];
                    });
                }
            },
            { root: containerRef.current, threshold: OBSERVER_THRESHOLD }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [images, visibleImages]);

    return (
        <div className="category-container" ref={containerRef}>
            {loading ? <p>Loading images...</p> : null}

            <div className="image-grid">
                {visibleImages.map((img, index) => (
                    <img
                        key={index}
                        src={img.url}
                        alt={img.name}
                        className="category-image loaded"
                        data-index={index}
                        onLoad={(e) => e.target.classList.add("loaded")}
                        onClick={() => setSelectedImage({ url: img.url, index })}
                    />
                ))}
            </div>

            {/* Sentinel for triggering new batches */}
            {hasMoreImages.current && <div ref={observerRef} className="observer-sentinel"></div>}

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
