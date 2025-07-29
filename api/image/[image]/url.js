import { getImageUrl } from "../../services/catalogLoader.js";

export default async function handler(req, res) {
    try {
        const { image } = req.param;
        const url = await getImageUrl(image);
        if (!url) {
            return res.status(404).json({ error: "Image not found or URL missing" });
        }
        res.status(200).json({ url });
    } catch (err) {
        console.error("❌ Error in image url handler:", err);
        res.status(500).json({ error: err.message });
    }
}
