import {getImageUrl} from "../../services/catalogLoader.js";

export default async function handler(req, res) {
    const { image } = req.query;
    const url = await getImageUrl(image);
    if (!url) return res.status(404).json({ error: "Image not found or URL missing" });

    res.status(200).json({ url: url });
}
