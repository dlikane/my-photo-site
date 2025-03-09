// import all necessary modules
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

// load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const dropboxAccessToken = process.env.DROPBOX_TOKEN;

// Dynamically set API Base URL
const API_BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${PORT}`;

// Enable CORS for your React frontend
app.use(cors());

// Initialize the Dropbox Client
const dbx = new Dropbox({ accessToken: dropboxAccessToken, fetch: fetch });

// API to get all image filenames dynamically
app.get('/api/images', async (req, res) => {

    console.log('Received request to /api/images');
    console.log('Token: ', dropboxAccessToken);

    try {
        console.log('Requesting file list from Dropbox');
        const response = await dbx.filesListFolder({ path: '' });

        console.log('Received file list from Dropbox:', response);
        let images = [];

        // Loop through each file from Dropbox and generate a temporary link
        for (const file of response.result.entries) {
            if (file['.tag'] === 'file') {

                console.log(`Requesting temporary link for file: ${file.path_lower}`);
                const link = await dbx.filesGetTemporaryLink({ path: file.path_lower });

                console.log(`Received temporary link: `, link.result.link);
                images.push(link.result.link);
            }
        }

        console.log(`Responding with list of ${images.length} images`);
        res.json(images);

    } catch (err) {
        console.error('Error during processing:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started, it's running at ${API_BASE_URL}`);
});