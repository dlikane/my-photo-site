import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const Slideshow = () => {
    const [images, setImages] = useState([]);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/images`)
            .then(response => {
                const shuffled = response.data.sort(() => Math.random() - 0.5);
                setImages(shuffled);
            })
            .catch(error => console.error("Error fetching images:", error));
    }, []);

    useEffect(() => {
        if (images.length === 0) return;

        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Full animation duration

        return () => clearInterval(interval);
    }, [images]);

    return (
        <div className="slideshow-container">
            <AnimatePresence mode="wait">
                {images.length > 0 && (
                    <motion.img
                        key={index}
                        src={images[index]}
                        className="slideshow-image"
                        initial={{ opacity: 0, scale: 1, filter: "grayscale(1)" }} // Full grayscale, normal size
                        animate={{
                            opacity: 1,
                            scale: [1, 1.2, 1.2, 1.2, 1], // Zoom in 20% → hold → hold → zoom out
                            filter: ["grayscale(1)", "grayscale(1)", "grayscale(1)", "grayscale(0)", "grayscale(0)"], // Hold grayscale, then saturate
                        }}
                        transition={{
                            opacity: { duration: 1, ease: "easeInOut" }, // Fade in
                            scale: { times: [0, 0.2, 0.4, 0.6, 1], duration: 5, ease: "easeInOut" }, // Zoom + hold + zoom out
                            filter: { times: [0, 0.2, 0.4, 0.6, 1], duration: 5, ease: "easeInOut" }, // Grayscale → saturation at right timing
                        }}
                        exit={{ opacity: 0, scale: 1.2, filter: "grayscale(0)" }} // Fade out, stays colored
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Slideshow;