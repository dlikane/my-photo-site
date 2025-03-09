import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

// Fix __dirname issue in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Dynamically set API Base URL
const API_BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${PORT}`;

// ✅ Allow CORS for React frontend
app.use(cors());

// ✅ Serve images from the public folder (correct path)
app.use("/images", express.static(path.join(__dirname, "../../public/images")));

// ✅ API to get all image filenames dynamically
app.get("/api/images", (req, res) => {
    const imageDir = path.join(__dirname, "../../public/images");

    fs.readdir(imageDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Error reading image directory" });
        }

        // ✅ Use dynamic API URL for images
        const images = files.map(file => `${API_BASE_URL}/images/${file}`);
        res.json(images);
    });
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at ${API_BASE_URL}`);
});