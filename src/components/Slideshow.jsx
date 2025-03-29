import { useState, useEffect, useCallback } from "react"
import useFetchImages from "../hooks/useFetchImages"
import { catalogHelper } from "../lib/catalogHelper."
import ImageDisplay from "./ImageDisplay"
import Quote from "./Quote.jsx"

const Slideshow = () => {
    const images = useFetchImages()
    const [quote, setQuote] = useState(null)
    const [currentImages, setCurrentImages] = useState([])
    const [index, setIndex] = useState(0)
    const [showPlaceholder, setShowPlaceholder] = useState(true)
    const [showQuote, setShowQuote] = useState(false)

    const fetchQuote = async () => {
        try {
            const quote = await catalogHelper.getQuote()
            setQuote(quote)
        } catch (err) {
            console.error("❌ Error fetching quote", err)
        }
    }

    const startNewCycle = useCallback(() => {
        if (images.length === 0) return

        console.log("🔄 Starting new cycle...")

        const numImages = Math.floor(Math.random() * 3) + 3
        const selectedImages = [...images].sort(() => Math.random() - 0.5).slice(0, numImages)

        setCurrentImages(selectedImages)
        setIndex(0)
        setShowQuote(false)
        fetchQuote()
    }, [images])

    useEffect(() => {
        if (images.length > 0) {
            console.log("🟢 Images fetched, preparing slideshow...")
            setTimeout(() => setShowPlaceholder(false), 2000)
            startNewCycle()
        }
    }, [images])

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
                <ImageDisplay currentImages={[{ url: "/me.jpg", name: "Welcome" }]} index={0} />
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
