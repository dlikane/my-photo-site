import { useState, useEffect, useCallback } from "react";
import useFetchImages from "../hooks/useFetchImages";
import useFetchQuote from "../hooks/useFetchQuote";
import ImageDisplay from "./ImageDisplay";
import QuoteDisplay from "./QuoteDisplay";
import {AnimatePresence, motion} from "framer-motion";

const Slideshow = () => {
    const images = useFetchImages();
    const { quote, fetchQuote, setQuote } = useFetchQuote();
    const [currentImages, setCurrentImages] = useState([]);
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(true);

    const startNewCycle = useCallback(() => {
        if (images.length === 0) return;

        console.log("🔄 Starting new cycle...");

        const numImages = Math.floor(Math.random() * 3) + 3;
        const selectedImages = [...images].sort(() => Math.random() - 0.5).slice(0, numImages);

        setCurrentImages(selectedImages);
        setIndex(0);
        setIsPaused(false);
        fetchQuote(); // ✅ Fetch a new quote every cycle
    }, [images]);

    useEffect(() => {
        if (images.length > 0) {
            console.log("🟢 Images fetched, preparing slideshow...");
            setTimeout(() => {
                setShowPlaceholder(false);
                setTimeout(() => {
                    setIsReady(true);
                    startNewCycle();
                }, 1000); // ✅ Ensures transition completes before images start
            }, 2000); // ✅ Let `me.jpg` stay visible for a short time
            // setIsReady(true); // ✅ Only show images once they're ready
            // startNewCycle();
        }
    }, [images]);

    useEffect(() => {
        if (currentImages.length === 0) return;

        const transitionDuration = 2000; // 2 sec transition
        const displayDuration = 3000; // 3 sec display
        const totalDuration = transitionDuration + displayDuration;

        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;

                if (nextIndex >= currentImages.length) {
                    console.log("🛑 Reached last image. Pausing...");
                    setIsPaused(true); // ✅ Pause after last image
                    return prevIndex;
                }

                console.log("🔄 Moving to next image:", currentImages[nextIndex]?.name);
                return nextIndex;
            });
        }, totalDuration);

        return () => clearInterval(interval);
    }, [currentImages, index]);

    const handleClick = () => {
        console.log("🟠 Slideshow clicked! Restarting...");

        setIsPaused(false); // ✅ Make sure slideshow unpauses
        setQuote(null); // ✅ Hide previous quote
        startNewCycle();
    };

    if (!isReady) return (
        <div className="slideshow-container">
            <AnimatePresence>
                {showPlaceholder && (
                    <motion.img
                        src="/me.jpg"
                        className="placeholder-image"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
                    />
                )}
            </AnimatePresence>
        </div>
    );

    console.log("Placeholder: ", showPlaceholder)
    return (
        <div className="slideshow-container" onClick={handleClick}>
            {!showPlaceholder && (
                <>
                    <ImageDisplay currentImages={currentImages} index={index} />
                    <QuoteDisplay quote={quote} isPaused={isPaused} />
                </>
            )}

        </div>
    );
};

export default Slideshow;
