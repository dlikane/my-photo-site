import { loadCatalogFromDropbox } from './services/catalogLoader.js';

export default async function handler(req, res) {
    try {
        const catalog = await loadCatalogFromDropbox();
        res.status(200).json(catalog);
    } catch (err) {
        console.error("Failed to load catalog:", err.message);
        res.status(500).json({ error: "Failed to load catalog" });
    }
}
