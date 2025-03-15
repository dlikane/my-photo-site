import { useState, useEffect, useCallback } from "react";
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
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [showQuote, setShowQuote] = useState(false);

    const startNewCycle = useCallback(() => {
        if (images.length === 0) return;

        console.log("🔄 Starting new cycle...");

        const numImages = Math.floor(Math.random() * 3) + 3;
        const selectedImages = [...images].sort(() => Math.random() - 0.5).slice(0, numImages);

        setCurrentImages(selectedImages);
        setIndex(0);
        setIsPaused(false);
        setShowQuote(false);
        fetchQuote();
    }, [images]);

    useEffect(() => {
        if (images.length > 0) {
            console.log("🟢 Images fetched, preparing slideshow...");
            setTimeout(() => setShowPlaceholder(false), 2000);
            startNewCycle();
        }
    }, [images]);

    useEffect(() => {
        if (currentImages.length === 0) return;

        const transitionDuration = 2000;
        const displayDuration = 3000;
        const totalDuration = transitionDuration + displayDuration;

        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;

                if (nextIndex >= currentImages.length) {
                    console.log("🛑 Reached last image. Preparing to show quote...");
                    setTimeout(() => setShowQuote(true), 2000); // ✅ Delay quote appearance
                    setIsPaused(true);
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

        setIsPaused(false);
        setQuote(null);
        setShowQuote(false);
        startNewCycle();
    };

    return (
        <div className="slideshow-container" onClick={handleClick}>
            {showPlaceholder ? (
                <ImageDisplay currentImages={[{ url: "/me.jpg", name: "Welcome" }]} index={0} />
            ) : (
                <>
                    <ImageDisplay currentImages={currentImages} index={index} />
                    {showQuote && <QuoteDisplay quote={quote} />}
                </>
            )}
        </div>
    );
};

export default Slideshow;
