import { getDropboxCategories } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("📂 Received request to /api/categories");

    const includeHidden = req.query.includeHidden === "true";

    try {
        const categories = await getDropboxCategories(includeHidden);
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
