import { getDropboxImages } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { category } = req.query; // ✅ Get category from query parameters
    console.log(`📂 Requested Category: ${category || "Slideshow"}`);

    console.log("📷 Received request to /api/images");

    try {
        const images = await getDropboxImages(category);
        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
