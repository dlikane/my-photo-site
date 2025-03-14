import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useFetchImages from "../hooks/useFetchImages";
import useFetchQuote from "../hooks/useFetchQuote";
import ImageDisplay from "./ImageDisplay";
import QuoteDisplay from "./QuoteDisplay";

const Slideshow = () => {
    const images = useFetchImages();
    const { quote, fetchQuote, setQuote } = useFetchQuote();
    const [currentImages, setCurrentImages] = useState([]);
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showQuote, setShowQuote] = useState(false);
    const [isFirstCycle, setIsFirstCycle] = useState(true); // ✅ Track first cycle

    /** ✅ Start new image cycle **/
    const startNewCycle = useCallback(() => {
        if (images.length === 0) return;

        console.log("🔄 Starting new cycle...");

        const numImages = Math.floor(Math.random() * 3) + 3;
        let selectedImages = images.sort(() => Math.random() - 0.5).slice(0, numImages);

        // ✅ Only use `me.jpg` for the first cycle
        if (isFirstCycle) {
            selectedImages = [{ url: "/me.jpg", name: "Welcome" }, ...selectedImages];
        }

        setCurrentImages(selectedImages);
        setIndex(0);
        setIsPaused(false);
        setShowQuote(false);
        fetchQuote();
    }, [images, isFirstCycle]);

    /** ✅ Load images from Dropbox **/
    useEffect(() => {
        if (images.length > 0) {
            console.log("🟢 Images fetched, preparing slideshow...");
            startNewCycle();
        }
    }, [images]);

    /** ✅ Handle image transitions **/
    useEffect(() => {
        if (currentImages.length === 0) return;

        const transitionDuration = 2000; // 2 sec transition
        const firstImageDuration = 7000; // ✅ First image stays longer
        const displayDuration = 3000; // Normal display time
        const totalDuration = index === 0 && isFirstCycle ? firstImageDuration : transitionDuration + displayDuration;

        const interval = setTimeout(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;

                if (nextIndex >= currentImages.length) {
                    console.log("🛑 Reached last image. Showing quote...");
                    setTimeout(() => setShowQuote(true), 2000); // ✅ Delay quote appearance
                    setIsPaused(true);
                    setIsFirstCycle(false); // ✅ Mark first cycle as complete, so `me.jpg` isn't used again
                    return prevIndex;
                }

                console.log("🔄 Moving to next image:", currentImages[nextIndex]?.name);
                return nextIndex;
            });
        }, totalDuration);

        return () => clearTimeout(interval);
    }, [currentImages, index, isFirstCycle]);

    /** ✅ Handle click event to start new cycle **/
    const handleClick = () => {
        if (showQuote) {
            console.log("🟠 Click detected. Restarting cycle...");
            setQuote(null);
            setShowQuote(false);
            startNewCycle();
        }
    };

    return (
        <div className="slideshow-container" onClick={handleClick}>
            {/* ✅ Display Images */}
            <ImageDisplay currentImages={currentImages} index={index} isPaused={isPaused} />

            {/* ✅ Show "Warm Greetings" only for first cycle */}
            {isFirstCycle && showQuote && <QuoteDisplay quote={{ text: "Warm Greetings", author: "" }} />}

            {/* ✅ Normal Quote after first cycle */}
            {!isFirstCycle && showQuote && <QuoteDisplay quote={quote} />}
        </div>
    );
};

export default Slideshow;
