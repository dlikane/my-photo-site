import { getDropboxAbout } from "./services/dropboxService.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("📩 Received request to /api/about");

    try {
        const aboutContent = await getDropboxAbout();
        res.status(200).json({ content: aboutContent }); // ✅ `null` if Dropbox is missing
    } catch (error) {
        console.error("❌ Error serving about content:", error);
        res.status(500).json({ content: null });
    }
}
