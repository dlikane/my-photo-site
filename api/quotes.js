import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';
import { getAccessToken } from './auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('Received request to /api/quotes');

    const accessToken = await getAccessToken();
    if (!accessToken) {
        return res.status(500).json({ error: 'Failed to get access token' });
    }

    const dbx = new Dropbox({ accessToken, fetch });

    try {
        const filePath = '/quotes_list.txt';
        const file = await dbx.filesDownload({ path: filePath });

        const content = file.result.fileBinary.toString('utf-8');

        res.status(200).json({ quotes: content });
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({ error: err.message });
    }
}
