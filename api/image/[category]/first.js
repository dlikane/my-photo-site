import { getFirstDropboxImage } from "../../services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { category } = req.query;
    console.log("📥 Received request for first image in category:", category);

    if (!category) return res.status(400).json({ error: "Missing image ID" });

    try {
        const image = await getFirstDropboxImage(`/${category}/small`);
        console.log(`✅ Found image for /${category}/small:`, image?.url || "none");
        res.status(200).json(image);
    } catch (error) {
        console.error(`❌ Error fetching first image for /${category}/small:`, error.message);
        res.status(500).json({ error: error.message });
    }
}
