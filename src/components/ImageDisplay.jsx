import { motion, AnimatePresence } from "framer-motion";

const ImageDisplay = ({ currentImages, index, isPaused }) => {
    const currentImage = currentImages[index];

    return (
        <AnimatePresence mode="wait">
            {currentImage && (
                <motion.div
                    key={index}
                    className="relative flex justify-center items-center w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: isPaused ? 1 : 0 }}
                    transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                >
                    <img
                        src={currentImage.url}
                        className="w-auto h-full max-w-full max-h-full object-contain"
                        alt={currentImage.name}
                    />
                    <motion.div
                        className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 text-lg rounded-md shadow-md"
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
