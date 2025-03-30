// src/hooks/useFetchImages.js
import { useEffect, useState } from "react"
import { catalogHelper } from "../lib/catalogHelper."

const useFetchImages = () => {
    const [images, setImages] = useState([])

    useEffect(() => {
        const fetch = async () => {
            try {
                const catalog = await catalogHelper.getCatalog()
                const filtered = catalog?.images?.filter(
                    (img) => img.tags?.includes("public") && img.tags?.includes("fav")
                ) || []
                setImages(filtered)
            } catch (err) {
                console.error("❌ Failed to fetch images:", err)
            }
        }
        fetch()
    }, [])

    return images
}

export default useFetchImages
