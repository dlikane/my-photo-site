import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
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
        if (!categoryName) return;

        const fetchImages = async () => {
            try {
                const response = await axios.get(`/api/images?category=${encodeURIComponent(categoryName)}`);
                const data = response.data || [];

                setImages(data);
                setVisibleImages(
                    data.slice(0, IMAGE_BATCH_SIZE).map((img, i) => ({ img, globalIndex: i }))
                );
                hasMoreImages.current = data.length > IMAGE_BATCH_SIZE;
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
                    setTimeout(() => {
                        setVisibleImages((prev) => {
                            const nextBatch = images.slice(prev.length, prev.length + IMAGE_BATCH_SIZE);
                            hasMoreImages.current = nextBatch.length > 0;
                            return [
                                ...prev,
                                ...nextBatch.map((img, i) => ({
                                    img,
                                    globalIndex: prev.length + i,
                                })),
                            ];
                        });
                    }, 300);
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

            {/* 👇 Ensures 2 images per row on mobile, 3 images per row on larger screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-6xl">
                {visibleImages?.map(({ img, globalIndex }) => (
                    <motion.div
                        key={globalIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                        onClick={() => setSelectedImage({ url: img.url, index: globalIndex })}
                    >
                        <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
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
