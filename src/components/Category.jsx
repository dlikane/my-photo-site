// src/components/Category.jsx
import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import FullscreenViewer from "./FullscreenViewer"

const IMAGE_BATCH_SIZE = 20
const OBSERVER_THRESHOLD = 0.8

const Category = () => {
    const location = useLocation()
    const categoryName = location.pathname.replace("/category/", "")
    const [images, setImages] = useState([])
    const [visibleImages, setVisibleImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(null)
    const containerRef = useRef(null)
    const observerRef = useRef(null)
    const hasMoreImages = useRef(true)

    useEffect(() => {
        if (!categoryName) return

        const fetchImages = async () => {
            try {
                const data = await catalogHelper.getFilteredImagesByTag(categoryName)
                setImages(data)
                setVisibleImages(
                    data.slice(0, IMAGE_BATCH_SIZE).map((img, i) => ({ img, globalIndex: i }))
                )
                hasMoreImages.current = data.length > IMAGE_BATCH_SIZE
            } catch (error) {
                console.error("❌ Error fetching images:", error)
            } finally {
                setLoading(false)
            }
        }

        setImages([])
        setVisibleImages([])
        setLoading(true)
        hasMoreImages.current = true

        fetchImages()
    }, [categoryName])

    useEffect(() => {
        if (!images.length || !containerRef.current || !hasMoreImages.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                const lastEntry = entries[0]

                if (lastEntry.isIntersecting) {
                    setTimeout(() => {
                        setVisibleImages((prev) => {
                            const nextBatch = images.slice(prev.length, prev.length + IMAGE_BATCH_SIZE)
                            hasMoreImages.current = nextBatch.length > 0
                            return [
                                ...prev,
                                ...nextBatch.map((img, i) => ({
                                    img,
                                    globalIndex: prev.length + i,
                                })),
                            ]
                        })
                    }, 300)
                }
            },
            { root: containerRef.current, threshold: OBSERVER_THRESHOLD }
        )

        if (observerRef.current) {
            observer.observe(observerRef.current)
        }

        return () => observer.disconnect()
    }, [images, visibleImages])

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center justify-start bg-white p-5 dark:bg-black">
            {loading && (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-black dark:text-white">
                    <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-t-black dark:border-t-white border-transparent" />
                    <p className="text-lg font-light italic">Developing your gallery…</p>
                </div>
            )}

            <div className="grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3">
                {visibleImages.map(({ img, globalIndex }) => (
                    <motion.div
                        key={globalIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="aspect-square w-full cursor-pointer overflow-hidden rounded-lg shadow-md"
                        onClick={() => setSelectedImage({ url: img.url, index: globalIndex })}
                    >
                        <img
                            src={img.url}
                            alt={img.name}
                            className="size-full object-cover"
                        />
                    </motion.div>
                ))}
            </div>

            {hasMoreImages.current && <div ref={observerRef} className="h-10 w-full" />}

            {selectedImage && (
                <FullscreenViewer
                    images={images}
                    currentIndex={selectedImage.index}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    )
}

export default Category
