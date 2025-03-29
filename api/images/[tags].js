import {getImagesByTags, verifyUrls} from "../services/catalog.js"

export default async function handler(req, res) {
    const { tags = "", random } = req.query
    let images;
    try {
        images = await getImagesByTags(tags)
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(200).json([]);
        }
        if (random) {
            const count = parseInt(random, 10) || 1
            images = images.sort(() => Math.random() - 0.5).slice(0, count)
            // it's only a handful, allocate their temp urls here
            images = verifyUrls(images)
        }
        res.status(200).json(images)
    } catch (err) {
        console.log("tags:", tags);
        console.log("images:", images);
        console.error("❌ Error in /api/images/[tags]:", err)
        res.status(500).json({ error: "Failed to fetch images" })
    }
}
