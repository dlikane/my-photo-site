import formidable from "formidable"
import sharp from "sharp"
import { uploadToDropbox } from "../src/lib/dropbox"

export const config = {
    api: { bodyParser: false }
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end()

    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }) // 10MB

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "Parse error" })

        const file = files.image?.[0]
        const path = fields.path?.[0]
        if (!file || !path) return res.status(400).json({ error: "Missing file or path" })

        try {
            const imageBuffer = await sharp(file.filepath)
                .resize(600, 600, { fit: "cover" })
                .jpeg({ quality: 70 })
                .toBuffer()

            const result = await uploadToDropbox(path, imageBuffer)
            res.status(200).json({ url: result?.link || null })
        } catch (e) {
            res.status(500).json({ error: "Upload failed" })
        }
    })
}
