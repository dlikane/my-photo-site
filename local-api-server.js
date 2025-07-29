// local-api-server.js
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to walk all .js files under /api
const walkDir = (dir, filelist = []) => {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath, filelist);
        } else if (file.endsWith(".js")) {
            filelist.push(fullPath);
        }
    }
    return filelist;
};

// Load all handlers
const apiDir = path.join(__dirname, "api");
const files = walkDir(apiDir);

console.log(`🔍 Found ${files.length} handler file(s) in /api`);
for (const file of files) {
    // Convert to route path
    const routePath = "/api" + file
        .replace(apiDir, "")
        .replace(/\.js$/, "")
        .replace(/\\/g, "/") // windows path fix
        .replace(/\[([^\]]+)\]/g, ":$1"); // [param] -> :param

    try {
        const mod = await import(`file://${file}`);
        const handler = mod.default;
        if (typeof handler !== "function") {
            console.warn(`⚠️  Skipping ${file}: no default export function`);
            continue;
        }

        // Register all methods
        app.all(routePath, async (req, res) => {
            try {
                console.log(`➡️  ${req.method} ${req.url}`);
                await handler(req, res);
            } catch (e) {
                console.error(`❌ Error in handler for ${routePath}`, e);
                res.status(500).json({ error: e.message });
            }
        });

        console.log(`✅ Route mounted: ${routePath}`);
    } catch (err) {
        console.error(`❌ Failed to load handler: ${file}`);
        console.error(err);
    }
}

// Fallback 404 handler
app.use((req, res) => {
    console.warn("🚫 Unmatched request:", req.method, req.url);
    res.status(404).json({ error: "Not Found" });
});

app.listen(port, () => {
    console.log(`🚀 Local API server running at http://localhost:${port}/api/...`);
});
