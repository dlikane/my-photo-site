/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";

const ImageDisplay = ({ currentImages, index, isPaused }) => {
    const currentImage = currentImages[index];

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
                    <img
                        src={currentImage.url}
                        className="h-full max-h-full w-auto max-w-full object-contain"
                        alt={currentImage.name}
                    />
                    <motion.div
                        className="absolute left-1/2 top-1 -translate-x-1/2 rounded-md bg-black/70 px-4 py-2 text-lg text-white shadow-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: isPaused ? 1 : 0 }}
                        transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                    >
                        {currentImage.caption}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageDisplay;
