import {getAbout, getMenuTags, getPlaylists, getQuote} from "../services/catalog.js";

export default async function handler(req, res) {
    const { slug } = req.query;

    try {
        if (slug === "about") return res.json(await getAbout());
        if (slug === "quote") return res.json(await getQuote());
        if (slug === "playlists") return res.json(await getPlaylists());
        if (slug === "menu") return res.json(await getMenuTags());
        return res.status(404).json({ error: "Not found" });
    } catch (err) {
        console.error("❌ resource.js error:", err);
        return res.status(500).json({ error: "Internal error" });
    }
}
