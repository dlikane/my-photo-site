import dotenv from 'dotenv';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

dotenv.config();

const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;

async function getAccessToken() {
    try {
        const response = await fetch('https://api.dropbox.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: DROPBOX_REFRESH_TOKEN,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to refresh access token: ${data.error_description}`);
        }

        return data.access_token;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}

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
        let images = [];

        for (const file of response.result.entries) {
            if (file['.tag'] === 'file') {
                const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });
                images.push(link.result.link);
            }
        }

        res.status(200).json(images);
    } catch (err) {
        console.error('Error fetching images:', err);
        res.status(500).json({ error: err.message });
    }
}
