import { useState, useEffect, useCallback } from "react"
import ImageDisplay from "./ImageDisplay"
import Quote from "./Quote.jsx"
import { getQuote, getRandomImagesByTags, isLoaded } from "../lib/catalog.js"

const Slideshow = () => {
    const [quote, setQuote] = useState(null)
    const [currentImages, setCurrentImages] = useState([])
    const [index, setIndex] = useState(0)
    const [showPlaceholder, setShowPlaceholder] = useState(true)
    const [showQuote, setShowQuote] = useState(false)

    const preloadImages = (images) => {
        images.forEach((img) => {
            const i = new Image()
            i.src = img.url
        })
    }

    const startNewCycle = useCallback(async () => {
        console.log("🔄 Starting new cycle...")
        const selectedImages = await getRandomImagesByTags(["small", "public", "fav"], 3)
        preloadImages(selectedImages)
        setCurrentImages(selectedImages)
        setIndex(0)
        setShowQuote(false)
        setQuote(await getQuote())
    }, [])

    useEffect(() => {
        const waitForCatalog = async () => {
            const timeout = new Promise((resolve) => setTimeout(resolve, 5000))
            while (!isLoaded()) {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }
            await timeout
            setShowPlaceholder(false)
        }

        waitForCatalog()
        startNewCycle()
    }, [])

    useEffect(() => {
        if (currentImages.length === 0) return

        const transitionDuration = 2000
        const displayDuration = 3000
        const extraHoldDuration = 2000
        const totalDuration = transitionDuration + displayDuration + extraHoldDuration

        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1
                if (nextIndex >= currentImages.length) {
                    console.log("🛑 Reached last image. Stopping cycle...")
                    clearInterval(interval)
                    setShowQuote(true)
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
            {/* me.jpg placeholder image */}
            <img
                src="/me.jpg"
                className={`absolute h-full w-full object-contain transition-opacity duration-1000 ${showPlaceholder ? "opacity-100" : "opacity-0"}`}
                alt="me"
            />

            {/* Slideshow image display */}
            <div className={`absolute h-full w-full transition-opacity duration-1000 ${showPlaceholder ? "opacity-0" : "opacity-100"}`}>
                <ImageDisplay currentImages={currentImages} index={index} isPaused={showQuote} />
                {showQuote && <Quote quote={quote} />}
            </div>
        </div>
    )
}

export default Slideshow
