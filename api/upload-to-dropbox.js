import formidable from "formidable";
import sharp from "sharp";
import { uploadToDropbox } from "./services/dropboxService.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "Parse error" });

        const file = files.file?.[0];
        const path = fields.path?.[0];

        if (!file || !path) {
            return res.status(400).json({ error: "Missing file or path" });
        }

        let imageBuffer;

        try {
            if (path.startsWith("__clients/")) {
                imageBuffer = await sharp(file.filepath)
                    .resize(800) // Client photos: resize width to 800px
                    .jpeg({ quality: 70 })
                    .toBuffer();
            } else if (path.startsWith("__projects/")) {
                imageBuffer = await sharp(file.filepath)
                    .resize(600, 600, { fit: "cover" }) // Project images: crop to 600x600
                    .jpeg({ quality: 70 })
                    .toBuffer();
            } else {
                // Default: no resize
                imageBuffer = await sharp(file.filepath)
                    .jpeg({ quality: 70 })
                    .toBuffer();
            }

            const result = await uploadToDropbox(`/${path}`, imageBuffer);

            res.status(200).json({ url: result?.link || null });
        } catch (e) {
            console.error("❌ Upload failed:", e);
            res.status(500).json({ error: "Upload failed" });
        }
    });
}
