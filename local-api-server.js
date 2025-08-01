// local-api-server.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// ✅ Add middleware to parse JSON bodies
app.use(express.json());

console.log(`🔍 Scanning handlers in /api`);

const handlersDir = path.join(__dirname, "api");

const walk = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath, fileList);
        } else if (file.endsWith(".js")) {
            fileList.push(fullPath);
        }
    }
    return fileList;
};

const handlerFiles = walk(handlersDir);
console.log(`🔍 Found ${handlerFiles.length} handler file(s) in /api`);

for (const file of handlerFiles) {
    const relative = path.relative(handlersDir, file);
    const route = `/api/${relative
        .replace(/\.js$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1")
        .replace(/\\/g, "/")}`;
    const mod = await import(`file://${file}`);
    const handler = mod.default;

    if (typeof handler !== "function") {
        console.warn(`⚠️  Skipping ${file}: no default export function`);
        continue;
    }

    app.all(route, async (req, res) => {
        try {
            // Vercel compatibility: dynamic param (e.g. /api/image/[name]) added to query
            Object.assign(req.query, req.params);
            console.log(`➡️  ${req.method} ${req.originalUrl}`);
            await handler(req, res);
        } catch (err) {
            console.error(`❌ Error in handler for ${route}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    console.log(`✅ Route mounted: ${route}`);
}

app.listen(port, () => {
    console.log(`🚀 Local API server running at http://localhost:${port}/api/...`);
});
