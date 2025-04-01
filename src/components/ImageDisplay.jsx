import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CachedImage from "./CachedImage.jsx";

const ImageDisplay = ({ currentImages, index, isPaused }) => {
    const currentImage = currentImages[index];
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        setImageLoaded(false); // reset on image change
    }, [currentImage]);

    return (
        <AnimatePresence mode="wait">
            {currentImage && (
                <motion.div
                    key={index}
                    className="relative flex size-full items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: isPaused ? 1 : 0 }}
                    transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                >
                    <CachedImage
                        img={currentImage}
                        className="h-full max-h-full w-auto max-w-full object-contain"
                        onLoad={() => setImageLoaded(true)}
                    />
                    {imageLoaded && (
                        <motion.div
                            className="absolute left-1/2 top-1 -translate-x-1/2 rounded-md bg-black/70 px-4 py-2 text-lg text-white shadow-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: isPaused ? 1 : 0 }}
                            transition={{ opacity: { duration: 1, ease: "easeInOut", delay: 0.5 } }}
                        >
                            {currentImage.caption}
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageDisplay;
