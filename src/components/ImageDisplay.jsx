import { motion, AnimatePresence } from "framer-motion";

const ImageDisplay = ({ currentImages, index, isPaused }) => {
    const currentImage = currentImages[index];

    return (
        <AnimatePresence mode="wait">
            {currentImage && (
                <motion.div
                    key={index}
                    className="image-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: isPaused ? 1 : 0 }} // ✅ Keeps last image & caption visible when paused
                    transition={{ duration: 2, ease: "easeInOut" }}
                >
                    {/* ✅ Image */}
                    <motion.img
                        src={currentImage.url}
                        className="slideshow-image"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                        transition={{
                            opacity: { duration: 2, ease: "easeInOut" },
                            scale: { duration: 5, ease: "easeInOut" }
                        }}
                        exit={{ opacity: isPaused ? 1 : 0 }}
                    />

                    {/* ✅ Caption stays exactly where the tagline was */}
                    <motion.div
                        className="image-caption"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: isPaused ? 1 : 0 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    >
                        {currentImage.name}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageDisplay;
