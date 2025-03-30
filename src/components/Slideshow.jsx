import { useState, useEffect, useCallback } from "react"
import ImageDisplay from "./ImageDisplay"
import Quote from "./Quote.jsx"
import {getImagesByTags, getQuote, getRandomImagesByTags} from "../lib/catalog.js";

const Slideshow = () => {
    const [quote, setQuote] = useState(null)
    const [meImages, setMeImages] = useState([])
    const [currentImages, setCurrentImages] = useState([])
    const [index, setIndex] = useState(0)
    const [showPlaceholder, setShowPlaceholder] = useState(true)
    const [showQuote, setShowQuote] = useState(false)

    const startNewCycle = useCallback(async () => {
        console.log("🔄 Starting new cycle...")

        const meImages = await getImagesByTags(["me"]);
        setMeImages(meImages);
        const selectedImages = await getRandomImagesByTags(["small", "public", "fav"], 3)
        setCurrentImages(selectedImages)
        setIndex(0)
        setShowQuote(false)
        setQuote(await getQuote())
    }, [])

    useEffect(() => {
        setTimeout(() => setShowPlaceholder(false), 2000)
        startNewCycle()
    }, [])

    useEffect(() => {
        if (currentImages.length === 0) return

        const transitionDuration = 2000
        const displayDuration = 3000
        const totalDuration = transitionDuration + displayDuration

        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1

                if (nextIndex >= currentImages.length) {
                    console.log("🛑 Reached last image. Stopping cycle...")
                    clearInterval(interval)

                    setTimeout(() => {
                        console.log("💬 Showing quote...")
                        setShowQuote(true)
                    }, displayDuration)

                    return prevIndex
                }

                console.log("🔄 Moving to next image:", currentImages[nextIndex]?.name)
                return nextIndex
            })
        }, totalDuration)

        return () => clearInterval(interval)
    }, [currentImages, index])

    const handleClick = () => {
        console.log("🟠 Slideshow clicked! Restarting...")
        setShowQuote(false)
        setQuote(null)
        startNewCycle()
    }

    return (
        <div
            className="relative flex size-full items-center justify-center overflow-hidden bg-white dark:bg-black"
            onClick={handleClick}
        >
            {showPlaceholder ? (
                <ImageDisplay currentImages={meImages} index={0} />
            ) : (
                <>
                    <ImageDisplay currentImages={currentImages} index={index} isPaused={showQuote} />
                    {showQuote && <Quote quote={quote} />}
                </>
            )}
        </div>
    )
}

export default Slideshow
