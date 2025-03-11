import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const Slideshow = () => {
    const [images, setImages] = useState([]);
    const [currentImages, setCurrentImages] = useState([]);
    const [index, setIndex] = useState(0);
    const [quote, setQuote] = useState(null);
    const [caption, setCaption] = useState("");
    const [isPaused, setIsPaused] = useState(false);

    /** ✅ Fetch images from API **/
    const fetchImages = async () => {
        try {
            const response = await axios.get("/api/images");
            console.log("✅ Successfully fetched images:", response.data);

            if (!Array.isArray(response.data) || response.data.length === 0) {
                console.warn("⚠️ No images received from API.");
                return;
            }

            // ✅ Extract URLs and filenames
            const validImages = response.data.filter(img => img.url && img.name);

            if (validImages.length === 0) {
                console.warn("⚠️ No valid image URLs received.");
                return;
            }

            console.log("🎉 Storing images in state:", validImages);
            setImages(validImages.sort(() => Math.random() - 0.5));
        } catch (error) {
            console.error("❌ Error fetching images:", error.response?.data || error.message);
        }
    };

    /** ✅ Fetch random quote from API **/
    const fetchQuote = async () => {
        try {
            const response = await axios.get("/api/quotes");
            console.log("✅ Fetched quote:", response.data);

            if (!response.data.quotes) {
                console.warn("⚠️ No quote received from API.");
                return;
            }

            const quotesList = response.data.quotes.split("\n").map(line => line.split("|"));
            const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
            setQuote({ author: randomQuote[0], text: randomQuote[1] });
        } catch (error) {
            console.error("❌ Error fetching quotes:", error.response?.data || error.message);
        }
    };

    /** ✅ Start new slideshow cycle with 3-5 random images **/
    const startNewCycle = useCallback(() => {
        if (images.length === 0) return;

        const numImages = Math.floor(Math.random() * 3) + 3;
        const selectedImages = [...images].sort(() => Math.random() - 0.5).slice(0, numImages);

        setCurrentImages(selectedImages);
        setIndex(0);
        setIsPaused(false);
        fetchQuote();

        setCaption(selectedImages[0]?.name || ""); // ✅ Set the actual filename
    }, [images]);
    /** ✅ Load images on first render **/
    useEffect(() => {
        fetchImages();
    }, []);

    /** ✅ Handle slideshow timing **/
    useEffect(() => {
        if (currentImages.length === 0) return;

        const transitionDuration = 2000; // 2 sec transition
        const displayDuration = 3000; // 3 sec display
        const totalDuration = transitionDuration + displayDuration;

        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= currentImages.length) {
                    setIsPaused(true);
                    return prevIndex;
                }
                return nextIndex;
            });
        }, totalDuration);

        return () => clearInterval(interval);
    }, [currentImages]);

    /** ✅ Handle click to restart slideshow **/
    const handleClick = () => {
        if (isPaused) {
            setQuote(null);
            startNewCycle();
        }
    };

    useEffect(() => {
        if (images.length > 0) {
            console.log("🟢 Images fetched, starting slideshow...");
            startNewCycle();
        }
    }, [images]); // Runs when images update

    useEffect(() => {
        if (currentImages.length > 0) {
            setCaption(currentImages[index]?.name || ""); // ✅ Update caption dynamically
        }
    }, [index, currentImages]); // ✅ Runs whenever `index` changes

    return (
        <div className="slideshow-container" onClick={handleClick}>
            <AnimatePresence mode="wait">
                {currentImages.length > 0 && (
                    <motion.img
                        key={index}
                        src={currentImages[index]?.url}
                        className="slideshow-image"
                        onError={(e) => console.error("❌ Image failed to load:", e.target.src)}
                        onLoad={() => console.log("✅ Image loaded:", currentImages[index]?.url)}
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: 1, scale: [1, 1.1, 1] }}
                        transition={{
                            opacity: { duration: 2, ease: "easeInOut" },
                            scale: { duration: 5, ease: "easeInOut" }
                        }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>

            {/* ✅ Caption at the top */}
            {caption && (
                <div className="image-caption">{caption}</div>
            )}

            {/* ✅ Quote on last image */}
            {isPaused && quote && (
                <div className="quote-container">
                    <p className="quote-text">"{quote.text}"</p>
                    <p className="quote-author">— {quote.author}</p>
                </div>
            )}
        </div>
    );
};

export default Slideshow;
