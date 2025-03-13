import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const ImageDisplay = ({ currentImages, index, isPaused }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const currentImage = currentImages[index];

    // ✅ Reset loading state when image changes
    useEffect(() => {
        setIsLoaded(false);
    }, [currentImage]);

    return (
        <AnimatePresence mode="wait">
            {currentImage && (
                <motion.div
                    key={index}
                    className="image-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}  /* ✅ Waits until image is loaded */
                    exit={{ opacity: isPaused ? 1 : 0 }}
                    transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                >
                    {/* ✅ Image loads first, then animates */}
                    <motion.img
                        src={currentImage.url}
                        className="slideshow-image"
                        onLoad={() => setIsLoaded(true)} /* ✅ Set state when image is fully loaded */
                        initial={{ scale: 1 }}
                        animate={isLoaded ? { scale: [1, 1.025, 1] } : {}}
                        transition={{ scale: { duration: 5, ease: "easeInOut" } }}
                    />

                    {/* ✅ Caption only fades in/out, no zoom */}
                    {isLoaded && (
                        <motion.div
                            className="image-caption"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: isPaused ? 1 : 0 }}
                            transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                        >
                            {currentImage.name}
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageDisplay;
