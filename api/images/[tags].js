import {getImagesByTags} from "../services/catalog.js"

export default async function handler(req, res) {
    const { tags = "" } = req.query
    try {
        const images = await getImagesByTags(tags)
        res.status(200).json(images)
    } catch (err) {
        console.error("❌ Error in /api/catalog/category/[tags]:", err)
        res.status(500).json({ error: "Failed to fetch category images" })
    }
}
