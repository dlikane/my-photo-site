import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import { getAccessToken } from './auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('Received request to /api/images');

    const accessToken = await getAccessToken();
    if (!accessToken) {
        return res.status(500).json({ error: 'Failed to get access token' });
    }

    const dbx = new Dropbox({ accessToken, fetch });

    try {
        const response = await dbx.filesListFolder({ path: '' });

        if (!response.result.entries) {
            return res.status(404).json({ error: "No images found" });
        }

        let images = response.result.entries
            .filter(file => file['.tag'] === 'file' && file.name.toLowerCase().endsWith('.jpg'))
            .map(async (file) => {
                const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });

                // ✅ Return both URL and file name
                return {
                    url: link.result.link,
                    name: file.name.replace(/_/g, " ").replace(/\.[^/.]+$/, "") // Format filename
                };
            });

        const resolvedImages = await Promise.all(images);
        res.status(200).json(resolvedImages);
    } catch (err) {
        console.error('❌ Error fetching images:', err);
        res.status(500).json({ error: err.message });
    }
}
