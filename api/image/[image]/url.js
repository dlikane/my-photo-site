import { getImageUrlByName } from "../../services/catalog.js";

export default async function handler(req, res) {
    const { image } = req.query;

    if (!image) return res.status(400).json({ error: "Missing image name" });

    try {
        const url = await getImageUrlByName(image);
        if (!url) return res.status(404).json({ error: "Image not found or URL missing" });
        res.redirect(url);
    } catch (err) {
        console.error("❌ Error in /api/images/[image]/url:", err);
        res.status(500).json({ error: "Failed to get image URL" });
    }
}
