import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;

export async function getAccessToken() {
    try {
        const response = await fetch('https://api.dropbox.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // eslint-disable-next-line no-undef
                Authorization: `Basic ${Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: DROPBOX_REFRESH_TOKEN,
            }),
        });

        const data = await response.json();

        // ✅ Debugging log
        //console.log("Dropbox OAuth Response:", data);

        if (!response.ok) {
            throw new Error(`Failed to refresh access token: ${data.error_description || JSON.stringify(data)}`);
        }

        return data.access_token;
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return null;
    }
}
