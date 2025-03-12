import { motion, AnimatePresence } from "framer-motion";

const ImageDisplay = ({ currentImages, index, isPaused }) => {
    const currentImage = currentImages[index];

    return (
        <AnimatePresence mode="wait">
            {currentImage && (
                <motion.div
                    key={index}
                    className="image-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: isPaused ? 1 : 0 }}
                    transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                >
                    {/* ✅ Image scales independently */}
                    <motion.img
                        src={currentImage.url}
                        className="slideshow-image"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.025, 1] }}
                        transition={{ scale: { duration: 5, ease: "easeInOut" } }}
                    />

                    {/* ✅ Caption only fades in/out, no zoom */}
                    <motion.div
                        className="image-caption"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: isPaused ? 1 : 0 }}
                        transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                    >
                        {currentImage.name}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageDisplay;
