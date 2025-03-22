import formidable from "formidable"
import sharp from "sharp"
import { uploadToDropbox } from "../src/lib/dropbox"

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
    const form = formidable()
    form.parse(req, async (_, files) => {
        const file = files.file?.[0]
        if (!file) return res.status(400).json({ error: "No file" })

        const filename = `/__clients/${Date.now()}_${file.originalFilename.replace(/\s/g, "_")}`
        const imageBuffer = await sharp(file.filepath).resize(800).jpeg({ quality: 70 }).toBuffer()

        const result = await uploadToDropbox(`/${filename}`, imageBuffer)
        if (!result?.link) return res.status(500).json({ error: "Upload failed" })

        res.status(200).json({ url: result.link })
    })
}
