import { getDropboxImages } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("📷 Received request to /api/images");

    try {
        const images = await getDropboxImages();
        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
