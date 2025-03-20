import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import FullscreenViewer from "./FullscreenViewer";

const IMAGE_BATCH_SIZE = 20;
const OBSERVER_THRESHOLD = 0.8;

const Category = () => {
    const { categoryName } = useParams();
    const [images, setImages] = useState([]);
    const [visibleImages, setVisibleImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const hasMoreImages = useRef(true);

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

                setImages(response.data);
                setVisibleImages(response.data.slice(0, IMAGE_BATCH_SIZE));
                hasMoreImages.current = response.data.length > IMAGE_BATCH_SIZE;
            } catch (error) {
                console.error("❌ Error fetching images:", error);
            } finally {
                setLoading(false);
            }
        };

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
                        hasMoreImages.current = nextBatch.length > 0;
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
        <div ref={containerRef} className="flex flex-col items-center justify-start w-full min-h-screen p-5 bg-white dark:bg-black overflow-y-auto">
            {loading && <p className="text-black dark:text-white text-lg">Loading images...</p>}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-6xl">
                {visibleImages.map((img, index) => (
                    <img
                        key={index}
                        src={img.url}
                        alt={img.name}
                        className="w-full h-auto object-cover rounded-lg shadow-md cursor-pointer transition-transform duration-300 hover:scale-105"
                        onClick={() => setSelectedImage({ url: img.url, index })}
                    />
                ))}
            </div>

            {hasMoreImages.current && <div ref={observerRef} className="w-full h-10"></div>}

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
