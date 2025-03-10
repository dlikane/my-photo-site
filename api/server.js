import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5001;
const dropboxAccessToken = process.env.DROPBOX_TOKEN;
const dbx = new Dropbox({ accessToken: dropboxAccessToken, fetch: fetch });

app.get('/api/images', async (req, res) => {
    console.log('Received request to /api/images');

    try {
        const response = await dbx.filesListFolder({ path: '' });
        let images = [];

        for (const file of response.result.entries) {
            if (file['.tag'] === 'file') {
                const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });
                images.push(link.result.link);
            }
        }

        res.json(images);
    } catch (err) {
        console.error('Error fetching images:', err);
        res.status(500).json({ error: err.message });
    }
});

// If running locally, start the server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
    });
}

// Export for Vercel deployment
export default app;
