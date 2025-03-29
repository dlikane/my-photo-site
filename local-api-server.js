// local-api-server.js
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import resourceHandler from "./api/resource/[slug].js";
import imagesHandler from "./api/images/[tags].js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Auto-load any /api/*.js handler
app.get("/api/:handler", async (req, res) => {
    const { handler } = req.params;
    try {
        const handlerPath = path.join(__dirname, "api", `${handler}.js`);
        const mod = await import(`file://${handlerPath}`);
        if (typeof mod.default !== "function") throw new Error("Handler not found");

        await mod.default(req, res);
    } catch (e) {
        console.error("❌ Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// /api/resource/:slug
app.get("/api/resource/:slug", async (req, res) => {
    req.query = { slug: req.params.slug };
    await resourceHandler(req, res);
});

// /api/images/:tags
app.get("/api/images/:tags", async (req, res) => {
    req.query = { tags: req.params.tags };
    await imagesHandler(req, res);
});


app.listen(port, () => {
    console.log(`🚀 Local API server running at http://localhost:${port}/api/<handler>`);
});
